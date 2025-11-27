import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { User, Mail, Phone, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useApplication } from '../contexts/ApplicationContext'
import { theme } from '../styles/utils'
import { Card, Button, Badge } from '../components/ui'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'

function Applications() {
  const navigate = useNavigate()
  const { 
    filteredApplications,
    setApplications,
    updateApplicationStatus,
    loading,
    error,
    setError,
    jobFilter,
    setJobFilter
  } = useApplication()
  
  const [jobs, setJobs] = useState<any[]>([])
  const userType = (localStorage.getItem('userType') || '').toUpperCase()
  const suitabilityByAppIdRef = useRef<Record<number, number>>({})
  const [suitabilityByAppId, setSuitabilityByAppId] = useState<Record<number, number>>({})
  const candidateCacheRef = useRef<Record<string, any>>({})
  const candidatesListMapRef = useRef<Record<string, any>>({})
  const candidatesNameIndexRef = useRef<Record<string, string[]>>({})

  // 유틸: 정규화
  const normalize = (s: any): string => {
    return String(s || '')
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[·.,/\\\-_|]+/g, '')
  }
  const toDate = (value: any): Date | null => {
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value
    if (typeof value === 'number') {
      const ms = value < 1e12 ? value * 1000 : value
      const d = new Date(ms)
      return isNaN(d.getTime()) ? null : d
    }
    if (typeof value === 'string') {
      const s = value.trim()
      if (!s) return null
      if (/^\d{10,13}$/.test(s)) return toDate(parseInt(s, 10))
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) {
        const d = new Date(s.replace(' ', 'T'))
        return isNaN(d.getTime()) ? null : d
      }
      if (/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) {
        const d = new Date(s.replace(/\//g, '-').replace(' ', 'T'))
        return isNaN(d.getTime()) ? null : d
      }
      const d = new Date(s)
      return isNaN(d.getTime()) ? null : d
    }
    return null
  }
  const normalizeGender = (g: any): 'M' | 'F' | '' => {
    const s = String(g || '').trim().toLowerCase()
    if (!s || s === '무관') return ''
    if (['m', 'male', '남', '남성', '남자'].includes(s)) return 'M'
    if (['f', 'female', '여', '여성', '여자'].includes(s)) return 'F'
    return ''
  }
  const parseJobAgeRange = (ageRaw: any): { min?: number; max?: number } | null => {
    const s = String(ageRaw || '').trim()
    if (!s || s === '무관') return null
    const decade = s.match(/^(\d{2})\s*대$/)
    if (decade) {
      const base = parseInt(decade[1], 10)
      return { min: base, max: base + 9 }
    }
    const range = s.match(/^(\d{2,3})\s*~\s*(\d{2,3})$/)
    if (range) {
      return { min: parseInt(range[1], 10), max: parseInt(range[2], 10) }
    }
    const ge = s.match(/^(\d{2,3})\s*세\s*이상$/)
    if (ge) return { min: parseInt(ge[1], 10) }
    const le = s.match(/^(\d{2,3})\s*세\s*이하$/)
    if (le) return { max: parseInt(le[1], 10) }
    if (/^\d{2,3}$/.test(s)) {
      const n = parseInt(s, 10)
      return { min: n, max: n }
    }
    return null
  }
  const isAgeInRange = (age?: number, range?: { min?: number; max?: number } | null): boolean => {
    if (!Number.isFinite(age || NaN) || !range) return false
    if (range.min != null && (age as number) < range.min) return false
    if (range.max != null && (age as number) > range.max) return false
    return true
  }
  const getSuitabilityVariant = (score: number) => {
    return score >= 85 ? 'success' : score >= 75 ? 'warning' : 'error'
  }
  const getSelectedJob = () => jobs.find(j => String(j.id) === String(jobFilter))
  const getJobFields = (job: any) => {
    if (!job) return { categoryName: '', location: '', region: '', district: '', dong: '', requirements: [] as string[], qualifications: [] as string[], description: '', gender: '', age: '', startTime: '', endTime: '' }
    return {
      categoryName: job.categoryName || job.category || '',
      location: job.location || '',
      region: job.region || '',
      district: job.district || '',
      dong: job.dong || '',
      requirements: Array.isArray(job.requirements) ? job.requirements : [],
      qualifications: Array.isArray(job.qualifications) ? job.qualifications : [],
      description: job.description || '',
      gender: job.gender || '',
      age: job.age || job.preferredAge || '',
      startTime: job.startTime || job.start_time || '',
      endTime: job.endTime || job.end_time || ''
    }
  }
  // CandidateSearch.tsx와 동일한 형태로 후보자 객체를 맞춰 계산
  const computeSuitability = (cand: {
    desiredCategories?: string[]
    desiredCategory?: string
    preferredRegion?: string
    preferredDistrict?: string
    preferredDong?: string
    licenses?: string[]
    experience?: string[]
    updatedAt?: any,
    gender?: any,
    age?: any
  }): number => {
    const job = getSelectedJob()
    const { categoryName, location, region, district, dong, requirements, qualifications, description, gender, age, startTime, endTime } = getJobFields(job)
    let score = job ? 40 : 50
    let cap = 100
    // 후보자 희망 업직종
    const desiredNames: string[] = Array.isArray(cand.desiredCategories)
      ? cand.desiredCategories.map((v: any) => String(v).trim()).filter(Boolean)
      : (cand.desiredCategory ? [String(cand.desiredCategory)] : [])
    const desiredNorm = desiredNames.map(normalize)
    // 위치
    const prefRegion = cand.preferredRegion || ''
    const prefDistrict = cand.preferredDistrict || ''
    const prefDong = cand.preferredDong || ''
    const preferredText = [prefRegion, prefDistrict, prefDong && prefDong !== '전체' ? prefDong : ''].filter(Boolean).join(' ')
    // 자격증
    const licNames: string[] = Array.isArray(cand.licenses) ? cand.licenses.map((l: any) => String(l)).filter(Boolean) : []
    const licNorm = licNames.map(normalize)
    // 경력 텍스트
    const expTexts: string[] = Array.isArray(cand.experience) ? cand.experience.map((t: any) => String(t)).filter(Boolean) : []
    const candGender = normalizeGender((cand as any).gender)
    const candAge: number | undefined = Number.isFinite((cand as any).age) ? Number((cand as any).age) : undefined
    const candWorkTime: string = (cand as any)?.workTime || (cand as any)?.preferredWorkTime || ''
    const candIntro: string = (cand as any)?.introduction || (cand as any)?.intro || ''
    const candStrengthsArr: string[] = Array.isArray((cand as any)?.strengths)
      ? ((cand as any)?.strengths as any[]).map((s: any) => String(s).trim()).filter(Boolean)
      : String((cand as any)?.strengths || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)

    // 1) 카테고리
    if (job) {
      const jobCatNorm = normalize(categoryName)
      if (jobCatNorm) {
        if (desiredNorm.some(d => d && (d === jobCatNorm || jobCatNorm.includes(d) || d.includes(jobCatNorm)))) {
          score += 8
        } else if (desiredNorm.some(d => d && (d.slice(0, 4) === jobCatNorm.slice(0, 4)))) {
          score += 5
        } else {
          score += 2
        }
      }
    }
    // 2) 지역 (+가점) + 불일치 페널티
    if (job) {
      const regionHit = prefRegion && region && prefRegion === region
      const districtHit = prefDistrict && district && prefDistrict === district
      const dongHit = prefDong && dong && prefDong === dong && prefDong !== '전체'
      if (regionHit) score += 10
      if (districtHit) score += 6
      if (dongHit) score += 4
      const locNorm = normalize(location)
      const prefNorm = normalize(preferredText)
      const locHit = !!(locNorm && prefNorm && (locNorm.includes(prefNorm) || prefNorm.includes(locNorm)))
      if (locHit) score += 6
      const hasPref = !!(prefRegion || prefDistrict || (prefDong && prefDong !== '전체'))
      const hasJobLoc = !!(region || district || dong || location)
      if (hasJobLoc && hasPref) {
        if (!regionHit && region && prefRegion) score -= 30
        if (!districtHit && district && prefDistrict) score -= 20
        if (!dongHit && dong && prefDong && prefDong !== '전체') score -= 10
        if (!(regionHit || districtHit || dongHit || locHit)) score -= 8
        if (!regionHit && region && prefRegion) cap = Math.min(cap, 40)
        else if (!districtHit && district && prefDistrict) cap = Math.min(cap, 55)
        else if (!dongHit && dong && prefDong && prefDong !== '전체') cap = Math.min(cap, 65)
        // 시/도 불일치 또는 어떤 위치 매칭도 없으면 절대 상한 10%
        const regionMismatch = !!(region && prefRegion && !regionHit)
        const noAnyMatch = !(regionHit || districtHit || dongHit || locHit)
        if (regionMismatch || noAnyMatch) cap = Math.min(cap, 10)
      }
    }
    // 3) 요구조건/자격
    const jobNeeds = [...requirements, ...qualifications].map(normalize).filter(Boolean)
    if (jobNeeds.length > 0 && licNorm.length > 0) {
      const overlap = licNorm.filter(l => jobNeeds.some(jn => jn && (l.includes(jn) || jn.includes(l)))).length
      score += Math.min(10, overlap * 5)
    }
    // 4) 경력/설명
    const descNorm = normalize(description)
    if (descNorm) {
      if (desiredNorm.some(d => d && descNorm.includes(d))) score += 6
      if (expTexts.some(t => normalize(t) && descNorm.includes(normalize(t)))) score += 4
    }
    // 5) 최신성 보정: 목록 객체의 updatedAt을 우선 사용(인재정보와 동일)
    const updatedRaw = cand.updatedAt
    const updatedDate = toDate(updatedRaw)
    if (updatedDate) {
      const diffDays = Math.floor((Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays <= 7) score += 5
      else if (diffDays <= 30) score += 2
    }
    // 6) 성별/나이 매칭 보정(최대 +14)
    if (job) {
      const jobGender = normalizeGender(gender)
      // 공고 성별이 무관('')이면 후보 성별만 있으면 일치로 간주
      if (candGender && (jobGender === '' || jobGender === candGender)) score += 3
      const jobAgeRange = parseJobAgeRange(age)
      // 공고 나이가 무관(null)이면 후보 나이만 있으면 일치로 간주
      if ((jobAgeRange == null && Number.isFinite(candAge as any)) || isAgeInRange(candAge, jobAgeRange)) score += 4
    }
    // 7) 근무시간 매칭 (최대 +8)
    const parseHHMM = (s: string): number | null => {
      const m = String(s || '').match(/^(\d{2}):(\d{2})$/)
      if (!m) return null
      const h = parseInt(m[1], 10), mi = parseInt(m[2], 10)
      if (isNaN(h) || isNaN(mi)) return null
      return h * 60 + mi
    }
    const parseCandidateTime = (s: string): { start: number; end: number } | null => {
      const mm = String(s || '').match(/(\d{2}:\d{2})\s*~\s*(\d{2}:\d{2})/)
      if (mm) {
        const a = parseHHMM(mm[1]); const b = parseHHMM(mm[2])
        if (a != null && b != null) return { start: a, end: b }
      }
      if (/풀타임|무관/.test(String(s || ''))) return { start: 0, end: 24 * 60 }
      return null
    }
    const jobStart = parseHHMM(String(startTime || '')); const jobEnd = parseHHMM(String(endTime || ''))
    const candRange = parseCandidateTime(candWorkTime)
    if (jobStart != null && jobEnd != null && candRange) {
      const overlap = Math.max(0, Math.min(jobEnd, candRange.end) - Math.max(jobStart, candRange.start))
      if (overlap >= 240) score += 8
      else if (overlap >= 60) score += 4
    }
    // 8) 자기소개 ↔ 직무설명 매칭 (최대 +8)
    if (candIntro && description) {
      const introTokens = String(candIntro).toLowerCase().split(/[^a-zA-Z0-9가-힣]+/).filter(t => t.length >= 2)
      const descLow = String(description).toLowerCase()
      let hits = 0
      const seen = new Set<string>()
      for (const t of introTokens) {
        if (seen.has(t)) continue
        seen.add(t)
        if (descLow.includes(t)) hits++
        if (hits >= 4) break
      }
      if (hits >= 3) score += 8
      else if (hits >= 1) score += 4
    }
    // 9) 나의 강점 ↔ 직무설명 매칭 (최대 +6)
    if (candStrengthsArr.length > 0 && description) {
      const descLow = String(description).toLowerCase()
      const strengthsLow = candStrengthsArr.map(s => s.toLowerCase())
      const matched = strengthsLow.filter(s => s && descLow.includes(s)).length
      if (matched >= 2) score += 6
      else if (matched >= 1) score += 3
    }
    if (!Number.isFinite(score)) score = 50
    score = Math.min(score, cap)
    score = Math.max(0, Math.min(100, Math.round(score)))
    return score
  }

  // 현재 표시되는 지원자들에 대해 적합도 계산(선택 공고 기준)
  useEffect(() => {
    const run = async () => {
      const job = getSelectedJob()
      if (!job || filteredApplications.length === 0) {
        setSuitabilityByAppId({})
        suitabilityByAppIdRef.current = {}
        return
      }
      // 인재 목록을 한 번 가져와서(아이디→목록 객체) updatedAt 등 동일 기준으로 사용
      if (Object.keys(candidatesListMapRef.current).length === 0) {
        try {
          const listRes = await fetch('/api/candidates')
          if (listRes.ok) {
            const listData = await listRes.json()
            if (Array.isArray(listData)) {
              const map: Record<string, any> = {}
              const nameIndex: Record<string, string[]> = {}
              listData.forEach((c: any) => {
                if (c && c.id != null) {
                  const idStr = String(c.id)
                  map[idStr] = c
                  const nm = String(c.name || '').trim()
                  if (nm) {
                    if (!nameIndex[nm]) nameIndex[nm] = []
                    nameIndex[nm].push(idStr)
                  }
                }
              })
              candidatesListMapRef.current = map
              candidatesNameIndexRef.current = nameIndex
            }
          }
        } catch {
          // ignore
        }
      }
      const next: Record<number, number> = {}
      for (const app of filteredApplications) {
        let candidateId =
          (app as any).candidateId ||
          (app as any).jobseekerId ||
          (app as any).jobSeekerId ||
          (app as any).applicantId
        // 후보자 ID가 없다면 이름으로 추정(목록 기준) - 인재정보와 일치 유도
        if (!candidateId) {
          const nm = String((app as any).applicantName || '').trim()
          if (nm) {
            const ids = candidatesNameIndexRef.current[nm]
            if (Array.isArray(ids) && ids.length > 0) candidateId = ids[0]
          }
        }
        if (candidateId) {
          const key = String(candidateId)
          try {
            let detail = candidateCacheRef.current[key]
            if (!detail) {
              const res = await fetch(`/api/candidates/${encodeURIComponent(key)}`)
              if (res.ok) {
                detail = await res.json()
                candidateCacheRef.current[key] = detail
              }
            }
            // 목록 객체(인재정보 카드 기준 데이터)와 상세를 합성
            const listObj = candidatesListMapRef.current[key]
            if (detail || listObj) {
              // licenses: 상세는 [{name,...}], 목록은 ['자격명', ...]
              const licensesFromDetail = Array.isArray(detail?.licenses)
                ? detail.licenses.map((l: any) => (l && (l.name || l.licName || l.title)) ? String(l.name || l.licName || l.title) : '').filter(Boolean)
                : []
              const licensesFromList = Array.isArray(listObj?.licenses) ? listObj.licenses.map((v: any) => String(v)) : []
              // experience: 목록은 문자열 리스트, 상세는 객체 리스트
              const expFromDetail = Array.isArray(detail?.experiences)
                ? detail.experiences.map((e: any) => [e.company, e.position].filter(Boolean).join(' ')).filter(Boolean)
                : []
              const expFromList = Array.isArray(listObj?.experience) ? listObj.experience.map((v: any) => String(v)) : []
              const candSynth = {
                // 인재정보(CandidateSearch)는 목록 객체 기반 → 목록 우선
                desiredCategories: Array.isArray(listObj?.desiredCategories) ? listObj.desiredCategories
                  : (Array.isArray(detail?.desiredCategories) ? detail.desiredCategories : []),
                preferredRegion: listObj?.preferredRegion ?? detail?.preferredRegion ?? '',
                preferredDistrict: listObj?.preferredDistrict ?? detail?.preferredDistrict ?? '',
                preferredDong: listObj?.preferredDong ?? detail?.preferredDong ?? '',
                licenses: licensesFromList.length > 0 ? licensesFromList : licensesFromDetail,
                experience: expFromList.length > 0 ? expFromList : expFromDetail,
                updatedAt: listObj?.jobseekerProfile?.updatedAt, // 인재정보와 동일 기준
                gender: (detail?.gender ?? listObj?.gender ?? ''),
                age: (typeof listObj?.age === 'number' ? listObj?.age : (detail?.age ?? undefined)),
                workTime: (detail?.workTime ?? listObj?.workTime ?? ''),
                introduction: (detail?.introduction ?? listObj?.introduction ?? ''),
                strengths: Array.isArray(listObj?.strengths) ? listObj?.strengths
                  : (Array.isArray(detail?.strengths) ? detail?.strengths
                    : String(detail?.strengths || listObj?.strengths || '').split(',').map((s: any) => String(s).trim()).filter(Boolean))
              }
              const score = computeSuitability(candSynth)
              if (typeof app.id === 'number') next[app.id] = score
            }
          } catch {
            // ignore, fallback later
          }
        }
      }
      suitabilityByAppIdRef.current = next
      setSuitabilityByAppId(next)
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs, jobFilter, filteredApplications])

  // 사업자의 공고 목록 가져오기
  useEffect(() => {
    const fetchEmployerJobs = async () => {
      const userId = localStorage.getItem('userId')
      const userType = localStorage.getItem('userType')
      
      if (!userId) return
      if (userType?.toUpperCase() !== 'EMPLOYER') return

      try {
        console.log('🔍 Fetching employer jobs for user:', userId)
        const response = await fetch(`/api/employer/jobs/${userId}`)
        
        if (response.ok) {
          const jobsData = await response.json()
          console.log('✅ Employer jobs fetched:', jobsData)
          setJobs(jobsData)
          
          // 첫 번째 공고를 기본으로 선택 (최초 로드 시에만)
          if (jobsData.length > 0 && jobFilter === '전체') {
            console.log('📌 Setting default job filter:', jobsData[0].id)
            setJobFilter(jobsData[0].id.toString())
          } else if (jobsData.length === 0) {
            // 공고가 하나도 없으면 지원자 목록 표시를 막기 위해 컨텍스트 목록 비움
            setApplications([])
          }
        }
      } catch (error) {
        console.error('❌ Error fetching employer jobs:', error)
      }
    }

    fetchEmployerJobs()
  }, [jobFilter, setJobFilter])

  // 지원자 목록에 공고 제목 추가
  useEffect(() => {
    if (jobs.length > 0 && filteredApplications.length > 0) {
      const currentJob = jobs.find(job => job.id.toString() === jobFilter)
      if (currentJob && filteredApplications[0].jobTitle === '') {
        // jobTitle이 비어있으면 업데이트
        const updatedApplications = filteredApplications.map(app => ({
          ...app,
          jobTitle: currentJob.title
        }))
        setApplications(updatedApplications)
      }
    }
  }, [jobs, filteredApplications, jobFilter, setApplications])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case '합격':
        return <CheckCircle size={16} />
      case '불합격':
        return <XCircle size={16} />
      case '대기':
        return <Clock size={16} />
      default:
        return null
    }
  }


  const handleStatusChange = async (applicationId: number, newStatus: '대기' | '합격' | '불합격') => {
    if (window.confirm(`지원자 상태를 "${newStatus}"로 변경하시겠습니까?`)) {
      await updateApplicationStatus(applicationId, newStatus)
      alert(`지원자 상태가 "${newStatus}"로 변경되었습니다.`)
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <LoadingSpinner size="lg" message="지원자 목록을 불러오는 중..." />
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h1 style={{ 
          fontSize: theme.typography.fontSize['3xl'], 
          fontWeight: theme.typography.fontWeight.bold, 
          marginBottom: theme.spacing['2xl'],
          color: theme.colors.text.primary
        }}>
          지원자 관리
        </h1>
        <ErrorMessage
          message={error.message || '지원자 목록을 불러오는 중 오류가 발생했습니다.'}
          onRetry={() => window.location.reload()}
          onDismiss={() => setError(null)}
        />
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ 
        fontSize: theme.typography.fontSize['3xl'], 
        fontWeight: theme.typography.fontWeight.bold, 
        marginBottom: theme.spacing['2xl'],
        color: theme.colors.text.primary
      }}>
        지원자 관리
      </h1>

      {/* 접근 제어: 사업자가 아니면 안내만 표시 */}
      {userType !== 'EMPLOYER' && (
        <Card padding="xl" style={{ marginBottom: theme.spacing.xl }}>
          <p style={{ 
            fontSize: theme.typography.fontSize.base, 
            color: theme.colors.text.secondary 
          }}>
            이 페이지는 사업자 전용입니다. 사업자로 로그인 후 이용해 주세요.
          </p>
        </Card>
      )}

      {/* 공고가 없으면 지원자 목록을 숨기고 안내 표시 */}
      {userType === 'EMPLOYER' && jobs.length === 0 && (
        <Card padding="xl" style={{ marginBottom: theme.spacing.xl }}>
          <p style={{ 
            fontSize: theme.typography.fontSize.base, 
            color: theme.colors.text.secondary 
          }}>
            아직 등록한 공고가 없습니다. 공고를 등록한 후 지원자 관리가 가능합니다.
          </p>
          <div style={{ marginTop: theme.spacing.md }}>
            <Button variant="primary" onClick={() => navigate('/employer/jobs/posting')}>
              공고 등록하러 가기
            </Button>
          </div>
        </Card>
      )}

      {/* 공고 선택 */}
      {userType === 'EMPLOYER' && jobs.length > 0 && (
        <div style={{ marginBottom: theme.spacing.xl }}>
          <label style={{ 
            display: 'block', 
            marginBottom: theme.spacing.sm,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
            color: theme.colors.text.primary
          }}>
            공고 선택
          </label>
          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            style={{
              padding: theme.spacing.sm,
              border: `1px solid ${theme.colors.border.default}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.base,
              minWidth: '300px'
            }}
          >
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 지원자 목록 */}
      {userType === 'EMPLOYER' && jobs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
          {filteredApplications.map((application) => (
            <Card key={application.id} padding="xl">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'start', 
              marginBottom: theme.spacing.lg 
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: theme.spacing.md, 
                  marginBottom: theme.spacing.md 
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: theme.borderRadius.full,
                    backgroundColor: theme.colors.primaryLight + '20',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <User size={24} color={theme.colors.primary} />
                  </div>
                  <div>
                    <h3 style={{ 
                      fontSize: theme.typography.fontSize.xl, 
                      fontWeight: theme.typography.fontWeight.bold, 
                      marginBottom: theme.spacing.xs,
                      color: theme.colors.text.primary
                    }}>
                      {application.applicantName}
                    </h3>
                    <p style={{ 
                      fontSize: theme.typography.fontSize.sm, 
                      color: theme.colors.text.secondary 
                    }}>
                      {application.jobTitle}
                    </p>
                  </div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: theme.spacing.lg, 
                  fontSize: theme.typography.fontSize.sm, 
                  color: theme.colors.text.secondary, 
                  marginLeft: '60px' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                    <Mail size={16} />
                    {application.email}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                    <Phone size={16} />
                    {application.phone}
                  </div>
                  <div>
                    지원일: {application.appliedDate}
                  </div>
                  <Badge 
                    variant={getSuitabilityVariant(
                      suitabilityByAppId[application.id] != null ? suitabilityByAppId[application.id] : (application as any).suitability || 0
                    )}
                    size="sm"
                  >
                    적합도: {suitabilityByAppId[application.id] != null ? suitabilityByAppId[application.id] : 0}%
                  </Badge>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: theme.spacing.sm, 
                alignItems: 'flex-end' 
              }}>
                <Badge 
                  variant={
                    application.status === '합격' ? 'success' : 
                    application.status === '불합격' ? 'error' : 
                    'warning'
                  }
                >
                  {getStatusIcon(application.status)}
                  {application.status}
                </Badge>
              </div>
            </div>

            {/* 상태 변경 버튼 */}
            <div style={{
              display: 'flex',
              gap: theme.spacing.sm,
              paddingTop: theme.spacing.lg,
              borderTop: `1px solid ${theme.colors.border.default}`,
              marginTop: theme.spacing.lg
            }}>
              {application.status !== '합격' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange(application.id, '합격')}
                  style={{
                    borderColor: theme.colors.success,
                    color: theme.colors.success
                  }}
                >
                  합격 처리
                </Button>
              )}
              {application.status !== '불합격' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange(application.id, '불합격')}
                  style={{
                    borderColor: theme.colors.error,
                    color: theme.colors.error
                  }}
                >
                  불합격 처리
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`/employer/applications/${application.id}`)}
              >
                상세 보기
              </Button>
            </div>
            </Card>
          ))}
        </div>
      )}

      {userType === 'EMPLOYER' && jobs.length > 0 && filteredApplications.length === 0 && (
        <Card padding="xl" style={{ textAlign: 'center' }}>
          <p style={{ 
            fontSize: theme.typography.fontSize.base, 
            color: theme.colors.text.secondary 
          }}>
            지원자가 없습니다.
          </p>
        </Card>
      )}
    </div>
  )
}

export default Applications

