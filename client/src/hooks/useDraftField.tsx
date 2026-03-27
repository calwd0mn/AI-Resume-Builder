import { useEffect, useState } from 'react'

/**
 * F: 某个字段的类型（比如 string、Experience[] 等）
 */
export function useDraftField<F>(
  value: F,                      // 已保存的值（来自父 state）
  onSave: (next: F) => void,     // 真正保存时怎么写回父 state
  isActive: boolean,             // 当前这块表单是否处于激活/可编辑状态
) {
  const [draft, setDraft] = useState<F>(value)

  // 外部 value 变化时，同步草稿（例如切换简历）
  useEffect(() => {
    setDraft(value)
  }, [value])

  // 离开当前 section 时丢弃未保存的草稿
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