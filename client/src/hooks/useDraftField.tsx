import { useEffect, useState } from 'react'

/**
 */
export function useDraftField<F>(
  value: F,
  onSave: (next: F) => void,
  isActive: boolean,
) {
  const [draft, setDraft] = useState<F>(value)

  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => {
    if (!isActive) {
      setDraft(value)
    }
  }, [isActive, value])

  const save = () => {
    onSave(draft)
  }

  return { draft, setDraft, save }
}