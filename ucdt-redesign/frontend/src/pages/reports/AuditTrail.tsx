import { motion } from 'framer-motion'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/data-table/DataTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type AuditRow = {
  id: string
  action: string
  actor: string
  target: string
  timestamp: string
}

const mockAudit: AuditRow[] = [
  { id: '1', action: 'Created project', actor: 'April Diehl', target: 'Houston Astros', timestamp: '2026-02-06 09:12' },
  { id: '2', action: 'Provisioned', actor: 'Seth Cenac', target: 'UCDT Dry Run', timestamp: '2026-02-06 08:40' },
  { id: '3', action: 'Updated TN Map', actor: 'Marcia Gageby', target: 'Charter UC Tampa', timestamp: '2026-02-05 15:22' },
]

const columns: ColumnDef<AuditRow>[] = [
  { accessorKey: 'action', header: 'Action' },
  { accessorKey: 'actor', header: 'Actor' },
  { accessorKey: 'target', header: 'Target' },
  { accessorKey: 'timestamp', header: 'Timestamp' },
]

export default function AuditTrailReport() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Trail</h1>
        <p className="text-muted-foreground">Track who changed what and when</p>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Latest Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={mockAudit} searchKey="action" searchPlaceholder="Search actions..." />
        </CardContent>
      </Card>
    </motion.div>
  )
}
