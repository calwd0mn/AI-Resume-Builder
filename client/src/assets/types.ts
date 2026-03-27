// types.ts
export const EMPTY_RESUME_DATA: ResumeData = {
    id: '',
    userId: '',
    title: '',
    public: false,
    personal_info: {
        full_name: '',
        email: '',
        phone: '',
        location: '',
        profession: '',
        image: null,
        job_intention: '前端工程师',
    },
    professional_summary: '',
    skills: [],
    experience: [],
    education: [],
    project: [],
    template: 'classic',
    accent_color: '#3B82F6',
    updatedAt: '',
    createdAt: '',
}


export interface Experience {
    company: string;
    position: string;
    start_date: string;
    end_date: string;
    description: string;
    is_current: boolean;
    id: string;
}

export interface Education {
    institution: string;
    degree: string;
    field: string;
    graduation_date: string;
    gpa?: string;
    id: string;
}

export interface Project {
    name: string;
    type: string;
    description: string;
    id: string;
}

export interface ResumeData {
    id: string;
    userId: string;
    title: string;
    public: boolean;
    personal_info: {
        full_name: string;
        email: string;
        phone: string;
        location: string;
        profession: string;
        image: any;
        gender?: string;
        age?: number;
        political_status?: string;
        job_intention: string;
        website?: string;
        linkedin?: string;
    };
    professional_summary: string;
    skills: string[];
    experience: Experience[];
    education: Education[];
    project: Project[];
    template: string;
    accent_color: string;
    updatedAt: string;
    createdAt: string;
}