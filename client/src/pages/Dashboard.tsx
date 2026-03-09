import { FilePenLineIcon, PencilIcon, PlusIcon, TrashIcon, UploadCloudIcon, XIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { dummyResumeData } from '../assets/assets'
import type { ResumeData } from '../assets/types'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '../app/store'
import api from '../configs/api'
import toast from 'react-hot-toast'
import axios from 'axios'
import { extractTextFromPdfWithOcrFallback } from '../utils/pdfOcr'

const Dashboard = () => {

  const { user, token } = useSelector((state: RootState) => state.auth)

  const colors = ["#9333ea", "#d97706", "#dc2626", "#0284c7", "#16a34a"]
  const [allResumes, setAllResumes] = useState<ResumeData[]>([])
  const [showCreateResume, setShowCreateResume] = useState(false)
  const [showUploadResume, setShowUploadResume] = useState(false)
  const [title, setTitle] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [editResumeId, setEditResumeId] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const navigate = useNavigate()

  const loadAllResumes = async () => {
    setAllResumes(dummyResumeData)
  }
  // 此处复习一下useEffect，useEffect会在组件挂载后执行，相当于componentDidMount
  // 第二个参数是依赖项，如果不选则每次组件渲染都会执行，如果选则只有依赖项发生变化时才会执行，此处我们用空数组表示只执行一次
  // useState将allResumes数据拷贝存储在组件状态中，避免直接修改原始数据导致无法触发渲染
  useEffect(() => {
    loadAllResumes()
  }, [])

  const createResume: React.SubmitEventHandler<HTMLFormElement> = async (event) => {
    try {
      event.preventDefault()
      const { data } = await api.post('api/resumes/create', { title }, { headers: { Authorization: `Bearer ${token}` } })
      setAllResumes([...allResumes, data.resume])
      setTitle('')
      setShowCreateResume(false)
      navigate(`/app/builder/${data.resume._id}`)
    } catch (error) {
      const message = axios.isAxiosError(error) ? (error.response?.data?.message ?? error.message) : (error instanceof Error ? error.message : 'Request failed')
      toast.error(message)
    }
  }

  const uploadResume: React.SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (!resumeFile) {
        toast.error('Please select a resume file')
        return
      }
      if (!title.trim()) {
        toast.error('Please enter a resume title')
        return
      }

      const { text: resumeText, usedOcr } = await extractTextFromPdfWithOcrFallback(resumeFile, () => {
        toast.loading('正在使用 OCR 识别扫描版简历，请稍候…', { id: 'pdf-ocr' })
      })
      toast.dismiss('pdf-ocr')
      if (!resumeText.trim()) {
        toast.error('无法从该 PDF 提取文字，请使用可选中文字的 PDF 或清晰的扫描件。')
        return
      }
      if (usedOcr) toast.success('已通过 OCR 识别扫描版简历')
      const { data } = await api.post('api/ai/upload-resume', { resumeText: resumeText.trim(), title }, { headers: { Authorization: `Bearer ${token}` } })
      setTitle('')
      setResumeFile(null)
      setShowUploadResume(false)
      navigate(`/app/builder/${data.resumeId}`)
    } catch (error) {
      const message = axios.isAxiosError(error) ? (error.response?.data?.message ?? error.message) : (error instanceof Error ? error.message : 'Request failed')
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  };


  const editTitle: React.SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    setAllResumes(allResumes.map(resume => resume.id === editResumeId ? { ...resume, title: title } : resume))
    setEditResumeId('')
    setTitle('')
  }
  const deleteResume = async (resumeId: string) => {
    // 添加确认窗口
    const confirm = window.confirm('Are you sure you want to delete this resume?')
    if (confirm) {
      // 此处复习一下filter方法，filter方法会返回一个新数组，新数组中的元素是原数组中满足条件的元素
      // 在React中，元素更新靠的是浅比较，即比较地址，所以我们要通过返回新数组的方式进行数据的修改触发渲染
      setAllResumes(allResumes.filter(resume => resume.id !== resumeId))
    }
  }
  return (
    <div>
      <div className='max-w-7xl mx-auto px-4 py-8'>
        {/* sm:hidden 只在手机端（小屏幕）显示 */}
        <p className='text-2xl font-medium mb-6 bg-gradient-to-r from-slate-600 to-slate-700 bg-clip-text text-transparent sm:hidden'>Welcome,{user?.name}</p>
        {/* gap-4 需要配合布局如flex和grid，设置内部元素的间距 */}
        {/* group 打破css中样式只能用于当前元素子集的限制，在父级加入group 子集加入group-action/focus/hover... 在父级触发时所有带标签的子集都做出反应*/}
        <div className='flex gap-4'>
          <button onClick={() => setShowCreateResume(true)} className='w-full bg-white sm:max-w-36 h-48 flex flex-col items-center justify-center rounded-lg gap-2 text-slate-600 border border-dashed border-slate-300 group hover:border-indigo-500 hover:shadow-lg transition-all duration-300 cursor-pointer'>
            <PlusIcon className='size-11 transition-all duration-300 p-2.5 bg-gradient-to-br from-indigo-300 to-indigo-500  text-white rounded-full' />
            <p className='text-sm group-hover:text-indigo-500 transition-all duration-300'>Create Resume</p>
          </button>
          <button onClick={() => setShowUploadResume(true)} className='w-full bg-white sm:max-w-36 h-48 flex flex-col items-center justify-center rounded-lg gap-2 text-slate-600 border border-dashed border-slate-300 group hover:border-purple-500 hover:shadow-lg transition-all duration-300 cursor-pointer'>
            <UploadCloudIcon className='size-11 transition-all duration-300 p-2.5 bg-gradient-to-br from-purple-300 to-indigo-500  text-white rounded-full' />
            <p className='text-sm group-hover:text-purple-500 transition-all duration-300'>Upload Extisting</p>
          </button>
        </div>

        <hr className='border-slate-200 my-6 sm:w-[305px]' />

        <div className='grid grid-cols-2 sm:flex flex-wrap gap-4'>
          {allResumes.map((resume, index) => {
            const baseColor = colors[index % colors.length]
            return (
              <button onClick={() => navigate(`/app/builder/${resume.id}`)} key={index} className='relative w-full sm:max-w-36 h-48 flex flex-col items-center justify-center rounded-lg gap-2 border group hover:shadow-lg transition-all duration-300 cursor-pointer' style={{ background: `linear-gradient(135deg,${baseColor}10,${baseColor}40)`, borderColor: baseColor + '40' }}>
                <FilePenLineIcon className='size-7 group-hover:scale-110 transition-all' style={{ color: baseColor }} />
                <p className='text-sm group-hover:scale-105 transition-all  px-2 text-center' style={{ color: baseColor }}>
                  {resume.title}
                </p>
                <p className='absolute bottom-1 text-[11px] text-slate-400 group-hover:text-slate-500 transition-all duration-300 px-2 text-center' style={{ color: baseColor + '90' }}>
                  Update on {new Date(resume.updatedAt).toLocaleDateString()}
                </p>
                <div onClick={e => e.stopPropagation()} className='absolute top-1 right-1 group-hover:flex items-center hidden'>
                  <TrashIcon onClick={() => deleteResume(resume.id)} className='size-7 p-1.5 hover:bg-white/50 rounded text-slate-700 transition-colors' />
                  <PencilIcon onClick={() => { setEditResumeId(resume.id); setTitle(resume.title) }} className='size-7 p-1.5 hover:bg-white/50 rounded text-slate-700 transition-colors' />
                </div>
              </button>
            )
          })}
        </div>
        <div>
          {/* 如果showCreateResume为true 我们就渲染创建页面  */}
          {showCreateResume && (
            <form onSubmit={createResume} onClick={() => setShowCreateResume(false)} className='fixed inset-0 bg-black/70 backdrop-blur bg-opacity-50 z-10 flex items-center justify-center'>
              {/* stopPropagation 阻止事件向上冒泡 将弹窗关闭*/}
              <div onClick={e => e.stopPropagation()} className='relative w-full max-w-sm bg-slate-50 rounded-lg p-6'>
                <h2 className='text-xl font-boldd mb-4'>Create a Resume</h2>
                <input onChange={(e) => setTitle(e.target.value)} value={title} type="text" placeholder='Enter Resume Title' className='w-full px-4 py-2 mb-4 border border-slate-200 rounded focus:ring-2 focus:border-green-600 focus:ring-green-600/50 outline-none' required />
                <button className='w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors'>Create Resume</button>
                <XIcon className='absolute top-4 right-4 cursor-pointer text-slate-400 hover:text-slate-600 transition-colors' onClick={() => { setShowCreateResume(false); setTitle(''); setResumeFile(null) }} />
              </div>
            </form>
          )
          }

          {showUploadResume && (
            <form onSubmit={uploadResume} onClick={() => setShowUploadResume(false)} className='fixed inset-0 bg-black/70 backdrop-blur bg-opacity-50 z-10 flex items-center justify-center'>
              {/* stopPropagation 阻止事件向上冒泡 将弹窗关闭*/}
              <div onClick={e => e.stopPropagation()} className='relative w-full max-w-sm bg-slate-50 rounded-lg p-6'>
                <h2 className='text-xl font-boldd mb-4'>Upload Resume</h2>
                <input onChange={(e) => setTitle(e.target.value)} value={title} type="text" placeholder='Enter Resume Title' className='w-full px-4 py-2 mb-4 border border-slate-200 rounded focus:ring-2 focus:border-green-600 focus:ring-green-600/50 outline-none' required />
                <div>
                  <label htmlFor="resume-input" className='block text-sm text-slate-700'>
                    Select Resume File
                    <div className='flex flex-col items-center justify-center gap-2 border group text-slate-400 border-slate-400 border-dashed rounded-md p-4 py-10 my-4 hover:border-green-500 hover:text-green-700 cursor-pointer transition-colors'>
                      {resumeFile ? (
                        <p className='text-green-700'>{resumeFile.name}</p>
                      ) : (
                        <>
                          <UploadCloudIcon className='size-14 stroke-1' />
                          <p>Upload resume</p>
                        </>
                      )}
                    </div>
                  </label>
                  {/* hidden 隐藏原生input上传按钮 */}
                  {/* files是一个FileList数组，包含用户选择的文件 */}
                  <input type="file" id='resume-input' accept='.pdf' hidden onChange={(e) => e.target.files && setResumeFile(e.target.files[0])} />
                </div>
                <button type="submit" disabled={isLoading} className='w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed'>
                  {isLoading ? '处理中…' : 'Upload Resume'}
                </button>
                <XIcon className='absolute top-4 right-4 cursor-pointer text-slate-400 hover:text-slate-600 transition-colors' onClick={() => { setShowUploadResume(false); setTitle(''); setResumeFile(null) }} />
              </div>
            </form>
          )
          }
          {editResumeId && (
            <form onSubmit={editTitle} onClick={() => setEditResumeId('')} className='fixed inset-0 bg-black/70 backdrop-blur bg-opacity-50 z-10 flex items-center justify-center'>
              <div onClick={e => e.stopPropagation()} className='relative w-full max-w-sm bg-slate-50 rounded-lg p-6'>
                <h2 className='text-xl font-boldd mb-4'>Edit Resume Title</h2>
                <input onChange={(e) => setTitle(e.target.value)} value={title} type="text" placeholder='Enter Resume Title' className='w-full px-4 py-2 mb-4 border border-slate-200 rounded focus:ring-2 focus:border-green-600 focus:ring-green-600/50 outline-none' required />
                <button className='w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors'>Edit Title</button>
                <XIcon className='absolute top-4 right-4 cursor-pointer text-slate-400 hover:text-slate-600 transition-colors' onClick={() => { setEditResumeId(''); setTitle(''); setResumeFile(null) }} />
              </div>
            </form>
          )
          }
        </div>
      </div>
    </div>
  )
}

export default Dashboard