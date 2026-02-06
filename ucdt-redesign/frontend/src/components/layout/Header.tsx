import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun, Moon, Search, Bell, Command, Plus, Server } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator
} from '@/components/ui/command'
import { mockProjects } from '@/data/mock-data'
import { Badge } from '@/components/ui/badge'
import { dashboardStats } from '@/data/mock-data'
import { Separator } from '@/components/ui/separator'

export default function Header() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [commandOpen, setCommandOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
        {/* Search */}
        <Button
          variant="outline"
          className="relative h-9 w-full max-w-sm justify-start text-sm text-muted-foreground"
          onClick={() => setCommandOpen(true)}
        >
          <Search className="mr-2 h-4 w-4" />
          <span>Search projects...</span>
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <Command className="h-3 w-3" />K
          </kbd>
        </Button>

        <div className="flex-1" />

        <div className="hidden items-center gap-2 lg:flex">
          <div className="flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
            <Server className="h-3.5 w-3.5 text-amber-500" />
            Provisioning queue
            <Badge variant="warning" className="h-5 px-1.5 text-[10px]">
              {dashboardStats.provisioningQueue}
            </Badge>
          </div>
          <Separator orientation="vertical" className="h-5" />
          <Button size="sm" onClick={() => navigate('/projects')}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
            3
          </span>
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        >
          {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">DG</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Design Engineer</p>
                <p className="text-xs leading-none text-muted-foreground">engineer@company.com</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Command Palette */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Search projects, actions..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => { navigate('/projects'); setCommandOpen(false) }}>
              <Search className="mr-2 h-4 w-4" />
              <span>View All Projects</span>
            </CommandItem>
            <CommandItem onSelect={() => { setCommandOpen(false) }}>
              <span className="mr-2 text-lg">+</span>
              <span>Create New Project</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Recent Projects">
            {mockProjects.slice(0, 5).map((project) => (
              <CommandItem
                key={project.id}
                onSelect={() => { navigate(`/projects/${project.id}`); setCommandOpen(false) }}
              >
                <span className="mr-2 font-mono text-xs text-muted-foreground">{project.engId}</span>
                <span>{project.customerName}</span>
                <Badge variant={
                  project.status === 'completed' ? 'success' :
                  project.status === 'error' ? 'destructive' :
                  project.status === 'provisioning' ? 'warning' :
                  'secondary'
                } className="ml-auto text-[10px]">
                  {project.status}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => { navigate('/'); setCommandOpen(false) }}>Dashboard</CommandItem>
            <CommandItem onSelect={() => { navigate('/projects'); setCommandOpen(false) }}>Projects</CommandItem>
            <CommandItem onSelect={() => { navigate('/admin'); setCommandOpen(false) }}>User Admin</CommandItem>
            <CommandItem onSelect={() => { navigate('/options'); setCommandOpen(false) }}>Options</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
