import { createSlice } from '@reduxjs/toolkit'

/** Whether the navigation menu is expanded on narrow screens. It closes again when a page is opened. */
const uiSlice = createSlice({
  name: 'ui',
  initialState: { menuOpen: false },
  reducers: {
    toggleMenu(state) {
      state.menuOpen = !state.menuOpen
    },
    closeMenu(state) {
      state.menuOpen = false
    },
  },
})

export const { toggleMenu, closeMenu } = uiSlice.actions

export default uiSlice.reducer
