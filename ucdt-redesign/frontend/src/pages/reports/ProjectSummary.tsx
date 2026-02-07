import { motion } from 'framer-motion'
import { type ColumnDef } from '@tanstack/react-table'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import type { Project } from '@/types'
import { fetchProjects } from '@/lib/api'
import { useEffect, useState } from 'react'
import { DataTable } from '@/components/data-table/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const statusConfig: Record<Project['status'], { label: string; variant: 'secondary' | 'default' | 'warning' | 'success' | 'destructive' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  'in-progress': { label: 'In Progress', variant: 'default' },
  provisioning: { label: 'Provisioning', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  error: { label: 'Error', variant: 'destructive' },
}

const columns: ColumnDef<Project>[] = [
  { accessorKey: 'customerName', header: 'Customer' },
  { accessorKey: 'projectType', header: 'Project Type' },
  { accessorKey: 'orderType', header: 'Order Type' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const config = statusConfig[row.original.status]
      return <Badge variant={config.variant}>{config.label}</Badge>
    },
  },
  { accessorKey: 'updatedAt', header: 'Last Updated' },
]

export default function ProjectSummaryReport() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchProjects({ limit: 50 })
        setProjects(data)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Project Summary</h1>
          <p className="text-muted-foreground">Overview of active designs and status</p>
        </div>
        <Button onClick={() => toast.success('Report exported')}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Recent Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={loading ? [] : projects}
            searchKey="customerName"
            searchPlaceholder="Search projects..."
          />
          {loading && <p className="text-sm text-muted-foreground mt-2">Loading projects…</p>}
        </CardContent>
      </Card>
    </motion.div>
  )
}
