import { motion } from 'framer-motion'
import { type ColumnDef } from '@tanstack/react-table'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type AdminUser = {
  id: string
  name: string
  email: string
  role: 'Admin' | 'Engineer' | 'Viewer'
  status: 'Active' | 'Inactive'
}

const mockUsers: AdminUser[] = [
  { id: '1', name: 'April Diehl', email: 'april@company.com', role: 'Engineer', status: 'Active' },
  { id: '2', name: 'Seth Cenac', email: 'seth@company.com', role: 'Admin', status: 'Active' },
  { id: '3', name: 'Marcia Gageby', email: 'marcia@company.com', role: 'Viewer', status: 'Inactive' },
]

const columns: ColumnDef<AdminUser>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => <Badge variant="outline">{row.original.role}</Badge>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.status === 'Active' ? 'success' : 'secondary'}>
        {row.original.status}
      </Badge>
    ),
  },
]

export default function UserAdmin() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Admin</h1>
          <p className="text-muted-foreground">Manage user roles and access</p>
        </div>
        <Button onClick={() => toast.info('Invite user flow would open')}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Users</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={mockUsers} searchKey="name" searchPlaceholder="Search users..." />
        </CardContent>
      </Card>
    </motion.div>
  )
}
