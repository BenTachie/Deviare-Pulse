const BASE = '/api/schedules'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data?.error || `HTTP ${res.status}`
    throw Object.assign(new Error(msg), { status: res.status, data })
  }
  return data
}

/**
 * Push all saved schedules to the backend for server-side resolution.
 * Called whenever the CSM saves or creates a schedule.
 * Fire-and-forget — failures are logged but do not block the UI.
 */
export async function syncSchedulesToBackend(schedules) {
  return request('/sync', {
    method: 'POST',
    body:   JSON.stringify({ schedules }),
  })
}

/** Fetch the list of schedules the backend currently has (used for validation). */
export async function fetchBackendSchedules() {
  const { schedules } = await request('/')
  return schedules
}

/** Remove a single schedule from the backend store. */
export async function deleteBackendSchedule(id) {
  return request(`/${id}`, { method: 'DELETE' })
}
