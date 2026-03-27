import { Plus, Trash2Icon } from 'lucide-react'
import React, { useState } from 'react'
import type { Experience, ResumeData } from '../assets/types'
import { useSelector } from 'react-redux'
import type { RootState } from '../app/store'
import axios from 'axios'
import toast from 'react-hot-toast'
import AiEnhanceButton from './AiEnhanceButton'
import { useSseEnhancer } from '../hooks/useSseEnhancer'

type ExperienceProps = {
  data: ResumeData['experience']
  setExperience: React.Dispatch<React.SetStateAction<ResumeData['experience']>>
}

const ExperienceForm = ({ data, setExperience }: ExperienceProps) => {
  const { token } = useSelector((state: RootState) => state.auth)
  const { isStreaming, start, stop } = useSseEnhancer()
  const [streamingId, setStreamingId] = useState<string | null>(null)

  const addExperience = () => {
    const newExperience: Experience = {
      company: "",
      position: "",
      start_date: "",
      end_date: "",
      description: "",
      id: crypto.randomUUID(),
      is_current: false
    };
    setExperience(prev => [...prev, newExperience])
  }
  const handleChange = (index: number, field: keyof Experience, value: string) => {
    setExperience(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }
  const handleCurrentWorkingChange = (index: number, checked: boolean) => {
    setExperience(prev => {
      const next = [...prev]
      next[index] = {
        ...next[index],
        is_current: checked,
        end_date: checked ? 'Present' : '',
      }
      return next
    })
  }
  const handleDelete = (id: string) => {
    setExperience(prev => prev.filter(exp => exp.id !== id))
  }

  const handleEnhanceDescription = async (experience: Experience) => {
    const safeContent = String(experience.description || '').trim()
    if (!safeContent) {
      toast.error('Please enter job description first.')
      return
    }

    try {
      let streamedText = ''
      setStreamingId(experience.id)
      setExperience((prev) => prev.map((item) => item.id === experience.id ? { ...item, description: '' } : item))
      await start({
        endpoint: '/api/ai/enhance-job-desc-stream',
        token,
        payload: { userContent: safeContent },
        onChunk: (delta) => {
          streamedText += delta
          setExperience((prev) => prev.map((item) => item.id === experience.id ? { ...item, description: streamedText } : item))
        },
        onDone: (result, meta) => {
          setExperience((prev) => prev.map((item) => item.id === experience.id ? { ...item, description: result } : item))
          if (meta?.traceId) {
            console.log(`[JobDesc][${meta.traceId}] stream completed, fallback=${Boolean(meta?.fromFallback)}`)
          }
        },
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.message ?? error.message)
        : (error instanceof Error ? error.message : 'Request failed')
      toast.error(message)
    } finally {
      setStreamingId(null)
    }
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between'>
        <div className='flex flex-col gap-3 pt-4'>
          <p className='font-semibold text-lg text-gray-800'>Professional Experience</p>
          <p className='text-sm text-gray-600'>Add your job experience here</p>
        </div>
        <button className='inline-flex items-center h-10 gap-2 bg-gradient-to-br from-pink-50 to-pink-100 text-pink-600 ring-pink-300 hover:ring transition-all px-4 py-1.5 rounded-lg whitespace-nowrap' onClick={addExperience} >
          <Plus className='size-4' />
          Add Experience
        </button>
      </div>
      {data.map((experience, index) => (
        <div key={experience.id} className='rounded-lg border border-gray-300 p-4'>
          <div className='flex items-center justify-between mb-4'>
            <h3>Experience #{index + 1}</h3>
            <button onClick={() => handleDelete(experience.id)}><Trash2Icon className='size-6 text-red-400 hover:text-red-600 transition-colors cursor-pointer' /></button>
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <input
              type="text"
              className="mt-1 block w-full h-9 border border-gray-300 rounded-lg p-2"
              value={experience.position}
              placeholder="job title"
              onChange={(e) => handleChange(index, 'position', e.target.value)}
            />
            <input
              type="text"
              className="mt-1 block w-full h-9 border border-gray-300 rounded-lg p-2"
              value={experience.company}
              placeholder="company name"
              onChange={(e) => handleChange(index, 'company', e.target.value)}
            />
            <input
              type="month"
              className="mt-1 block w-full h-9 border border-gray-300 rounded-lg p-2"
              value={experience.start_date}
              onChange={(e) => handleChange(index, 'start_date', e.target.value)}
            />
            <input
              type={experience.is_current ? 'text' : 'month'}
              value={experience.is_current ? 'Present' : experience.end_date}
              disabled={experience.is_current}
              readOnly={experience.is_current}
              title={experience.is_current ? 'Current working here is enabled' : ''}
              className={`mt-1 block w-full h-9 border border-gray-300 rounded-lg p-2 ${experience.is_current ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
              onChange={(e) => handleChange(index, 'end_date', e.target.value)}
            />
          </div>
          <label className='mt-3 inline-flex items-center gap-2 text-sm text-gray-600'>
            <input
              type='checkbox'
              checked={experience.is_current}
              onChange={(e) => handleCurrentWorkingChange(index, e.target.checked)}
            />
            Current working here
          </label>

          <div className='flex items-center justify-between mt-5 mb-2'>
            <p className=' text-md text-gray-600 font-semibold'>Job Description</p>
            <AiEnhanceButton
              isStreaming={isStreaming && streamingId === experience.id}
              onStart={() => handleEnhanceDescription(experience)}
              onStop={stop}
              className='flex items-center gap-2 justify-center rounded-lg bg-purple-100 px-4 py-1.5 text-sm text-purple-600 hover:text-purple-800 hover:bg-purple-200 ring-purple-300 hover:ring transition-colors'
            />
          </div>
          <textarea id="job_description"
            className='mt-1 block w-full h-30 border border-gray-300 rounded-lg p-2 resize-none'
            value={experience.description}
            onChange={(e) => handleChange(index, 'description', e.target.value)}
          ></textarea>
        </div>
      ))}


    </div>

  )
}

export default ExperienceForm
