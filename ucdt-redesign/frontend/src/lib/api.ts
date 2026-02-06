import type { Project } from '@/types'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export async function fetchProjects(options?: { limit?: number }): Promise<Project[]> {
  // For now, return mock data since backend may not be running
  const { mockProjects } = await import('@/data/mock-data')
  return mockProjects.slice(0, options?.limit ?? 100)
}

export async function fetchProject(id: string): Promise<Project> {
  const { mockProjects } = await import('@/data/mock-data')
  const project = mockProjects.find(p => p.id === id)
  if (!project) {
    throw new Error('Project not found')
  }
  return project
}

export async function provisionProject(id: string): Promise<{ project: Project; message: string }> {
  const { mockProjects } = await import('@/data/mock-data')
  const project = mockProjects.find(p => p.id === id)
  if (!project) {
    throw new Error('Project not found')
  }
  // Simulate provisioning by updating status
  const updatedProject = { ...project, status: 'provisioning' as const }
  return { project: updatedProject, message: 'Provisioning started' }
}
