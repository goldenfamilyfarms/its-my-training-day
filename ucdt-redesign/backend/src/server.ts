import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

// Mock data
const projects = Array.from({ length: 50 }, (_, i) => {
  const resources = ['April Diehl', 'Marcia Gageby', 'Seth Cenac', 'Christopher Kiester', 'Tyrell Williams']
  const projectTypes = ['Unified Communications', 'Standard Config']
  const orderTypes = ['New Install', 'Upgrade', 'Migration']
  const routings = ['BHN - Redsky', 'Charter - Redsky', 'BW.com - Redsky', 'TWC.GIA - Redsky']
  const statuses = ['draft', 'in-progress', 'provisioning', 'completed', 'error']
  const customers = [
    'Houston Astros', 'MONTANA CLUB', 'Charter UC Tampa TEST UC A1',
    'UCDT Dry Run', 'Senor Antonios', 'Charter UC Tampa TEST UC A3',
  ]

  return {
    id: String(i + 1),
    engId: `ENG-${String(i).padStart(8, '0')}`,
    resource: resources[i % resources.length],
    projectType: projectTypes[i % projectTypes.length],
    orderType: orderTypes[i % orderTypes.length],
    customerName: i < customers.length ? customers[i] : `Test Customer ${i + 1}`,
    multiSite: i % 3 === 0,
    mainSite: i % 2 === 0,
    existingUcEnterprise: i % 4 === 0,
    networkRouting: routings[i % routings.length],
    existingEntId: `${8130000000 + i}`,
    groupId: `Group${8130000000 + i}`,
    groupName: i < customers.length ? customers[i] : `Test Customer ${i + 1}`,
    mainTn: `${8130000000 + i}`,
    status: statuses[i % statuses.length],
    createdAt: new Date(2022, 6 + (i % 6), (i % 28) + 1).toISOString(),
    updatedAt: new Date(2023, 0, (i % 28) + 1).toISOString(),
  }
})

// Routes
app.get('/api/projects', (req, res) => {
  const { page = '1', limit = '10', search = '', status = '' } = req.query as Record<string, string>
  let filtered = projects

  if (search) {
    const s = search.toLowerCase()
    filtered = filtered.filter(p =>
      p.customerName.toLowerCase().includes(s) ||
      p.engId.toLowerCase().includes(s) ||
      p.resource.toLowerCase().includes(s)
    )
  }

  if (status) {
    filtered = filtered.filter(p => p.status === status)
  }

  const pageNum = parseInt(page)
  const limitNum = parseInt(limit)
  const start = (pageNum - 1) * limitNum
  const end = start + limitNum

  res.json({
    data: filtered.slice(start, end),
    total: filtered.length,
    page: pageNum,
    totalPages: Math.ceil(filtered.length / limitNum),
  })
})

app.get('/api/projects/:id', (req, res) => {
  const project = projects.find(p => p.id === req.params.id)
  if (!project) {
    res.status(404).json({ error: 'Project not found' })
    return
  }
  res.json(project)
})

app.post('/api/projects', (req, res) => {
  const newProject = {
    id: String(projects.length + 1),
    ...req.body,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  projects.push(newProject)
  res.status(201).json(newProject)
})

app.put('/api/projects/:id', (req, res) => {
  const index = projects.findIndex(p => p.id === req.params.id)
  if (index === -1) {
    res.status(404).json({ error: 'Project not found' })
    return
  }
  projects[index] = { ...projects[index], ...req.body, updatedAt: new Date().toISOString() }
  res.json(projects[index])
})

app.post('/api/projects/:id/provision', (req, res) => {
  const project = projects.find(p => p.id === req.params.id)
  if (!project) {
    res.status(404).json({ error: 'Project not found' })
    return
  }
  // Simulate provisioning - in real app this would generate XLSX and send to third-party
  project.status = 'provisioning'
  project.updatedAt = new Date().toISOString()
  res.json({
    message: 'Provisioning request submitted',
    project,
    provisioningId: `PROV-${Date.now()}`,
  })
})

app.get('/api/dashboard/stats', (_req, res) => {
  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'in-progress').length,
    provisioningQueue: projects.filter(p => p.status === 'provisioning').length,
    completedThisMonth: projects.filter(p => p.status === 'completed').length,
    errorCount: projects.filter(p => p.status === 'error').length,
    byStatus: {
      draft: projects.filter(p => p.status === 'draft').length,
      'in-progress': projects.filter(p => p.status === 'in-progress').length,
      provisioning: projects.filter(p => p.status === 'provisioning').length,
      completed: projects.filter(p => p.status === 'completed').length,
      error: projects.filter(p => p.status === 'error').length,
    }
  }
  res.json(stats)
})

app.listen(PORT, () => {
  console.log(`UCDT API server running on http://localhost:${PORT}`)
})
