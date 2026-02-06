export interface Project {
  id: string
  engId: string
  resource: string
  projectType: string
  orderType: string
  customerName: string
  multiSite: boolean
  mainSite: boolean
  existingUcEnterprise: boolean
  networkRouting: string
  existingEntId: string
  groupId: string
  groupName: string
  mainTn: string
  status: 'draft' | 'in-progress' | 'provisioning' | 'completed' | 'error'
  createdAt: string
  updatedAt: string
}

export interface TnMapEntry {
  id: string
  tn: string
  extension: string
  firstName: string
  lastName: string
  userId: string
  deviceType: string
  macAddress: string
  linePort: string
  status: 'active' | 'pending' | 'ported'
}

export interface UserEntry {
  id: string
  userId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  extension: string
  department: string
  deviceType: string
  callPlan: string
  voicemail: boolean
  status: 'active' | 'inactive' | 'pending'
}

export interface GeneralNote {
  id: string
  lastUpdateBy: string
  lastUpdateDateTime: string
  notes: string
}

export interface TrueUpEntry {
  id: string
  type: string
  description: string
  ordered: number
  actual: number
  notes: string
}

export interface CallFlowEntry {
  id: string
  name: string
  type: 'main-number' | 'auto-attendant' | 'hunt-group' | 'call-center' | 'call-pickup' | 'time-schedule' | 'group-vm' | 'hospitality'
  description: string
  number: string
  routing: string
  lastUpdateBy: string
  lastUpdateDateTime: string
  notes: string
}

export interface OmniChannelEntry {
  id: string
  type: 'queue-setup' | 'web-chat' | 'email-queue' | 'web-callback' | 'twitter'
  name: string
  description: string
  status: 'active' | 'inactive' | 'pending'
  lastUpdateBy: string
  lastUpdateDateTime: string
  notes: string
}

export interface ProvisioningLog {
  id: string
  lastUpdateBy: string
  lastUpdateDateTime: string
  notes: string
  status: 'started' | 'completed' | 'failed'
}

export type NavItem = {
  title: string
  href: string
  icon: string
  badge?: number
  children?: NavItem[]
}
