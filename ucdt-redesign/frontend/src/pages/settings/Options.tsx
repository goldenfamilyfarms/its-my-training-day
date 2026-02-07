import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

const settings = [
  { label: 'Default project status', value: 'Draft' },
  { label: 'Provisioning template', value: 'Hosted Voice - UC Enterprise' },
  { label: 'Auto-validation', value: 'Enabled' },
  { label: 'Audit logging', value: 'Enabled' },
]

export default function Options() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Options</h1>
          <p className="text-muted-foreground">System defaults and workspace preferences</p>
        </div>
        <Button onClick={() => toast.success('Settings saved')}>
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settings.map((setting) => (
          <Card key={setting.label} className="shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{setting.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {setting.value}
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  )
}
