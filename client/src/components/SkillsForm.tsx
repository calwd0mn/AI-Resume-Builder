import React, { useState } from 'react'
import type { ResumeData } from '../assets/types'
import { Plus, Sparkles, X } from 'lucide-react'

type SkillsFormProps = {
  data: ResumeData['skills']
  setSkills: React.Dispatch<React.SetStateAction<ResumeData['skills']>>
}

const SkillsForm = ({ data, setSkills }: SkillsFormProps) => {
  const [input, setInput] = useState('')

  const addSkill = () => {
    const skill = input.trim()
    if (!skill || data.includes(skill)) return
    setSkills(prev => [...prev, skill])
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkill()
    }
  }

  const removeSkill = (index: number) => {
    setSkills(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-3 pt-4'>
        <p className='font-semibold text-lg text-gray-800'>Skills</p>
        <p className='text-sm text-gray-600'>Add your technical and soft skills</p>
      </div>

      <div className='flex items-center gap-3'>
        <input
          type='text'
          className='flex-1 h-11 border border-gray-300 rounded-lg px-3'
          value={input}
          placeholder='Enter a skill (e.g., JavaScript, Project Management)'
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className='inline-flex items-center h-11 gap-2 bg-blue-600 text-white px-5 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap'
          onClick={addSkill}
        >
          <Plus className='size-4' />
          Add
        </button>
      </div>

      {data.length === 0 ? (
        <div className='flex flex-col items-center gap-2 py-8 text-gray-400'>
          <Sparkles className='size-10' />
          <p className='text-lg font-medium'>No skills added yet.</p>
          <p className='text-sm'>Add your technical and soft skills above.</p>
        </div>
      ) : (
        <div className='flex flex-wrap gap-2'>
          {data.map((skill, index) => (
            <span
              key={index}
              className='inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium'
            >
              {skill}
              <button onClick={() => removeSkill(index)} className='hover:text-red-500 transition-colors'>
                <X className='size-3.5' />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className='bg-green-50 border-l-4 border-green-400 rounded-r-lg p-4'>
        <p className='text-sm text-gray-700'>
          <span className='font-bold text-green-700'>Tip: </span>
          Add 8-12 relevant skills. Include both technical skills (programming languages, tools) and soft skills (leadership, communication).
        </p>
      </div>
    </div>
  )
}

export default SkillsForm
