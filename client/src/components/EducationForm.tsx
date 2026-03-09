import React from 'react'
import type { Education, ResumeData } from '../assets/types'
import { Plus, Trash2 } from 'lucide-react'

type EducationFormProps = {
  data: ResumeData['education']
  setEducation: React.Dispatch<React.SetStateAction<ResumeData['education']>>
  onSaveChanges: () => void
}

const EducationForm = ({ data, setEducation, onSaveChanges }: EducationFormProps) => {

  const addEducation = () => {
    const newEducation: Education = {
      institution: '',
      degree: '',
      field: '',
      graduation_date: '',
      gpa: '',
      id: crypto.randomUUID(),
    }
    setEducation(prev => [...prev, newEducation])
  }

  const handleChange = (index: number, field: keyof Education, value: string) => {
    setEducation(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handleDelete = (id: string) => {
    setEducation(prev => prev.filter(edu => edu.id !== id))
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between'>
        <div className='flex flex-col gap-3 pt-4'>
          <p className='font-semibold text-lg text-gray-800'>Education</p>
          <p className='text-sm text-gray-600'>Add your education history here</p>
        </div>
        <button className='inline-flex items-center h-10 gap-2 bg-gradient-to-br from-pink-50 to-pink-100 text-pink-600 ring-pink-300 hover:ring transition-all px-4 py-1.5 rounded-lg whitespace-nowrap' onClick={addEducation}>
          <Plus className='size-4' />
          Add Education
        </button>
      </div>

      {data.map((education, index) => (
        <div key={education.id} className='rounded-lg border border-gray-300 p-4'>
          <div className='flex items-center justify-between mb-4'>
            <h3>Education #{index + 1}</h3>
            <button onClick={() => handleDelete(education.id)}>
              <Trash2 className='size-6 text-red-400 hover:text-red-600 transition-colors cursor-pointer' />
            </button>
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <input
              type='text'
              className='mt-1 block w-full h-9 border border-gray-300 rounded-lg p-2'
              value={education.institution}
              placeholder='institution name'
              onChange={(e) => handleChange(index, 'institution', e.target.value)}
            />
            <input
              type='text'
              className='mt-1 block w-full h-9 border border-gray-300 rounded-lg p-2'
              value={education.degree}
              placeholder='degree'
              onChange={(e) => handleChange(index, 'degree', e.target.value)}
            />
            <input
              type='text'
              className='mt-1 block w-full h-9 border border-gray-300 rounded-lg p-2'
              value={education.field}
              placeholder='field of study'
              onChange={(e) => handleChange(index, 'field', e.target.value)}
            />
            <input
              type='month'
              value={education.graduation_date}
              className='mt-1 block w-full h-9 border border-gray-300 rounded-lg p-2'
              onChange={(e) => handleChange(index, 'graduation_date', e.target.value)}
            />
            <input
              type='text'
              className='mt-1 block w-full h-9 border border-gray-300 rounded-lg p-2'
              value={education.gpa || ''}
              placeholder='GPA (optional)'
              onChange={(e) => handleChange(index, 'gpa', e.target.value)}
            />
          </div>
        </div>
      ))}

      <button
        className='h-11 bg-gradient-to-br from-green-100 to-green-200 border border-green-300 text-green-600 hover:ring transition-all px-4 py-1.5 rounded-lg'
        onClick={onSaveChanges}
      >
        Save Changes
      </button>
    </div>
  )
}

export default EducationForm