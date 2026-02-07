import { motion } from 'framer-motion'
import { type ColumnDef } from '@tanstack/react-table'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type UserRow = {
  id: string
  name: string
  email: string
  extension: string
  department: string
  status: 'active' | 'inactive'
}

const mockUsers: UserRow[] = [
  { id: '1', name: 'Lance McCluers', email: 'lance@company.com', extension: '5101', department: 'Sales', status: 'active' },
  { id: '2', name: 'Ryan Pressly', email: 'ryan@company.com', extension: '5104', department: 'Support', status: 'active' },
  { id: '3', name: 'Jose Altuve', email: 'jose@company.com', extension: '2222', department: 'Engineering', status: 'inactive' },
]

const columns: ColumnDef<UserRow>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'extension', header: 'Extension' },
  { accessorKey: 'department', header: 'Department' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.status === 'active' ? 'success' : 'secondary'}>
        {row.original.status}
      </Badge>
    ),
  },
]

export default function UserDataImport() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Data Import</h1>
          <p className="text-muted-foreground">Manage imported user rosters</p>
        </div>
        <Button onClick={() => toast.info('Upload dialog would open')}>
          <Upload className="mr-2 h-4 w-4" />
          Upload CSV
        </Button>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Imported Users</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={mockUsers} searchKey="name" searchPlaceholder="Search users..." />
        </CardContent>
      </Card>
    </motion.div>
  )
}
