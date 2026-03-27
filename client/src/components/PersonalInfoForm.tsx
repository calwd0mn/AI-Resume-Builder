import { type Dispatch, type SetStateAction } from 'react'
import type { ResumeData } from '../assets/types'
import { User, Mail, Phone, MapPin, BriefcaseBusiness, Globe } from 'lucide-react'



type PersonalInfoFormProps = {
  data: ResumeData['personal_info']
  onChange: (next: ResumeData['personal_info']) => void
  removeBackground: boolean
  setRemoveBackground: Dispatch<SetStateAction<boolean>>
}

function PersonalInfoForm({ data, onChange, removeBackground, setRemoveBackground }: PersonalInfoFormProps) {

  const handleChange = (
    field: keyof ResumeData['personal_info'],
    value: any
  ) => {
    const next = { ...data, [field]: value }
    onChange(next)
  }
  const fields = [
    { key: "full_name", label: "Full Name", icon: User, type: "text", required: true },
    { key: "email", label: "Email Address", icon: Mail, type: "email", required: true },
    { key: "phone", label: "Phone Number", icon: Phone, type: "tel", required: true },
    { key: "location", label: "Location", icon: MapPin, type: "text" },
    { key: "website", label: "Personal Website", icon: Globe, type: "url" },
    { key: "job_intention", label: "Job Intention", icon: BriefcaseBusiness, type: "text" },
  ]


  return (
    <div >
      <h3 className='text-lg font-semibold text-gray-700'>Personal Information</h3>
      <p className='text-sm text-gray-500'>Get Started with the personal information</p>
      <div className='flex items-center gap-2'>
        <label>
          {data.image ? (
            <img src={typeof data.image === 'string' ? data.image : URL.createObjectURL(data.image)} alt="user-image"
              className='w-16 h-16 rounded-full object-cover mt-5 ring ring-slate-300 hover:opacity-80' />
          ) : (
            <div className='inline-flex items-center gap-2 mt-5 text-slate-600 hover:text-slate-700 cursor-pointer'>
              <User className='size-10 p-2.5 border rounded-full' />upload user image
            </div>
          )}
          <input type="file" accept='image/jpeg,image/png' className='hidden' onChange={(e) => { handleChange('image', e.target.files![0]) }} />
        </label>
        {data.image != null && (
          <div className='flex flex-col gap-1 pl-4 text-sm'>
            <p>Remove Background</p>
            <label className='relative inline-flex items-center cursor-pointer text-gray-900 gap-3'>
              <input type="checkbox" className="sr-only peer" onChange={() => setRemoveBackground(prev => !prev)} checked={removeBackground} />
              <div className='w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-green-600 transition-colors duration-200'>
              </div>
              <span className='dot absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-4'></span>
            </label>
          </div>
        )}
      </div>
      {fields.map((field) => {
        const Icon = field.icon
        return (
          <div key={field.key} className='space-y-1 mt-3'>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <Icon className='size-4' />
              {field.label}
              {field.required && <span className='text-red-500'>*</span>}


            </label>
            <input
              type={field.type}
              value={data[field.key as keyof ResumeData['personal_info']] || ''}
              placeholder={`Enter your ${field.label.toLowerCase()} here`}
              required={field.required}
              className='mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm'
              onChange={(e) => handleChange(field.key as keyof ResumeData['personal_info'], e.target.value)}
            />
          </div>
        )
      })

      }
    </div>
  )
}

export default PersonalInfoForm