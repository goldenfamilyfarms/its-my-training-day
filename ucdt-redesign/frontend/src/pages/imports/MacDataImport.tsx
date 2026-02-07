import { motion } from 'framer-motion'
import { type ColumnDef } from '@tanstack/react-table'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type MacRow = {
  id: string
  macAddress: string
  device: string
  assignedTo: string
  status: 'assigned' | 'unassigned'
}

const mockMacs: MacRow[] = [
  { id: '1', macAddress: '00:1A:2B:00:CD:EF', device: 'Poly VVX 450', assignedTo: 'Lance McCluers', status: 'assigned' },
  { id: '2', macAddress: '00:1A:2B:01:CD:EF', device: 'Cisco 8845', assignedTo: 'Unassigned', status: 'unassigned' },
  { id: '3', macAddress: '00:1A:2B:02:CD:EF', device: 'Poly VVX 350', assignedTo: 'Ryan Pressly', status: 'assigned' },
]

const columns: ColumnDef<MacRow>[] = [
  { accessorKey: 'macAddress', header: 'MAC Address' },
  { accessorKey: 'device', header: 'Device' },
  { accessorKey: 'assignedTo', header: 'Assigned To' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.status === 'assigned' ? 'success' : 'secondary'}>
        {row.original.status}
      </Badge>
    ),
  },
]

export default function MacDataImport() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">MAC Address Import</h1>
          <p className="text-muted-foreground">Assign device inventory to users</p>
        </div>
        <Button onClick={() => toast.info('Upload dialog would open')}>
          <Upload className="mr-2 h-4 w-4" />
          Upload CSV
        </Button>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">MAC Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={mockMacs} searchKey="macAddress" searchPlaceholder="Search MACs..." />
        </CardContent>
      </Card>
    </motion.div>
  )
}
