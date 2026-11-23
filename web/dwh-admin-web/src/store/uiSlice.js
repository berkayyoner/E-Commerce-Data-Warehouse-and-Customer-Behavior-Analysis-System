import { createSlice } from '@reduxjs/toolkit'

const SIDEBAR_KEY = 'dwh.admin.sidebarOpen'

function readSidebar() {
  try {
    const stored = window.localStorage.getItem(SIDEBAR_KEY)
    return stored === null ? window.innerWidth >= 900 : stored === 'true'
  } catch {
    return true
  }
}

function persistSidebar(open) {
  try {
    window.localStorage.setItem(SIDEBAR_KEY, String(open))
  } catch {
    // Remembering the state is a convenience only.
  }
}

let nextToastId = 1

const uiSlice = createSlice({
  name: 'ui',
  initialState: { sidebarOpen: readSidebar(), toasts: [] },
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen
      persistSidebar(state.sidebarOpen)
    },
    setSidebar(state, action) {
      state.sidebarOpen = action.payload
      persistSidebar(state.sidebarOpen)
    },
    /** A toast shows a translated message (messageKey) or, when given, the server's own text (message). */
    pushToast: {
      reducer(state, action) {
        state.toasts.push(action.payload)
      },
      prepare(kind, messageKey, message = null) {
        return { payload: { id: nextToastId++, kind, messageKey, message } }
      },
    },
    dismissToast(state, action) {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload)
    },
  },
})

export const { toggleSidebar, setSidebar, pushToast, dismissToast } = uiSlice.actions

export default uiSlice.reducer
