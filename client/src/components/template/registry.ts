import ClassicTemplate from './ClassicTemplate'
import MinimalTemplate from './MinimalTemplate'
import ModernTemplate from './ModernTemplate'
import MinimalImageTemplate from './MinimalImageTemplate'

// 这里先不纠结类型，可以先用 any，后面再根据你的 ResumeData/props 慢慢补类型
export const templateRegistry: Record<string, React.ComponentType<any>> = {
  classic: ClassicTemplate,
  minimal: MinimalTemplate,
  modern: ModernTemplate,
  // 支持两种写法，兼容 mock 数据里的 "minimal-image"
  minimalImage: MinimalImageTemplate,
}