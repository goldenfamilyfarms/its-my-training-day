import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { type ColumnDef } from '@tanstack/react-table'
import {
  ArrowLeft, Phone, Users, FileText, GitBranch, Headphones,
  BarChart3, Send, Edit, Trash2, Plus, Download, ArrowUpDown,
  ChevronDown, Clock, MessageSquare, Wifi, Mail, PhoneCall, Twitter
} from 'lucide-react'
import { toast } from 'sonner'
import type { Project, TnMapEntry, UserEntry, GeneralNote, TrueUpEntry, CallFlowEntry, OmniChannelEntry } from '@/types'
import {
  mockTnMap, mockUsers, mockGeneralNotes,
  mockTrueUp, mockCallFlows, mockOmniChannel, mockProvisioningLogs
} from '@/data/mock-data'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/data-table/DataTable'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { fetchProject, provisionProject } from '@/lib/api'

// TN Map columns
const tnMapColumns: ColumnDef<TnMapEntry>[] = [
  { accessorKey: 'tn', header: 'TN', cell: ({ row }) => <span className="font-mono text-xs">{row.getValue('tn')}</span> },
  { accessorKey: 'extension', header: 'Ext', cell: ({ row }) => <span className="font-mono text-xs">{row.getValue('extension')}</span> },
  { accessorKey: 'firstName', header: 'First Name' },
  { accessorKey: 'lastName', header: 'Last Name' },
  { accessorKey: 'userId', header: 'User ID', cell: ({ row }) => <span className="text-xs">{row.getValue('userId')}</span> },
  { accessorKey: 'deviceType', header: 'Device Type', cell: ({ row }) => <Badge variant="outline" className="text-xs font-normal">{row.getValue('deviceType')}</Badge> },
  { accessorKey: 'macAddress', header: 'MAC Address', cell: ({ row }) => <span className="font-mono text-xs">{row.getValue('macAddress')}</span> },
  {
    accessorKey: 'status', header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return <Badge variant={status === 'active' ? 'success' : status === 'ported' ? 'default' : 'secondary'}>{status}</Badge>
    }
  },
]

// User List columns
const userColumns: ColumnDef<UserEntry>[] = [
  { accessorKey: 'firstName', header: 'First Name' },
  { accessorKey: 'lastName', header: 'Last Name' },
  { accessorKey: 'email', header: 'Email', cell: ({ row }) => <span className="text-xs">{row.getValue('email')}</span> },
  { accessorKey: 'extension', header: 'Ext', cell: ({ row }) => <span className="font-mono text-xs">{row.getValue('extension')}</span> },
  { accessorKey: 'department', header: 'Department', cell: ({ row }) => <Badge variant="outline" className="text-xs font-normal">{row.getValue('department')}</Badge> },
  { accessorKey: 'deviceType', header: 'Device' },
  { accessorKey: 'callPlan', header: 'Call Plan' },
  {
    accessorKey: 'voicemail', header: 'VM',
    cell: ({ row }) => <span className={row.getValue('voicemail') ? 'text-green-500' : 'text-muted-foreground'}>{row.getValue('voicemail') ? 'Yes' : 'No'}</span>
  },
  {
    accessorKey: 'status', header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return <Badge variant={status === 'active' ? 'success' : status === 'inactive' ? 'destructive' : 'secondary'}>{status}</Badge>
    }
  },
]

// General Notes columns
const notesColumns: ColumnDef<GeneralNote>[] = [
  { accessorKey: 'lastUpdateBy', header: 'Updated By' },
  { accessorKey: 'lastUpdateDateTime', header: 'Date/Time', cell: ({ row }) => <span className="text-xs font-mono">{row.getValue('lastUpdateDateTime')}</span> },
  { accessorKey: 'notes', header: 'Notes', cell: ({ row }) => <span className="text-sm max-w-md truncate block">{row.getValue('notes')}</span> },
]

// True Up columns
const trueUpColumns: ColumnDef<TrueUpEntry>[] = [
  { accessorKey: 'type', header: 'Type', cell: ({ row }) => row.getValue('type') ? <Badge variant="outline">{row.getValue('type')}</Badge> : <span className="text-muted-foreground">-</span> },
  { accessorKey: 'description', header: 'Description', cell: ({ row }) => <span className="font-medium">{row.getValue('description') || '-'}</span> },
  { accessorKey: 'ordered', header: 'Ordered', cell: ({ row }) => <span className="font-mono text-sm">{row.getValue('ordered')}</span> },
  {
    accessorKey: 'actual', header: 'Actual',
    cell: ({ row }) => {
      const ordered = row.original.ordered
      const actual = row.getValue('actual') as number
      const diff = actual - ordered
      return (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm">{actual}</span>
          {diff !== 0 && ordered > 0 && (
            <Badge variant={diff > 0 ? 'warning' : 'destructive'} className="text-[10px]">
              {diff > 0 ? `+${diff}` : diff}
            </Badge>
          )}
        </div>
      )
    }
  },
  { accessorKey: 'notes', header: 'Notes', cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.getValue('notes') || '-'}</span> },
]

// Call Flow columns
const callFlowColumns: ColumnDef<CallFlowEntry>[] = [
  {
    accessorKey: 'type', header: 'Type',
    cell: ({ row }) => {
      const type = row.getValue('type') as string
      const icons: Record<string, React.ReactNode> = {
        'main-number': <Phone className="h-3.5 w-3.5" />,
        'auto-attendant': <Headphones className="h-3.5 w-3.5" />,
        'hunt-group': <Users className="h-3.5 w-3.5" />,
        'call-center': <Headphones className="h-3.5 w-3.5" />,
        'call-pickup': <PhoneCall className="h-3.5 w-3.5" />,
        'time-schedule': <Clock className="h-3.5 w-3.5" />,
        'group-vm': <MessageSquare className="h-3.5 w-3.5" />,
        'hospitality': <Users className="h-3.5 w-3.5" />,
      }
      return (
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-primary">{icons[type]}</div>
          <Badge variant="outline" className="text-xs font-normal capitalize">{type.replace(/-/g, ' ')}</Badge>
        </div>
      )
    }
  },
  { accessorKey: 'name', header: 'Name', cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span> },
  { accessorKey: 'description', header: 'Description' },
  { accessorKey: 'number', header: 'Number', cell: ({ row }) => <span className="font-mono text-xs">{row.getValue('number') || '-'}</span> },
  { accessorKey: 'routing', header: 'Routing' },
  { accessorKey: 'lastUpdateBy', header: 'Updated By' },
  { accessorKey: 'notes', header: 'Notes', cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.getValue('notes') || '-'}</span> },
]

// Omni Channel columns
const omniColumns: ColumnDef<OmniChannelEntry>[] = [
  {
    accessorKey: 'type', header: 'Type',
    cell: ({ row }) => {
      const type = row.getValue('type') as string
      const icons: Record<string, React.ReactNode> = {
        'queue-setup': <Users className="h-3.5 w-3.5" />,
        'web-chat': <MessageSquare className="h-3.5 w-3.5" />,
        'email-queue': <Mail className="h-3.5 w-3.5" />,
        'web-callback': <PhoneCall className="h-3.5 w-3.5" />,
        'twitter': <Twitter className="h-3.5 w-3.5" />,
      }
      return (
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center text-primary">{icons[type]}</div>
          <Badge variant="outline" className="text-xs font-normal capitalize">{type.replace(/-/g, ' ')}</Badge>
        </div>
      )
    }
  },
  { accessorKey: 'name', header: 'Name', cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span> },
  { accessorKey: 'description', header: 'Description' },
  {
    accessorKey: 'status', header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return <Badge variant={status === 'active' ? 'success' : status === 'pending' ? 'warning' : 'secondary'}>{status}</Badge>
    }
  },
  { accessorKey: 'lastUpdateBy', header: 'Updated By' },
  { accessorKey: 'lastUpdateDateTime', header: 'Last Update', cell: ({ row }) => <span className="text-xs font-mono">{row.getValue('lastUpdateDateTime')}</span> },
  { accessorKey: 'notes', header: 'Notes', cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.getValue('notes') || '-'}</span> },
]

const callFlowSubTypes = [
  { label: 'All', value: 'all' },
  { label: 'Main Numbers', value: 'main-number' },
  { label: 'Auto Attendant', value: 'auto-attendant' },
  { label: 'Hunt Groups', value: 'hunt-group' },
  { label: 'Call Center', value: 'call-center' },
  { label: 'Call Pickup', value: 'call-pickup' },
  { label: 'Time Schedules', value: 'time-schedule' },
  { label: 'Group VM', value: 'group-vm' },
  { label: 'Hospitality', value: 'hospitality' },
]

const omniSubTypes = [
  { label: 'All', value: 'all' },
  { label: 'Queue Setup', value: 'queue-setup' },
  { label: 'Web Chat', value: 'web-chat' },
  { label: 'Email Queue', value: 'email-queue' },
  { label: 'Web Callback', value: 'web-callback' },
  { label: 'Twitter', value: 'twitter' },
]

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadProject = async () => {
    if (!id) return
    setLoading(true)
    setLoadError(null)
    try {
      const data = await fetchProject(id)
      setProject(data)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to load project')
      setProject(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProject()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <p className="text-sm text-muted-foreground">Loading project…</p>
      </div>
    )
  }

  if (loadError || !project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Project Not Found</h2>
          <p className="text-muted-foreground mt-1">{loadError ?? 'The project you are looking for does not exist.'}</p>
          <Button onClick={() => navigate('/projects')} className="mt-4">Back to Projects</Button>
        </div>
      </div>
    )
  }

  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline' }> = {
    draft: { label: 'Draft', variant: 'secondary' },
    'in-progress': { label: 'In Progress', variant: 'default' },
    provisioning: { label: 'Provisioning', variant: 'warning' },
    completed: { label: 'Completed', variant: 'success' },
    error: { label: 'Error', variant: 'destructive' },
  }
  const sc = statusConfig[project.status]
  const provisioningSteps = [
    { label: 'Design', description: 'Form data captured' },
    { label: 'Review', description: 'QA and validation' },
    { label: 'Provision', description: 'XLSX to partner' },
    { label: 'Complete', description: 'Devices live' },
  ]
  const statusToStep: Record<Project['status'], number> = {
    draft: 0,
    'in-progress': 1,
    provisioning: 2,
    completed: 3,
    error: 2,
  }
  const activeStep = statusToStep[project.status]
  const latestNote = mockGeneralNotes[0]
  const latestProvisioning = mockProvisioningLogs[0]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{project.customerName}</h1>
              <Badge variant={sc.variant}>{sc.label}</Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span className="font-mono">{project.engId}</span>
              <Separator orientation="vertical" className="h-4" />
              <span>{project.projectType}</span>
              <Separator orientation="vertical" className="h-4" />
              <span>{project.orderType}</span>
              <Separator orientation="vertical" className="h-4" />
              <span>{project.resource}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.info('Edit mode would be enabled')}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.info('Export to XLSX')}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            size="sm"
            onClick={async () => {
              try {
                const response = await provisionProject(project.id)
                setProject(response.project)
                toast.success('Provisioning request sent to third-party application')
              } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Provisioning failed')
              }
            }}
          >
            <Send className="mr-2 h-4 w-4" />
            Provision
          </Button>
        </div>
      </div>

      {/* Project Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: 'Group ID', value: project.groupId },
          { label: 'Main TN', value: project.mainTn },
          { label: 'Network Routing', value: project.networkRouting },
          { label: 'Existing Ent ID', value: project.existingEntId },
          { label: 'Multi Site', value: project.multiSite ? 'Yes' : 'No' },
          { label: 'UC Enterprise', value: project.existingUcEnterprise ? 'Yes' : 'No' },
        ].map((info) => (
          <Card key={info.label} className="shadow-none">
            <CardContent className="p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{info.label}</p>
              <p className="text-sm font-medium mt-0.5 truncate" title={info.value}>{info.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Project Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Customer</span>
              <span className="font-medium">{project.customerName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Engineering ID</span>
              <span className="font-mono">{project.engId}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Resource</span>
              <span className="font-medium">{project.resource}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Order Type</span>
              <span className="font-medium">{project.orderType}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Provisioning Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {provisioningSteps.map((step, index) => (
              <div key={step.label} className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 h-6 w-6 rounded-full border flex items-center justify-center text-xs font-semibold",
                    index <= activeStep ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground"
                  )}
                >
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-medium">{step.label}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Latest Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Last note</p>
              <p className="text-sm font-medium mt-1">{latestNote.notes}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{latestNote.lastUpdateDateTime}</p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Provisioning</p>
              <p className="text-sm font-medium mt-1">{latestProvisioning.notes}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={latestProvisioning.status === 'completed' ? 'success' : 'warning'}>
                  {latestProvisioning.status}
                </Badge>
                <span className="text-[11px] text-muted-foreground">{latestProvisioning.lastUpdateDateTime}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tn-map" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="tn-map" className="gap-1.5">
            <Phone className="h-3.5 w-3.5" />
            TN Map
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{mockTnMap.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            User List
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{mockUsers.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            General Notes
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{mockGeneralNotes.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="call-flow" className="gap-1.5">
            <GitBranch className="h-3.5 w-3.5" />
            Call Flow Design
          </TabsTrigger>
          <TabsTrigger value="omni" className="gap-1.5">
            <Headphones className="h-3.5 w-3.5" />
            Omni Channel
          </TabsTrigger>
          <TabsTrigger value="true-up" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            True Up
          </TabsTrigger>
        </TabsList>

        {/* TN Map Tab */}
        <TabsContent value="tn-map">
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">TN Map</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm"><Plus className="mr-1 h-3 w-3" />Add TN</Button>
                <Button variant="outline" size="sm"><Edit className="mr-1 h-3 w-3" />Edit</Button>
              </div>
            </div>
            <DataTable columns={tnMapColumns} data={mockTnMap} searchKey="tn" searchPlaceholder="Search by TN..." />
          </motion.div>
        </TabsContent>

        {/* User List Tab */}
        <TabsContent value="users">
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">User List</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm"><Plus className="mr-1 h-3 w-3" />Add User</Button>
                <Button variant="outline" size="sm"><Edit className="mr-1 h-3 w-3" />Edit</Button>
              </div>
            </div>
            <DataTable columns={userColumns} data={mockUsers} searchKey="lastName" searchPlaceholder="Search by last name..." />
          </motion.div>
        </TabsContent>

        {/* General Notes Tab */}
        <TabsContent value="notes">
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">General Notes</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm"><Plus className="mr-1 h-3 w-3" />New Note</Button>
                <Button variant="outline" size="sm"><Trash2 className="mr-1 h-3 w-3" />Delete</Button>
                <Button variant="outline" size="sm"><Edit className="mr-1 h-3 w-3" />Edit</Button>
              </div>
            </div>
            <DataTable columns={notesColumns} data={mockGeneralNotes} searchPlaceholder="Search notes..." />
          </motion.div>
        </TabsContent>

        {/* Call Flow Design Tab */}
        <TabsContent value="call-flow">
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">Call Flow Design</h3>
                <div className="flex gap-1 flex-wrap">
                  {callFlowSubTypes.map((subType) => (
                    <Button key={subType.value} variant="outline" size="sm" className="h-7 text-xs">
                      {subType.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm"><Plus className="mr-1 h-3 w-3" />New</Button>
                <Button variant="outline" size="sm"><Edit className="mr-1 h-3 w-3" />Edit</Button>
              </div>
            </div>
            <DataTable columns={callFlowColumns} data={mockCallFlows} searchKey="name" searchPlaceholder="Search call flows..." />
          </motion.div>
        </TabsContent>

        {/* Omni Channel Tab */}
        <TabsContent value="omni">
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">Omni Channel</h3>
                <Badge variant="warning">WIP</Badge>
                <div className="flex gap-1 flex-wrap">
                  {omniSubTypes.map((subType) => (
                    <Button key={subType.value} variant="outline" size="sm" className="h-7 text-xs">
                      {subType.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm"><Plus className="mr-1 h-3 w-3" />New</Button>
                <Button variant="outline" size="sm"><Edit className="mr-1 h-3 w-3" />Edit</Button>
              </div>
            </div>
            <DataTable columns={omniColumns} data={mockOmniChannel} searchKey="name" searchPlaceholder="Search channels..." />
          </motion.div>
        </TabsContent>

        {/* True Up Tab */}
        <TabsContent value="true-up">
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">True Up</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm"><Edit className="mr-1 h-3 w-3" />Edit</Button>
              </div>
            </div>
            {/* True Up Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {(() => {
                const totalOrdered = mockTrueUp.reduce((sum, e) => sum + e.ordered, 0)
                const totalActual = mockTrueUp.reduce((sum, e) => sum + e.actual, 0)
                const mismatches = mockTrueUp.filter(e => e.ordered > 0 && e.ordered !== e.actual).length
                return [
                  { label: 'Total Ordered', value: totalOrdered, color: 'text-primary' },
                  { label: 'Total Actual', value: totalActual, color: totalActual === totalOrdered ? 'text-green-500' : 'text-amber-500' },
                  { label: 'Mismatches', value: mismatches, color: mismatches > 0 ? 'text-destructive' : 'text-green-500' },
                ].map((s) => (
                  <Card key={s.label} className="shadow-none">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
                      <p className={cn("text-2xl font-bold mt-1", s.color)}>{s.value}</p>
                    </CardContent>
                  </Card>
                ))
              })()}
            </div>
            <DataTable columns={trueUpColumns} data={mockTrueUp} searchKey="description" searchPlaceholder="Search items..." />
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
