import type { ResumeData } from "../../assets/types"

export type ResumeTemplate = {
  id: string
  name: string
  description: string
  previewImage: string
  // Add any other template-specific fields here
}

export type TemplateProps = {
  data: ResumeData
  accentColor: string
}