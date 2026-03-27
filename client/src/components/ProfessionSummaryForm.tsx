import { useSelector } from 'react-redux'
import type { RootState } from '../app/store'
import type { ResumeData } from '../assets/types'
import axios from 'axios'
import toast from 'react-hot-toast'
import AiEnhanceButton from './AiEnhanceButton'
import { useSseEnhancer } from '../hooks/useSseEnhancer'

type ProfessionSummaryFormProps = {
  summary: string
  onSummaryChange: (next: string) => void
  setResumeData: React.Dispatch<React.SetStateAction<ResumeData>>
}

const ProfessionSummaryForm = ({ summary, onSummaryChange, setResumeData }: ProfessionSummaryFormProps) => {
  const { token } = useSelector((state: RootState) => state.auth)
  const { isStreaming, start, stop } = useSseEnhancer()

  const generateSummary = async () => {
    const safeSummary = summary.trim()
    if (!safeSummary) {
      toast.error('Please enter your summary first.')
      return
    }

    try {
      let streamedText = ''
      onSummaryChange('')
      await start({
        endpoint: '/api/ai/enhance-pro-sum-stream',
        token,
        payload: { userContent: safeSummary },
        onChunk: (delta) => {
          streamedText += delta
          onSummaryChange(streamedText)
        },
        onDone: (result, meta) => {
          onSummaryChange(result)
          setResumeData((prev) => ({ ...prev, professional_summary: result }))
          if (meta?.traceId) {
            console.log(`[Summary][${meta.traceId}] stream completed, fallback=${Boolean(meta?.fromFallback)}`)
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
    }
  }

  return (
    <div>
      <div className='flex items-center justify-between'>
        <div className='flex flex-col gap-3 pt-4'>
          <p className='font-semibold text-lg text-gray-800'>Professional Summary</p>
          <p className='text-sm text-gray-600'>Add summary for your resume here</p>
        </div>
        <AiEnhanceButton
          isStreaming={isStreaming}
          onStart={generateSummary}
          onStop={stop}
          className='inline-flex items-center gap-2 bg-gradient-to-br from-pink-50 to-pink-100 text-pink-600 ring-pink-300 hover:ring transition-all px-4 py-1.5 rounded-full whitespace-nowrap'
        />
      </div>
      <textarea
        placeholder='Write a brief summary about your professional background, skills, and career goals. This section should highlight your key qualifications and what you bring to potential employers.'
        className='w-full h-50 mt-4 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all resize-none'
        value={summary}
        onChange={(e) => onSummaryChange(e.target.value)}
      />
    </div>
  )
}

export default ProfessionSummaryForm
