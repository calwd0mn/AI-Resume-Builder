import { Loader2, Sparkles, Square } from 'lucide-react'

type AiEnhanceButtonProps = {
  isStreaming: boolean
  onStart: () => void
  onStop: () => void
  className?: string
}

const AiEnhanceButton = ({ isStreaming, onStart, onStop, className }: AiEnhanceButtonProps) => {
  return (
    <button
      type='button'
      onClick={isStreaming ? onStop : onStart}
      className={className}
    >
      {isStreaming ? <Loader2 className='size-4 animate-spin' /> : <Sparkles className='size-4' />}
      {isStreaming ? (
        <>
          生成中
          <Square className='size-3 fill-current' />
        </>
      ) : 'Enhance with AI'}
    </button>
  )
}

export default AiEnhanceButton
