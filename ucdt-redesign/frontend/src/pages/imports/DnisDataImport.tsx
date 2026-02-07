import { motion } from 'framer-motion'
import { type ColumnDef } from '@tanstack/react-table'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table/DataTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type DnisRow = {
  id: string
  dnis: string
  route: string
  location: string
  status: string
}

const mockDnis: DnisRow[] = [
  { id: '1', dnis: '555-555-5079', route: 'Main Line', location: 'Houston', status: 'Mapped' },
  { id: '2', dnis: '555-555-5081', route: 'Support AA', location: 'Houston', status: 'Mapped' },
  { id: '3', dnis: '555-555-5090', route: 'Sales Queue', location: 'Tampa', status: 'Pending' },
]

const columns: ColumnDef<DnisRow>[] = [
  { accessorKey: 'dnis', header: 'DNIS' },
  { accessorKey: 'route', header: 'Route' },
  { accessorKey: 'location', header: 'Location' },
  { accessorKey: 'status', header: 'Status' },
]

export default function DnisDataImport() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">DNIS Data Import</h1>
          <p className="text-muted-foreground">Validate inbound routes and number mapping</p>
        </div>
        <Button onClick={() => toast.info('Upload dialog would open')}>
          <Upload className="mr-2 h-4 w-4" />
          Upload CSV
        </Button>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">DNIS Records</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={mockDnis} searchKey="dnis" searchPlaceholder="Search DNIS..." />
        </CardContent>
      </Card>
    </motion.div>
  )
}
