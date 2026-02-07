import { motion } from 'framer-motion'
import { type ColumnDef } from '@tanstack/react-table'
import { Copy, Plus, Upload } from 'lucide-react'
import { toast } from 'sonner'
import type { ProvisioningTemplate } from '@/types'
import { mockProvisioningTemplates } from '@/data/mock-data'
import { DataTable } from '@/components/data-table/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const statusConfig: Record<ProvisioningTemplate['status'], { label: string; variant: 'default' | 'warning' | 'secondary' }> = {
  active: { label: 'Active', variant: 'default' },
  deprecated: { label: 'Deprecated', variant: 'warning' },
  draft: { label: 'Draft', variant: 'secondary' },
}

const columns: ColumnDef<ProvisioningTemplate>[] = [
  {
    accessorKey: 'name',
    header: 'Template',
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.name}</p>
        <p className="text-xs text-muted-foreground">{row.original.description}</p>
      </div>
    ),
  },
  { accessorKey: 'product', header: 'Product' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const config = statusConfig[row.original.status]
      return <Badge variant={config.variant}>{config.label}</Badge>
    },
  },
  { accessorKey: 'version', header: 'Version' },
  { accessorKey: 'owner', header: 'Owner' },
  {
    accessorKey: 'lastUpdated',
    header: 'Last Updated',
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.lastUpdated}</span>,
  },
  {
    accessorKey: 'isDefault',
    header: 'Default',
    cell: ({ row }) => (
      row.original.isDefault ? <Badge variant="success">Default</Badge> : <span className="text-xs text-muted-foreground">—</span>
    ),
  },
]

export default function ProvisioningTemplates() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Provisioning Templates</h1>
          <p className="text-muted-foreground">Manage XLSX mappings and template versions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => toast.info('Template import coming soon')}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button onClick={() => toast.success('New template wizard would open')}>
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {mockProvisioningTemplates.map((template) => (
          <Card key={template.id} className="shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{template.name}</CardTitle>
                <Badge variant={statusConfig[template.status].variant}>
                  {statusConfig[template.status].label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{template.description}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{template.product} · {template.version}</span>
                <span>Updated {template.lastUpdated}</span>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => toast.info(`Viewing ${template.name}`)}>
                  View
                </Button>
                <Button size="sm" variant="outline" onClick={() => toast.success(`Copied ${template.name}`)}>
                  <Copy className="mr-1 h-3 w-3" />
                  Duplicate
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Template Registry</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={mockProvisioningTemplates} searchKey="name" searchPlaceholder="Search templates..." />
        </CardContent>
      </Card>
    </motion.div>
  )
}
