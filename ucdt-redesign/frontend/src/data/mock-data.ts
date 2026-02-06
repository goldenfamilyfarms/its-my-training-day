import type { Project, TnMapEntry, UserEntry, GeneralNote, TrueUpEntry, CallFlowEntry, OmniChannelEntry, ProvisioningLog } from '@/types'

export const mockProjects: Project[] = [
  {
    id: '1', engId: 'ENG-03263090', resource: 'April Diehl', projectType: 'Unified Communications',
    orderType: 'New Install', customerName: 'Houston Astros', multiSite: true, mainSite: false,
    existingUcEnterprise: true, networkRouting: 'Charter - Redsky', existingEntId: '5555555079',
    groupId: 'HoustonAs5555555079', groupName: 'Houston Astros', mainTn: '5555555079',
    status: 'in-progress', createdAt: '2022-11-15', updatedAt: '2023-01-10'
  },
  {
    id: '2', engId: 'ENG-03263090', resource: 'April Diehl', projectType: 'Standard Config',
    orderType: 'New Install', customerName: 'MONTANA CLUB', multiSite: false, mainSite: true,
    existingUcEnterprise: false, networkRouting: 'BHN - Redsky', existingEntId: '4065418141',
    groupId: 'MONTANACL4065418141', groupName: 'MONTANA CLUB', mainTn: '4065418141',
    status: 'completed', createdAt: '2022-10-20', updatedAt: '2022-12-15'
  },
  {
    id: '3', engId: 'ENG-00000000', resource: 'Marcia Gageby', projectType: 'Unified Communications',
    orderType: 'New Install', customerName: 'Charter UC Tampa TEST UC A1', multiSite: false, mainSite: true,
    existingUcEnterprise: false, networkRouting: 'BHN - Redsky', existingEntId: '8135555000',
    groupId: 'CharterUC8135555000', groupName: 'Charter UC Tampa TEST UC A1', mainTn: '8135555000',
    status: 'draft', createdAt: '2022-09-01', updatedAt: '2022-09-01'
  },
  {
    id: '4', engId: 'ENG-00000001', resource: 'Marcia Gageby', projectType: 'Unified Communications',
    orderType: 'New Install', customerName: 'Charter UC Tampa TEST UC A3', multiSite: false, mainSite: true,
    existingUcEnterprise: false, networkRouting: 'BHN - Redsky', existingEntId: '8135555090',
    groupId: 'CharterUC8135555090', groupName: 'Charter UC Tampa TEST UC A3', mainTn: '8135555090',
    status: 'provisioning', createdAt: '2022-09-05', updatedAt: '2023-01-05'
  },
  {
    id: '5', engId: 'ENG-00000003', resource: 'Marcia Gageby', projectType: 'Unified Communications',
    orderType: 'New Install', customerName: 'Charter UC Tampa TEST UC A2', multiSite: false, mainSite: true,
    existingUcEnterprise: false, networkRouting: 'BHN - Redsky', existingEntId: '8135555050',
    groupId: 'CharterUC8135555050', groupName: 'Charter UC Tampa TEST UC A2', mainTn: '8135555050',
    status: 'completed', createdAt: '2022-09-10', updatedAt: '2022-12-20'
  },
  {
    id: '6', engId: 'ENG-01234567', resource: 'April Diehl', projectType: 'Unified Communications',
    orderType: 'New Install', customerName: 'UCDT Dry Run', multiSite: true, mainSite: true,
    existingUcEnterprise: false, networkRouting: 'BW.com - Redsky', existingEntId: '8133211237',
    groupId: 'UCDTDryRu8133211237', groupName: 'UCDT Dry Run', mainTn: '8133211237',
    status: 'in-progress', createdAt: '2022-10-01', updatedAt: '2023-01-08'
  },
  {
    id: '7', engId: 'ENG-02345678', resource: 'April Diehl', projectType: 'Unified Communications',
    orderType: 'New Install', customerName: 'UCDT Other Dry Run', multiSite: true, mainSite: false,
    existingUcEnterprise: true, networkRouting: 'BW.com - Redsky', existingEntId: '8135555100',
    groupId: 'UCDTOther8135555150', groupName: 'UCDT Other Dry Run', mainTn: '8135555150',
    status: 'error', createdAt: '2022-10-15', updatedAt: '2023-01-09'
  },
  {
    id: '8', engId: 'ENG-00000023', resource: 'Marcia Gageby', projectType: 'Standard Config',
    orderType: 'New Install', customerName: 'Charter UC Tampa TEST 072622 23', multiSite: false, mainSite: true,
    existingUcEnterprise: false, networkRouting: 'BHN - Redsky', existingEntId: '8135555090',
    groupId: 'CharterUC8135555090', groupName: 'Charter UC Tampa TEST 072622 23', mainTn: '8135555090',
    status: 'completed', createdAt: '2022-07-26', updatedAt: '2022-08-15'
  },
  {
    id: '9', engId: 'ENG-00000024', resource: 'Marcia Gageby', projectType: 'Standard Config',
    orderType: 'New Install', customerName: 'Charter UC Tampa TEST 072722 26', multiSite: false, mainSite: true,
    existingUcEnterprise: false, networkRouting: 'BHN - Redsky', existingEntId: '8135555090',
    groupId: 'CharterUC8135555090', groupName: 'Charter UC Tampa TEST 072722 26', mainTn: '8135555090',
    status: 'draft', createdAt: '2022-07-27', updatedAt: '2022-07-27'
  },
  {
    id: '10', engId: 'ENG-03400883', resource: 'Christopher Kiester', projectType: 'Unified Communications',
    orderType: 'New Install', customerName: 'Senor Antonios', multiSite: false, mainSite: true,
    existingUcEnterprise: false, networkRouting: 'TWC.GIA - Redsky', existingEntId: '7405486996',
    groupId: 'SenorAnto7405486996', groupName: 'Senor Antonios', mainTn: '7405486996',
    status: 'in-progress', createdAt: '2022-12-01', updatedAt: '2023-01-12'
  },
]

// Generate more projects for pagination demo
for (let i = 11; i <= 50; i++) {
  const resources = ['April Diehl', 'Marcia Gageby', 'Seth Cenac', 'Christopher Kiester', 'Tyrell Williams']
  const projectTypes = ['Unified Communications', 'Standard Config']
  const orderTypes = ['New Install', 'Upgrade', 'Migration']
  const routings = ['BHN - Redsky', 'Charter - Redsky', 'BW.com - Redsky', 'TWC.GIA - Redsky']
  const statuses: Project['status'][] = ['draft', 'in-progress', 'provisioning', 'completed', 'error']
  const r = resources[i % resources.length]
  mockProjects.push({
    id: String(i),
    engId: `ENG-${String(i).padStart(8, '0')}`,
    resource: r,
    projectType: projectTypes[i % projectTypes.length],
    orderType: orderTypes[i % orderTypes.length],
    customerName: `Test Customer ${i}`,
    multiSite: i % 3 === 0,
    mainSite: i % 2 === 0,
    existingUcEnterprise: i % 4 === 0,
    networkRouting: routings[i % routings.length],
    existingEntId: `${8130000000 + i}`,
    groupId: `TestCust${8130000000 + i}`,
    groupName: `Test Customer ${i}`,
    mainTn: `${8130000000 + i}`,
    status: statuses[i % statuses.length],
    createdAt: `2023-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
    updatedAt: `2023-0${(i % 9) + 1}-${String(Math.min((i % 28) + 5, 28)).padStart(2, '0')}`,
  })
}

export const mockTnMap: TnMapEntry[] = Array.from({ length: 44 }, (_, i) => ({
  id: String(i + 1),
  tn: `555${String(5550000 + i).padStart(7, '0')}`,
  extension: String(1000 + i),
  firstName: ['John', 'Jane', 'Mike', 'Sarah', 'Tom', 'Lisa'][i % 6],
  lastName: ['Smith', 'Doe', 'Johnson', 'Williams', 'Brown', 'Davis'][i % 6],
  userId: `user${i + 1}@company.com`,
  deviceType: ['Poly VVX 450', 'Poly VVX 350', 'Poly VVX 250', 'Cisco 8845', 'Softphone'][i % 5],
  macAddress: `00:1A:2B:${String(i).padStart(2, '0')}:CD:EF`,
  linePort: `lp_${1000 + i}@broadworks.net`,
  status: (['active', 'pending', 'ported'] as const)[i % 3],
}))

export const mockUsers: UserEntry[] = Array.from({ length: 22 }, (_, i) => ({
  id: String(i + 1),
  userId: `user${i + 1}@company.com`,
  firstName: ['John', 'Jane', 'Mike', 'Sarah', 'Tom', 'Lisa', 'Chris', 'Amy'][i % 8],
  lastName: ['Smith', 'Doe', 'Johnson', 'Williams', 'Brown', 'Davis', 'Wilson', 'Moore'][i % 8],
  email: `user${i + 1}@company.com`,
  phone: `555-${String(1000 + i).padStart(4, '0')}`,
  extension: String(1000 + i),
  department: ['Engineering', 'Sales', 'Support', 'Marketing', 'HR'][i % 5],
  deviceType: ['Poly VVX 450', 'Poly VVX 350', 'Cisco 8845', 'Softphone'][i % 4],
  callPlan: ['Standard', 'Premium', 'Basic'][i % 3],
  voicemail: i % 2 === 0,
  status: (['active', 'inactive', 'pending'] as const)[i % 3],
}))

export const mockGeneralNotes: GeneralNote[] = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1),
  lastUpdateBy: 'script',
  lastUpdateDateTime: `2022-12-21 ${19 + Math.floor(i / 3)}:${String((i * 17 + 55) % 60).padStart(2, '0')}:${String((i * 23 + 35) % 60).padStart(2, '0')}`,
  notes: i % 2 === 0
    ? `Provisioning via API started by Christopher Louis(Developer)`
    : `Provisioning Completed! Number of providers: 1 Number of groups: 1 Number of virtual users: 9 Number of devices: 5`,
}))

export const mockTrueUp: TrueUpEntry[] = [
  { id: '1', type: '', description: '', ordered: 0, actual: 0, notes: '' },
  { id: '2', type: '', description: '', ordered: 0, actual: 0, notes: '' },
  { id: '3', type: '', description: '', ordered: 0, actual: 0, notes: '' },
  { id: '4', type: '', description: '', ordered: 0, actual: 0, notes: '' },
  { id: '5', type: '', description: '', ordered: 0, actual: 0, notes: '' },
  { id: '6', type: '', description: '', ordered: 0, actual: 0, notes: '' },
  { id: '7', type: '', description: '', ordered: 0, actual: 0, notes: '' },
  { id: '8', type: 'Add-Ons', description: 'Hosted Voice - Queue', ordered: 2, actual: 2, notes: '' },
  { id: '9', type: 'Add-Ons', description: 'Hosted Voice - Auto Attendant', ordered: 0, actual: 2, notes: '' },
  { id: '10', type: 'Add-Ons', description: 'Hosted Voice - Additional Voice Mail', ordered: 0, actual: 2, notes: '' },
  { id: '11', type: 'Seats', description: 'Hosted Voice - Standard Seat', ordered: 15, actual: 15, notes: '' },
  { id: '12', type: 'Seats', description: 'Hosted Voice - Premium Seat', ordered: 5, actual: 5, notes: '' },
  { id: '13', type: 'Devices', description: 'Poly VVX 450', ordered: 10, actual: 10, notes: '' },
  { id: '14', type: 'Devices', description: 'Poly VVX 350', ordered: 5, actual: 3, notes: 'Backordered - 2 remaining' },
  { id: '15', type: 'Devices', description: 'Cisco 8845', ordered: 3, actual: 3, notes: '' },
]

export const mockCallFlows: CallFlowEntry[] = [
  { id: '1', name: 'Main Line', type: 'main-number', description: 'Primary business line', number: '555-555-5079', routing: 'Direct', lastUpdateBy: 'Seth Cenac', lastUpdateDateTime: '2023-01-05 14:30:00', notes: '' },
  { id: '2', name: 'Sales AA', type: 'auto-attendant', description: 'Sales department auto attendant', number: '555-555-5080', routing: 'AA > Hunt Group', lastUpdateBy: 'Seth Cenac', lastUpdateDateTime: '2023-01-05 14:35:00', notes: 'Hours: 8am-5pm CST' },
  { id: '3', name: 'Support AA', type: 'auto-attendant', description: 'Customer support auto attendant', number: '555-555-5081', routing: 'AA > Call Center', lastUpdateBy: 'April Diehl', lastUpdateDateTime: '2023-01-06 10:00:00', notes: '24/7 operation' },
  { id: '4', name: 'Sales Team', type: 'hunt-group', description: 'Sales hunt group - circular', number: '555-555-5082', routing: 'Circular', lastUpdateBy: 'Seth Cenac', lastUpdateDateTime: '2023-01-05 15:00:00', notes: '5 members' },
  { id: '5', name: 'Support Queue', type: 'call-center', description: 'Inbound support call center', number: '555-555-5083', routing: 'Longest Idle', lastUpdateBy: 'April Diehl', lastUpdateDateTime: '2023-01-06 10:15:00', notes: '8 agents' },
  { id: '6', name: 'Lobby Pickup', type: 'call-pickup', description: 'Front lobby pickup group', number: '', routing: 'Group', lastUpdateBy: 'Seth Cenac', lastUpdateDateTime: '2023-01-05 16:00:00', notes: '' },
  { id: '7', name: 'Business Hours', type: 'time-schedule', description: 'Standard business hours M-F', number: '', routing: '', lastUpdateBy: 'Seth Cenac', lastUpdateDateTime: '2023-01-05 16:30:00', notes: '8am-5pm M-F' },
  { id: '8', name: 'Holiday Schedule', type: 'time-schedule', description: 'US Federal holidays', number: '', routing: '', lastUpdateBy: 'Seth Cenac', lastUpdateDateTime: '2023-01-05 16:45:00', notes: '' },
  { id: '9', name: 'General VM', type: 'group-vm', description: 'General company voicemail', number: '555-555-5084', routing: '', lastUpdateBy: 'April Diehl', lastUpdateDateTime: '2023-01-06 11:00:00', notes: '' },
]

export const mockOmniChannel: OmniChannelEntry[] = [
  { id: '1', type: 'queue-setup', name: 'Sales Chat Queue', description: 'Web chat queue for sales inquiries', status: 'active', lastUpdateBy: 'script', lastUpdateDateTime: '2022-12-21 19:55:35', notes: '' },
  { id: '2', type: 'web-chat', name: 'Website Live Chat', description: 'Primary website chat widget', status: 'active', lastUpdateBy: 'script', lastUpdateDateTime: '2022-12-21 19:57:09', notes: '' },
  { id: '3', type: 'email-queue', name: 'Support Email', description: 'support@company.com routing', status: 'active', lastUpdateBy: 'script', lastUpdateDateTime: '2022-12-21 20:17:05', notes: '' },
  { id: '4', type: 'web-callback', name: 'Callback Request', description: 'Website callback form integration', status: 'pending', lastUpdateBy: 'script', lastUpdateDateTime: '2022-12-21 20:18:38', notes: '' },
  { id: '5', type: 'twitter', name: 'Twitter Support', description: '@companysupport DM routing', status: 'inactive', lastUpdateBy: 'script', lastUpdateDateTime: '2022-12-21 20:38:30', notes: '' },
]

export const mockProvisioningLogs: ProvisioningLog[] = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1),
  lastUpdateBy: 'script',
  lastUpdateDateTime: `2022-12-21 ${19 + Math.floor(i / 3)}:${String((i * 17 + 55) % 60).padStart(2, '0')}:${String((i * 23 + 35) % 60).padStart(2, '0')}`,
  notes: i % 2 === 0
    ? 'Provisioning via API started by Christopher Louis(Developer)'
    : 'Provisioning Completed! Number of providers: 1 Number of groups: 1 Number of virtual users: 9 Num...',
  status: (i % 2 === 0 ? 'started' : 'completed') as ProvisioningLog['status'],
}))

export const dashboardStats = {
  totalProjects: 7014,
  activeProjects: 234,
  provisioningQueue: 18,
  completedThisMonth: 45,
  errorCount: 3,
}
