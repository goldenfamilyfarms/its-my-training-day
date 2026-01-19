/**
 * Question: Multi-Cloud Compliance Monitoring
 * 
 * How would you design a compliance monitoring system that works across AWS, 
 * Azure, and GCP without platform-specific code duplication?
 * 
 * Key Technical Decisions:
 * - Adapter pattern for cloud provider abstraction
 * - Resource normalization to canonical types
 * - Unified schema with cloud-specific extensions
 * - Feature flags for gradual rollout
 */

// Types
type CloudProvider = 'AWS' | 'AZURE' | 'GCP';

interface GenericResource {
  id: string;
  type: CanonicalResourceType;
  provider: CloudProvider;
  name: string;
  region: string;
  tags: Record<string, string>;
  complianceState: ComplianceState;
  providerSpecificAttributes: Record<string, unknown>; // JSONB field
}

type CanonicalResourceType =
  | 'STORAGE_BUCKET'
  | 'COMPUTE_INSTANCE'
  | 'DATABASE'
  | 'NETWORK_SECURITY_GROUP'
  | 'IAM_USER'
  | 'IAM_ROLE'
  | 'ENCRYPTION_KEY';

interface ComplianceState {
  encrypted: boolean;
  publicAccess: boolean;
  loggingEnabled: boolean;
  versioningEnabled?: boolean;
  mfaEnabled?: boolean;
  [key: string]: unknown;
}

// Cloud Provider Abstraction Interface
interface CloudProviderAdapter {
  readonly providerId: CloudProvider;
  
  listStorageBuckets(region?: string): Promise<GenericResource[]>;
  listComputeInstances(region?: string): Promise<GenericResource[]>;
  listDatabases(region?: string): Promise<GenericResource[]>;
  listNetworkSecurityGroups(region?: string): Promise<GenericResource[]>;
  listIAMUsers(): Promise<GenericResource[]>;
  listIAMRoles(): Promise<GenericResource[]>;
  
  checkEncryption(resource: GenericResource): Promise<boolean>;
  checkPublicAccess(resource: GenericResource): Promise<boolean>;
  checkLogging(resource: GenericResource): Promise<boolean>;
  
  normalizeResource(providerResource: unknown): GenericResource;
}

// AWS Adapter Implementation
class AWSAdapter implements CloudProviderAdapter {
  readonly providerId: CloudProvider = 'AWS';

  async listStorageBuckets(region?: string): Promise<GenericResource[]> {
    // In production, would use AWS SDK
    const buckets = await this.awsS3ListBuckets();
    
    return buckets.map(bucket => this.normalizeResource({
      providerType: 's3_bucket',
      name: bucket.Name,
      region: bucket.Region || 'us-east-1',
      encryption: bucket.Encryption?.Status === 'Enabled',
      publicAccess: bucket.PublicAccessBlock === 'false',
      versioning: bucket.Versioning === 'Enabled',
      logging: bucket.Logging?.Enabled === true,
    }));
  }

  async listComputeInstances(region?: string): Promise<GenericResource[]> {
    // In production, would use AWS SDK
    const instances = await this.awsEC2ListInstances(region);
    
    return instances.map(instance => this.normalizeResource({
      providerType: 'ec2_instance',
      id: instance.InstanceId,
      name: instance.Tags?.find(t => t.Key === 'Name')?.Value,
      region: instance.Placement?.AvailabilityZone?.slice(0, -1),
      encryption: instance.BlockDeviceMappings?.some(bdm => bdm.Ebs?.Encrypted),
    }));
  }

  async listDatabases(region?: string): Promise<GenericResource[]> {
    // In production, would use AWS SDK
    const databases = await this.awsRDSListInstances(region);
    
    return databases.map(db => this.normalizeResource({
      providerType: 'rds_instance',
      id: db.DBInstanceIdentifier,
      name: db.DBInstanceIdentifier,
      region: db.AvailabilityZone?.slice(0, -1),
      encryption: db.StorageEncrypted === true,
    }));
  }

  async listNetworkSecurityGroups(region?: string): Promise<GenericResource[]> {
    // In production, would use AWS SDK
    const securityGroups = await this.awsEC2ListSecurityGroups(region);
    
    return securityGroups.map(sg => this.normalizeResource({
      providerType: 'security_group',
      id: sg.GroupId,
      name: sg.GroupName,
      region: region || 'us-east-1',
      publicAccess: sg.IpPermissions?.some(perm => 
        perm.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')
      ),
    }));
  }

  async listIAMUsers(): Promise<GenericResource[]> {
    // In production, would use AWS SDK
    const users = await this.awsIAMListUsers();
    
    return users.map(user => this.normalizeResource({
      providerType: 'iam_user',
      id: user.UserName,
      name: user.UserName,
      region: 'global',
      mfaEnabled: user.MFADevices?.length > 0,
    }));
  }

  async listIAMRoles(): Promise<GenericResource[]> {
    // In production, would use AWS SDK
    const roles = await this.awsIAMListRoles();
    
    return roles.map(role => this.normalizeResource({
      providerType: 'iam_role',
      id: role.RoleName,
      name: role.RoleName,
      region: 'global',
    }));
  }

  async checkEncryption(resource: GenericResource): Promise<boolean> {
    // Use provider-specific attributes
    const providerAttrs = resource.providerSpecificAttributes;
    return providerAttrs.encryption === true || 
           providerAttrs.StorageEncrypted === true ||
           providerAttrs.encrypted === true;
  }

  async checkPublicAccess(resource: GenericResource): Promise<boolean> {
    const providerAttrs = resource.providerSpecificAttributes;
    return providerAttrs.publicAccess === true ||
           providerAttrs.PublicAccessBlock === 'false';
  }

  async checkLogging(resource: GenericResource): Promise<boolean> {
    const providerAttrs = resource.providerSpecificAttributes as any;
    return providerAttrs.logging === true ||
           providerAttrs.Logging?.Enabled === true;
  }

  normalizeResource(providerResource: any): GenericResource {
    // Map AWS-specific resource to canonical type
    const typeMapping: Record<string, CanonicalResourceType> = {
      s3_bucket: 'STORAGE_BUCKET',
      ec2_instance: 'COMPUTE_INSTANCE',
      rds_instance: 'DATABASE',
      security_group: 'NETWORK_SECURITY_GROUP',
      iam_user: 'IAM_USER',
      iam_role: 'IAM_ROLE',
    };

    return {
      id: providerResource.id || providerResource.name || providerResource.InstanceId || providerResource.DBInstanceIdentifier,
      type: typeMapping[providerResource.providerType] || 'STORAGE_BUCKET',
      provider: 'AWS',
      name: providerResource.name || providerResource.UserName || providerResource.RoleName,
      region: providerResource.region || 'us-east-1',
      tags: providerResource.Tags?.reduce((acc: Record<string, string>, tag: any) => {
        acc[tag.Key] = tag.Value;
        return acc;
      }, {}) || {},
      complianceState: {
        encrypted: providerResource.encryption || providerResource.StorageEncrypted || false,
        publicAccess: providerResource.publicAccess || false,
        loggingEnabled: providerResource.logging || providerResource.Logging?.Enabled || false,
        versioningEnabled: providerResource.versioning,
        mfaEnabled: providerResource.mfaEnabled,
      },
      providerSpecificAttributes: providerResource,
    };
  }

  // Mock AWS SDK methods (would use actual SDK in production)
  private async awsS3ListBuckets(): Promise<any[]> {
    return [];
  }

  private async awsEC2ListInstances(region?: string): Promise<any[]> {
    return [];
  }

  private async awsRDSListInstances(region?: string): Promise<any[]> {
    return [];
  }

  private async awsEC2ListSecurityGroups(region?: string): Promise<any[]> {
    return [];
  }

  private async awsIAMListUsers(): Promise<any[]> {
    return [];
  }

  private async awsIAMListRoles(): Promise<any[]> {
    return [];
  }
}

// Azure Adapter Implementation
class AzureAdapter implements CloudProviderAdapter {
  readonly providerId: CloudProvider = 'AZURE';

  async listStorageBuckets(region?: string): Promise<GenericResource[]> {
    // In production, would use Azure SDK
    const containers = await this.azureListBlobContainers(region);
    
    return containers.map(container => this.normalizeResource({
      providerType: 'blob_container',
      name: container.name,
      resourceGroup: container.resourceGroup,
      region: container.location,
      encryption: ((container.properties as any)?.encryption?.services?.blob as any)?.enabled,
      publicAccess: container.properties?.publicAccess !== 'None',
    }));
  }

  async listComputeInstances(region?: string): Promise<GenericResource[]> {
    // In production, would use Azure SDK
    const vms = await this.azureListVirtualMachines(region);
    
    return vms.map(vm => this.normalizeResource({
      providerType: 'virtual_machine',
      id: vm.id,
      name: vm.name,
      resourceGroup: vm.resourceGroup,
      region: vm.location,
      encryption: vm.properties?.storageProfile?.osDisk?.encryptionSettings?.enabled,
    }));
  }

  async listDatabases(region?: string): Promise<GenericResource[]> {
    // In production, would use Azure SDK
    const databases = await this.azureListSQLDatabases(region);
    
    return databases.map(db => this.normalizeResource({
      providerType: 'sql_database',
      id: db.id,
      name: db.name,
      resourceGroup: db.resourceGroup,
      region: db.location,
      encryption: db.properties?.transparentDataEncryption?.status === 'Enabled',
    }));
  }

  async listNetworkSecurityGroups(region?: string): Promise<GenericResource[]> {
    // In production, would use Azure SDK
    const nsgs = await this.azureListNetworkSecurityGroups(region);
    
    return nsgs.map(nsg => this.normalizeResource({
      providerType: 'network_security_group',
      id: nsg.id,
      name: nsg.name,
      resourceGroup: nsg.resourceGroup,
      region: nsg.location,
    }));
  }

  async listIAMUsers(): Promise<GenericResource[]> {
    // In production, would use Azure AD SDK
    const users = await this.azureADListUsers();
    
    return users.map(user => this.normalizeResource({
      providerType: 'azure_ad_user',
      id: user.id,
      name: user.userPrincipalName,
      region: 'global',
      mfaEnabled: user.mfaRegistered === true,
    }));
  }

  async listIAMRoles(): Promise<GenericResource[]> {
    // In production, would use Azure RBAC SDK
    const roles = await this.azureListRoleDefinitions();
    
    return roles.map(role => this.normalizeResource({
      providerType: 'role_definition',
      id: role.id,
      name: role.name,
      region: 'global',
    }));
  }

  async checkEncryption(resource: GenericResource): Promise<boolean> {
    const providerAttrs = resource.providerSpecificAttributes;
    const attrs = providerAttrs as any;
    return attrs.encryption === true ||
           attrs.properties?.encryption?.services?.blob?.enabled === true ||
           attrs.properties?.transparentDataEncryption?.status === 'Enabled';
  }

  async checkPublicAccess(resource: GenericResource): Promise<boolean> {
    const providerAttrs = resource.providerSpecificAttributes;
    const attrs = providerAttrs as any;
    return attrs.publicAccess === true ||
           attrs.properties?.publicAccess !== 'None';
  }

  async checkLogging(resource: GenericResource): Promise<boolean> {
    const providerAttrs = resource.providerSpecificAttributes;
    const attrs = providerAttrs as any;
    return attrs.logging === true ||
           attrs.properties?.diagnosticSettings?.enabled === true;
  }

  normalizeResource(providerResource: any): GenericResource {
    const typeMapping: Record<string, CanonicalResourceType> = {
      blob_container: 'STORAGE_BUCKET',
      virtual_machine: 'COMPUTE_INSTANCE',
      sql_database: 'DATABASE',
      network_security_group: 'NETWORK_SECURITY_GROUP',
      azure_ad_user: 'IAM_USER',
      role_definition: 'IAM_ROLE',
    };

    return {
      id: providerResource.id || providerResource.name,
      type: typeMapping[providerResource.providerType] || 'STORAGE_BUCKET',
      provider: 'AZURE',
      name: providerResource.name,
      region: providerResource.location || providerResource.region || 'eastus',
      tags: providerResource.tags || {},
      complianceState: {
        encrypted: providerResource.encryption || false,
        publicAccess: providerResource.publicAccess || false,
        loggingEnabled: providerResource.logging || false,
        mfaEnabled: providerResource.mfaEnabled,
      },
      providerSpecificAttributes: providerResource,
    };
  }

  // Mock Azure SDK methods
  private async azureListBlobContainers(region?: string): Promise<any[]> {
    return [];
  }

  private async azureListVirtualMachines(region?: string): Promise<any[]> {
    return [];
  }

  private async azureListSQLDatabases(region?: string): Promise<any[]> {
    return [];
  }

  private async azureListNetworkSecurityGroups(region?: string): Promise<any[]> {
    return [];
  }

  private async azureADListUsers(): Promise<any[]> {
    return [];
  }

  private async azureListRoleDefinitions(): Promise<any[]> {
    return [];
  }
}

// Unified Compliance Service
class UnifiedComplianceService {
  private adapters: Map<CloudProvider, CloudProviderAdapter> = new Map();
  private featureFlags: Map<CloudProvider, boolean> = new Map();

  constructor() {
    // Register adapters
    this.adapters.set('AWS', new AWSAdapter());
    this.adapters.set('AZURE', new AzureAdapter());
    // Would add GCP adapter here

    // Feature flags for gradual rollout
    this.featureFlags.set('AWS', true);
    this.featureFlags.set('AZURE', false); // Not yet enabled
    this.featureFlags.set('GCP', false);
  }

  /**
   * Get all resources across enabled cloud providers
   */
  async getAllResources(
    resourceType: CanonicalResourceType,
    providers?: CloudProvider[]
  ): Promise<GenericResource[]> {
    const enabledProviders = providers || this.getEnabledProviders();
    const allResources: GenericResource[] = [];

    for (const provider of enabledProviders) {
      if (!this.featureFlags.get(provider)) {
        continue; // Skip disabled providers
      }

      const adapter = this.adapters.get(provider);
      if (!adapter) continue;

      try {
        let resources: GenericResource[] = [];

        switch (resourceType) {
          case 'STORAGE_BUCKET':
            resources = await adapter.listStorageBuckets();
            break;
          case 'COMPUTE_INSTANCE':
            resources = await adapter.listComputeInstances();
            break;
          case 'DATABASE':
            resources = await adapter.listDatabases();
            break;
          case 'NETWORK_SECURITY_GROUP':
            resources = await adapter.listNetworkSecurityGroups();
            break;
          case 'IAM_USER':
            resources = await adapter.listIAMUsers();
            break;
          case 'IAM_ROLE':
            resources = await adapter.listIAMRoles();
            break;
        }

        allResources.push(...resources);
      } catch (error) {
        console.error(`Error fetching resources from ${provider}:`, error);
        // Continue with other providers
      }
    }

    return allResources;
  }

  /**
   * Evaluate compliance control across all cloud providers
   */
  async evaluateControl(
    controlId: string,
    resourceType: CanonicalResourceType
  ): Promise<ComplianceEvaluationResult> {
    const resources = await this.getAllResources(resourceType);
    const results: ResourceComplianceResult[] = [];

    for (const resource of resources) {
      const adapter = this.adapters.get(resource.provider);
      if (!adapter) continue;

      // Evaluate control (e.g., "all storage buckets must be encrypted")
      const encrypted = await adapter.checkEncryption(resource);
      const passed = encrypted; // Simplified - would use actual control logic

      results.push({
        resourceId: resource.id,
        provider: resource.provider,
        passed,
        details: {
          encrypted,
          publicAccess: await adapter.checkPublicAccess(resource),
          loggingEnabled: await adapter.checkLogging(resource),
        },
      });
    }

    const passedCount = results.filter(r => r.passed).length;
    const complianceScore = resources.length > 0
      ? (passedCount / resources.length) * 100
      : 0;

    return {
      controlId,
      resourceType,
      totalResources: resources.length,
      compliantResources: passedCount,
      complianceScore,
      results,
    };
  }

  private getEnabledProviders(): CloudProvider[] {
    return Array.from(this.featureFlags.entries())
      .filter(([_, enabled]) => enabled)
      .map(([provider]) => provider);
  }

  /**
   * Enable/disable cloud provider via feature flag
   */
  setProviderEnabled(provider: CloudProvider, enabled: boolean): void {
    this.featureFlags.set(provider, enabled);
  }
}

interface ComplianceEvaluationResult {
  controlId: string;
  resourceType: CanonicalResourceType;
  totalResources: number;
  compliantResources: number;
  complianceScore: number;
  results: ResourceComplianceResult[];
}

interface ResourceComplianceResult {
  resourceId: string;
  provider: CloudProvider;
  passed: boolean;
  details: Record<string, unknown>;
}

// Example Usage
export function demonstrateMultiCloudAbstraction() {
  const service = new UnifiedComplianceService();

  // Enable Azure (gradual rollout)
  service.setProviderEnabled('AZURE', true);

  // Get all storage buckets across enabled providers
  const buckets = service.getAllResources('STORAGE_BUCKET');
  console.log('All storage buckets:', buckets);

  // Evaluate encryption control across all clouds
  const evaluation = service.evaluateControl('CC6.7', 'STORAGE_BUCKET');
  console.log('Compliance evaluation:', evaluation);

  return { service };
}

export {
  UnifiedComplianceService,
  CloudProviderAdapter,
  AWSAdapter,
  AzureAdapter,
  GenericResource,
  CanonicalResourceType,
};

