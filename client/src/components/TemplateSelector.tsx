import { Check, Layout } from 'lucide-react'


type TemplateSelectorProps = {
  selectedTemplate: string
  setTemplate: (template: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

function TemplateSelector({ selectedTemplate, setTemplate, isOpen, setIsOpen }: TemplateSelectorProps) {
  const templates = [
    {
      id: "classic",
      name: "Classic",
      preview: "A clean, traditional resume format with clear sections and professional typography"
    },
    {
      id: "modern",
      name: "Modern",
      preview: "Sleek design with strategic use of color and modern font choices"
    },
    {
      id: "minimalImage",
      name: "Minimal Image",
      preview: "Minimal design with a single image and clean typography"
    },
    {
      id: "minimal",
      name: "Minimal",
      preview: "Ultra-clean design that puts your content front and center"
    },
  ]
  return (
    <>

      <div className="relative">
        <button onClick={() => setIsOpen(!isOpen)} className='flex items-center gap-1 text-sm text-blue-600 bg-gradient-to-br from-blue-50 to-blue-100 ring-blue-300 hover:ring transition-all px-3 py-2 rounded-lg'>
          <Layout size={14} /><span className='max-sm:hidden'>Templates</span>
        </button>

        {isOpen && (
          <>
            {/* 遮罩先渲染、z-10，点击关闭；下拉内容 z-20 在其之上，保证点击模板能触发 setTemplate */}
            <div className="fixed inset-0 z-10 cursor-default" onClick={() => setIsOpen(false)} />
            <div className="flex flex-col gap-2 absolute left-0 mt-2 w-75 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-2">
              {templates.map((template) => (
                <div key={template.id} className={`relative p-3 border rounded-md cursor-pointer transition-all ${selectedTemplate === template.id ? 'border-blue-400 bg-blue-100' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-100'}`} onClick={() => { setTemplate(template.id); setIsOpen(false); }} >
                  {selectedTemplate === template.id && (
                    <div className='absolute right-2 top-2'>
                      <div className='size-5 bg-blue-600 rounded-full flex items-center justify-center '>
                        <Check className='w-3 h-3 text-white ' />
                      </div>
                    </div>
                  )}
                  <div>
                    <h4 className='font-medium text-gray-800'>{template.name}</h4>
                    <div className='mt-2 p-2 bg-blue-50 rounded italic text-xs text-gray-400'>{template.preview}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

    </>

  )
}

export default TemplateSelector