import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import Dashboard from '@/pages/Dashboard'
import Projects from '@/pages/Projects'
import ProjectDetail from '@/pages/ProjectDetail'
import ProvisioningQueue from '@/pages/provisioning/ProvisioningQueue'
import ProvisioningHistory from '@/pages/provisioning/ProvisioningHistory'
import ProvisioningTemplates from '@/pages/provisioning/ProvisioningTemplates'
import ProvisioningLogReport from '@/pages/reports/ProvisioningLog'
import EngineeringImport from '@/pages/imports/EngineeringImport'
import LokiResults from '@/pages/imports/LokiResults'
import UserDataImport from '@/pages/imports/UserDataImport'
import DnisDataImport from '@/pages/imports/DnisDataImport'
import MacDataImport from '@/pages/imports/MacDataImport'
import CustomAudioImport from '@/pages/imports/CustomAudioImport'
import ProjectSummaryReport from '@/pages/reports/ProjectSummary'
import AuditTrailReport from '@/pages/reports/AuditTrail'
import Options from '@/pages/settings/Options'
import UserAdmin from '@/pages/admin/UserAdmin'
import MacdRequests from '@/pages/macd/MacdRequests'
import WebexAuth from '@/pages/webex/WebexAuth'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/imports/engineering" element={<EngineeringImport />} />
        <Route path="/imports/loki" element={<LokiResults />} />
        <Route path="/imports/user-data" element={<UserDataImport />} />
        <Route path="/imports/dnis" element={<DnisDataImport />} />
        <Route path="/imports/mac" element={<MacDataImport />} />
        <Route path="/imports/audio" element={<CustomAudioImport />} />
        <Route path="/imports/*" element={<PlaceholderPage title="Imports" />} />
        <Route path="/reports/provisioning" element={<ProvisioningLogReport />} />
        <Route path="/reports/summary" element={<ProjectSummaryReport />} />
        <Route path="/reports/audit" element={<AuditTrailReport />} />
        <Route path="/reports/*" element={<PlaceholderPage title="Reports" />} />
        <Route path="/provisioning/queue" element={<ProvisioningQueue />} />
        <Route path="/provisioning/history" element={<ProvisioningHistory />} />
        <Route path="/provisioning/templates" element={<ProvisioningTemplates />} />
        <Route path="/provisioning/*" element={<PlaceholderPage title="Provisioning" />} />
        <Route path="/options" element={<Options />} />
        <Route path="/admin" element={<UserAdmin />} />
        <Route path="/macd" element={<MacdRequests />} />
        <Route path="/webex-auth" element={<WebexAuth />} />
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
