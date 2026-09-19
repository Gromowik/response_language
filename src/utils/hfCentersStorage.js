const STORAGE_KEY = 'rl_hf_centers_v1'

export function loadHfLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { frequencies: {}, notes: {}, touches: {} }
    const data = JSON.parse(raw)
    return {
      frequencies: data.frequencies || {},
      notes: data.notes || {},
      touches: data.touches || {},
    }
  } catch {
    return { frequencies: {}, notes: {}, touches: {} }
  }
}

export function saveHfLocal(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

/** Merge catalog base frequency with local bumps. */
export function effectiveFrequency(center, localFreq) {
  const base = typeof center.frequency === 'number' ? center.frequency : 0
  const bump = typeof localFreq === 'number' ? localFreq : 0
  return base + bump
}

export function bumpFrequency(centerId) {
  const state = loadHfLocal()
  state.frequencies[centerId] = (state.frequencies[centerId] || 0) + 1
  state.touches[centerId] = (state.touches[centerId] || 0) + 1
  saveHfLocal(state)
  return state
}

export function setPersonalNote(centerId, note) {
  const state = loadHfLocal()
  state.notes[centerId] = note
  saveHfLocal(state)
  return state
}
