import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FolderKanban, Server, CheckCircle2, AlertTriangle, Clock,
  ArrowUpRight, TrendingUp, Activity
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { mockProjects, dashboardStats } from '@/data/mock-data'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } }
}

const statusColors = {
  draft: '#94a3b8',
  'in-progress': '#3b82f6',
  provisioning: '#f59e0b',
  completed: '#22c55e',
  error: '#ef4444',
}

const projectTypeData = [
  { name: 'Unified Comm', count: 28 },
  { name: 'Standard Config', count: 15 },
  { name: 'Migration', count: 8 },
  { name: 'Upgrade', count: 5 },
]

const weeklyData = [
  { day: 'Mon', created: 4, completed: 3 },
  { day: 'Tue', created: 6, completed: 5 },
  { day: 'Wed', created: 3, completed: 7 },
  { day: 'Thu', created: 8, completed: 4 },
  { day: 'Fri', created: 5, completed: 6 },
]

const statusData = [
  { name: 'Draft', value: 12, color: statusColors.draft },
  { name: 'In Progress', value: 18, color: statusColors['in-progress'] },
  { name: 'Provisioning', value: 8, color: statusColors.provisioning },
  { name: 'Completed', value: 45, color: statusColors.completed },
  { name: 'Error', value: 3, color: statusColors.error },
]

export default function Dashboard() {
  const navigate = useNavigate()

  const stats = [
    {
      title: 'Total Projects',
      value: dashboardStats.totalProjects.toLocaleString(),
      change: '+12%',
      icon: FolderKanban,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Active Projects',
      value: dashboardStats.activeProjects,
      change: '+5%',
      icon: Activity,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Provisioning Queue',
      value: dashboardStats.provisioningQueue,
      change: '-3',
      icon: Server,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      title: 'Completed This Month',
      value: dashboardStats.completedThisMonth,
      change: '+22%',
      icon: CheckCircle2,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
  ]

  const recentProjects = mockProjects.slice(0, 6)

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="p-6 space-y-6"
    >
      {/* Page header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your UC Design Tool projects</p>
        </div>
        <Button onClick={() => navigate('/projects')}>
          View All Projects
          <ArrowUpRight className="ml-2 h-4 w-4" />
        </Button>
      </motion.div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <motion.div key={stat.title} variants={item}>
            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-500 font-medium">{stat.change}</span>
                      <span className="text-xs text-muted-foreground">vs last month</span>
                    </div>
                  </div>
                  <div className={`${stat.bg} p-3 rounded-xl`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div variants={item} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Weekly Activity</CardTitle>
              <CardDescription>Projects created and completed this week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={weeklyData} barGap={4}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="created" fill="hsl(221.2 83.2% 53.3%)" radius={[4, 4, 0, 0]} name="Created" />
                  <Bar dataKey="completed" fill="hsl(142.1 76.2% 36.3%)" radius={[4, 4, 0, 0]} name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project Status</CardTitle>
              <CardDescription>Distribution by current status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="hsl(var(--background))"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {statusData.map((s) => (
                  <div key={s.name} className="flex items-center gap-1.5 text-xs">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                    <span className="text-muted-foreground">{s.name}</span>
                    <span className="font-medium">{s.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent projects */}
      <motion.div variants={item}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Projects</CardTitle>
              <CardDescription>Latest projects being worked on</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/projects')}>
              View all
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentProjects.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                      {project.customerName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium group-hover:text-primary transition-colors">
                        {project.customerName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {project.engId} · {project.projectType}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground hidden md:block">
                      {project.resource}
                    </span>
                    <Badge
                      variant={
                        project.status === 'completed' ? 'success' :
                        project.status === 'error' ? 'destructive' :
                        project.status === 'provisioning' ? 'warning' :
                        project.status === 'in-progress' ? 'default' :
                        'secondary'
                      }
                    >
                      {project.status}
                    </Badge>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
