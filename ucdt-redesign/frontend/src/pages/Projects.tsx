import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { type ColumnDef } from '@tanstack/react-table'
import { Plus, Download, Upload, ArrowUpDown, Filter, ListFilter } from 'lucide-react'
import type { Project } from '@/types'
import { DataTable } from '@/components/data-table/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { fetchProjects } from '@/lib/api'

const statusConfig = {
  draft: { label: 'Draft', variant: 'secondary' as const },
  'in-progress': { label: 'In Progress', variant: 'default' as const },
  provisioning: { label: 'Provisioning', variant: 'warning' as const },
  completed: { label: 'Completed', variant: 'success' as const },
  error: { label: 'Error', variant: 'destructive' as const },
}

const columns: ColumnDef<Project>[] = [
  {
    accessorKey: 'engId',
    header: ({ column }) => (
      <button className="flex items-center gap-1" onClick={() => column.toggleSorting()}>
        ENG ID <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs text-primary font-medium">{row.getValue('engId')}</span>
    ),
  },
  {
    accessorKey: 'resource',
    header: ({ column }) => (
      <button className="flex items-center gap-1" onClick={() => column.toggleSorting()}>
        Resource <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
  },
  {
    accessorKey: 'projectType',
    header: 'Project Type',
    cell: ({ row }) => (
      <Badge variant="outline" className="font-normal">
        {row.getValue('projectType')}
      </Badge>
    ),
  },
  {
    accessorKey: 'orderType',
    header: 'Order Type',
  },
  {
    accessorKey: 'customerName',
    header: ({ column }) => (
      <button className="flex items-center gap-1" onClick={() => column.toggleSorting()}>
        Customer <ArrowUpDown className="h-3 w-3" />
      </button>
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue('customerName')}</span>
    ),
  },
  {
    accessorKey: 'multiSite',
    header: 'Multi Site',
    cell: ({ row }) => (
      <span className={row.getValue('multiSite') ? 'text-green-500 font-medium' : 'text-muted-foreground'}>
        {row.getValue('multiSite') ? 'Yes' : 'No'}
      </span>
    ),
  },
  {
    accessorKey: 'mainSite',
    header: 'Main Site',
    cell: ({ row }) => (
      <span className={row.getValue('mainSite') ? 'text-green-500 font-medium' : 'text-muted-foreground'}>
        {row.getValue('mainSite') ? 'Yes' : 'No'}
      </span>
    ),
  },
  {
    accessorKey: 'networkRouting',
    header: 'Network Routing',
    cell: ({ row }) => (
      <span className="text-xs">{row.getValue('networkRouting')}</span>
    ),
  },
  {
    accessorKey: 'mainTn',
    header: 'Main TN',
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.getValue('mainTn')}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as Project['status']
      const config = statusConfig[status]
      return <Badge variant={config.variant}>{config.label}</Badge>
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
]

export default function Projects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<Project['status'] | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'Unified Communications' | 'Standard Config'>('all')

  const loadProjects = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await fetchProjects({ limit: 500 })
      setProjects(data)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProjects()
  }, [])

  const stats = useMemo(() => {
    const counts = projects.reduce((acc, project) => {
      acc.total += 1
      acc[project.status] += 1
      return acc
    }, {
      total: 0,
      draft: 0,
      'in-progress': 0,
      provisioning: 0,
      completed: 0,
      error: 0,
    } as Record<'total' | Project['status'], number>)

    return [
      { label: 'Total', value: counts.total, tone: 'text-foreground' },
      { label: 'In Progress', value: counts['in-progress'], tone: 'text-blue-500' },
      { label: 'Provisioning', value: counts.provisioning, tone: 'text-amber-500' },
      { label: 'Completed', value: counts.completed, tone: 'text-green-500' },
      { label: 'Errors', value: counts.error, tone: 'text-destructive' },
    ]
  }, [projects])

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const statusMatch = statusFilter === 'all' || project.status === statusFilter
      const typeMatch = typeFilter === 'all' || project.projectType === typeFilter
      return statusMatch && typeMatch
    })
  }, [projects, statusFilter, typeFilter])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage hosted voice designs and provisioning
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.info('Import feature coming soon')}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.info('Export feature coming soon')}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => toast.success('New project dialog would open here')}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.tone}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {loadError && (
        <Card className="shadow-none border-destructive/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-destructive">Failed to load projects</p>
              <p className="text-xs text-muted-foreground">{loadError}</p>
            </div>
            <Button size="sm" variant="outline" onClick={loadProjects}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="shadow-none">
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            Filters
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {([
              { label: 'All', value: 'all' },
              { label: 'Draft', value: 'draft' },
              { label: 'In Progress', value: 'in-progress' },
              { label: 'Provisioning', value: 'provisioning' },
              { label: 'Completed', value: 'completed' },
              { label: 'Error', value: 'error' },
            ] as const).map((status) => (
              <Button
                key={status.value}
                variant={statusFilter === status.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status.value)}
                className="h-7 text-xs"
              >
                {status.label}
              </Button>
            ))}
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ListFilter className="h-3.5 w-3.5" />
            Project type
          </div>
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as typeof typeFilter)}>
            <SelectTrigger className="h-8 w-[200px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="Unified Communications">Unified Communications</SelectItem>
              <SelectItem value="Standard Config">Standard Config</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={loading ? [] : filteredProjects}
        searchKey="customerName"
        searchPlaceholder="Search by customer name..."
        onRowClick={(project) => navigate(`/projects/${project.id}`)}
      />
      {loading && (
        <p className="text-sm text-muted-foreground">Loading projects…</p>
      )}
    </motion.div>
  )
}
