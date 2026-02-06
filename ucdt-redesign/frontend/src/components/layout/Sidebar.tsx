import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FolderKanban, Upload, FileBarChart, Server,
  Settings, Users, Repeat, Shield, ChevronLeft, ChevronRight,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { dashboardStats, mockProjects } from '@/data/mock-data'

interface SidebarItem {
  title: string
  href: string
  icon: React.ReactNode
  badge?: number
  children?: { title: string; href: string }[]
}

const sidebarSections: { label: string; items: SidebarItem[] }[] = [
  {
    label: 'Workspace',
    items: [
      { title: 'Dashboard', href: '/', icon: <LayoutDashboard className="h-4 w-4" /> },
      { title: 'Projects', href: '/projects', icon: <FolderKanban className="h-4 w-4" />, badge: mockProjects.length },
      {
        title: 'Imports', href: '#', icon: <Upload className="h-4 w-4" />,
        children: [
          { title: 'Engineering Page', href: '/imports/engineering' },
          { title: 'Loki Results', href: '/imports/loki' },
          { title: 'User Data', href: '/imports/user-data' },
          { title: 'DNIS Data', href: '/imports/dnis' },
          { title: 'MAC Address Data', href: '/imports/mac' },
          { title: 'Custom Audio File', href: '/imports/audio' },
        ]
      },
    ]
  },
  {
    label: 'Operations',
    items: [
      {
        title: 'Reports', href: '#', icon: <FileBarChart className="h-4 w-4" />,
        children: [
          { title: 'Project Summary', href: '/reports/summary' },
          { title: 'Provisioning Log', href: '/reports/provisioning' },
          { title: 'Audit Trail', href: '/reports/audit' },
        ]
      },
      {
        title: 'Provisioning', href: '#', icon: <Server className="h-4 w-4" />, badge: dashboardStats.provisioningQueue,
        children: [
          { title: 'Queue', href: '/provisioning/queue' },
          { title: 'History', href: '/provisioning/history' },
          { title: 'Templates', href: '/provisioning/templates' },
        ]
      },
      { title: 'MACD', href: '/macd', icon: <Repeat className="h-4 w-4" /> },
    ]
  },
  {
    label: 'Admin',
    items: [
      { title: 'Options', href: '/options', icon: <Settings className="h-4 w-4" /> },
      { title: 'User Admin', href: '/admin', icon: <Users className="h-4 w-4" /> },
      { title: 'Webex Auth', href: '/webex-auth', icon: <Shield className="h-4 w-4" /> },
    ]
  },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const location = useLocation()

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title) ? prev.filter(i => i !== title) : [...prev, title]
    )
  }

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 64 : 256 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="relative flex flex-col border-r border-sidebar-border bg-sidebar-background h-screen"
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-4 border-b border-sidebar-border">
          <motion.div
            className="flex items-center gap-2 overflow-hidden"
            animate={{ opacity: 1 }}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              UC
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="font-semibold text-sm whitespace-nowrap overflow-hidden"
                >
                  Design Tool
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-2">
          <nav className="flex flex-col gap-2 px-2">
            {sidebarSections.map((section) => (
              <div key={section.label} className="space-y-1">
                {!collapsed && (
                  <div className="px-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-foreground !text-foreground">
                      {section.label}
                    </p>
                  </div>
                )}
                {section.items.map((item) => {
                  const isExpanded = expandedItems.includes(item.title)
                  const isActive = location.pathname === item.href ||
                    item.children?.some(c => location.pathname === c.href)

                  if (item.children) {
                    return (
                      <div key={item.title}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => !collapsed ? toggleExpanded(item.title) : undefined}
                              className={cn(
                                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                "text-foreground !text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                              )}
                            >
                              <span className="shrink-0">{item.icon}</span>
                              {!collapsed && (
                                <>
                                  <span className="flex-1 text-left">{item.title}</span>
                                  {item.badge !== undefined && (
                                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                                      {item.badge}
                                    </Badge>
                                  )}
                                  <ChevronDown
                                    className={cn(
                                      "h-4 w-4 transition-transform duration-200",
                                      isExpanded && "rotate-180"
                                    )}
                                  />
                                </>
                              )}
                            </button>
                          </TooltipTrigger>
                          {collapsed && (
                            <TooltipContent side="right">{item.title}</TooltipContent>
                          )}
                        </Tooltip>
                        <AnimatePresence>
                          {isExpanded && !collapsed && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-sidebar-border pl-3">
                                {item.children.map((child) => (
                                  <NavLink
                                    key={child.href}
                                    to={child.href}
                                    className={({ isActive }) => cn(
                                      "rounded-md px-3 py-1.5 text-sm transition-colors",
                                      "text-foreground !text-foreground hover:text-foreground hover:bg-sidebar-accent",
                                      isActive && "text-sidebar-primary font-medium bg-sidebar-accent"
                                    )}
                                  >
                                    {child.title}
                                  </NavLink>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  }

                  return (
                    <Tooltip key={item.title}>
                      <TooltipTrigger asChild>
                        <NavLink
                          to={item.href}
                          className={({ isActive }) => cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                            "text-foreground !text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            isActive && "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                          )}
                        >
                          <span className="shrink-0">{item.icon}</span>
                          {!collapsed && (
                            <>
                              <span className="flex-1">{item.title}</span>
                              {item.badge !== undefined && (
                                <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                                  {item.badge}
                                </Badge>
                              )}
                            </>
                          )}
                        </NavLink>
                      </TooltipTrigger>
                      {collapsed && (
                        <TooltipContent side="right">{item.title}</TooltipContent>
                      )}
                    </Tooltip>
                  )
                })}
                <Separator className="mt-2" />
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Collapse toggle */}
        <div className="border-t border-sidebar-border p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full justify-center"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}
