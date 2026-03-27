import { Suspense, lazy, useEffect, useState, type SetStateAction } from 'react'
import type { ResumeData } from '../assets/types'
import { EMPTY_RESUME_DATA } from '../assets/types'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeftIcon, Briefcase, ChevronLeft, ChevronRight, FileText, FolderIcon, GraduationCap, Sparkles, User } from 'lucide-react'
import ResumePreview from '../components/ResumePreview'
import TemplateSelector from '../components/TemplateSelector'
import ColorSeclector from '../components/ColorSeclector'
import ActiveSectionContext from '../components/ActiveSectionContext'
import { useSelector } from 'react-redux'
import type { RootState } from '../app/store'
import api from '../configs/api'
import axios from 'axios'
import toast from 'react-hot-toast'

type DraftKeys = 'professional_summary' | 'experience' | 'education' | 'project' | 'skills' | 'personal_info'
//Partial<Pick<ResumeData, DraftKeys>> 表示 ResumeDrafts 是 ResumeData 的子集，且只包含 DraftKeys 中的键，partial将获取的属性变为可选属性
type ResumeDrafts = Partial<Pick<ResumeData, DraftKeys>>

const PersonalInfoForm = lazy(() => import('../components/PersonalInfoForm'))
const ProfessionSummaryForm = lazy(() => import('../components/ProfessionSummaryForm'))
const ExperienceForm = lazy(() => import('../components/ExperienceForm'))
const EducationForm = lazy(() => import('../components/EducationForm'))
const ProjectForm = lazy(() => import('../components/ProjectForm'))
const SkillsForm = lazy(() => import('../components/SkillsForm'))


const ResumeBuilder = () => {
  const resumeId = useParams<{ resumeId: string }>().resumeId
  const [resumeData, setResumeData] = useState<ResumeData>(EMPTY_RESUME_DATA)
  const { token } = useSelector((state: RootState) => state.auth)
  const normalizeResumeForUI = (raw: ResumeData): ResumeData => {
    if (raw?.personal_info && typeof raw.personal_info !== 'string') {
      return raw
    }

    const legacyImage = typeof (raw as any)?.personal_info === 'string'
      ? (raw as any).personal_info
      : ''

    return {
      ...raw,
      personal_info: {
        ...EMPTY_RESUME_DATA.personal_info,
        image: legacyImage,
      },
    } as ResumeData
  }

  const loadExistingResume = async (resumeId: string) => {
    try {
      const { data } = await api.get(`/api/resumes/get/${resumeId}`, { headers: { Authorization: `Bearer ${token}` } })
      if (data.resume) {
        setResumeData(normalizeResumeForUI(data.resume))
        document.title = data.resume.title;
      }
    } catch (error) {
      const message = axios.isAxiosError(error) ? (error.response?.data?.message ?? error.message) : (error instanceof Error ? error.message : 'Request failed')
      toast.error(message)
    }
  }
  const sections = [
    { id: "personal", name: "Personal Info", icon: User },
    { id: "summary", name: "Summary", icon: FileText },
    { id: "experience", name: "Experience", icon: Briefcase },
    { id: "education", name: "Education", icon: GraduationCap },
    { id: "projects", name: "Projects", icon: FolderIcon },
    { id: "skills", name: "Skills", icon: Sparkles },
  ]

  const [activeSectionIndex, setactiveSectionIndex] = useState(0)
  const [removeBackground, setremoveBackground] = useState<boolean>(false)
  const activeSection = sections[activeSectionIndex]
  const [drafts, setDrafts] = useState<ResumeDrafts>({})
  const [isSaving, setIsSaving] = useState(false)
  /** 当前打开的 dropdown：'template' | 'color' | null，保证同一时间只开一个 */
  const [activeDropdown, setActiveDropdown] = useState<'template' | 'color' | null>(null)

  const setDraftField = <K extends keyof ResumeDrafts>(key: K, value: ResumeDrafts[K]) => {
    setDrafts(prev => ({ ...prev, [key]: value }))
  }




  const setDraftFieldWithUpdater = <K extends keyof ResumeDrafts>(
    key: K,
    updater: SetStateAction<NonNullable<ResumeDrafts[K]>>,
    fallback: NonNullable<ResumeDrafts[K]>,
  ) => {
    setDrafts(prev => {
      const current = (prev[key] ?? fallback) as NonNullable<ResumeDrafts[K]>
      const next = typeof updater === 'function'
        ? (updater as (prev: NonNullable<ResumeDrafts[K]>) => NonNullable<ResumeDrafts[K]>)(current)
        : updater
      return { ...prev, [key]: next }
    })
  }
  /** 当前“真实数据 + 所有草稿”合并结果，与预览一致，用于上传 */
  const getMergedResumeData = (): ResumeData => ({ ...resumeData, ...drafts } as ResumeData)

  /**
   * 将简历数据持久化到后端。
   * @param data 可选；不传则用当前 resumeData，传则用合并后的数据（用于 Save Changes 时带上草稿）
   * @returns 是否保存成功
   */
  const saveResume = async (data?: ResumeData): Promise<boolean> => {
    if (!resumeId) {
      toast.error('简历 ID 不存在，无法保存')
      return false
    }
    const toSave = data ?? resumeData
    try {
      const updatedResumeData = structuredClone(toSave) as ResumeData
      // remove image from updatedResumeData
      // 原因：JSON吞不下文件，如果image是一个File或者Blob对象，JSON解析后会变成一个空对象
      if (typeof toSave.personal_info.image === 'object') {
        delete updatedResumeData.personal_info.image
      }
      // FormData可以携带string和二进制文件
      const formData = new FormData()
      formData.append('resumeId', resumeId)
      formData.append('resumeData', JSON.stringify(updatedResumeData))
      if (removeBackground) formData.append('removeBackground', 'yes')
      if (typeof toSave.personal_info.image === 'object' && toSave.personal_info.image instanceof File) {
        formData.append('image', toSave.personal_info.image)
      }
      const { data: res } = await api.put('/api/resumes/update', formData, { headers: { Authorization: `Bearer ${token}` } })
      setResumeData(normalizeResumeForUI(res.resume))
      toast.success(res.message)
      return true
    } catch (error) {
      const message = axios.isAxiosError(error) ? (error.response?.data?.message ?? error.message) : (error instanceof Error ? error.message : 'Request failed')
      toast.error(message)
      return false
    }
  }

  const discardDraftField = <K extends keyof ResumeDrafts>(key: K) => {
    setDrafts(prev => {
      const copy = { ...prev }
      delete copy[key]
      return copy
    })
  }

  // 每个 section 离开时要丢弃的草稿字段
  const sectionDraftKeys: Record<string, Array<keyof ResumeDrafts>> = {
    personal: ['personal_info'],
    summary: ['professional_summary'],
    experience: ['experience'],
    education: ['education'],
    projects: ['project'],
    skills: ['skills'],
  }

  const switchSection = (nextIndex: number) => {
    if (nextIndex === activeSectionIndex) return
    const currentSectionId = sections[activeSectionIndex].id
    const keys = sectionDraftKeys[currentSectionId] ?? []
    keys.forEach((key) => discardDraftField(key))
    setactiveSectionIndex(nextIndex)
  }


  const activeSectionDraftKeys = sectionDraftKeys[activeSection.id] ?? []
  const hasDraftInActiveSection = activeSectionDraftKeys.some((key) => drafts[key] !== undefined)






  /** Save Changes 按钮：先合并草稿再上传到数据库，成功则清空当前 section 草稿 */
  const handleSaveChanges = async () => {
    const merged = getMergedResumeData()
    setIsSaving(true)
    try {
      const ok = await saveResume(merged)
      if (ok) {
        activeSectionDraftKeys.forEach((key) => discardDraftField(key))
      }
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    if (!resumeId) return
    loadExistingResume(resumeId)
  }, [resumeId])

  const previewData: ResumeData = {
    ...resumeData,
    ...drafts,
  }

  return (
    <ActiveSectionContext.Provider value={activeSection.id}>
      <div>
        <div className='max-w-7xl mx-auto px-4 py-7'>
          {/* inline-flex 设置为行内块元素，通常用于按钮的文字和icon一起需要同行显示时 */}
          <Link to={`/app`} className='inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-all'>
            <ArrowLeftIcon className='size-4' />Back to Dashboard
          </Link>
        </div>
        <div className='max-w-7xl mx-auto px-4 py-7'>
          <div className='grid lg:grid-cols-12 gap-8'>
            {/* Lefr Panel - Form */}
            {/* lg:col-span-5 在大屏上占据5/12 */}
            {/* overflow-hidden，超出的隐藏，可以适配圆角 */}
            <div className='relative lg:col-span-5 rounded-lg overflow-hidden'>
              <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-5 pt-1'>

                {/* progress bar using activeSectionIndex */}
                <hr className="absolute top-0 left-0 right-0 border-2 border-gray-200" />
                <hr className="absolute top-0 left-0  h-1 bg-gradient-to-r from-green-500 to-green-600 border-none transition-all duration-2000" style={{ width: `${activeSectionIndex * 100 / (sections.length - 1)}%` }} />
                {/* Section Navigation */}
                <div className='flex items-center '>
                  <div className='flex items-center justify-between my-3  border-gray-300 gap-2'>
                    <TemplateSelector selectedTemplate={resumeData.template} setTemplate={(template) => setResumeData(prev => ({ ...prev, template: template }))} isOpen={activeDropdown === 'template'} setIsOpen={(open) => setActiveDropdown(open ? 'template' : null)} />
                    <ColorSeclector selectedColor={resumeData.accent_color} setColor={(color) => setResumeData(prev => ({ ...prev, accent_color: color }))} isOpen={activeDropdown === 'color'} setIsOpen={(open) => setActiveDropdown(open ? 'color' : null)} />
                  </div>
                  {/* ml-auto可以吃掉所有剩余的空间用作左外边距，可用来实现推到底(右)端 */}
                  <div className='ml-auto flex items-center gap-1 '>
                    {activeSectionIndex !== 0 ? (
                      <button onClick={() => switchSection(Math.max(activeSectionIndex - 1, 0))} className=' flex items-center gap-1 p-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all' disabled={activeSectionIndex === 0}>
                        <ChevronLeft className='size-4' />Previous
                      </button>
                    ) : null}
                    <button onClick={() => switchSection(Math.min(activeSectionIndex + 1, sections.length - 1))} className={`flex items-center gap-1 p-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all ${activeSectionIndex === sections.length - 1 && 'opacity-50'}`} disabled={activeSectionIndex === sections.length - 1}>
                      Next
                      <ChevronRight className='size-4' />
                    </button>
                  </div>
                </div>
                <hr className='border border-gray-200  mb-2' />
                {/* Form */}
                <div className='space-y-6'>
                  <Suspense fallback={<div className='text-sm text-slate-500 py-3'>分区内容加载中...</div>}>
                    {activeSection.id === 'personal' && (
                      <PersonalInfoForm
                        data={drafts.personal_info ?? resumeData.personal_info}
                        onChange={(data) => setDraftField('personal_info', data)}
                        removeBackground={removeBackground}
                        setRemoveBackground={setremoveBackground}
                      />
                    )}
                    {activeSection.id === 'summary' && (
                      <ProfessionSummaryForm
                        summary={drafts.professional_summary ?? resumeData.professional_summary}
                        onSummaryChange={(summary) => setDraftField('professional_summary', summary)}
                        setResumeData={(next) => setResumeData(next)}
                      />
                    )}
                    {activeSection.id === 'experience' && (
                      <ExperienceForm
                        data={drafts.experience ?? resumeData.experience}
                        setExperience={(updater) =>
                          setDraftFieldWithUpdater('experience', updater, resumeData.experience)
                        }
                      />
                    )}
                    {activeSection.id === 'education' && (
                      <EducationForm
                        data={drafts.education ?? resumeData.education}
                        setEducation={(updater) =>
                          setDraftFieldWithUpdater('education', updater, resumeData.education)
                        }
                      />
                    )}
                    {activeSection.id === 'projects' && (
                      <ProjectForm
                        data={drafts.project ?? resumeData.project}
                        setProject={(updater) =>
                          setDraftFieldWithUpdater('project', updater, resumeData.project)
                        }
                      />
                    )}
                    {activeSection.id === 'skills' && (
                      <SkillsForm
                        data={drafts.skills ?? resumeData.skills}
                        setSkills={(updater) =>
                          setDraftFieldWithUpdater('skills', updater, resumeData.skills)
                        }
                      />
                    )}
                  </Suspense>
                  <button
                    className='w-full h-11 bg-gradient-to-br from-green-100 to-green-200 border border-green-300 text-green-600 hover:ring transition-all px-4 py-1.5 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed'
                    onClick={handleSaveChanges}
                    disabled={!hasDraftInActiveSection || isSaving}
                    type='button'
                  >
                    {isSaving ? '保存中…' : '保存更改'}
                  </button>
                </div>


              </div>

            </div>
            {/* Right Panel - Preview */}
            <div className='lg:col-span-7 max-lg:mt-6'>
              {/* resume preview */}
              <ResumePreview data={previewData} template={resumeData.template} accentColor={resumeData.accent_color} classes='' />

            </div>
          </div>
        </div>

      </div>
    </ActiveSectionContext.Provider>
  )
}
export default ResumeBuilder
