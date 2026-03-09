import { Sparkles } from 'lucide-react'

type ProfessionSummaryFormProps = {
  summary: string
  onSummaryChange: (next: string) => void
  onSaveSummary: () => void
}


const ProfessionSummaryForm = ({ summary, onSummaryChange, onSaveSummary }: ProfessionSummaryFormProps) => {
  return (
    <div >
      <div className='flex items-center justify-between'>
        <div className='flex flex-col gap-3 pt-4'>
          <p className='font-semibold text-lg text-gray-800'>Professional Summary</p>
          <p className='text-sm text-gray-600'>Add summary for your resume here</p>
        </div>
        {/* whitespace-nowrap 禁止自动换行 */}
        <button className='inline-flex items-center gap-2  bg-gradient-to-br from-pink-50 to-pink-100 text-pink-600 ring-pink-300 hover:ring transition-all px-4 py-1.5 rounded-full whitespace-nowrap' >
          <Sparkles className='size-4' />
          AI Enhance
        </button>
      </div>
      <textarea
        placeholder='Write a brief summary about your professional background, skills, and career goals. This section should highlight your key qualifications and what you bring to potential employers.'
        className='w-full h-50 mt-4 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all resize-none'
        value={summary}
        onChange={(e) => onSummaryChange(e.target.value)}
      />
      <button
        className='mt-4 h-12 bg-gradient-to-br from-green-100 to-green-200 border border-green-300 text-green-600 hover:ring transition-all px-4 py-1.5 rounded-lg'
        onClick={onSaveSummary}
      >
        Save Changes
      </button>
    </div>



  )
}

export default ProfessionSummaryForm