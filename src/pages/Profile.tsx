import { useState, useEffect } from 'react'
import { useUser } from '../contexts/UserContext'
import type { JobseekerProfile } from '../contexts/UserContext'
import { useNavigate } from 'react-router-dom'
import { User, Award, Briefcase, Activity, Plus, X, Save, Edit2, Trash2, RotateCcw, Bookmark, MapPin, DollarSign, ArrowRight, CheckCircle, ChevronDown, GraduationCap, Mail, Phone, Calendar, Home, Users, Star, MessageSquare } from 'lucide-react'
import { apiCall, getErrorMessage, getApiBaseUrl } from '../utils/api'
import JobseekerProposals from './JobseekerProposals'

type ProfileTab = 'personal' | 'licenses' | 'experience' | 'physical' | 'saved' | 'applied' | 'proposals'

type SavedJob = {
  id: number
  title: string
  company: string
  location: string
  salary: string
  description: string
  type: string
  posted: string
  postingStatus?: string
  deadline?: string
}

type AppliedJob = {
  id: number
  applicationId: number
  title: string
  company: string
  location: string
  salary: string
  description: string
  type: string
  posted: string
  status: string
  postingStatus?: string
  deadline?: string
}

type License = {
  id: number
  name: string
  issueDate: string
  expiryDate: string
}

type Experience = {
  id: number
  company: string
  position: string
  startDate: string
  endDate: string
  description: string
}

// 지역 선택을 OpenAPI로 가져오기 위한 타입
type RegionItem = { code: string; name: string; sido?: string; sgg?: string; umd?: string }
type DistrictItem = { code: string; name: string }
type DongItem = { code: string; name: string }

function Profile() {
  const { setJobseekerProfile } = useUser();
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<ProfileTab>('personal')
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [appliedJobs, setAppliedJobs] = useState<AppliedJob[]>([])
  
  // strengths 정규화 유틸
  const sanitizeStrengths = (value: any): string[] => {
    const toArray = (v: any): string[] => {
      if (!v) return []
      if (Array.isArray(v)) return v
      if (typeof v === 'string') return v.split(/[,;\n\r]+/)
      return []
    }
    const unique = new Set(
      toArray(value)
        .map((s) => (typeof s === 'string' ? s.trim() : ''))
        .filter((s) => !!s && strengthOptions.includes(s))
    )
    return Array.from(unique).slice(0, 3)
  }
  
  // 하드코딩된 지역/동 데이터는 제거되었습니다. OpenAPI 기반 데이터 사용

  // 강점 옵션
  const strengthOptions = [
    '빠른 학습능력', '책임감', '성실함', '적극적인 커뮤니케이션', '시간관리', 
    '팀워크', '문제해결능력', '인내심', '긍정적 마인드', '세심함',
    '리더십', '창의성', '협업능력', '빠른 대응', '정확성',
    '체력', '외국어 능력', '컴퓨터 활용능력', '고객 서비스', '다재다능함'
  ]

  // MBTI 옵션
  const mbtiOptions = [
    'ISTJ', 'ISFJ', 'INFJ', 'INTJ', 'ISTP', 'ISFP', 'INFP', 'INTP',
    'ESTP', 'ESFP', 'ENFP', 'ENTP', 'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'
  ]

  // 초기 개인정보 (초기화 시 사용)
  const initialPersonalInfo = {
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: '',
    address: '',
    education: '',
    preferredRegion: '전체',
    preferredDistrict: '전체',
    preferredDong: '전체',
    workDuration: '무관',
    workDays: '무관',
    workTime: '무관',
    strengths: [] as string[],
    mbti: '',
    introduction: '',
    muscleStrength: '중' as '상' | '중' | '하',
    height: 0,
    weight: 0
  }
  
  // 저장된 개인정보 (취소 시 복원용, 저장 시 업데이트됨)
  const [savedPersonalInfo, setSavedPersonalInfo] = useState(initialPersonalInfo)
  
  // 현재 편집 중인 개인정보
  const [personalInfo, setPersonalInfo] = useState(initialPersonalInfo)
  
  // 희망 업직종(카테고리) 선택 상태 및 로더
  type CategoryItem = { cd: string; nm: string }
  const [jobMainCats, setJobMainCats] = useState<CategoryItem[]>([])
  const [jobSubCatsByMain, setJobSubCatsByMain] = useState<Record<string, CategoryItem[]>>({})
  const [selectedJobMainCd, setSelectedJobMainCd] = useState<string>('')
  const [desiredJobSubcats, setDesiredJobSubcats] = useState<string[]>([]) // 소분류 이름 목록
  const [showJobPopup, setShowJobPopup] = useState(false)
  const ensureLoadMainCats = async () => {
    if (jobMainCats.length > 0) return
    try {
      const res = await fetch(`/api/categories?kind=01&depth=1`)
      if (res.ok) {
        const data: CategoryItem[] = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setJobMainCats(data)
          setSelectedJobMainCd(data[0].cd)
        }
      }
    } catch {}
  }
  const ensureLoadSubCats = async (mainCd: string) => {
    if (!mainCd) return
    if (jobSubCatsByMain[mainCd]) return
    try {
      const res = await fetch(`/api/categories?kind=01&depth=2&parent=${encodeURIComponent(mainCd)}`)
      if (res.ok) {
        const data: CategoryItem[] = await res.json()
        setJobSubCatsByMain(prev => ({ ...prev, [mainCd]: Array.isArray(data) ? data : [] }))
      } else {
        setJobSubCatsByMain(prev => ({ ...prev, [mainCd]: [] }))
      }
    } catch {
      setJobSubCatsByMain(prev => ({ ...prev, [mainCd]: [] }))
    }
  }
  
  // 프로필 로딩 상태
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  // 급여 표시 보조 함수: 시급/일급/월급 접두 + $공백 제거
  const formatSalaryLabel = (salary: any, salaryType?: any): string => {
    const raw = String(salary ?? '').replace(/\$\s+/g, '$').trim()
    const t = String(salaryType ?? '').toUpperCase()
    const hasKoreanLabel = /시급|일급|월급|연봉/.test(raw)

    const detectByType = (): string | '' => {
      if (!t) return ''
      if (t.includes('HOURLY') || t.includes('HOUR') || t.includes('시급')) return '시급'
      if (t.includes('DAILY') || t.includes('DAY') || t.includes('일급')) return '일급'
      if (t.includes('MONTH') || t.includes('MONTHLY') || t.includes('월급')) return '월급'
      if (t.includes('YEAR') || t.includes('ANNUAL') || t.includes('연봉')) return '연봉'
      return ''
    }

    const detectHeuristic = (): string | '' => {
      // 급여 문자열에 한글 라벨이 없고 타입도 없을 때 숫자 범위로 추정
      const num = parseInt(String(raw).replace(/[^0-9]/g, '') || '0', 10)
      if (!Number.isFinite(num) || num <= 0) return ''
      // 대략적 기준: < 100,000 시급, 100,000~999,999 일급, ≥ 1,000,000 월급
      if (num >= 1_000_000) return '월급'
      if (num >= 100_000) return '일급'
      return '시급'
    }

    const label =
      detectByType() ||
      (hasKoreanLabel ? '' : detectHeuristic())

    return label ? `${label} ${raw || '협의'}` : (raw || '협의')
  }
  
  // 프로필 불러오기
  useEffect(() => {
    const loadProfile = async () => {
      const userId = localStorage.getItem('userId')
      if (!userId) {
        alert('로그인이 필요합니다.')
        navigate('/login/jobseeker')
        return
      }
      setIsLoadingProfile(true)
      try {
        const response = await apiCall<JobseekerProfile>(`/api/jobseeker/profile/${userId}`, { method: 'GET' })
        // muscleStrength enum을 한글로 변환
        // muscleStrength, height, weight 등은 physicalAttributes에서 추출
        let strengthKorean: '상' | '중' | '하' = '중';
        if (response.physicalAttributes?.muscleStrength === '상') strengthKorean = '상';
        else if (response.physicalAttributes?.muscleStrength === '하') strengthKorean = '하';
        const respAny: any = response as any
        const profileData = {
          name: response.name || '',
          email: response.email || '',
          phone: response.phone || '',
          birthDate: response.birthDate || '',
          gender: respAny.gender || '',
          address: response.address || '',
          education: response.education || '',
          preferredRegion: response.preferredRegion || '전체',
          preferredDistrict: response.preferredDistrict || '전체',
          preferredDong: response.preferredDong || '전체',
          workDuration: response.workDuration || '무관',
          workDays: response.workDays || '무관',
          workTime: response.workTime || '무관',
          strengths: sanitizeStrengths(respAny.strengths),
          mbti: response.mbti || '',
          introduction: response.introduction || '',
          muscleStrength: strengthKorean,
          height: response.physicalAttributes?.height || 0,
          weight: response.physicalAttributes?.weight || 0
        };
        setPersonalInfo(profileData);
        setSavedPersonalInfo(profileData);
        // 희망 업직종 초기화 (백엔드에서 콤마 구분 문자열로 전달)
        if (respAny && respAny.desiredCategoryNames) {
          const arr = String(respAny.desiredCategoryNames).split(',').map((s: string) => s.trim()).filter(Boolean)
          setDesiredJobSubcats(arr)
        } else {
          setDesiredJobSubcats([])
        }
        const physicalInfo = {
          strength: strengthKorean,
          height: (response.physicalAttributes?.height ?? '') as number | '',
          weight: (response.physicalAttributes?.weight ?? '') as number | ''
        };
        setPhysicalData(physicalInfo);
        setSavedPhysicalData(physicalInfo);
        // UserContext에 프로필 저장 (id 등 포함)
        setJobseekerProfile(response);
      } catch (error) {
        console.error('프로필 로딩 실패:', error)
        const errorMessage = getErrorMessage(error)
        console.log('userId:', localStorage.getItem('userId'))
        console.log('에러 상세:', error)
        alert(`프로필을 불러오는데 실패했습니다.\n\n상세 오류: ${errorMessage}\n\n백엔드 서버(${getApiBaseUrl()})가 실행 중인지 확인해주세요.`)
      } finally {
        setIsLoadingProfile(false)
      }
    }
    loadProfile()
  }, [navigate, setJobseekerProfile])

  const [showRegionDropdown, setShowRegionDropdown] = useState(false)
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false)
  const [showDongDropdown, setShowDongDropdown] = useState(false)
  // OpenAPI 기반 지역 데이터 및 선택 코드
  const [regionsApi, setRegionsApi] = useState<RegionItem[]>([])
  const [districtsApi, setDistrictsApi] = useState<DistrictItem[]>([])
  const [dongsApi, setDongsApi] = useState<DongItem[]>([])
  const [selectedRegionCode, setSelectedRegionCode] = useState<string>('')
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<string>('')
  const [selectedDongCode, setSelectedDongCode] = useState<string>('')
  const [licenses, setLicenses] = useState<License[]>([])
  const [isLoadingLicenses, setIsLoadingLicenses] = useState(false)
  const [experience, setExperience] = useState<Experience[]>([])
  const [isLoadingExperiences, setIsLoadingExperiences] = useState(false)
  const [activeJobIds, setActiveJobIds] = useState<number[]>([])
  
  // 지역 API: 시/도 목록 로드
  useEffect(() => {
    const loadRegions = async () => {
      try {
        const res = await fetch('/api/regions')
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            const list = data.map((r: any) => ({
              code: r.code,
              name: r.name,
              sido: r.sido,
              sgg: r.sgg,
              umd: r.umd
            })) as RegionItem[]
            setRegionsApi(list)
          } else {
            setRegionsApi([])
          }
        } else {
          setRegionsApi([])
        }
      } catch {
        setRegionsApi([])
      }
    }
    loadRegions()
  }, [])

  // 선택된 시/도 코드에 따른 구/군 목록 로드
  useEffect(() => {
    if (!selectedRegionCode) {
      setDistrictsApi([])
      setSelectedDistrictCode('')
      setDongsApi([])
      setSelectedDongCode('')
      return
    }
    const loadDistricts = async () => {
      try {
        const res = await fetch(`/api/districts?region=${encodeURIComponent(selectedRegionCode)}`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) setDistrictsApi(data as DistrictItem[])
          else setDistrictsApi([])
        } else {
          setDistrictsApi([])
        }
      } catch {
        setDistrictsApi([])
      }
    }
    loadDistricts()
  }, [selectedRegionCode])

  // 선택된 구/군 코드에 따른 동 목록 로드
  useEffect(() => {
    if (!selectedDistrictCode) {
      setDongsApi([])
      setSelectedDongCode('')
      return
    }
    const loadDongs = async () => {
      try {
        const res = await fetch(`/api/dongs?district=${encodeURIComponent(selectedDistrictCode)}`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) setDongsApi(data as DongItem[])
          else setDongsApi([])
        } else {
          setDongsApi([])
        }
      } catch {
        setDongsApi([])
      }
    }
    loadDongs()
  }, [selectedDistrictCode])

  // 기존 저장된 personalInfo 값을 기반으로 초기 코드 매핑 시도
  useEffect(() => {
    // Region 초기 매핑
    if (!selectedRegionCode && personalInfo.preferredRegion && personalInfo.preferredRegion !== '전체' && regionsApi.length > 0) {
      const r = regionsApi.find(rg => rg.name === personalInfo.preferredRegion || rg.sido === personalInfo.preferredRegion)
      if (r) setSelectedRegionCode(r.code)
    }
  }, [regionsApi, personalInfo.preferredRegion, selectedRegionCode])

  useEffect(() => {
    // District 초기 매핑
    if (selectedRegionCode && !selectedDistrictCode && personalInfo.preferredDistrict && personalInfo.preferredDistrict !== '전체' && districtsApi.length > 0) {
      const d = districtsApi.find(di => di.name === personalInfo.preferredDistrict)
      if (d) setSelectedDistrictCode(d.code)
    }
  }, [districtsApi, personalInfo.preferredDistrict, selectedRegionCode, selectedDistrictCode])

  useEffect(() => {
    // Dong 초기 매핑
    if (selectedDistrictCode && !selectedDongCode && personalInfo.preferredDong && personalInfo.preferredDong !== '전체' && dongsApi.length > 0) {
      const dd = dongsApi.find(dg => dg.name === personalInfo.preferredDong)
      if (dd) setSelectedDongCode(dd.code)
    }
  }, [dongsApi, personalInfo.preferredDong, selectedDistrictCode, selectedDongCode])
  // 자격증 로드
  useEffect(() => {
    const loadLicenses = async () => {
      const userId = localStorage.getItem('userId')
      if (!userId) return
      
      setIsLoadingLicenses(true)
      try {
        const response = await apiCall<License[]>(`/api/jobseeker/licenses/${userId}`, {
          method: 'GET'
        })
        setLicenses(response)
      } catch (error) {
        console.error('자격증 로딩 실패:', error)
        setLicenses([]) // 에러 발생 시 빈 배열로 초기화
      } finally {
        setIsLoadingLicenses(false)
      }
    }
    
    loadLicenses()
  }, [])
  
  // 경력 로드
  useEffect(() => {
    const loadExperiences = async () => {
      const userId = localStorage.getItem('userId')
      if (!userId) return
      
      setIsLoadingExperiences(true)
      try {
        const response = await apiCall<Experience[]>(`/api/jobseeker/experiences/${userId}`, {
          method: 'GET'
        })
        setExperience(response)
      } catch (error) {
        console.error('경력 로딩 실패:', error)
      } finally {
        setIsLoadingExperiences(false)
      }
    }
    
    loadExperiences()
  }, [])
  
  // 자격증 관련 상태
  const [editingLicenseId, setEditingLicenseId] = useState<number | null>(null)
  const [isAddingLicense, setIsAddingLicense] = useState(false)
  const [newLicense, setNewLicense] = useState<Omit<License, 'id'>>({
    name: '',
    issueDate: '',
    expiryDate: ''
  })
  const [editingLicense, setEditingLicense] = useState<Omit<License, 'id'>>({
    name: '',
    issueDate: '',
    expiryDate: ''
  })
  
  // 경력 관련 상태
  const [editingExperienceId, setEditingExperienceId] = useState<number | null>(null)
  const [isAddingExperience, setIsAddingExperience] = useState(false)
  const [newExperience, setNewExperience] = useState<Omit<Experience, 'id'>>({
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    description: ''
  })
  const [editingExperience, setEditingExperience] = useState<Omit<Experience, 'id'>>({
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    description: ''
  })
  
  // 자격증 추가
  const handleAddLicense = async () => {
    if (!newLicense.name || !newLicense.issueDate || !newLicense.expiryDate) {
      alert('모든 필드를 입력해주세요.')
      return
    }
    
    const userId = localStorage.getItem('userId')
    if (!userId) {
      alert('로그인이 필요합니다.')
      return
    }
    
    try {
      const addedLicense = await apiCall<License>(`/api/jobseeker/licenses/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newLicense)
      })
      
      setLicenses([...licenses, addedLicense])
      setNewLicense({ name: '', issueDate: '', expiryDate: '' })
      setIsAddingLicense(false)
      alert('자격증이 추가되었습니다.')
    } catch (error) {
      console.error('자격증 추가 실패:', error)
      alert(getErrorMessage(error))
    }
  }
  
  // 자격증 수정 시작
  const handleStartEditLicense = (license: License) => {
    setEditingLicenseId(license.id)
    setEditingLicense({
      name: license.name,
      issueDate: license.issueDate,
      expiryDate: license.expiryDate
    })
  }
  
  // 자격증 수정 저장
  const handleSaveLicense = async (id: number) => {
    if (!editingLicense.name || !editingLicense.issueDate || !editingLicense.expiryDate) {
      alert('모든 필드를 입력해주세요.')
      return
    }
    
    try {
      const updatedLicense = await apiCall<License>(`/api/jobseeker/licenses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingLicense)
      })
      
      setLicenses(licenses.map(l => l.id === id ? updatedLicense : l))
      setEditingLicenseId(null)
      setEditingLicense({ name: '', issueDate: '', expiryDate: '' })
      alert('자격증이 수정되었습니다.')
    } catch (error) {
      console.error('자격증 수정 실패:', error)
      alert(getErrorMessage(error))
    }
  }
  
  // 자격증 삭제
  const handleDeleteLicense = async (id: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return
    }
    
    try {
      await apiCall(`/api/jobseeker/licenses/${id}`, {
        method: 'DELETE'
      })
      
      setLicenses(licenses.filter(l => l.id !== id))
      alert('자격증이 삭제되었습니다.')
    } catch (error) {
      console.error('자격증 삭제 실패:', error)
      alert(getErrorMessage(error))
    }
  }
  
  // 경력 추가
  const handleAddExperience = async () => {
    if (!newExperience.company || !newExperience.position || !newExperience.startDate || !newExperience.description) {
      alert('회사명, 직책, 입사년월, 업무 내용은 필수 입력 항목입니다.')
      return
    }
    
    const userId = localStorage.getItem('userId')
    if (!userId) {
      alert('로그인이 필요합니다.')
      return
    }
    
    try {
      const addedExperience = await apiCall<Experience>(`/api/jobseeker/experiences/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newExperience,
          endDate: newExperience.endDate || null
        })
      })
      
      setExperience([...experience, addedExperience])
      setNewExperience({ company: '', position: '', startDate: '', endDate: '', description: '' })
      setIsAddingExperience(false)
      alert('경력이 추가되었습니다.')
    } catch (error) {
      console.error('경력 추가 실패:', error)
      alert(getErrorMessage(error))
    }
  }
  
  // 경력 수정 시작
  const handleStartEditExperience = (exp: Experience) => {
    setEditingExperienceId(exp.id)
    setEditingExperience({
      company: exp.company,
      position: exp.position,
      startDate: exp.startDate,
      endDate: exp.endDate || '',
      description: exp.description
    })
  }
  
  // 경력 수정 저장
  const handleSaveExperience = async (id: number) => {
    if (!editingExperience.company || !editingExperience.position || !editingExperience.startDate || !editingExperience.description) {
      alert('회사명, 직책, 입사년월, 업무 내용은 필수 입력 항목입니다.')
      return
    }
    
    try {
      const updatedExperience = await apiCall<Experience>(`/api/jobseeker/experiences/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editingExperience,
          endDate: editingExperience.endDate || null
        })
      })
      
      setExperience(experience.map(e => e.id === id ? updatedExperience : e))
      setEditingExperienceId(null)
      setEditingExperience({ company: '', position: '', startDate: '', endDate: '', description: '' })
      alert('경력이 수정되었습니다.')
    } catch (error) {
      console.error('경력 수정 실패:', error)
      alert(getErrorMessage(error))
    }
  }
  
  // 경력 삭제
  const handleDeleteExperience = async (id: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return
    }
    
    try {
      await apiCall(`/api/jobseeker/experiences/${id}`, {
        method: 'DELETE'
      })
      
      setExperience(experience.filter(e => e.id !== id))
      alert('경력이 삭제되었습니다.')
    } catch (error) {
      console.error('경력 삭제 실패:', error)
      alert(getErrorMessage(error))
    }
  }
  
  // 강점 선택/해제
  const handleStrengthToggle = (strength: string) => {
    const currentStrengths = personalInfo.strengths
    if (currentStrengths.includes(strength)) {
      setPersonalInfo({
        ...personalInfo,
        strengths: currentStrengths.filter(s => s !== strength)
      })
    } else {
      if (currentStrengths.length >= 3) {
        alert('강점은 최대 3개까지 선택할 수 있습니다.')
        return
      }
      setPersonalInfo({
        ...personalInfo,
        strengths: [...currentStrengths, strength]
      })
    }
  }

  // 개인정보 저장
  const [personalInfoSaved, setPersonalInfoSaved] = useState(false)

  const handleSavePersonalInfo = async () => {
    if (!personalInfo.name || !personalInfo.email || !personalInfo.phone || !personalInfo.birthDate) {
      alert('이름, 이메일, 전화번호, 생년월일은 필수 입력 항목입니다.')
      return
    }
    // 학력사항 필수
    if (!personalInfo.education) {
      alert('학력사항은 필수 입력 항목입니다.')
      return
    }
    
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(personalInfo.email)) {
      alert('올바른 이메일 형식을 입력해주세요.')
      return
    }
    
    // 전화번호 형식 검증 (선택적)
    const phoneRegex = /^[0-9-]+$/
    if (!phoneRegex.test(personalInfo.phone)) {
      alert('올바른 전화번호 형식을 입력해주세요.')
      return
    }

    // 자기소개 검증 (5자 이상 20자 이하) - 필수
    if (!personalInfo.introduction || personalInfo.introduction.length < 5) {
      alert('자기소개는 최소 5자 이상 입력해주세요.')
      return
    }
    if (personalInfo.introduction.length > 20) {
      alert('자기소개는 최대 20자까지 입력 가능합니다.')
      return
    }

    // 희망근무조건 필수: 기본값(전체/무관) 유지 + 선택 없음이면 막기
    const hasMeaningfulRegion =
      (personalInfo.preferredRegion && personalInfo.preferredRegion !== '전체') ||
      (personalInfo.preferredDistrict && personalInfo.preferredDistrict !== '전체') ||
      (personalInfo.preferredDong && personalInfo.preferredDong !== '전체')
    const hasMeaningfulWork =
      (personalInfo.workDuration && personalInfo.workDuration !== '무관') ||
      (personalInfo.workDays && personalInfo.workDays !== '무관') ||
      (personalInfo.workTime && personalInfo.workTime !== '무관')
    const hasDesiredCategories = desiredJobSubcats && desiredJobSubcats.length > 0
    if (!hasMeaningfulRegion && !hasMeaningfulWork && !hasDesiredCategories) {
      alert('희망근무조건은 최소 1개 이상(지역/근무조건/희망 업직종) 선택해 주세요.')
      return
    }
    
    const userId = localStorage.getItem('userId')
    if (!userId) {
      alert('로그인이 필요합니다.')
      return
    }
    
    try {
      // muscleStrength 매핑
      let muscleStrength: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM'
      if (physicalData.strength === '상') muscleStrength = 'HIGH'
      else if (physicalData.strength === '하') muscleStrength = 'LOW'
      
      // 선택된 소분류 이름을 코드로 가능한 만큼 매핑
      const allLoadedSubcats = Object.values(jobSubCatsByMain).flat()
      const codeByName = new Map(allLoadedSubcats.map(i => [i.nm, i.cd]))
      const desiredCodes = desiredJobSubcats.map(nm => codeByName.get(nm) || '').filter((v, i, a) => v && a.indexOf(v) === i)
      await apiCall(`/api/jobseeker/profile/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: personalInfo.name,
          phone: personalInfo.phone,
          birthDate: personalInfo.birthDate,
          gender: personalInfo.gender,
          address: personalInfo.address,
          education: personalInfo.education,
          preferredRegion: personalInfo.preferredRegion,
          preferredDistrict: personalInfo.preferredDistrict,
          preferredDong: personalInfo.preferredDong,
          workDuration: personalInfo.workDuration,
          workDays: personalInfo.workDays,
          workTime: personalInfo.workTime,
          muscleStrength: muscleStrength,
          height: physicalData.height,
          weight: physicalData.weight,
          strengths: sanitizeStrengths(personalInfo.strengths).join(','),
          mbti: personalInfo.mbti,
          introduction: personalInfo.introduction,
          desiredCategoryCodes: desiredCodes.join(','),
          desiredCategoryNames: desiredJobSubcats.join(',')
        })
      })
      
      // 저장된 정보 업데이트
      setSavedPersonalInfo({ ...personalInfo })
      setPersonalInfoSaved(true)
      setTimeout(() => setPersonalInfoSaved(false), 3000)
      
    } catch (error) {
      console.error('개인정보 저장 실패:', error)
      alert(getErrorMessage(error))
    }
  }
  
  // 개인정보 취소 (저장된 값으로 복원)
  const handleCancelPersonalInfo = () => {
    if (window.confirm('변경사항을 취소하시겠습니까? 입력한 내용이 저장되지 않습니다.')) {
      setPersonalInfo({ ...savedPersonalInfo })
    }
  }
  
  // 개인정보 초기화
  const handleResetPersonalInfo = () => {
    if (window.confirm('모든 개인정보를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      setPersonalInfo({ ...initialPersonalInfo })
    }
  }

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-region-dropdown]')) {
        setShowRegionDropdown(false)
      }
      if (!target.closest('[data-district-dropdown]')) {
        setShowDistrictDropdown(false)
      }
      if (!target.closest('[data-dong-dropdown]')) {
        setShowDongDropdown(false)
      }
    }
    if (showRegionDropdown || showDistrictDropdown || showDongDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => {
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [showRegionDropdown, showDistrictDropdown, showDongDropdown])
  
  const [physicalData, setPhysicalData] = useState({
    strength: '중' as '상' | '중' | '하',
    height: '' as number | '',
    weight: '' as number | ''
  })

  const [savedPhysicalData, setSavedPhysicalData] = useState({
    strength: '중' as '상' | '중' | '하',
    height: '' as number | '',
    weight: '' as number | ''
  })

  const [isSavingPhysical, setIsSavingPhysical] = useState(false)

  // 신체속성 저장
  const handleSavePhysicalData = async () => {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      alert('로그인이 필요합니다.')
      return
    }
    
    setIsSavingPhysical(true)
    try {
      // muscleStrength 매핑
      let muscleStrength: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM'
      if (physicalData.strength === '상') muscleStrength = 'HIGH'
      else if (physicalData.strength === '하') muscleStrength = 'LOW'
      
      // 선택된 소분류 이름을 코드로 가능한 만큼 매핑(동일 로직)
      const allLoadedSubcats = Object.values(jobSubCatsByMain).flat()
      const codeByName = new Map(allLoadedSubcats.map(i => [i.nm, i.cd]))
      const desiredCodes = desiredJobSubcats.map(nm => codeByName.get(nm) || '').filter((v, i, a) => v && a.indexOf(v) === i)
      
      await apiCall(`/api/jobseeker/profile/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: personalInfo.name,
          phone: personalInfo.phone,
          birthDate: personalInfo.birthDate,
          gender: personalInfo.gender,
          address: personalInfo.address,
          education: personalInfo.education,
          preferredRegion: personalInfo.preferredRegion,
          preferredDistrict: personalInfo.preferredDistrict,
          preferredDong: personalInfo.preferredDong,
          workDuration: personalInfo.workDuration,
          workDays: personalInfo.workDays,
          workTime: personalInfo.workTime,
          muscleStrength: muscleStrength,
          height: physicalData.height === '' ? null : physicalData.height,
          weight: physicalData.weight === '' ? null : physicalData.weight,
          strengths: personalInfo.strengths.join(','),
          mbti: personalInfo.mbti,
          introduction: personalInfo.introduction,
          desiredCategoryCodes: desiredCodes.join(','),
          desiredCategoryNames: desiredJobSubcats.join(',')
        })
      })
      
      // 저장된 신체 정보 업데이트
      setSavedPhysicalData({ ...physicalData })
      
      alert('✓ 신체 속성이 성공적으로 저장되었습니다!')
    } catch (error) {
      console.error('신체 속성 저장 실패:', error)
      const errorMsg = getErrorMessage(error)
      alert(`❌ 저장 실패\n\n${errorMsg}\n\n백엔드 서버가 실행 중인지 확인해주세요.`)
    } finally {
      setIsSavingPhysical(false)
    }
  }

  // 신체속성 취소
  const handleCancelPhysicalData = () => {
    if (window.confirm('변경사항을 취소하시겠습니까? 입력한 내용이 저장되지 않습니다.')) {
      setPhysicalData({ ...savedPhysicalData })
    }
  }

  // 날짜 차이 계산 함수
  const getDaysAgo = (dateString: string): string => {
    const today = new Date()
    const postedDate = new Date(dateString)
    const diffTime = today.getTime() - postedDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return '오늘'
    if (diffDays === 1) return '1일전'
    if (diffDays < 7) return `${diffDays}일전`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주전`
    return `${Math.floor(diffDays / 30)}개월전`
  }
  
  // 공고 마감 여부
  const isJobClosed = (status?: string, deadline?: string): boolean => {
    const s = String(status || '').trim().toLowerCase()
    if (s && (s === 'closed' || s.includes('마감') || s.includes('종료') || s.includes('마감됨'))) return true
    if (!deadline) return false
    const d = new Date(deadline)
    if (isNaN(d.getTime())) return false
    const today = new Date()
    d.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    return d < today
  }

  // 저장된 일자리 불러오기 (API 연동)
  useEffect(() => {
    if (activeTab === 'saved') {
      const userId = localStorage.getItem('userId')
      console.log('💾 저장된 일자리 탭 활성화, userId:', userId)
      if (!userId) {
        console.log('❌ userId가 없습니다')
        return
      }

      const fetchSavedJobs = async () => {
        try {
          console.log('🔍 저장된 일자리 불러오기 시작:', `/api/jobseeker/saved-jobs/${userId}`)
          const response = await apiCall(`/api/jobseeker/saved-jobs/${userId}`, { method: 'GET' })
          console.log('📡 저장된 일자리 응답:', response)
          if (Array.isArray(response)) {
            const formattedJobs = response.map((job: any) => ({
              id: job.id,
              title: job.title,
              company: job.company || '',
              location: job.location || '',
              salary: job.salary || '협의',
              salaryType: job.salaryType || job.salary_type || null,
              description: job.description || '',
              type: job.jobType || '파트타임',
              posted: job.postedDate ? getDaysAgo(job.postedDate) : '최근',
              // 가능한 키를 폭넓게 수용
              postingStatus: job.status || job.jobStatus || job.postingStatus || job.job_post_status || job.post_status || null,
              deadline: job.deadline || job.jobDeadline || job.job_deadline || job.deadlineDate || job.job_deadline_date || null
            }))
            console.log('✅ 저장된 일자리 개수:', formattedJobs.length, formattedJobs)
            setSavedJobs(formattedJobs)
          }
        } catch (error) {
          console.error('❌ 저장된 일자리를 불러오는데 실패했습니다:', error)
          // 에러 발생 시 빈 배열로 설정
          setSavedJobs([])
        }
      }

      fetchSavedJobs()
    }
  }, [activeTab])

  // 저장된 일자리 삭제 (API 연동)
  const handleRemoveSavedJob = async (jobId: number) => {
    if (!window.confirm('저장된 일자리를 삭제하시겠습니까?')) return

    const userId = localStorage.getItem('userId')
    if (!userId) return

    try {
      await apiCall(`/api/jobseeker/saved-jobs/${userId}/${jobId}`, { method: 'DELETE' })
      setSavedJobs(savedJobs.filter(job => job.id !== jobId))
      alert('✓ 저장이 해제되었습니다.')
    } catch (error) {
      const errorMsg = getErrorMessage(error)
      alert(`❌ 삭제 실패\n\n${errorMsg}`)
    }
  }

  // 지원한 일자리 불러오기 (API 연동) + 이벤트 기반 즉시 갱신
  useEffect(() => {
    const userId = localStorage.getItem('userId')
    if (!userId) return

    const fetchApplications = async () => {
      try {
        const response = await apiCall(`/api/jobseeker/applications/${userId}`, { method: 'GET' })
          if (Array.isArray(response)) {
            const formattedJobs = response.map((app: any) => ({
            id: app.jobId,
            applicationId: app.id, // 지원서 ID (삭제용)
            title: app.jobTitle,
            company: app.company || '',
            location: app.location || '',
            salary: app.salary || '협의',
            salaryType: app.salaryType || app.salary_type || null,
            description: app.description || '',
            type: app.jobType || '파트타임',
            posted: app.posted || '최근',
            status: app.status || 'PENDING',
            // 공고 상태 키 확장 + 앱 상태가 '마감/종료' 의미일 경우도 수용
            postingStatus: app.jobStatus || app.postingStatus || app.job_status || app.job_post_status || app.post_status
              || (app.job ? (app.job.status || app.job.jobStatus || app.job.postingStatus || app.job.job_status || app.job.post_status) : null)
              || (typeof app.status === 'string' ? app.status : null),
            deadline: app.deadline || app.jobDeadline || app.job_deadline || app.deadlineDate || app.job_deadline_date
              || (app.job ? (app.job.deadline || app.job.jobDeadline || app.job.job_deadline || app.job.deadlineDate || app.job.job_deadline_date) : null)
              || null
          }))
          // 상세 정보로 마감 보강 (필드가 비어있는 항목만)
          const enrichWithDetails = async (jobsArr: AppliedJob[]) => {
            return await Promise.all(jobsArr.map(async (j) => {
              if (j.postingStatus || j.deadline) return j
              try {
                // 구직자 상세 API 우선 시도
                let res = await fetch(`/api/jobs/detail/${j.id}`)
                if (!res.ok) {
                  // 실패 시 고용주 상세 API로 폴백
                  res = await fetch(`/api/employer/jobs/detail/${j.id}`)
                }
                if (res.ok) {
                  const data = await res.json()
                  const postingStatus = data.status || data.jobStatus || data.postingStatus || null
                  const deadline = data.deadline || data.jobDeadline || data.job_deadline || null
                  return { ...j, postingStatus, deadline }
                }
              } catch {
                // ignore
              }
              return j
            }))
          }
          const enriched = await enrichWithDetails(formattedJobs as AppliedJob[])
          setAppliedJobs(enriched)
          // 활성 공고 ID 목록 로드(없으면 마감으로 간주하는 보강 로직)
          try {
            const actRes = await fetch('/api/jobs/active')
            if (actRes.ok) {
              const act = await actRes.json()
              if (Array.isArray(act)) {
                const ids = act.map((j: any) => Number(j.id)).filter((v: any) => Number.isFinite(v))
                setActiveJobIds(ids)
              }
            }
          } catch {}
        }
      } catch (error) {
        console.error('지원 내역을 불러오는데 실패했습니다:', error)
        setAppliedJobs([])
      }
    }

    // 최초 로드
    fetchApplications()

    // 지원/취소 시 즉시 갱신
    const onChanged = () => fetchApplications()
    window.addEventListener('application:changed' as any, onChanged as any)
    return () => window.removeEventListener('application:changed' as any, onChanged as any)
  }, [])

  // 지원한 일자리 삭제 (API 연동)
  const handleCancelApplication = async (applicationId: number) => {
    if (!window.confirm('지원을 취소하시겠습니까?\n\n취소 후 다시 지원할 수 있습니다.')) return

    const userId = localStorage.getItem('userId')
    if (!userId) return

    try {
      await apiCall(`/api/jobseeker/applications/${userId}/${applicationId}`, { method: 'DELETE' })
      setAppliedJobs(appliedJobs.filter(job => job.applicationId !== applicationId))
      alert('✓ 지원이 취소되었습니다.')
    } catch (error) {
      const errorMsg = getErrorMessage(error)
      alert(`❌ 지원 취소 실패\n\n${errorMsg}`)
    }
  }

  const tabs = [
    { id: 'personal' as ProfileTab, label: '개인 정보', icon: User },
    { id: 'licenses' as ProfileTab, label: '자격증', icon: Award },
    { id: 'experience' as ProfileTab, label: '경력', icon: Briefcase },
    { id: 'physical' as ProfileTab, label: '신체 속성', icon: Activity },
    { id: 'saved' as ProfileTab, label: '저장된 일자리', icon: Bookmark },
    { id: 'applied' as ProfileTab, label: '지원한 일자리', icon: CheckCircle },
    { id: 'proposals' as ProfileTab, label: '제안받은 일자리', icon: MessageSquare }
  ]

  return (
    <div>
      {/* 저장 성공 토스트 메시지 */}
      {personalInfoSaved && (
        <div style={{
          position: 'fixed',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#2196f3',
          color: '#fff',
          padding: '12px 32px',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 600,
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(33,150,243,0.15)'
        }}>
          개인정보가 저장되었습니다.
        </div>
      )}

      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '32px' }}>프로필</h1>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: '1px solid #e0e0e0', overflowX: 'auto', flexWrap: 'nowrap', paddingBottom: '4px' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #2196f3' : '2px solid transparent',
                backgroundColor: activeTab === tab.id ? '#f5f5f5' : 'transparent',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                lineHeight: 1.2
              }}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'personal' && (
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>개인 정보</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            이름, 연락처 등 기본 개인 정보를 업데이트하세요.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '800px' }}>
            <div>
              <label style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={16} color="#2196f3" />
                이름 <span style={{ color: '#f44336' }}>*</span>
              </label>
              <input
                type="text"
                value={personalInfo.name}
                onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px',
                  backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="%232196f3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>')`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: '12px center',
                  backgroundSize: '20px 20px'
                }}
              />
            </div>
            <div>
              <label style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={16} color="#4caf50" />
                이메일 <span style={{ color: '#f44336' }}>*</span>
              </label>
              <input
                type="email"
                value={personalInfo.email}
                onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px',
                  backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="%234caf50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>')`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: '12px center',
                  backgroundSize: '20px 20px'
                }}
              />
            </div>
            <div>
              <label style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={16} color="#ff9800" />
                전화번호 <span style={{ color: '#f44336' }}>*</span>
              </label>
              <input
                type="tel"
                value={personalInfo.phone}
                onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px',
                  backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="%23ff9800" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>')`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: '12px center',
                  backgroundSize: '20px 20px'
                }}
              />
            </div>
            <div>
              <label style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={16} color="#9c27b0" />
                생년월일 <span style={{ color: '#f44336' }}>*</span>
              </label>
              <input
                type="date"
                value={personalInfo.birthDate}
                onChange={(e) => setPersonalInfo({ ...personalInfo, birthDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px',
                  backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="%239c27b0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>')`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: '12px center',
                  backgroundSize: '20px 20px'
                }}
              />
            </div>
            <div>
              <label style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={16} color="#00bcd4" />
                성별
              </label>
              <select
                value={personalInfo.gender}
                onChange={(e) => setPersonalInfo({ ...personalInfo, gender: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '20px 20px, 16px 16px',
                  appearance: 'none',
                  backgroundPosition: '12px center, right 12px center',
                  backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="%2300bcd4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>'), url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%23666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>')`
                }}
              >
                <option value="">선택하세요</option>
                <option value="남성">남성</option>
                <option value="여성">여성</option>
              </select>
            </div>
            <div>
              <label style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Home size={16} color="#607d8b" />
                주소
              </label>
              <input
                type="text"
                value={personalInfo.address}
                onChange={(e) => setPersonalInfo({ ...personalInfo, address: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px',
                  backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="%23607d8b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>')`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: '12px center',
                  backgroundSize: '20px 20px'
                }}
              />
            </div>
          </div>

          {/* 학력사항 */}
          <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #e0e0e0' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GraduationCap size={20} />
              학력사항 <span style={{ color: '#f44336', fontWeight: 700 }}>*</span>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '800px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>최종학력 <span style={{ color: '#f44336' }}>*</span></label>
                <select
                  value={personalInfo.education}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, education: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                >
                  <option value="">선택하세요</option>
                  <option value="초등학교">초등학교</option>
                  <option value="중학교">중학교</option>
                  <option value="고등학교">고등학교</option>
                  <option value="대학(2,3년제)">대학(2,3년제)</option>
                  <option value="대학(4년제)">대학(4년제)</option>
                  <option value="대학원">대학원</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>나의 MBTI</label>
                <select
                  value={personalInfo.mbti}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, mbti: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                >
                  <option value="">선택하세요</option>
                  {mbtiOptions.map((mbti) => (
                    <option key={mbti} value={mbti}>{mbti}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 희망근무조건 */}
          <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #e0e0e0' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={20} color="#2196f3" />
              희망근무조건 <span style={{ color: '#f44336', fontWeight: 700 }}>*</span>
            </h3>
              <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>지역선택</h4>
              <div style={{ display: 'flex', gap: '12px', maxWidth: '800px' }}>
                {/* 시/도 선택 */}
                <div style={{ position: 'relative', flex: 1 }} data-region-dropdown>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>시/도</label>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowRegionDropdown(!showRegionDropdown)
                      setShowDistrictDropdown(false)
                      setShowDongDropdown(false)
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      backgroundColor: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '16px'
                    }}
                  >
                      <span>{personalInfo.preferredRegion || '전체'}</span>
                    <ChevronDown size={20} color="#666" />
                  </button>
                  {showRegionDropdown && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      zIndex: 100,
                      maxHeight: '300px',
                      overflowY: 'auto'
                    }}>
                        {/* 전체 */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setPersonalInfo({
                              ...personalInfo,
                              preferredRegion: '전체',
                              preferredDistrict: '전체',
                              preferredDong: '전체'
                            })
                            setSelectedRegionCode('')
                            setSelectedDistrictCode('')
                            setSelectedDongCode('')
                            setShowRegionDropdown(false)
                          }}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            textAlign: 'left',
                            border: 'none',
                            backgroundColor: personalInfo.preferredRegion === '전체' ? '#e3f2fd' : '#ffffff',
                            color: personalInfo.preferredRegion === '전체' ? '#2196f3' : '#333',
                            cursor: 'pointer',
                            fontSize: '16px'
                          }}
                        >
                          전체
                        </button>
                        {regionsApi.map((region) => (
                          <button
                            key={region.code}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setPersonalInfo({ 
                                ...personalInfo, 
                                preferredRegion: region.name,
                                preferredDistrict: '전체',
                                preferredDong: '전체'
                              })
                              setSelectedRegionCode(region.code)
                              setSelectedDistrictCode('')
                              setSelectedDongCode('')
                              setShowRegionDropdown(false)
                            }}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              textAlign: 'left',
                              border: 'none',
                              backgroundColor: personalInfo.preferredRegion === region.name ? '#e3f2fd' : '#ffffff',
                              color: personalInfo.preferredRegion === region.name ? '#2196f3' : '#333',
                              cursor: 'pointer',
                              fontSize: '16px'
                            }}
                          >
                            {region.name}
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {/* 구/군 선택 */}
                  {selectedRegionCode && (
                  <div style={{ position: 'relative', flex: 1 }} data-district-dropdown>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>구/군</label>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowDistrictDropdown(!showDistrictDropdown)
                        setShowRegionDropdown(false)
                        setShowDongDropdown(false)
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '16px'
                      }}
                    >
                      <span>{personalInfo.preferredDistrict || '전체'}</span>
                      <ChevronDown size={20} color="#666" />
                    </button>
                    {showDistrictDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '4px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        zIndex: 100,
                        maxHeight: '300px',
                        overflowY: 'auto'
                      }}>
                          {/* 전체 */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setPersonalInfo({
                                ...personalInfo,
                                preferredDistrict: '전체',
                                preferredDong: '전체'
                              })
                              setSelectedDistrictCode('')
                              setSelectedDongCode('')
                              setShowDistrictDropdown(false)
                            }}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              textAlign: 'left',
                              border: 'none',
                              backgroundColor: personalInfo.preferredDistrict === '전체' ? '#e3f2fd' : '#ffffff',
                              color: personalInfo.preferredDistrict === '전체' ? '#2196f3' : '#333',
                              cursor: 'pointer',
                              fontSize: '16px'
                            }}
                          >
                            전체
                          </button>
                          {districtsApi.map((district) => (
                            <button
                              key={district.code}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setPersonalInfo({ 
                                  ...personalInfo, 
                                  preferredDistrict: district.name,
                                  preferredDong: '전체'
                                })
                                setSelectedDistrictCode(district.code)
                                setSelectedDongCode('')
                                setShowDistrictDropdown(false)
                              }}
                              style={{
                                width: '100%',
                                padding: '12px 16px',
                                textAlign: 'left',
                                border: 'none',
                                backgroundColor: personalInfo.preferredDistrict === district.name ? '#e3f2fd' : '#ffffff',
                                color: personalInfo.preferredDistrict === district.name ? '#2196f3' : '#333',
                                cursor: 'pointer',
                                fontSize: '16px'
                              }}
                            >
                              {district.name}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 동 선택 */}
                  {selectedRegionCode && selectedDistrictCode && (
                  <div style={{ position: 'relative', flex: 1 }} data-dong-dropdown>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>동</label>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowDongDropdown(!showDongDropdown)
                        setShowRegionDropdown(false)
                        setShowDistrictDropdown(false)
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '16px'
                      }}
                    >
                      <span>{personalInfo.preferredDong || '전체'}</span>
                      <ChevronDown size={20} color="#666" />
                    </button>
                    {showDongDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '4px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        zIndex: 100,
                        maxHeight: '300px',
                        overflowY: 'auto'
                      }}>
                          {/* 전체 */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setPersonalInfo({ 
                                ...personalInfo, 
                                preferredDong: '전체'
                              })
                              setSelectedDongCode('')
                              setShowDongDropdown(false)
                            }}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              textAlign: 'left',
                              border: 'none',
                              backgroundColor: personalInfo.preferredDong === '전체' ? '#e3f2fd' : '#ffffff',
                              color: personalInfo.preferredDong === '전체' ? '#2196f3' : '#333',
                              cursor: 'pointer',
                              fontSize: '16px'
                            }}
                          >
                            전체
                          </button>
                          {dongsApi.map((dong) => (
                            <button
                              key={dong.code}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setPersonalInfo({ 
                                  ...personalInfo, 
                                  preferredDong: dong.name
                                })
                                setSelectedDongCode(dong.code)
                                setShowDongDropdown(false)
                              }}
                              style={{
                                width: '100%',
                                padding: '12px 16px',
                                textAlign: 'left',
                                border: 'none',
                                backgroundColor: personalInfo.preferredDong === dong.name ? '#e3f2fd' : '#ffffff',
                                color: personalInfo.preferredDong === dong.name ? '#2196f3' : '#333',
                                cursor: 'pointer',
                                fontSize: '16px'
                              }}
                            >
                              {dong.name}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* 희망 업직종 */}
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>희망 업직종</h4>
              <div style={{ position: 'relative' }}>
                {/* 표시용 선택명 변환(소분류 '전체' → 현재 대분류명) */}
                {(() => {
                  const mainNm = (jobMainCats.find(m => m.cd === selectedJobMainCd)?.nm) || ''
                  const displayNames = desiredJobSubcats.map(n => n === '전체' ? (mainNm || '전체') : n)
                  return (
                <button
                  type="button"
                  onClick={() => { setShowJobPopup(!showJobPopup); ensureLoadMainCats(); if (selectedJobMainCd) ensureLoadSubCats(selectedJobMainCd) }}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    maxWidth: 420
                  }}
                >
                  <span style={{ display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {displayNames.length > 0
                      ? `${displayNames.slice(0, 2).join(', ')}${displayNames.length > 2 ? ` 외 ${displayNames.length - 2}개` : ''}`
                      : '선택된 소분류 0개'}
                  </span>
                  <ChevronDown size={16} color="#666" />
                </button>
                  )
                })()}
                {showJobPopup && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    width: 680,
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: 8,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    padding: 12,
                    zIndex: 10
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ fontSize: 12, color: '#999' }}>최대 3개까지 선택 가능</div>
                      <button
                        type="button"
                        onClick={() => { if (jobMainCats[0]) setSelectedJobMainCd(jobMainCats[0].cd); setDesiredJobSubcats([]) }}
                        style={{ border: 'none', background: 'transparent', color: '#2196f3', cursor: 'pointer', fontSize: 12 }}
                      >
                        초기화
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 12, maxHeight: 320 }}>
                      {/* 대분류 */}
                      <div style={{ borderRight: '1px solid #eee', overflowY: 'auto', maxHeight: 220 }}>
                        {jobMainCats.map(main => (
                          <button
                            key={main.cd}
                            type="button"
                            onClick={() => { setSelectedJobMainCd(main.cd); ensureLoadSubCats(main.cd) }}
                            style={{
                              width: '100%', textAlign: 'left', padding: '8px 10px', border: 'none',
                              background: selectedJobMainCd === main.cd ? '#e3f2fd' : 'transparent',
                              color: selectedJobMainCd === main.cd ? '#2196f3' : '#333', cursor: 'pointer', borderRadius: 6
                            }}
                          >
                            {main.nm}
                          </button>
                        ))}
                      </div>
                      {/* 소분류 */}
                      <div style={{ overflowY: 'auto', maxHeight: 220 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(140px, 1fr))', gap: 6 }}>
                          {(jobSubCatsByMain[selectedJobMainCd]?.map(s => s.nm) || []).map(sub => {
                            const selected = desiredJobSubcats.includes(sub)
                            return (
                              <label key={`${selectedJobMainCd}-${sub}`} style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px',
                                border: selected ? '1px solid #2196f3' : '1px solid #e0e0e0',
                                background: selected ? '#e3f2fd' : '#fff', borderRadius: 6, cursor: 'pointer'
                              }}>
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setDesiredJobSubcats(prev => prev.length >= 3 ? prev : [...prev, sub])
                                    } else {
                                      setDesiredJobSubcats(prev => prev.filter(s => s !== sub))
                                    }
                                  }}
                                />
                                <span style={{ fontSize: 13, color: selected ? '#2196f3' : '#333', whiteSpace: 'nowrap' }}>{sub}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                      <button
                        type="button"
                        onClick={() => setShowJobPopup(false)}
                        style={{ padding: '8px 14px', border: 'none', borderRadius: 6, background: '#2196f3', color: '#fff', cursor: 'pointer' }}
                      >
                        적용
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {desiredJobSubcats.length > 0 && (() => {
                const mainNm = (jobMainCats.find(m => m.cd === selectedJobMainCd)?.nm) || ''
                const displayNames = desiredJobSubcats.map(n => n === '전체' ? (mainNm || '전체') : n)
                return (
                <div style={{ marginTop: 8, color: '#666', fontSize: 13 }}>
                  선택됨: {displayNames.join(', ')}
                </div>
                )
              })()}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '800px' }}>

              {/* 근무기간 */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>근무기간</label>
                <select
                  value={personalInfo.workDuration}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, workDuration: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                >
                  <option value="무관">무관</option>
                  <option value="하루">하루</option>
                  <option value="1일주일이하">1일주일이하</option>
                  <option value="1주일~1개월">1주일~1개월</option>
                  <option value="1개월~3개월">1개월~3개월</option>
                  <option value="3개월~6개월">3개월~6개월</option>
                  <option value="6개월 이상">6개월 이상</option>
                </select>
              </div>

              {/* 근무일시 - 요일 */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>근무일시 (요일)</label>
                <select
                  value={personalInfo.workDays}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, workDays: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                >
                  <option value="무관">무관</option>
                  <option value="월~일">월~일</option>
                  <option value="월~토">월~토</option>
                  <option value="월~금">월~금</option>
                  <option value="주말(토,일)">주말(토,일)</option>
                </select>
              </div>

              {/* 근무일시 - 시간대 */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>근무일시 (시간대)</label>
                <select
                  value={personalInfo.workTime}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, workTime: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                >
                  <option value="무관">무관</option>
                  <option value="오전 파트타임(06:00~12:00)">오전 파트타임(06:00~12:00)</option>
                  <option value="오후 파트타임(12:00~18:00)">오후 파트타임(12:00~18:00)</option>
                  <option value="저녁 파트타임(18:00~24:00)">저녁 파트타임(18:00~24:00)</option>
                  <option value="새벽 파트타임(00:00~06:00)">새벽 파트타임(00:00~06:00)</option>
                  <option value="풀타임(8시간이상)">풀타임(8시간이상)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 나의 강점 */}
          <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #e0e0e0' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Star size={20} color="#ff9800" />
              나의 강점
            </h3>
            <p style={{ color: '#666', marginBottom: '16px', fontSize: '14px' }}>나의 강점을 최대 3개까지 선택해주세요. ({personalInfo.strengths.length}/3)</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', maxWidth: '800px' }}>
              {strengthOptions.map((strength) => (
                <label
                  key={strength}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px',
                    border: personalInfo.strengths.includes(strength) ? '2px solid #2196f3' : '1px solid #e0e0e0',
                    borderRadius: '6px',
                    backgroundColor: personalInfo.strengths.includes(strength) ? '#e3f2fd' : '#ffffff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!personalInfo.strengths.includes(strength)) {
                      e.currentTarget.style.backgroundColor = '#f5f5f5'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!personalInfo.strengths.includes(strength)) {
                      e.currentTarget.style.backgroundColor = '#ffffff'
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={personalInfo.strengths.includes(strength)}
                    onChange={() => handleStrengthToggle(strength)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>{strength}</span>
                </label>
              ))}
            </div>
          </div>



          {/* 자기소개 */}
          <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #e0e0e0' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={20} color="#4caf50" />
              자기소개 <span style={{ color: '#f44336', fontWeight: 700 }}>*</span>
            </h3>
            <div style={{ maxWidth: '800px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                자기소개를 입력해 주세요. (최소 5자, 최대 20자)
              </label>
              <textarea
                value={personalInfo.introduction}
                onChange={(e) => setPersonalInfo({ ...personalInfo, introduction: e.target.value })}
                placeholder="자기소개를 입력해주세요..."
                rows={8}
                maxLength={20}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '14px', color: '#666' }}>
                <span style={{ color: (personalInfo.introduction.length > 0 && (personalInfo.introduction.length < 5 || personalInfo.introduction.length > 20)) ? '#f44336' : '#666' }}>
                  {personalInfo.introduction.length > 0 && personalInfo.introduction.length < 5 
                    ? `최소 5자 이상 입력해주세요. (현재 ${personalInfo.introduction.length}자)`
                    : personalInfo.introduction.length > 20
                    ? `✓ ${personalInfo.introduction.length}자`
                    : `0자 / 최소 5자`}
                </span>
                <span>{personalInfo.introduction.length} / 20자</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
            <button
              onClick={handleResetPersonalInfo}
              style={{
                padding: '12px 24px',
                border: '1px solid #ff9800',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                color: '#ff9800',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fff3e0'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff'
              }}
            >
              <RotateCcw size={16} />
              초기화
            </button>
            <button
              onClick={handleCancelPersonalInfo}
              style={{
                padding: '12px 24px',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff'
              }}
            >
              취소
            </button>
            <button
              onClick={handleSavePersonalInfo}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#2196f3',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1976d2'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#2196f3'
              }}
            >
              저장
            </button>
          </div>
        </div>
      )}

      {activeTab === 'licenses' && (
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>자격증</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {licenses.map((license) => (
              <div key={license.id} style={{
                padding: '20px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: '#ffffff'
              }}>
                {editingLicenseId === license.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                        자격증명 <span style={{ color: '#f44336' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={editingLicense.name}
                        onChange={(e) => setEditingLicense({ ...editingLicense, name: e.target.value })}
                        placeholder="자격증명을 입력하세요"
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                          발급일 <span style={{ color: '#f44336' }}>*</span>
                        </label>
                        <input
                          type="date"
                          value={editingLicense.issueDate}
                          onChange={(e) => setEditingLicense({ ...editingLicense, issueDate: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                          만료일 <span style={{ color: '#f44336' }}>*</span>
                        </label>
                        <input
                          type="date"
                          value={editingLicense.expiryDate}
                          onChange={(e) => setEditingLicense({ ...editingLicense, expiryDate: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => {
                          setEditingLicenseId(null)
                          setEditingLicense({ name: '', issueDate: '', expiryDate: '' })
                        }}
                        style={{
                          padding: '8px 16px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          backgroundColor: '#ffffff',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <X size={16} />
                        취소
                      </button>
                      <button
                        onClick={() => handleSaveLicense(license.id)}
                        style={{
                          padding: '8px 16px',
                          border: 'none',
                          borderRadius: '6px',
                          backgroundColor: '#2196f3',
                          color: '#ffffff',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Save size={16} />
                        저장
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>{license.name}</h3>
                      <p style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>발급일: {license.issueDate}</p>
                      <p style={{ color: '#666', fontSize: '14px' }}>만료일: {license.expiryDate}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleStartEditLicense(license)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          backgroundColor: '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '14px'
                        }}
                      >
                        <Edit2 size={14} />
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteLicense(license.id)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #f44336',
                          borderRadius: '6px',
                          backgroundColor: '#ffffff',
                          color: '#f44336',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '14px'
                        }}
                      >
                        <Trash2 size={14} />
                        삭제
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {isAddingLicense ? (
              <div style={{
                padding: '20px',
                border: '2px dashed #2196f3',
                borderRadius: '8px',
                backgroundColor: '#f5f5f5'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                      자격증명 <span style={{ color: '#f44336' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={newLicense.name}
                      onChange={(e) => setNewLicense({ ...newLicense, name: e.target.value })}
                      placeholder="자격증명을 입력하세요"
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                        발급일 <span style={{ color: '#f44336' }}>*</span>
                      </label>
                      <input
                        type="date"
                        value={newLicense.issueDate}
                        onChange={(e) => setNewLicense({ ...newLicense, issueDate: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                        만료일 <span style={{ color: '#f44336' }}>*</span>
                      </label>
                      <input
                        type="date"
                        value={newLicense.expiryDate}
                        onChange={(e) => setNewLicense({ ...newLicense, expiryDate: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => {
                        setIsAddingLicense(false)
                        setNewLicense({ name: '', issueDate: '', expiryDate: '' })
                      }}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <X size={16} />
                      취소
                    </button>
                    <button
                      onClick={handleAddLicense}
                      style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '6px',
                        backgroundColor: '#2196f3',
                        color: '#ffffff',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Save size={16} />
                      저장
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingLicense(true)}
                style={{
                  padding: '12px 24px',
                  border: '1px dashed #2196f3',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  color: '#2196f3',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Plus size={20} />
                자격증 추가
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === 'experience' && (
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>경력</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {experience.map((exp) => (
              <div key={exp.id} style={{
                padding: '20px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: '#ffffff'
              }}>
                {editingExperienceId === exp.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                          회사명 <span style={{ color: '#f44336' }}>*</span>
                        </label>
                        <input
                          type="text"
                          value={editingExperience.company}
                          onChange={(e) => setEditingExperience({ ...editingExperience, company: e.target.value })}
                          placeholder="회사명을 입력하세요"
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                          직책 <span style={{ color: '#f44336' }}>*</span>
                        </label>
                        <input
                          type="text"
                          value={editingExperience.position}
                          onChange={(e) => setEditingExperience({ ...editingExperience, position: e.target.value })}
                          placeholder="직책을 입력하세요"
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                          입사년월 <span style={{ color: '#f44336' }}>*</span>
                        </label>
                        <input
                          type="month"
                          value={editingExperience.startDate}
                          onChange={(e) => setEditingExperience({ ...editingExperience, startDate: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                          퇴사년월 <span style={{ color: '#999' }}>(선택)</span>
                        </label>
                        <input
                          type="month"
                          value={editingExperience.endDate}
                          onChange={(e) => setEditingExperience({ ...editingExperience, endDate: e.target.value })}
                          placeholder="재직중이면 비워두세요"
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '6px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                        업무 내용 <span style={{ color: '#f44336' }}>*</span>
                      </label>
                      <textarea
                        value={editingExperience.description}
                        onChange={(e) => setEditingExperience({ ...editingExperience, description: e.target.value })}
                        placeholder="주요 업무 내용을 입력하세요"
                        rows={4}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          fontSize: '14px',
                          resize: 'vertical',
                          fontFamily: 'inherit'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => {
                          setEditingExperienceId(null)
                          setEditingExperience({ company: '', position: '', startDate: '', endDate: '', description: '' })
                        }}
                        style={{
                          padding: '8px 16px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          backgroundColor: '#ffffff',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <X size={16} />
                        취소
                      </button>
                      <button
                        onClick={() => handleSaveExperience(exp.id)}
                        style={{
                          padding: '8px 16px',
                          border: 'none',
                          borderRadius: '6px',
                          backgroundColor: '#2196f3',
                          color: '#ffffff',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Save size={16} />
                        저장
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                        {exp.position} - {exp.company}
                      </h3>
                      <p style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>
                        기간: {exp.startDate} ~ {exp.endDate ? exp.endDate : '재직중'}
                      </p>
                      <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.6' }}>{exp.description}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleStartEditExperience(exp)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          backgroundColor: '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '14px'
                        }}
                      >
                        <Edit2 size={14} />
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteExperience(exp.id)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #f44336',
                          borderRadius: '6px',
                          backgroundColor: '#ffffff',
                          color: '#f44336',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '14px'
                        }}
                      >
                        <Trash2 size={14} />
                        삭제
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {isAddingExperience ? (
              <div style={{
                padding: '20px',
                border: '2px dashed #2196f3',
                borderRadius: '8px',
                backgroundColor: '#f5f5f5'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                        회사명 <span style={{ color: '#f44336' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={newExperience.company}
                        onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
                        placeholder="회사명을 입력하세요"
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                        직책 <span style={{ color: '#f44336' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={newExperience.position}
                        onChange={(e) => setNewExperience({ ...newExperience, position: e.target.value })}
                        placeholder="직책을 입력하세요"
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                        입사년월 <span style={{ color: '#f44336' }}>*</span>
                      </label>
                      <input
                        type="month"
                        value={newExperience.startDate}
                        onChange={(e) => setNewExperience({ ...newExperience, startDate: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                        퇴사년월 <span style={{ color: '#999' }}>(선택)</span>
                      </label>
                      <input
                        type="month"
                        value={newExperience.endDate}
                        onChange={(e) => setNewExperience({ ...newExperience, endDate: e.target.value })}
                        placeholder="재직중이면 비워두세요"
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                      업무 내용 <span style={{ color: '#f44336' }}>*</span>
                    </label>
                    <textarea
                      value={newExperience.description}
                      onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
                      placeholder="주요 업무 내용을 입력하세요"
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        fontSize: '14px',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => {
                        setIsAddingExperience(false)
                        setNewExperience({ company: '', position: '', startDate: '', endDate: '', description: '' })
                      }}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <X size={16} />
                      취소
                    </button>
                    <button
                      onClick={handleAddExperience}
                      style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '6px',
                        backgroundColor: '#2196f3',
                        color: '#ffffff',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Save size={16} />
                      저장
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingExperience(true)}
                style={{
                  padding: '12px 24px',
                  border: '1px dashed #2196f3',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  color: '#2196f3',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Plus size={20} />
                경력 추가
              </button>
            )}
          </div>
        </div>
      )}

      {/* 신체속성 탭 */}
      {activeTab === 'physical' && (
        <>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>신체 속성</h2>
            <p style={{ color: '#666', marginBottom: '24px' }}>
              근력, 키, 몸무게 등 신체 데이터를 입력하세요. AI 추천 시스템이 이 정보를 활용합니다.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '800px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>근력</label>
                <select
                  value={physicalData.strength}
                  onChange={(e) => setPhysicalData({ ...physicalData, strength: e.target.value as '상' | '중' | '하' })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                >
                  <option value="상">상</option>
                  <option value="중">중</option>
                  <option value="하">하</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>키 (cm)</label>
                <input
                  type="number"
                  min="0"
                  value={physicalData.height === '' ? '' : physicalData.height}
                  onChange={(e) => {
                    const v = e.target.value
                    setPhysicalData({ ...physicalData, height: v === '' ? '' : parseInt(v) })
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>몸무게 (kg)</label>
                <input
                  type="number"
                  min="0"
                  value={physicalData.weight === '' ? '' : physicalData.weight}
                  onChange={(e) => {
                    const v = e.target.value
                    setPhysicalData({ ...physicalData, weight: v === '' ? '' : parseInt(v) })
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancelPhysicalData}
                style={{
                  padding: '12px 24px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff'
                }}
              >
                취소
              </button>
              <button
                onClick={handleSavePhysicalData}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#2196f3',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1976d2'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#2196f3'
                }}
              >
                저장
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === 'saved' && (
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>저장된 일자리</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            관심 있는 일자리를 저장하여 나중에 쉽게 확인할 수 있습니다.
          </p>
          
          {savedJobs.length === 0 ? (
            <div style={{
              padding: '48px',
              textAlign: 'center',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }}>
              <Bookmark size={48} color="#999" style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p style={{ fontSize: '16px', color: '#666', marginBottom: '8px' }}>저장된 일자리가 없습니다</p>
              <p style={{ fontSize: '14px', color: '#999' }}>구직 검색 페이지에서 관심 있는 일자리를 저장해보세요.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {savedJobs.map((job) => {
                // 해당 일자리에 지원했는지 확인
                const application = appliedJobs.find(app => app.id === job.id)
                const applicationStatus = application?.status
                
                return (
                  <div
                    key={job.id}
                    style={{
                      padding: '24px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{job.title}</h3>
                          {isJobClosed((job as any).postingStatus, (job as any).deadline) && (
                            <span style={{
                              padding: '4px 12px',
                              backgroundColor: '#ffebee',
                              color: '#d32f2f',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>마감</span>
                          )}
                          {(applicationStatus === '합격' || applicationStatus === 'ACCEPTED') && (
                            <span style={{
                              padding: '4px 12px',
                              backgroundColor: '#4caf50',
                              color: '#ffffff',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>✓ 합격</span>
                          )}
                          {(applicationStatus === '대기' || applicationStatus === 'PENDING') && (
                            <span style={{
                              padding: '4px 12px',
                              backgroundColor: '#ff9800',
                              color: '#ffffff',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>⏳ 심사중</span>
                          )}
                          {(applicationStatus === '불합격' || applicationStatus === 'REJECTED') && (
                            <span style={{
                              padding: '4px 12px',
                              backgroundColor: '#f44336',
                              color: '#ffffff',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>✕ 불합격</span>
                          )}
                        </div>
                        <p style={{ color: '#666', fontSize: '14px', marginBottom: '12px' }}>{job.company}</p>
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '14px', color: '#666' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={16} />
                            {job.location}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <DollarSign size={16} />
                            {formatSalaryLabel((job as any).salary, (job as any).salaryType || (job as any).salary_type)}
                          </span>
                        </div>
                        <p style={{ color: '#666', fontSize: '14px', marginBottom: '12px' }}>{job.description}</p>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{
                            padding: '4px 12px',
                            backgroundColor: '#e3f2fd',
                            color: '#2196f3',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>{job.type}</span>
                          <span style={{ color: '#999', fontSize: '12px' }}>{job.posted}</span>
                        </div>
                      </div>
                    </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button
                      onClick={() => handleRemoveSavedJob(job.id)}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid #f44336',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        color: '#f44336',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '14px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#ffebee'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ffffff'
                      }}
                    >
                      <X size={16} />
                      저장 해제
                    </button>
                    <button
                      onClick={() => navigate(`/jobseeker/job/${job.id}`)}
                      style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '6px',
                        backgroundColor: '#2196f3',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '14px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#1976d2'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#2196f3'
                      }}
                    >
                      상세보기
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'applied' && (
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>지원한 일자리</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            지원을 완료한 일자리 목록입니다. 지원 상태를 확인하고 관리할 수 있습니다.
          </p>
          {appliedJobs.length === 0 ? (
            <div style={{
              padding: '48px',
              textAlign: 'center',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }}>
              <CheckCircle size={48} color="#999" style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p style={{ fontSize: '16px', color: '#666', marginBottom: '8px' }}>지원한 일자리가 없습니다</p>
              <p style={{ fontSize: '14px', color: '#999' }}>추천 채용 페이지에서 일자리에 지원해보세요.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {appliedJobs.map((job) => (
                <div
                  key={job.id}
                  style={{
                    padding: '24px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{job.title}</h3>
                        {(
                          isJobClosed((job as any).postingStatus, (job as any).deadline) ||
                          (activeJobIds.length > 0 && !activeJobIds.includes((job as any).id))
                        ) && (
                          <span style={{
                            padding: '4px 12px',
                            backgroundColor: '#ffebee',
                            color: '#d32f2f',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>마감</span>
                        )}
                        {(job.status === '합격' || job.status === 'ACCEPTED') && (
                          <span style={{
                            padding: '4px 12px',
                            backgroundColor: '#4caf50',
                            color: '#ffffff',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>✓ 합격</span>
                        )}
                        {(job.status === '대기' || job.status === 'PENDING') && (
                          <span style={{
                            padding: '4px 12px',
                            backgroundColor: '#ff9800',
                            color: '#ffffff',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>⏳ 심사중</span>
                        )}
                        {(job.status === '불합격' || job.status === 'REJECTED') && (
                          <span style={{
                            padding: '4px 12px',
                            backgroundColor: '#f44336',
                            color: '#ffffff',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>✕ 불합격</span>
                        )}
                      </div>
                      <p style={{ color: '#666', fontSize: '14px', marginBottom: '12px' }}>{job.company}</p>
                      <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '14px', color: '#666' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={16} />
                          {job.location}
                        </span>
                         <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <DollarSign size={16} />
                           {formatSalaryLabel((job as any).salary, (job as any).salaryType || (job as any).salary_type)}
                        </span>
                      </div>
                      <p style={{ color: '#666', fontSize: '14px', marginBottom: '12px' }}>{job.description}</p>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{
                          padding: '4px 12px',
                          backgroundColor: '#e3f2fd',
                          color: '#2196f3',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}>{job.type}</span>
                        <span style={{ color: '#999', fontSize: '12px' }}>{job.posted}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button
                      onClick={() => handleCancelApplication((job as any).applicationId || job.id)}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid #f44336',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        color: '#f44336',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '14px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#ffebee'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ffffff'
                      }}
                    >
                      <X size={16} />
                      지원 취소
                    </button>
                    <button
                      onClick={() => navigate(`/jobseeker/job/${job.id}`)}
                      style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '6px',
                        backgroundColor: '#2196f3',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '14px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#1976d2'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#2196f3'
                      }}
                    >
                      상세보기
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'proposals' && (
        <JobseekerProposals />
      )}

      {/* 상단에 저장 성공 메시지 */}
      {personalInfoSaved && (
        <div style={{
          position: 'fixed',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#2196f3',
          color: '#fff',
          padding: '12px 32px',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(33,150,243,0.15)'
        }}>
          개인정보가 저장되었습니다.
        </div>
      )}
    </div>
  )
}

export default Profile

