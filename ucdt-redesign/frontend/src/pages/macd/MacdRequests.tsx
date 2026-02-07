import { motion } from 'framer-motion'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/data-table/DataTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type MacdRequest = {
  id: string
  type: string
  customer: string
  requestedBy: string
  status: 'open' | 'in-review' | 'completed'
}

const mockRequests: MacdRequest[] = [
  { id: '1', type: 'Move', customer: 'Houston Astros', requestedBy: 'April Diehl', status: 'open' },
  { id: '2', type: 'Add', customer: 'UCDT Dry Run', requestedBy: 'Seth Cenac', status: 'in-review' },
  { id: '3', type: 'Change', customer: 'Charter UC Tampa', requestedBy: 'Marcia Gageby', status: 'completed' },
]

const columns: ColumnDef<MacdRequest>[] = [
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'customer', header: 'Customer' },
  { accessorKey: 'requestedBy', header: 'Requested By' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status
      const variant = status === 'completed' ? 'success' : status === 'in-review' ? 'warning' : 'secondary'
      return <Badge variant={variant}>{status}</Badge>
    },
  },
]

export default function MacdRequests() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">MACD Requests</h1>
        <p className="text-muted-foreground">Move/Add/Change/Delete requests in flight</p>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={mockRequests} searchKey="customer" searchPlaceholder="Search requests..." />
        </CardContent>
      </Card>
    </motion.div>
  )
}
