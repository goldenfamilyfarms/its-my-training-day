import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { type ColumnDef } from '@tanstack/react-table'
import { Plus, Download, Upload, ArrowUpDown } from 'lucide-react'
import type { Project } from '@/types'
import { mockProjects } from '@/data/mock-data'
import { DataTable } from '@/components/data-table/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
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

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={mockProjects}
        searchKey="customerName"
        searchPlaceholder="Search by customer name..."
        onRowClick={(project) => navigate(`/projects/${project.id}`)}
      />
    </motion.div>
  )
}
