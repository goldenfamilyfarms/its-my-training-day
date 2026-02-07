import { motion } from 'framer-motion'
import { type ColumnDef } from '@tanstack/react-table'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import type { ProvisioningLog } from '@/types'
import { mockProvisioningLogs } from '@/data/mock-data'
import { DataTable } from '@/components/data-table/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const statusConfig: Record<ProvisioningLog['status'], { label: string; variant: 'warning' | 'success' | 'destructive' }> = {
  started: { label: 'Started', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  failed: { label: 'Failed', variant: 'destructive' },
}

const columns: ColumnDef<ProvisioningLog>[] = [
  {
    accessorKey: 'lastUpdateDateTime',
    header: 'Date/Time',
    cell: ({ row }) => <span className="text-xs font-mono">{row.original.lastUpdateDateTime}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={statusConfig[row.original.status].variant}>
        {statusConfig[row.original.status].label}
      </Badge>
    ),
  },
  {
    accessorKey: 'notes',
    header: 'Notes',
    cell: ({ row }) => <span className="text-sm">{row.original.notes}</span>,
  },
  {
    accessorKey: 'lastUpdateBy',
    header: 'Updated By',
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.lastUpdateBy}</span>,
  },
]

export default function ProvisioningLogReport() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Provisioning Log</h1>
          <p className="text-muted-foreground">Audit log for provisioning activity</p>
        </div>
        <Button onClick={() => toast.success('Provisioning log exported')}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Log Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={mockProvisioningLogs} searchPlaceholder="Search logs..." />
        </CardContent>
      </Card>
    </motion.div>
  )
}
