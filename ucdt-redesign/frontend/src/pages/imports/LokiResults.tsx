import { motion } from 'framer-motion'
import { type ColumnDef } from '@tanstack/react-table'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type LokiResult = {
  id: string
  testName: string
  status: 'pass' | 'warn' | 'fail'
  score: number
  runAt: string
}

const statusConfig: Record<LokiResult['status'], { label: string; variant: 'success' | 'warning' | 'destructive' }> = {
  pass: { label: 'Pass', variant: 'success' },
  warn: { label: 'Warn', variant: 'warning' },
  fail: { label: 'Fail', variant: 'destructive' },
}

const mockResults: LokiResult[] = [
  { id: '1', testName: 'Data Integrity', status: 'pass', score: 98, runAt: '2026-02-06 09:10' },
  { id: '2', testName: 'TN Map Validation', status: 'warn', score: 82, runAt: '2026-02-06 08:42' },
  { id: '3', testName: 'MAC Address Check', status: 'fail', score: 61, runAt: '2026-02-05 17:22' },
]

const columns: ColumnDef<LokiResult>[] = [
  { accessorKey: 'testName', header: 'Test' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <Badge variant={statusConfig[row.original.status].variant}>{statusConfig[row.original.status].label}</Badge>,
  },
  { accessorKey: 'score', header: 'Score' },
  { accessorKey: 'runAt', header: 'Run Time' },
]

export default function LokiResults() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Loki Results</h1>
          <p className="text-muted-foreground">Automated validation checks for imports</p>
        </div>
        <Button variant="outline" onClick={() => toast.info('Refreshing validation results')}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Latest Runs</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={mockResults} searchKey="testName" searchPlaceholder="Search tests..." />
        </CardContent>
      </Card>
    </motion.div>
  )
}
