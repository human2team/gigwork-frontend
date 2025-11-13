import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

export interface Application {
  id: number
  applicantName: string
  jobTitle: string
  jobId: number
  email: string
  phone: string
  appliedDate: string
  status: '대기' | '합격' | '불합격'
  suitability: number
  // 지원자 상세 정보 (선택적)
  personalInfo?: {
    name: string
    email: string
    phone: string
    birthDate: string
    gender?: string
    address: string
    education: string
    preferredRegion?: string
    preferredDistrict?: string
    preferredDong?: string
    workDuration?: string
    workDays?: string
    workTime?: string
    mbti?: string
    introduction?: string
    strengths?: string[]
  }
  licenses?: Array<{
    id: number
    name: string
    issueDate: string
    expiryDate: string | null
  }>
  experiences?: Array<{
    id: number
    company: string
    position: string
    startDate: string
    endDate: string
    description: string
  }>
  physicalAttributes?: {
    muscleStrength: '상' | '중' | '하'
    height: number
    weight: number
  }
}

interface ApplicationContextType {
  // 지원자 목록
  applications: Application[]
  setApplications: (applications: Application[]) => void
  
  // 로딩 및 에러 상태
  loading: boolean
  error: Error | null
  setError: (error: Error | null) => void
  
  // 지원자 CRUD
  addApplication: (application: Omit<Application, 'id'>) => void
  updateApplication: (id: number, updates: Partial<Application>) => void
  deleteApplication: (id: number) => void
  getApplication: (id: number) => Application | undefined
  getApplicationsByJobId: (jobId: number) => Application[]
  
  // 상태 변경
  updateApplicationStatus: (id: number, status: '대기' | '합격' | '불합격') => Promise<void>
  
  // 필터
  statusFilter: string
  setStatusFilter: (status: string) => void
  jobFilter: string
  setJobFilter: (jobId: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  
  // 필터링된 지원자 목록
  filteredApplications: Application[]
  
  // 통계
  getApplicationStats: () => {
    total: number
    pending: number
    accepted: number
    rejected: number
    averageSuitability: number
  }
}

const ApplicationContext = createContext<ApplicationContextType | undefined>(undefined)

export function ApplicationProvider({ children }: { children: ReactNode }) {
  const [applications, setApplications] = useState<Application[]>([])
  const [statusFilter, setStatusFilter] = useState('전체')
  const [jobFilter, setJobFilter] = useState('전체')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // 백엔드에서 지원자 목록 불러오기
  useEffect(() => {
    const loadApplications = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // jobFilter가 설정되어 있으면 해당 공고의 지원자만 조회
        if (jobFilter !== '전체') {
          console.log('🔍 Fetching applicants for job:', jobFilter)
          
          // 공고 정보는 /api/employer/jobs에서 가져온 것을 사용
          // ApplicationContext는 jobTitle을 직접 조회하지 않고, Applications 컴포넌트에서 전달받음
          let jobTitle = ''
          
          const response = await fetch(`/api/jobseeker/applications/job/${jobFilter}`)
          
          if (response.ok) {
            const applicants = await response.json()
            console.log('✅ Applicants fetched:', applicants)
            
            // ApplicantResponse -> Application 형식 변환
            const convertedApplications = applicants.map((applicant: any) => ({
              id: applicant.applicationId,
              applicantName: applicant.name,
              jobTitle: jobTitle, // 조회한 공고 제목 사용
              jobId: parseInt(jobFilter),
              email: applicant.email || '',
              phone: applicant.phone || '',
              appliedDate: applicant.appliedDateFormatted || new Date(applicant.appliedDate).toLocaleDateString('ko-KR'),
              status: applicant.status === 'PENDING' ? '대기' : applicant.status === 'ACCEPTED' ? '합격' : '불합격',
              suitability: applicant.suitability || 0,
              personalInfo: {
                name: applicant.name,
                email: applicant.email || '',
                phone: applicant.phone || '',
                birthDate: applicant.birthDate ? new Date(applicant.birthDate).toLocaleDateString('ko-KR') : '',
                gender: applicant.gender || '',
                address: applicant.address || '',
                education: applicant.education || '',
                preferredRegion: applicant.preferredRegion || '',
                preferredDistrict: applicant.preferredDistrict || '',
                preferredDong: applicant.preferredDong || '',
                workDuration: applicant.workDuration || '',
                workDays: applicant.workDays || '',
                workTime: applicant.workTime || '',
                mbti: applicant.mbti || '',
                introduction: applicant.introduction || '',
                strengths: applicant.strengths ? applicant.strengths.split(',').map((s: string) => s.trim()) : []
              },
              licenses: applicant.licenses && applicant.licenses.length > 0 ? applicant.licenses.map((license: any) => ({
                id: license.id,
                name: license.name,
                issueDate: license.issueDate ? new Date(license.issueDate).toLocaleDateString('ko-KR') : '',
                expiryDate: license.expiryDate ? new Date(license.expiryDate).toLocaleDateString('ko-KR') : null
              })) : [],
              experiences: applicant.experiences && applicant.experiences.length > 0 ? applicant.experiences.map((exp: any) => ({
                id: exp.id,
                company: exp.company,
                position: exp.position,
                startDate: exp.startDate || '',
                endDate: exp.endDate || '',
                description: exp.description || ''
              })) : [],
              physicalAttributes: applicant.height || applicant.weight ? {
                muscleStrength: applicant.muscleStrength === 'HIGH' ? '상' : applicant.muscleStrength === 'MEDIUM' ? '중' : '하',
                height: applicant.height || 0,
                weight: applicant.weight || 0
              } : undefined
            }))
            
            setApplications(convertedApplications)
          } else {
            console.error('❌ Failed to fetch applicants:', response.status)
            setApplications([])
          }
        } else {
          // jobFilter가 없으면 빈 배열 (모든 공고의 지원자 조회는 별도 구현 필요)
          setApplications([])
        }
      } catch (e) {
        const error = e instanceof Error ? e : new Error('지원자 목록을 불러오는 중 오류가 발생했습니다.')
        console.error('Failed to load applications:', error)
        setError(error)
        setApplications([])
      } finally {
        setLoading(false)
      }
    }

    loadApplications()
  }, [jobFilter])

  // 더 이상 localStorage에 저장하지 않음 (백엔드 사용)

  // 지원자 추가
  const addApplication = (applicationData: Omit<Application, 'id'>) => {
    const newId = Math.max(0, ...applications.map(a => a.id)) + 1
    const newApplication: Application = {
      ...applicationData,
      id: newId,
      status: applicationData.status || '대기'
    }
    setApplications([...applications, newApplication])
  }

  // 지원자 업데이트
  const updateApplication = (id: number, updates: Partial<Application>) => {
    setApplications(
      applications.map(app => (app.id === id ? { ...app, ...updates } : app))
    )
  }

  // 지원자 삭제
  const deleteApplication = (id: number) => {
    setApplications(applications.filter(app => app.id !== id))
  }

  // 지원자 조회
  const getApplication = (id: number): Application | undefined => {
    return applications.find(app => app.id === id)
  }

  // 일자리별 지원자 조회
  const getApplicationsByJobId = (jobId: number): Application[] => {
    return applications.filter(app => app.jobId === jobId)
  }

  // 상태 변경
  const updateApplicationStatus = async (id: number, status: '대기' | '합격' | '불합격') => {
    try {
      // 백엔드 API 호출
      const response = await fetch(`http://localhost:8080/api/jobseeker/applications/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '상태 업데이트에 실패했습니다.')
      }

      // 성공 시 로컬 상태도 업데이트
      updateApplication(id, { status })
    } catch (error) {
      console.error('상태 업데이트 오류:', error)
      alert(error instanceof Error ? error.message : '상태 업데이트에 실패했습니다.')
    }
  }

  // 필터링된 지원자 목록
  const filteredApplications = applications.filter(app => {
    // 상태 필터
    if (statusFilter !== '전체' && app.status !== statusFilter) {
      return false
    }

    // 일자리 필터
    if (jobFilter !== '전체' && app.jobId !== Number(jobFilter)) {
      return false
    }

    // 검색어 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        app.applicantName.toLowerCase().includes(query) ||
        app.jobTitle.toLowerCase().includes(query) ||
        app.email.toLowerCase().includes(query) ||
        app.phone.includes(query)
      if (!matchesSearch) return false
    }

    return true
  })

  // 통계
  const getApplicationStats = () => {
    const total = applications.length
    const pending = applications.filter(a => a.status === '대기').length
    const accepted = applications.filter(a => a.status === '합격').length
    const rejected = applications.filter(a => a.status === '불합격').length
    const averageSuitability =
      applications.length > 0
        ? applications.reduce((sum, a) => sum + a.suitability, 0) / applications.length
        : 0

    return {
      total,
      pending,
      accepted,
      rejected,
      averageSuitability: Math.round(averageSuitability * 10) / 10
    }
  }

  return (
    <ApplicationContext.Provider
      value={{
        applications,
        setApplications,
        loading,
        error,
        setError,
        addApplication,
        updateApplication,
        deleteApplication,
        getApplication,
        getApplicationsByJobId,
        updateApplicationStatus,
        statusFilter,
        setStatusFilter,
        jobFilter,
        setJobFilter,
        searchQuery,
        setSearchQuery,
        filteredApplications,
        getApplicationStats
      }}
    >
      {children}
    </ApplicationContext.Provider>
  )
}

export function useApplication() {
  const context = useContext(ApplicationContext)
  if (context === undefined) {
    throw new Error('useApplication must be used within an ApplicationProvider')
  }
  return context
}

