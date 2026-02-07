import type { Project } from '@/types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

type ProjectListResponse = {
  data: Project[]
  total: number
  page: number
  totalPages: number
}

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || `Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function fetchProjects(params?: { page?: number; limit?: number; search?: string; status?: Project['status'] | '' }) {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set('page', String(params.page))
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.search) searchParams.set('search', params.search)
  if (params?.status) searchParams.set('status', params.status)

  const query = searchParams.toString()
  const response = await apiRequest<ProjectListResponse>(`/api/projects${query ? `?${query}` : ''}`)
  return response.data
}

export async function fetchProject(id: string) {
  return apiRequest<Project>(`/api/projects/${id}`)
}

export async function provisionProject(id: string) {
  return apiRequest<{ message: string; project: Project; provisioningId: string }>(`/api/projects/${id}/provision`, {
    method: 'POST',
  })
}
