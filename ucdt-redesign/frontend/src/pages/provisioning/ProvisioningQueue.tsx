import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { type ColumnDef } from '@tanstack/react-table'
import { Download, Send, AlertTriangle, CheckCircle2, Clock, ArrowUpRight } from 'lucide-react'
import { toast } from 'sonner'
import type { Project } from '@/types'
import { DataTable } from '@/components/data-table/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchProjects, provisionProject } from '@/lib/api'

type QueueRow = Project & {
  stage: 'ready' | 'sending' | 'blocked'
}

const stageConfig: Record<QueueRow['stage'], { label: string; variant: 'default' | 'warning' | 'destructive' }> = {
  ready: { label: 'Ready', variant: 'default' },
  sending: { label: 'Sending', variant: 'warning' },
  blocked: { label: 'Blocked', variant: 'destructive' },
}

export default function ProvisioningQueue() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadProjects = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await fetchProjects({ limit: 500 })
      setProjects(data)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to load queue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadProjects()
  }, [])

  const handleProvision = async (projectId: string, customerName: string) => {
    try {
      const response = await provisionProject(projectId)
      setProjects(prev => prev.map(item => item.id === projectId ? response.project : item))
      toast.success(`Provisioning sent for ${customerName}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Provisioning failed')
    }
  }

  const handleBatchSend = async () => {
    const readyItems = queueRows.filter(row => row.stage === 'ready')
    if (readyItems.length === 0) {
      toast.info('No ready items to send')
      return
    }
    try {
      await Promise.all(readyItems.map(item => provisionProject(item.id)))
      await loadProjects()
      toast.success(`Sent ${readyItems.length} provisioning requests`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Batch provisioning failed')
    }
  }

  const columns: ColumnDef<QueueRow>[] = [
    {
      accessorKey: 'customerName',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.customerName}</p>
          <p className="text-xs text-muted-foreground">{row.original.engId}</p>
        </div>
      ),
    },
    {
      accessorKey: 'projectType',
      header: 'Project Type',
      cell: ({ row }) => <Badge variant="outline">{row.original.projectType}</Badge>,
    },
    {
      accessorKey: 'mainTn',
      header: 'Main TN',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.mainTn}</span>,
    },
    {
      accessorKey: 'networkRouting',
      header: 'Routing',
      cell: ({ row }) => <span className="text-xs">{row.original.networkRouting}</span>,
    },
    {
      accessorKey: 'updatedAt',
      header: 'Last Updated',
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.updatedAt}</span>,
    },
    {
      accessorKey: 'stage',
      header: 'Stage',
      cell: ({ row }) => {
        const config = stageConfig[row.original.stage]
        return <Badge variant={config.variant}>{config.label}</Badge>
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.success(`XLSX exported for ${row.original.customerName}`)}
          >
            <Download className="mr-1 h-3 w-3" />
            Export
          </Button>
          <Button
            size="sm"
            onClick={() => handleProvision(row.original.id, row.original.customerName)}
          >
            <Send className="mr-1 h-3 w-3" />
            Send
          </Button>
        </div>
      ),
    },
  ]

  const queueRows = useMemo<QueueRow[]>(() => {
    return projects
      .filter(project => project.status === 'provisioning' || project.status === 'in-progress' || project.status === 'error')
      .map(project => ({
        ...project,
        stage: project.status === 'error' ? 'blocked' : project.status === 'provisioning' ? 'sending' : 'ready',
      }))
  }, [projects])

  const stats = useMemo(() => {
    const total = queueRows.length
    const ready = queueRows.filter(row => row.stage === 'ready').length
    const sending = queueRows.filter(row => row.stage === 'sending').length
    const blocked = queueRows.filter(row => row.stage === 'blocked').length
    return { total, ready, sending, blocked }
  }, [queueRows])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Provisioning Queue</h1>
          <p className="text-muted-foreground">Prepare, validate, and send provisioning files</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadProjects}>
            <Clock className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleBatchSend}>
            <Send className="mr-2 h-4 w-4" />
            Send Ready
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {[
          { label: 'Total in Queue', value: stats.total, icon: Clock },
          { label: 'Ready', value: stats.ready, icon: CheckCircle2 },
          { label: 'Sending', value: stats.sending, icon: ArrowUpRight },
          { label: 'Blocked', value: stats.blocked, icon: AlertTriangle },
        ].map((stat) => (
          <Card key={stat.label} className="shadow-none">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <stat.icon className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Queue Items</CardTitle>
        </CardHeader>
        <CardContent>
          {loadError && (
            <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {loadError}
            </div>
          )}
          <DataTable
            columns={columns}
            data={loading ? [] : queueRows}
            searchKey="customerName"
            searchPlaceholder="Search by customer name..."
          />
          {loading && (
            <p className="text-sm text-muted-foreground mt-2">Loading queue…</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
