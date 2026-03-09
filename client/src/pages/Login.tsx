import { Mail, User2Icon, Lock } from 'lucide-react'
import React from 'react'
import axios from 'axios'
import api from '../configs/api'
import { useDispatch } from 'react-redux'
import { login } from '../app/features/authSlice'
import toast from 'react-hot-toast'

const Login = () => {

  const dispatch = useDispatch()
  const query = new URLSearchParams(window.location.search)
  //URLSearchParams是一个类，用来操作URL中的查询字符串
  //window.location.search是一个字符串，表示当前页面的查询字符串
  //get 查询?后面"state"的值，如localhost:xxxx/login?state=signup
  const urlState = query.get("state")
  const [state, setState] = React.useState(urlState || "login")

  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: ''
  })
  // const 变量名：类型 = 初始值
  // React.SubmitEventHandler：接受FormEvent并且没有返回值的函数
  // <HTMLFormElement>：泛型参数，这个事件绑定在<form>中
  const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.post(`/api/users/${state === "login" ? "login" : "register"}`, formData)
      dispatch(login(data))
      localStorage.setItem('token', data.token)
      toast.success(data.message)
    } catch (error: unknown) {
      // TS的catch默认是unknown，不能直接访问error.message/response
      // 通过axios的判断，如果是网络请求的错误，优先返回后端的业务错误，没有就返回axios的网络错误
      // 如果是代码逻辑的错误，返回error.message
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.message ?? error.message)
        : (error instanceof Error ? error.message : 'Request failed')
      toast.error(message)
    }
  }

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const { name, value } = e.target
    // 复习：React中，判断页面是否要更新靠的是浅比较，即对比地址
    // 修改内容，数组/对象 地址没变，不更新
    // 所以我们要通过返回新数组的方法进行修改
    // ...prev解构,[key]:value 赋值，不丢失信息
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  return (
    <div className='flex items-center justify-center min-h-screen bg-gray-100'>
      <form onSubmit={handleSubmit} className="sm:w-[350px] w-full text-center border border-gray-300/60 rounded-2xl px-8 bg-white">
        <h1 className="text-gray-900 text-3xl mt-10 font-medium">{state === "login" ? "Login" : "Sign up"}</h1>
        <p className="text-gray-500 text-sm mt-2">Please sign in to continue</p>
        {state !== "login" && (
          <div className="flex items-center mt-6 w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2">
            <User2Icon size={16} color='#6B7280' />
            <input type="text" name="name" placeholder="Name" className="border-none outline-none ring-0" value={formData.name} onChange={handleChange} required />
          </div>
        )}
        <div className="flex items-center w-full mt-4 bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2">
          <Mail size={16} color='#6B7280' />
          <input type="email" name="email" placeholder="Email id" className="border-none outline-none ring-0" value={formData.email} onChange={handleChange} required />
        </div>
        <div className="flex items-center mt-4 w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2">
          <Lock size={16} color='#6B7280' />
          <input type="password" name="password" placeholder="Password" className="border-none outline-none ring-0" value={formData.password} onChange={handleChange} required />
        </div>
        <div className="mt-4 text-left text-indigo-500">
          <button className="text-sm" type="reset">Forget password?</button>
        </div>
        <button type="submit" className="mt-2 w-full h-11 rounded-full text-white bg-indigo-500 hover:opacity-90 transition-opacity">
          {state === "login" ? "Login" : "Sign up"}
        </button>
        <p onClick={() => setState(prev => prev === "login" ? "register" : "login")} className="text-gray-500 text-sm mt-3 mb-11">{state === "login" ? "Don't have an account?" : "Already have an account?"} <a href="#" className="text-indigo-500 hover:underline">click here</a></p>
      </form>
    </div>
  )
}

export default Login