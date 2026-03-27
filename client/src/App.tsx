import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'

import { useDispatch } from 'react-redux'
import api from './configs/api'
import { login, setLoading } from './app/features/authSlice'
import { Toaster } from 'react-hot-toast'

interface AppProps { }

const Home = lazy(() => import('./pages/Home'))
const Layout = lazy(() => import('./pages/Layout'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const ResumeBuilder = lazy(() => import('./pages/ResumeBuilder'))
const Preview = lazy(() => import('./pages/Preview'))

function App({ }: AppProps) {
  // 获取dispatch发送动作(action)
  const dispatch = useDispatch()

  const getUserData = async () => {
    const token = localStorage.getItem('token')
    try {
      if (token) {
        const { data } = await api.get('/api/users/data', { headers: { Authorization: `Bearer ${token}` } })
        if (data.user) {
          dispatch(login({ token, user: data.user }))
        }
        dispatch(setLoading(false))
      } else {
        dispatch(setLoading(false))
      }
    } catch (error) {
      dispatch(setLoading(false))
      console.log((error as Error).message)
    }
  }
  useEffect(() => {
    getUserData()
  }, [])

  return (
    <>
      {/* 添加路由 */}
      <Toaster />
      <Suspense fallback={<div className='p-4 text-sm text-slate-500'>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="app" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path='builder/:resumeId' element={<ResumeBuilder />} />
          </Route>
          <Route path="builder/:resumeId" element={<Preview />} />
        </Routes>
      </Suspense>

    </>
  )
}

export default App
