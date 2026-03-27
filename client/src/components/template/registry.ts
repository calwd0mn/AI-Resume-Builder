import ClassicTemplate from './ClassicTemplate'
import MinimalTemplate from './MinimalTemplate'
import ModernTemplate from './ModernTemplate'
import MinimalImageTemplate from './MinimalImageTemplate'

export const templateRegistry: Record<string, React.ComponentType<any>> = {
  classic: ClassicTemplate,
  minimal: MinimalTemplate,
  modern: ModernTemplate,
  minimalImage: MinimalImageTemplate,
}