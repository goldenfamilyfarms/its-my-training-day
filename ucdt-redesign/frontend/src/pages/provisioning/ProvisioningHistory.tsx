import { motion } from 'framer-motion'
import { Download, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { mockProvisioningLogs } from '@/data/mock-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const statusMap: Record<string, { label: string; variant: 'default' | 'success' | 'destructive' | 'warning' }> = {
  started: { label: 'Started', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  failed: { label: 'Failed', variant: 'destructive' },
}

export default function ProvisioningHistory() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Provisioning History</h1>
          <p className="text-muted-foreground">Track provisioning events and audit activity</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => toast.info('Refreshing history')}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => toast.success('Provisioning log exported')}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Recent Events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockProvisioningLogs.map((log) => {
            const config = statusMap[log.status] ?? statusMap.started
            return (
              <div key={log.id} className="flex items-start gap-4 rounded-lg border bg-card p-3">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={config.variant}>{config.label}</Badge>
                    <span className="text-xs text-muted-foreground">{log.lastUpdateDateTime}</span>
                  </div>
                  <p className="text-sm font-medium mt-1">{log.notes}</p>
                  <p className="text-xs text-muted-foreground mt-1">Updated by {log.lastUpdateBy}</p>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </motion.div>
  )
}
