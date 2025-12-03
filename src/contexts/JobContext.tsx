import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { apiCall } from '../utils/api'

export interface Job {
  id: number
  title: string
  category?: string
  company: string
  location: string
  salary: string
  description: string
  type: string
  posted: string
  status?: string
  applicants?: number
  views?: number
  postedDate?: string
  deadline?: string
  requirements?: string[]
  benefits?: string[]
  workHours?: string
  workDays?: string
  suitability?: number
  gender?: string
  age?: string
  education?: string
}

interface JobContextType {
  // 일자리 목록
  jobs: Job[]
  setJobs: (jobs: Job[]) => void
  fetchJobs: () => Promise<void>
  
  // 일자리 CRUD
  addJob: (job: Omit<Job, 'id'>) => void
  updateJob: (id: number, updates: Partial<Job>) => void
  deleteJob: (id: number) => void
  getJob: (id: number) => Job | undefined
  
  // 검색 및 필터
  searchQuery: string
  setSearchQuery: (query: string) => void
  statusFilter: string
  setStatusFilter: (status: string) => void
  locationFilter: string
  setLocationFilter: (location: string) => void
  salaryFilter: string
  setSalaryFilter: (salary: string) => void
  typeFilter: string
  setTypeFilter: (type: string) => void
  
  // 필터링된 일자리 목록
  filteredJobs: Job[]
  
  // 통계
  getJobStats: () => {
    total: number
    active: number
    closed: number
    totalApplicants: number
    totalViews: number
  }
}

const JobContext = createContext<JobContextType | undefined>(undefined)

export function JobProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('전체 상태')
  const [locationFilter, setLocationFilter] = useState('전체')
  const [salaryFilter, setSalaryFilter] = useState('전체')
  const [typeFilter, setTypeFilter] = useState('전체')

  // 공고 목록 새로고침 함수
  const fetchJobs = async () => {
    const employerId = localStorage.getItem('userId')
    const userType = localStorage.getItem('userType')
    console.log('🔍 Fetching jobs for employerId:', employerId, 'userType:', userType)
    
    if (!employerId) {
      console.log('❌ No employerId found in localStorage')
      return
    }

    if (userType !== 'EMPLOYER' && userType !== 'employer') {
      console.log('⚠️ User is not an employer, skipping job fetch')
      return
    }

    try {
      const url = `/api/employer/jobs/${employerId}`
      console.log('📡 Fetching from:', url)
      
      const data = await apiCall(url, { method: 'GET' })
      console.log('✅ Jobs fetched successfully:', data)
      console.log('📊 Number of jobs:', Array.isArray(data) ? data.length : 'not an array')
      
      if (Array.isArray(data)) {
        // Map backend raw status + deadline to an effective status for UI.
        const statusMap: { [key: string]: string } = {
          'ACTIVE': '진행중',
          'CLOSED': '마감',
          'PENDING': '대기'
        }

        const isPastDeadline = (deadline?: string) => {
          if (!deadline) return false
          const d = new Date(deadline)
          if (isNaN(d.getTime())) return false
          const today = new Date()
          d.setHours(0, 0, 0, 0)
          today.setHours(0, 0, 0, 0)
          return d.getTime() < today.getTime()
        }

        const transformed = data.map((job: any) => {
          const rawStatus = job.status
          let effectiveStatus = rawStatus
          if (rawStatus === 'ACTIVE' && isPastDeadline(job.deadline)) {
            effectiveStatus = 'CLOSED'
          }

          return {
            ...job,
            _rawStatus: rawStatus,
            status: statusMap[effectiveStatus] || effectiveStatus,
            views: job.views || 0,
            applicants: job.applicants || 0,
            postedDate: job.postedDate || job.posted || ''
          }
        })

        setJobs(transformed)
        if (data.length === 0) {
          console.log('⚠️ Backend returned empty array - no jobs found for this employer')
        }
      } else {
        console.error('❌ Invalid data format:', data)
        setJobs([])
      }
    } catch (error) {
      console.error('❌ Error fetching jobs:', error)
      setJobs([])
    }
  }

  // 백엔드에서 일자리 목록 불러오기 (초기 로드)
  useEffect(() => {
    fetchJobs()
  }, [])

  // 일자리 변경 시 localStorage에 저장 (제거 - 백엔드 사용)
  // useEffect(() => {
  //   if (jobs.length > 0) {
  //     localStorage.setItem('employerJobs', JSON.stringify(jobs))
  //   }
  // }, [jobs])

  // 일자리 추가
  const addJob = (jobData: Omit<Job, 'id'>) => {
    const newId = Math.max(0, ...jobs.map(j => j.id)) + 1
    const newJob: Job = {
      ...jobData,
      id: newId,
      status: jobData.status || '진행중',
      applicants: jobData.applicants || 0,
      views: jobData.views || 0,
      postedDate: jobData.postedDate || new Date().toISOString().split('T')[0]
    }
    setJobs([...jobs, newJob])
  }

  // 일자리 업데이트
  const updateJob = (id: number, updates: Partial<Job>) => {
    setJobs(jobs.map(job => (job.id === id ? { ...job, ...updates } : job)))
  }

  // 일자리 삭제
  const deleteJob = async (id: number) => {
    try {
      await apiCall(`/api/employer/jobs/${id}`, { method: 'DELETE' })
      setJobs(jobs.filter(job => job.id !== id))
      alert('공고가 삭제되었습니다.')
    } catch (error) {
      console.error('Error deleting job:', error)
      alert('공고 삭제에 실패했습니다.')
    }
  }

  // 일자리 조회
  const getJob = (id: number): Job | undefined => {
    return jobs.find(job => job.id === id)
  }

  // 필터링된 일자리 목록
  const filteredJobs = jobs.filter(job => {
    // 검색어 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = 
        job.title.toLowerCase().includes(query) ||
        job.company.toLowerCase().includes(query) ||
        job.location.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query)
      if (!matchesSearch) return false
    }

    // 상태 필터 (백엔드 ACTIVE/CLOSED와 프론트 한글 매칭)
    if (statusFilter !== '전체 상태') {
      const statusMap: { [key: string]: string[] } = {
        '진행중': ['ACTIVE', '진행중'],
        '마감': ['CLOSED', '마감'],
        '대기': ['대기']
      }
      const matchingStatuses = statusMap[statusFilter] || [statusFilter]
      // job.status here is the UI-friendly (Korean) status after transformation
      if (!matchingStatuses.includes(job.status || '')) {
        return false
      }
    }

    // 위치 필터
    if (locationFilter !== '전체' && !job.location.includes(locationFilter)) {
      return false
    }

    // 급여 필터
    if (salaryFilter !== '전체') {
      // 급여 필터 로직 (간단한 예시)
      if (salaryFilter === '시급' && !job.salary.includes('시급')) return false
      if (salaryFilter === '월급' && !job.salary.includes('월')) return false
    }

    // 타입 필터
    if (typeFilter !== '전체' && job.type !== typeFilter) {
      return false
    }

    return true
  })

  // 통계
  const getJobStats = () => {
    return {
      total: jobs.length,
      active: jobs.filter(j => j.status === '진행중').length,
      closed: jobs.filter(j => j.status === '마감').length,
      totalApplicants: jobs.reduce((sum, j) => sum + (j.applicants || 0), 0),
      totalViews: jobs.reduce((sum, j) => sum + (j.views || 0), 0)
    }
  }

  return (
    <JobContext.Provider
      value={{
        jobs,
        setJobs,
        fetchJobs,
        addJob,
        updateJob,
        deleteJob,
        getJob,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        locationFilter,
        setLocationFilter,
        salaryFilter,
        setSalaryFilter,
        typeFilter,
        setTypeFilter,
        filteredJobs,
        getJobStats
      }}
    >
      {children}
    </JobContext.Provider>
  )
}

export function useJob() {
  const context = useContext(JobContext)
  if (context === undefined) {
    throw new Error('useJob must be used within a JobProvider')
  }
  return context
}

