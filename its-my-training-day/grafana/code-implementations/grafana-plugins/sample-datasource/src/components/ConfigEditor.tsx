/**
 * Sample Data Source Plugin - Configuration Editor Component
 *
 * This React component provides the UI for configuring the data source
 * in Grafana's data source settings page. It handles:
 * - URL configuration
 * - Authentication settings (API keys, passwords)
 * - Default options (database, timeout)
 * - Debug settings
 *
 * Key concepts demonstrated:
 * - Using Grafana UI components for consistent styling
 * - Handling secure JSON data for sensitive configuration
 * - Form validation and user feedback
 * - React hooks for state management
 */

import React, { ChangeEvent, useState } from 'react';
import {
  DataSourcePluginOptionsEditorProps,
  onUpdateDatasourceJsonDataOption,
  onUpdateDatasourceSecureJsonDataOption,
  updateDatasourcePluginResetOption,
} from '@grafana/data';
import {
  InlineField,
  Input,
  SecretInput,
  Switch,
  FieldSet,
  InlineFieldRow,
  Alert,
} from '@grafana/ui';

import { SampleDataSourceOptions, SampleSecureJsonData } from '../types';

/**
 * Props interface for the ConfigEditor component
 *
 * DataSourcePluginOptionsEditorProps provides:
 * - options: Current data source configuration
 * - onOptionsChange: Callback to update configuration
 *
 * The generic types ensure type safety for our specific options.
 */
interface Props extends DataSourcePluginOptionsEditorProps<SampleDataSourceOptions, SampleSecureJsonData> {}

/**
 * ConfigEditor Component
 *
 * This component renders the configuration form for the data source.
 * It's displayed when users:
 * - Add a new data source
 * - Edit an existing data source
 *
 * Interview Tip: Configuration editors should:
 * - Use Grafana UI components for consistency
 * - Properly handle secure data (never display secrets)
 * - Provide helpful labels and tooltips
 * - Validate input where appropriate
 */
export function ConfigEditor(props: Props) {
  const { options, onOptionsChange } = props;
  const { jsonData, secureJsonFields, secureJsonData } = options;

  // Local state for validation feedback
  const [urlError, setUrlError] = useState<string | undefined>();

  /**
   * Handle URL changes with validation
   *
   * Validates that the URL is properly formatted before saving.
   */
  const onUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;

    // Basic URL validation
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      setUrlError('URL must start with http:// or https://');
    } else {
      setUrlError(undefined);
    }

    onOptionsChange({
      ...options,
      url,
    });
  };

  /**
   * Handle JSON data option changes
   *
   * Uses Grafana's helper function for updating jsonData fields.
   * This ensures proper immutable updates.
   */
  const onJsonDataChange = onUpdateDatasourceJsonDataOption(props, 'defaultDatabase');
  const onTimeoutChange = onUpdateDatasourceJsonDataOption(props, 'timeout');
  const onDebugChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...jsonData,
        enableDebug: event.target.checked,
      },
    });
  };

  /**
   * Handle secure JSON data changes
   *
   * Uses Grafana's helper for secure data. The actual values are
   * never sent back to the browser after initial save.
   */
  const onApiKeyChange = onUpdateDatasourceSecureJsonDataOption(props, 'apiKey');
  const onPasswordChange = onUpdateDatasourceSecureJsonDataOption(props, 'password');

  /**
   * Reset a secure field
   *
   * Allows users to clear and re-enter secure values.
   */
  const onResetApiKey = () => {
    updateDatasourcePluginResetOption(props, 'apiKey');
  };

  const onResetPassword = () => {
    updateDatasourcePluginResetOption(props, 'password');
  };

  return (
    <>
      {/* Connection Settings */}
      <FieldSet label="Connection">
        <InlineField
          label="URL"
          labelWidth={20}
          tooltip="The base URL of your data source API (e.g., http://localhost:8080)"
          invalid={!!urlError}
          error={urlError}
          required
        >
          <Input
            width={60}
            value={options.url || ''}
            onChange={onUrlChange}
            placeholder="http://localhost:8080"
            aria-label="Data source URL"
          />
        </InlineField>

        <InlineField
          label="Default Database"
          labelWidth={20}
          tooltip="The default database to use when not specified in queries"
        >
          <Input
            width={40}
            value={jsonData?.defaultDatabase || ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onOptionsChange({
                ...options,
                jsonData: { ...jsonData, defaultDatabase: e.target.value },
              })
            }
            placeholder="default"
            aria-label="Default database"
          />
        </InlineField>

        <InlineField
          label="Timeout (seconds)"
          labelWidth={20}
          tooltip="Request timeout in seconds"
        >
          <Input
            width={20}
            type="number"
            value={jsonData?.timeout || 30}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onOptionsChange({
                ...options,
                jsonData: { ...jsonData, timeout: parseInt(e.target.value, 10) || 30 },
              })
            }
            min={1}
            max={300}
            aria-label="Request timeout"
          />
        </InlineField>
      </FieldSet>

      {/* Authentication Settings */}
      <FieldSet label="Authentication">
        <Alert title="Security Note" severity="info">
          API keys and passwords are stored encrypted and never sent back to the browser.
          You'll need to re-enter them if you want to change them.
        </Alert>

        <InlineField
          label="API Key"
          labelWidth={20}
          tooltip="API key for authenticating with the data source"
        >
          <SecretInput
            width={40}
            isConfigured={secureJsonFields?.apiKey || false}
            value={secureJsonData?.apiKey || ''}
            onChange={onApiKeyChange}
            onReset={onResetApiKey}
            placeholder="Enter API key"
            aria-label="API key"
          />
        </InlineField>

        <InlineField
          label="Password"
          labelWidth={20}
          tooltip="Password for basic authentication (optional)"
        >
          <SecretInput
            width={40}
            isConfigured={secureJsonFields?.password || false}
            value={secureJsonData?.password || ''}
            onChange={onPasswordChange}
            onReset={onResetPassword}
            placeholder="Enter password"
            aria-label="Password"
          />
        </InlineField>
      </FieldSet>

      {/* Advanced Settings */}
      <FieldSet label="Advanced">
        <InlineFieldRow>
          <InlineField
            label="Enable Debug Logging"
            labelWidth={20}
            tooltip="Enable verbose logging for troubleshooting"
          >
            <Switch
              value={jsonData?.enableDebug || false}
              onChange={(e) =>
                onOptionsChange({
                  ...options,
                  jsonData: { ...jsonData, enableDebug: e.currentTarget.checked },
                })
              }
              aria-label="Enable debug logging"
            />
          </InlineField>
        </InlineFieldRow>
      </FieldSet>

      {/* Help Section */}
      <FieldSet label="Help">
        <Alert title="Configuration Tips" severity="info">
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>
              <strong>URL:</strong> Enter the base URL of your data source API
            </li>
            <li>
              <strong>Default Database:</strong> Used when queries don't specify a database
            </li>
            <li>
              <strong>API Key:</strong> Required for authenticated endpoints
            </li>
            <li>
              <strong>Debug:</strong> Enable for detailed logs in browser console
            </li>
          </ul>
        </Alert>
      </FieldSet>
    </>
  );
}

/**
 * Component Design Notes
 *
 * This ConfigEditor demonstrates several best practices:
 *
 * 1. **Grafana UI Components**: Using InlineField, Input, SecretInput, etc.
 *    ensures the configuration page looks consistent with other data sources.
 *
 * 2. **Secure Data Handling**: The SecretInput component properly handles
 *    sensitive data - it shows "configured" when a value exists but never
 *    displays the actual value.
 *
 * 3. **Validation**: Basic URL validation provides immediate feedback to users.
 *
 * 4. **Tooltips**: Every field has a tooltip explaining its purpose.
 *
 * 5. **Accessibility**: aria-label attributes improve screen reader support.
 *
 * 6. **Organization**: Fields are grouped into logical FieldSets.
 *
 * Interview Tip: When discussing plugin development, emphasize:
 * - Security considerations (never expose secrets)
 * - User experience (clear labels, validation, help text)
 * - Consistency with Grafana's design patterns
 */
