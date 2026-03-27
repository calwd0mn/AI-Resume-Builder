import { FilePenLineIcon, PencilIcon, PlusIcon, TrashIcon, UploadCloudIcon, XIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import type { ResumeData } from '../assets/types'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '../app/store'
import api from '../configs/api'
import toast from 'react-hot-toast'
import axios from 'axios'


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

  const normalizeResume = (resume: any): ResumeData => ({
    ...resume,
    id: resume?.id || resume?._id || '',
  })

  const loadAllResumes = async () => {
    try {
      const { data } = await api.get('/api/users/resumes', { headers: { Authorization: `Bearer ${token}` } })
      setAllResumes((data.resumes || []).map(normalizeResume))
    } catch (error) {
      const message = axios.isAxiosError(error) ? (error.response?.data?.message ?? error.message) : (error instanceof Error ? error.message : 'Request failed')
      toast.error(message)
    }
  }
  useEffect(() => {
    loadAllResumes()
  }, [])

  const createResume: React.SubmitEventHandler<HTMLFormElement> = async (event) => {
    try {
      event.preventDefault()
      const { data } = await api.post('/api/resumes/create', { title }, { headers: { Authorization: `Bearer ${token}` } })
      setAllResumes([...allResumes, normalizeResume(data.resume)])
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

    const STATUS_TOAST_ID = 'resume-status';

    try {
      if (!resumeFile || !title.trim()) {
        toast.error('请填写标题并上传简历文件');
        setIsLoading(false);
        return;
      }

      toast.loading('正在读取 PDF 内容...', { id: STATUS_TOAST_ID });
      const { extractTextFromPdfWithOcrFallback } = await import('../utils/pdfOcr');
      const { text: resumeText, usedOcr } = await extractTextFromPdfWithOcrFallback(resumeFile, () => {
        toast.loading('正在进行 OCR 识别，这可能需要较长时间...', { id: STATUS_TOAST_ID });
      });

      if (!resumeText.trim()) {
        toast.error('无法提取文字，请确保 PDF 不是受保护的加密文件', { id: STATUS_TOAST_ID });
        return;
      }

      toast.loading(usedOcr ? 'OCR 已完成，正在由 AI 深度解析...' : '正在解析简历结构...', { id: STATUS_TOAST_ID });

      const { data } = await api.post(
        '/api/ai/upload-resume',
        { resumeText: resumeText.trim(), title },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 60000
        }
      );

      toast.success('简历解析成功！正在进入编辑器...', { id: STATUS_TOAST_ID });

      setTitle('');
      setResumeFile(null);
      setShowUploadResume(false);
      navigate(`/app/builder/${data.resumeId}`);

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const serverMessage = error.response?.data?.message;

        if (error.code === 'ECONNABORTED' || status === 504) {
          toast.error('AI 解析耗时过长。建议尝试：1.删除简历中的图片或装饰文字 2.手动复制文本上传。', { id: STATUS_TOAST_ID, duration: 5000 });
        } else if (status === 413) {
          toast.error('简历内容超出长度限制，请上传精简后的版本。', { id: STATUS_TOAST_ID });
        } else {
          toast.error(serverMessage || '解析失败，请检查文件内容或重试。', { id: STATUS_TOAST_ID });
        }
      } else {
        toast.error('发生未知错误，请刷新页面重试', { id: STATUS_TOAST_ID });
      }
    } finally {
      setIsLoading(false);
    }
  };


  const editTitle: React.SubmitEventHandler<HTMLFormElement> = async (event) => {
    try {
      event.preventDefault()
      const { data } = await api.put('/api/resumes/update', { resumeId: editResumeId, title }, { headers: { Authorization: `Bearer ${token}` } })
      setAllResumes(allResumes.map(resume => resume.id === editResumeId ? { ...resume, title: title } : resume))
      setEditResumeId('')
      setTitle('')
      toast.success(data.message)
    } catch (error) {
      const message = axios.isAxiosError(error) ? (error.response?.data?.message ?? error.message) : (error instanceof Error ? error.message : 'Request failed')
      toast.error(message)
    }

  }
  const deleteResume = async (resumeId: string) => {
    try {
      const confirm = window.confirm('Are you sure you want to delete this resume?')
      if (confirm) {
        const { data } = await api.delete(`/api/resumes/delete/${resumeId}`, { headers: { Authorization: `Bearer ${token}` } })
        setAllResumes(allResumes.filter(resume => resume.id !== resumeId))
        toast.success(data.message)
      }
    } catch (error) {
      const message = axios.isAxiosError(error) ? (error.response?.data?.message ?? error.message) : (error instanceof Error ? error.message : 'Request failed')
      toast.error(message)
    }
  }
  return (
    <div>
      <div className='max-w-7xl mx-auto px-4 py-8'>
        <p className='text-2xl font-medium mb-6 bg-gradient-to-r from-slate-600 to-slate-700 bg-clip-text text-transparent sm:hidden'>Welcome,{user?.name}</p>
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
          {showCreateResume && (
            <form onSubmit={createResume} onClick={() => setShowCreateResume(false)} className='fixed inset-0 bg-black/70 backdrop-blur bg-opacity-50 z-10 flex items-center justify-center'>
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
              <div onClick={e => e.stopPropagation()} className='relative bg-slate-50 border shadow-md rounded-lg w-full max-w-sm p-6'>
                <h2 className='text-xl font-bold mb-4'>Edit Resume Title</h2>
                <input onChange={(e) => setTitle(e.target.value)} value={title} type="text" placeholder='Enter resume title' className='w-full px-4 py-2 mb-4 focus:border-green-600 ring-green-600' required />

                <button className='w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors'>Update</button>
                <XIcon className='absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors' onClick={() => { setEditResumeId(''); setTitle('') }} />
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
