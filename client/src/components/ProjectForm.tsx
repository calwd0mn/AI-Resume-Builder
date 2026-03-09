import React from 'react'
import type { Project, ResumeData } from '../assets/types'
import { Plus, Sparkles, Trash2 } from 'lucide-react'

type ProjectFormProps = {
  data: ResumeData['project']
  setProject: React.Dispatch<React.SetStateAction<ResumeData['project']>>
  onSaveChanges: () => void
}

const ProjectForm = ({ data, setProject, onSaveChanges }: ProjectFormProps) => {

  const addProject = () => {
    const newProject: Project = {
      name: '',
      type: '',
      description: '',
      id: crypto.randomUUID(),
    }
    setProject(prev => [...prev, newProject])
  }

  const handleChange = (index: number, field: keyof Project, value: string) => {
    setProject(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handleDelete = (id: string) => {
    setProject(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between'>
        <div className='flex flex-col gap-3 pt-4'>
          <p className='font-semibold text-lg text-gray-800'>Projects</p>
          <p className='text-sm text-gray-600'>Add your project experience here</p>
        </div>
        <button className='inline-flex items-center h-10 gap-2 bg-gradient-to-br from-pink-50 to-pink-100 text-pink-600 ring-pink-300 hover:ring transition-all px-4 py-1.5 rounded-lg whitespace-nowrap' onClick={addProject}>
          <Plus className='size-4' />
          Add Project
        </button>
      </div>

      {data.map((project, index) => (
        <div key={project.id} className='rounded-lg border border-gray-300 p-4'>
          <div className='flex items-center justify-between mb-4'>
            <h3>Project #{index + 1}</h3>
            <button onClick={() => handleDelete(project.id)}>
              <Trash2 className='size-6 text-red-400 hover:text-red-600 transition-colors cursor-pointer' />
            </button>
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <input
              type='text'
              className='mt-1 block w-full h-9 border border-gray-300 rounded-lg p-2'
              value={project.name}
              placeholder='project name'
              onChange={(e) => handleChange(index, 'name', e.target.value)}
            />
            <input
              type='text'
              className='mt-1 block w-full h-9 border border-gray-300 rounded-lg p-2'
              value={project.type}
              placeholder='project type'
              onChange={(e) => handleChange(index, 'type', e.target.value)}
            />
          </div>

          <div className='flex items-center justify-between mt-5 mb-2'>
            <p className='text-md text-gray-600 font-semibold'>Project Description</p>
            <button className='flex items-center gap-2 justify-center rounded-lg bg-purple-100 px-4 py-1.5 text-sm text-purple-600 hover:text-purple-800 hover:bg-purple-200 ring-purple-300 hover:ring transition-colors'>
              <Sparkles className='size-4' />Enhance with AI
            </button>
          </div>
          <textarea
            className='mt-1 block w-full h-30 border border-gray-300 rounded-lg p-2 resize-none'
            value={project.description}
            onChange={(e) => handleChange(index, 'description', e.target.value)}
          />
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

export default ProjectForm
