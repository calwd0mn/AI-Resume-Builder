import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../app/store'
import { logout } from '../app/features/authSlice'

const Navbar = () => {


  const user = useSelector((state: RootState) => state.auth.user)
  const dispatch = useDispatch()


  const navigate = useNavigate()
  const logoutUser = () => {
    navigate('/')
    dispatch(logout())
  }

  return (
    <div className='shadow bg-white'>
      <nav className='flex justify-between items-center max-w-7xl mx-auto px-4 py-3.5 text-slate-800 transition-all'>
        <Link to={'/'} >
          <img src="/logo.svg" alt="logo" className='h-11 w-auto' />
        </Link>
        <div className='flex items-center gap-4 text-sm'>
          <p>Hi, {user?.name}</p>
          <button onClick={logoutUser}
            className='bg-white hover:bg-slate-50 border border-gray-300 px-7 py-1.5 rounded-full active:scale-95 transition-all'>Logout</button>
        </div>
      </nav>

    </div>
  )
}

export default Navbar