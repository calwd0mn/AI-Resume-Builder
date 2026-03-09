// ActiveSectionContext.tsx
import { createContext, useContext } from 'react'

const ActiveSectionContext = createContext<string | null>(null)
export const useActiveSection = () => useContext(ActiveSectionContext)
export default ActiveSectionContext