import { motion } from 'framer-motion'
import { type ColumnDef } from '@tanstack/react-table'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type AudioRow = {
  id: string
  fileName: string
  duration: string
  codec: string
  status: 'approved' | 'pending' | 'rejected'
}

const mockAudio: AudioRow[] = [
  { id: '1', fileName: 'main_greeting.wav', duration: '00:18', codec: 'PCM', status: 'approved' },
  { id: '2', fileName: 'after_hours.wav', duration: '00:24', codec: 'PCM', status: 'pending' },
  { id: '3', fileName: 'holiday_message.wav', duration: '00:15', codec: 'PCM', status: 'rejected' },
]

const columns: ColumnDef<AudioRow>[] = [
  { accessorKey: 'fileName', header: 'File Name' },
  { accessorKey: 'duration', header: 'Duration' },
  { accessorKey: 'codec', header: 'Codec' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status
      const variant = status === 'approved' ? 'success' : status === 'pending' ? 'warning' : 'destructive'
      return <Badge variant={variant}>{status}</Badge>
    }
  },
]

export default function CustomAudioImport() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Custom Audio Files</h1>
          <p className="text-muted-foreground">Manage greetings and announcement audio</p>
        </div>
        <Button onClick={() => toast.info('Upload dialog would open')}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Audio
        </Button>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Audio Library</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={mockAudio} searchKey="fileName" searchPlaceholder="Search audio..." />
        </CardContent>
      </Card>
    </motion.div>
  )
}
