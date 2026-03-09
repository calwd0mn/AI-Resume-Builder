import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface User {
  id: string;
  email: string;
  name: string;
}

type AuthState = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
}

type LoginPayload = {
  token: string
  user: User
}

const initialState: AuthState = {
  token: null,
  user: null,
  // 是否登录
  isAuthenticated: false,
  loading: true,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<LoginPayload>) => {
      state.token = action.payload.token
      state.user = action.payload.user
      state.isAuthenticated = true
      state.loading = false
    },
    logout: (state) => {
      state.token = null
      state.user = null
      state.isAuthenticated = false
      localStorage.removeItem('token')
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    }
  }
})

export const { login, logout, setLoading } = authSlice.actions

export default authSlice.reducer