import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

// 구직자 프로필 타입
export interface JobseekerProfile {
  id?: number
  name: string
  email: string
  phone: string
  birthDate: string
  address: string
  education: string
  preferredRegion: string
  preferredDistrict: string
  preferredDong: string
  workDuration: string
  workDays: string
  workTime: string
  strengths: string[]
  mbti: string
  introduction: string
  licenses: License[]
  experience: Experience[]
  physicalAttributes: PhysicalAttributes
  savedJobs: SavedJob[]
  appliedJobs: SavedJob[]
}

// 사업자 프로필 타입
export interface EmployerProfile {
  id?: number
  companyName: string
  email: string
  phone: string
  address: string
  businessNumber: string
  representativeName: string
  industry: string
  companySize: string
  description: string
}

export interface License {
  id: number
  name: string
  issueDate: string
  expiryDate: string
}

export interface Experience {
  id: number
  company: string
  position: string
  duration: string
  description: string
}

export interface PhysicalAttributes {
  muscleStrength: '상' | '중' | '하'
  height: number
  weight: number
}

export interface SavedJob {
  id: number
  title: string
  company: string
  location: string
  salary: string
  description: string
  type: string
  posted: string
}

interface UserContextType {
  // 구직자 프로필
  jobseekerProfile: JobseekerProfile | null
  setJobseekerProfile: (profile: JobseekerProfile | null) => void
  updateJobseekerProfile: (updates: Partial<JobseekerProfile>) => void
  
  // 사업자 프로필
  employerProfile: EmployerProfile | null
  setEmployerProfile: (profile: EmployerProfile | null) => void
  updateEmployerProfile: (updates: Partial<EmployerProfile>) => void
  
  // 자격증 관리
  addLicense: (license: Omit<License, 'id'>) => void
  updateLicense: (id: number, license: Partial<License>) => void
  removeLicense: (id: number) => void
  
  // 경력 관리
  addExperience: (experience: Omit<Experience, 'id'>) => void
  updateExperience: (id: number, experience: Partial<Experience>) => void
  removeExperience: (id: number) => void
  
  // 저장된 공고 관리
  addSavedJob: (job: SavedJob) => void
  removeSavedJob: (jobId: number) => void
  isJobSaved: (jobId: number) => boolean
  
  // 지원한 공고 관리
  addAppliedJob: (job: SavedJob) => void
  removeAppliedJob: (jobId: number) => void
  isJobApplied: (jobId: number) => boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

// 기본 구직자 프로필
const defaultJobseekerProfile: JobseekerProfile = {
  name: '김민준',
  email: 'minjun.kim@example.com',
  phone: '010-1234-5678',
  birthDate: '1995-05-15',
  address: '서울시 강남구 테헤란로 123',
  education: '대학(4년제)',
  preferredRegion: '서울',
  preferredDistrict: '강남구',
  preferredDong: '역삼동',
  workDuration: '1개월~3개월',
  workDays: '월~금',
  workTime: '오후 파트타임(12:00~18:00)',
  strengths: ['빠른 학습능력', '책임감', '성실함'],
  mbti: 'ENFP',
  introduction: '안녕하세요. 성실하고 책임감 있는 자세로 일할 수 있는 구직자입니다.',
  licenses: [
    { id: 1, name: '운전면허증', issueDate: '2015-03-20', expiryDate: '2025-03-20' },
    { id: 2, name: '포크레인 면허', issueDate: '2020-06-15', expiryDate: '2025-06-15' }
  ],
  experience: [
    { id: 1, company: 'ABC 물류', position: '물류직원', duration: '2년', description: '창고 관리 및 물류 배송 업무' }
  ],
  physicalAttributes: {
    muscleStrength: '중',
    height: 175,
    weight: 70
  },
  savedJobs: [],
  appliedJobs: []
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [jobseekerProfile, setJobseekerProfile] = useState<JobseekerProfile | null>(null)
  const [employerProfile, setEmployerProfile] = useState<EmployerProfile | null>(null)

  // localStorage에서 프로필 불러오기
  useEffect(() => {
    const savedJobseeker = localStorage.getItem('jobseekerProfile')
    if (savedJobseeker) {
      try {
        setJobseekerProfile(JSON.parse(savedJobseeker))
      } catch (e) {
        console.error('Failed to parse jobseeker profile:', e)
      }
    } else {
      // 기본 프로필 설정
      setJobseekerProfile(defaultJobseekerProfile)
      localStorage.setItem('jobseekerProfile', JSON.stringify(defaultJobseekerProfile))
    }

    const savedEmployer = localStorage.getItem('employerProfile')
    if (savedEmployer) {
      try {
        setEmployerProfile(JSON.parse(savedEmployer))
      } catch (e) {
        console.error('Failed to parse employer profile:', e)
      }
    }
  }, [])

  // 프로필 변경 시 localStorage에 저장
  useEffect(() => {
    if (jobseekerProfile) {
      localStorage.setItem('jobseekerProfile', JSON.stringify(jobseekerProfile))
    }
  }, [jobseekerProfile])

  useEffect(() => {
    if (employerProfile) {
      localStorage.setItem('employerProfile', JSON.stringify(employerProfile))
    }
  }, [employerProfile])

  // 구직자 프로필 업데이트
  const updateJobseekerProfile = (updates: Partial<JobseekerProfile>) => {
    if (jobseekerProfile) {
      setJobseekerProfile({ ...jobseekerProfile, ...updates })
    }
  }

  // 사업자 프로필 업데이트
  const updateEmployerProfile = (updates: Partial<EmployerProfile>) => {
    if (employerProfile) {
      setEmployerProfile({ ...employerProfile, ...updates })
    }
  }

  // 자격증 관리
  const addLicense = (license: Omit<License, 'id'>) => {
    if (!jobseekerProfile) return
    
    const newId = Math.max(0, ...jobseekerProfile.licenses.map(l => l.id)) + 1
    const newLicense: License = { ...license, id: newId }
    setJobseekerProfile({
      ...jobseekerProfile,
      licenses: [...jobseekerProfile.licenses, newLicense]
    })
  }

  const updateLicense = (id: number, updates: Partial<License>) => {
    if (!jobseekerProfile) return
    
    setJobseekerProfile({
      ...jobseekerProfile,
      licenses: jobseekerProfile.licenses.map(license =>
        license.id === id ? { ...license, ...updates } : license
      )
    })
  }

  const removeLicense = (id: number) => {
    if (!jobseekerProfile) return
    
    setJobseekerProfile({
      ...jobseekerProfile,
      licenses: jobseekerProfile.licenses.filter(license => license.id !== id)
    })
  }

  // 경력 관리
  const addExperience = (experience: Omit<Experience, 'id'>) => {
    if (!jobseekerProfile) return
    
    const newId = Math.max(0, ...jobseekerProfile.experience.map(e => e.id)) + 1
    const newExperience: Experience = { ...experience, id: newId }
    setJobseekerProfile({
      ...jobseekerProfile,
      experience: [...jobseekerProfile.experience, newExperience]
    })
  }

  const updateExperience = (id: number, updates: Partial<Experience>) => {
    if (!jobseekerProfile) return
    
    setJobseekerProfile({
      ...jobseekerProfile,
      experience: jobseekerProfile.experience.map(exp =>
        exp.id === id ? { ...exp, ...updates } : exp
      )
    })
  }

  const removeExperience = (id: number) => {
    if (!jobseekerProfile) return
    
    setJobseekerProfile({
      ...jobseekerProfile,
      experience: jobseekerProfile.experience.filter(exp => exp.id !== id)
    })
  }

  // 저장된 공고 관리
  const addSavedJob = (job: SavedJob) => {
    if (!jobseekerProfile) return
    
    if (!jobseekerProfile.savedJobs.find(j => j.id === job.id)) {
      setJobseekerProfile({
        ...jobseekerProfile,
        savedJobs: [...jobseekerProfile.savedJobs, job]
      })
    }
  }

  const removeSavedJob = (jobId: number) => {
    if (!jobseekerProfile) return
    
    setJobseekerProfile({
      ...jobseekerProfile,
      savedJobs: jobseekerProfile.savedJobs.filter(job => job.id !== jobId)
    })
  }

  const isJobSaved = (jobId: number): boolean => {
    return jobseekerProfile?.savedJobs.some(job => job.id === jobId) ?? false
  }

  // 지원한 공고 관리
  const addAppliedJob = (job: SavedJob) => {
    if (!jobseekerProfile) return
    
    if (!jobseekerProfile.appliedJobs.find(j => j.id === job.id)) {
      setJobseekerProfile({
        ...jobseekerProfile,
        appliedJobs: [...jobseekerProfile.appliedJobs, job]
      })
    }
  }

  const removeAppliedJob = (jobId: number) => {
    if (!jobseekerProfile) return
    
    setJobseekerProfile({
      ...jobseekerProfile,
      appliedJobs: jobseekerProfile.appliedJobs.filter(job => job.id !== jobId)
    })
  }

  const isJobApplied = (jobId: number): boolean => {
    return jobseekerProfile?.appliedJobs.some(job => job.id === jobId) ?? false
  }

  return (
    <UserContext.Provider
      value={{
        jobseekerProfile,
        setJobseekerProfile,
        updateJobseekerProfile,
        employerProfile,
        setEmployerProfile,
        updateEmployerProfile,
        addLicense,
        updateLicense,
        removeLicense,
        addExperience,
        updateExperience,
        removeExperience,
        addSavedJob,
        removeSavedJob,
        isJobSaved,
        addAppliedJob,
        removeAppliedJob,
        isJobApplied
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

