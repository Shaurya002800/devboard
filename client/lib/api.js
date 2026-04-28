const BASE = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
)

function getStoredToken() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.sessionStorage.getItem('token')
}

async function request(path, options = {}) {
  const { body, token, headers, cache = 'no-store', ...rest } = options
  const authToken = token || getStoredToken()
  let response

  try {
    response = await fetch(`${BASE}${path}`, {
      method: rest.method || 'GET',
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...headers,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache,
      ...rest,
    })
  } catch {
    throw new Error(
      'Unable to reach the API. Make sure the Express server is running and your API URL is correct.'
    )
  }

  const text = await response.text()
  const data = safeParseJson(text)

  if (!response.ok) {
    throw new Error(
      data?.error ||
        `Request failed with status ${response.status}. Check the API URL and server logs.`
    )
  }

  return data
}

export function getTokenPayload(token = getStoredToken()) {
  if (!token) {
    return null
  }

  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

export function setStoredToken(token) {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem('token', token)
  window.dispatchEvent(new Event('devboard-auth-change'))
}

export function clearStoredToken() {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.removeItem('token')
  window.dispatchEvent(new Event('devboard-auth-change'))
}

export async function safeRequest(path, options = {}) {
  try {
    const data = await request(path, options)
    return { data, error: null }
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : 'Something went wrong while loading data.',
    }
  }
}

export const api = {
  get: (path, options) => request(path, options),
  post: (path, body, options) =>
    request(path, { method: 'POST', body, ...options }),
  patch: (path, body, options) =>
    request(path, { method: 'PATCH', body, ...options }),
  delete: (path, options) => request(path, { method: 'DELETE', ...options }),
}

export const fetchProjects = (params = {}, options = {}) => {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value))
    }
  })

  const query = searchParams.toString()
  return api.get(`/projects${query ? `?${query}` : ''}`, options)
}

export const safeFetchProjects = (params = {}, options = {}) => {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value))
    }
  })

  const query = searchParams.toString()
  return safeRequest(`/projects${query ? `?${query}` : ''}`, options)
}

export const fetchProject = (id, options = {}) =>
  api.get(`/projects/${id}`, options)
export const registerUser = (payload) => api.post('/auth/register', payload)
export const loginUser = (payload) => api.post('/auth/login', payload)
export const fetchCurrentUser = () => api.get('/auth/me')
export const safeFetchCurrentUser = () => safeRequest('/auth/me')
export const createProject = (payload) => api.post('/projects', payload)
export const updateProject = (id, payload) =>
  api.patch(`/projects/${id}`, payload)
export const deleteProject = (id) => api.delete(`/projects/${id}`)
export const createApplication = (payload) => api.post('/applications', payload)
export const fetchProjectApplications = (id) =>
  api.get(`/applications/project/${id}`)
export const updateApplicationStatus = (id, payload) =>
  api.patch(`/applications/${id}`, payload)
export const fetchMyApplications = () => api.get('/applications/mine')
export const fetchMyProjects = () => fetchProjects({ mine: true })

function normalizeBaseUrl(value) {
  const trimmedValue = value.replace(/\/+$/, '')
  return trimmedValue.endsWith('/api') ? trimmedValue : `${trimmedValue}/api`
}

function safeParseJson(value) {
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}
