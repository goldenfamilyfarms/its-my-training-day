import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function WebexAuth() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Webex Authentication</h1>
          <p className="text-muted-foreground">Manage Webex tokens and connection status</p>
        </div>
        <Button onClick={() => toast.info('OAuth flow would open')}>
          Connect Webex
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Connection Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Badge variant="warning">Not Connected</Badge>
            <p className="text-sm text-muted-foreground">
              Connect a Webex tenant to enable automated provisioning.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Token Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Last refresh: —</p>
            <p>Expires: —</p>
            <Button variant="outline" onClick={() => toast.info('Token refresh queued')}>
              Refresh Token
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
