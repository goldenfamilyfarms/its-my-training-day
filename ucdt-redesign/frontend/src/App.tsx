import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import Dashboard from '@/pages/Dashboard'
import Projects from '@/pages/Projects'
import ProjectDetail from '@/pages/ProjectDetail'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        {/* Placeholder routes for sidebar items */}
        <Route path="/imports/*" element={<PlaceholderPage title="Imports" />} />
        <Route path="/reports/*" element={<PlaceholderPage title="Reports" />} />
        <Route path="/provisioning/*" element={<PlaceholderPage title="Provisioning" />} />
        <Route path="/options" element={<PlaceholderPage title="Options" />} />
        <Route path="/admin" element={<PlaceholderPage title="User Admin" />} />
        <Route path="/macd" element={<PlaceholderPage title="MACD" />} />
        <Route path="/webex-auth" element={<PlaceholderPage title="Webex Authentication" />} />
      </Route>
    </Routes>
  )
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="text-center">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-muted-foreground mt-1">This section is under development.</p>
      </div>
    </div>
  )
}
