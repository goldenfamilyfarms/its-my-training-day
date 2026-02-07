import { motion } from 'framer-motion'
import { type ColumnDef } from '@tanstack/react-table'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type ImportRow = {
  id: string
  fileName: string
  type: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  uploadedBy: string
  uploadedAt: string
}

const statusConfig: Record<ImportRow['status'], { label: string; variant: 'secondary' | 'warning' | 'success' | 'destructive' }> = {
  queued: { label: 'Queued', variant: 'secondary' },
  processing: { label: 'Processing', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  failed: { label: 'Failed', variant: 'destructive' },
}

const mockImports: ImportRow[] = [
  { id: '1', fileName: 'engineering_page_0206.xlsx', type: 'Engineering Page', status: 'completed', uploadedBy: 'April Diehl', uploadedAt: '2026-02-06 09:12' },
  { id: '2', fileName: 'engineering_page_0205.xlsx', type: 'Engineering Page', status: 'processing', uploadedBy: 'Seth Cenac', uploadedAt: '2026-02-05 16:45' },
  { id: '3', fileName: 'engineering_page_0204.xlsx', type: 'Engineering Page', status: 'queued', uploadedBy: 'Marcia Gageby', uploadedAt: '2026-02-04 11:02' },
]

const columns: ColumnDef<ImportRow>[] = [
  { accessorKey: 'fileName', header: 'File Name' },
  { accessorKey: 'type', header: 'Type' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <Badge variant={statusConfig[row.original.status].variant}>{statusConfig[row.original.status].label}</Badge>,
  },
  { accessorKey: 'uploadedBy', header: 'Uploaded By' },
  { accessorKey: 'uploadedAt', header: 'Uploaded At' },
]

export default function EngineeringImport() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Engineering Page Import</h1>
          <p className="text-muted-foreground">Upload and validate engineering worksheets</p>
        </div>
        <Button onClick={() => toast.info('Upload dialog would open')}>
          <Upload className="mr-2 h-4 w-4" />
          Upload File
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: 'Queued', value: 1 },
          { label: 'Processing', value: 1 },
          { label: 'Completed', value: 1 },
        ].map((stat) => (
          <Card key={stat.label} className="shadow-none">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Recent Imports</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={mockImports} searchKey="fileName" searchPlaceholder="Search imports..." />
        </CardContent>
      </Card>
    </motion.div>
  )
}
