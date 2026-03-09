import type { ResumeData, } from '../assets/types'
import { templateRegistry } from './template/registry'

type ResumePreviewProps = {
  data: ResumeData
  template: string
  accentColor: string
  classes: string
}

function ResumePreview({ data, template, accentColor, classes = '' }: ResumePreviewProps) {
  const renderTemplate = () => {
    const TemplateComponent = templateRegistry[template]

    if (!TemplateComponent) {
      // 没找到模板时的兜底，可以自定义一段提示 UI
      return (
        <div className="p-8 bg-white text-red-500">
          未找到模板：{template}
        </div>
      )
    }
    return <TemplateComponent data={data} accentColor={accentColor} />
  }
  return (
    <div className='w-full bg-gray-100'>
      <div id="resume-preview" className={"border border-gray-200 print:shadow-none print:border-none " + classes}>
        {renderTemplate()}
      </div>

      <style >
        {`
        @page {
          size: letter;
          margin: 0;
        }
        @media print {
          html, body {
            width: 8.5in;
            height: 11in;
            overflow: hidden; 
          }
          body * {
            visibility: hidden;
          }
          #resume-preview, #resume-preview * {
            visibility: visible;
          }
          #resume-preview {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            margin: 0;
            padding: 0;
            box-shadow: none !important;
            border: none !important;
          }
        }
        `}
      </style>
    </div>
  )
}

export default ResumePreview