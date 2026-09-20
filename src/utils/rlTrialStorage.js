const STORAGE_KEY = 'rl_lever_trial_v1'

function uid(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function emptyTapeItem(partial = {}) {
  return {
    id: uid('item'),
    name: '',
    text: '',
    order: 1,
    in: 5,
    source: 'user', // user | object | exchange
    ...partial,
  }
}

export function defaultState() {
  return {
    activeObjectId: null, // obj-given | obj-work | null
    sessionStarted: false,
    messages: [],
    sessionTape: [],
    userTapeA: [],
    userTapeB: [],
  }
}

export function loadTrialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const data = JSON.parse(raw)
    return { ...defaultState(), ...data }
  } catch {
    return defaultState()
  }
}

export function saveTrialState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function addMessage(state, { role, text }) {
  const messages = [
    ...(state.messages || []),
    { id: uid('msg'), role, text, at: Date.now() },
  ]
  return { ...state, messages }
}

export function sortTape(items) {
  return [...(items || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}
