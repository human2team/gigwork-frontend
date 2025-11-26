import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, DollarSign, Bookmark, ArrowRight, BookmarkCheck, ChevronDown, X } from 'lucide-react'
import { apiCall } from '../utils/api'

// 상대 시간 계산 함수 (분/시간/일/주/개월)
const getDaysAgo = (dateString: string): string => {
  if (!dateString) return '최근'
  const now = new Date()
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return '최근'
  const ms = now.getTime() - d.getTime()
  const minutes = Math.floor(ms / (1000 * 60))
  const hours = Math.floor(ms / (1000 * 60 * 60))
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))

  // 같은 날짜에 등록된 항목은 시간대 차이로 인한 혼동을 줄이기 위해 '최근'으로 처리
  const sameDay = (() => {
    const dn = new Date(d)
    const nn = new Date(now)
    dn.setHours(0, 0, 0, 0)
    nn.setHours(0, 0, 0, 0)
    return dn.getTime() === nn.getTime()
  })()
  if (sameDay && hours < 6) return minutes < 1 ? '방금 전' : '최근'

  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일전`
  if (days < 30) return `${Math.floor(days / 7)}주전`
  return `${Math.floor(days / 30)}개월전`
}

const formatNumber = (v: any) => {
  const n = typeof v === 'string' ? parseInt(v.replace(/[^0-9]/g, '') || '0', 10) : Number(v || 0)
  if (!Number.isFinite(n)) return ''
  return n.toLocaleString()
}

const formatDate = (dateString?: string): string => {
  if (!dateString) return ''
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// 마감 여부 계산 (상태가 CLOSED이거나, 마감일이 '오늘 이전'이면 마감)
const isJobClosed = (status?: string, deadline?: string): boolean => {
  if (status && String(status).toUpperCase() === 'CLOSED') return true
  if (!deadline) return false
  const deadlineDate = new Date(deadline)
  if (isNaN(deadlineDate.getTime())) return false
  const today = new Date()
  // 날짜 단위 비교: 마감 당일은 '마감 아님'
  deadlineDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return deadlineDate < today
}

// 마감임박: 마감일이 '오늘 00:00'인 경우
const isDeadlineToday = (deadline?: string): boolean => {
  if (!deadline) return false
  const d = new Date(deadline)
  if (isNaN(d.getTime())) return false
  const today = new Date()
  d.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return d.getTime() === today.getTime()
}

// 업직종 2단 구조 - 서버에서 불러옴
type CategoryItem = { cd: string; nm: string }
type RegionItem = { code: string; name: string; sido?: string; sgg?: string; umd?: string }
type DistrictItem = { code: string; name: string }
type DongItem = { code: string; name: string }

// ...existing code...

// 구/군 → 동 매핑 (예시: 필요한 구만 우선 추가, 나머지는 비워둠)
const dongsByDistrict: Record<string, string[]> = {
  '서울 강남구': ['전체', '개포동', '논현동', '대치동', '도곡동', '삼성동', '세곡동', '수서동', '신사동', '압구정동', '일원동', '청담동'],
  '서울 송파구': ['전체', '잠실동', '풍납동', '송파동', '가락동', '문정동', '방이동', '거여동', '마천동', '석촌동', '오금동', '장지동'],
  '서울 서초구': ['전체', '서초동', '잠원동', '반포동', '방배동', '양재동']
}

const getDongs = (region: string, district: string): string[] => {
  if (!region || !district) return []
  const key = `${region} ${district}`
  return dongsByDistrict[key] || []
}

function JobSearch() {

  // 시/도 데이터 (Hook 선언을 컴포넌트 내부로 이동)
  const [regions, setRegions] = useState<RegionItem[]>([]);
  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [dongs, setDongs] = useState<DongItem[]>([]);
  const [selectedRegionCode, setSelectedRegionCode] = useState<string>('');
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<string>('');
  const [selectedDongCode, setSelectedDongCode] = useState<string>('');

  useEffect(() => {
    fetch('/api/regions')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // name, code, sido, sgg, umd 모두 포함된 데이터로 변환
          setRegions(data.map((r: any) => ({
            code: r.code,
            name: r.name,
            sido: r.sido,
            sgg: r.sgg,
            umd: r.umd
          })))
        }
      })
      .catch(() => setRegions([]))
  }, []);

  useEffect(() => {
    if (!selectedRegionCode) return;
    // 시/도는 code 전체(법정동코드)로 전달
    fetch(`/api/districts?region=${encodeURIComponent(selectedRegionCode)}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setDistricts(data)
        else setDistricts([])
      })
      .catch(() => setDistricts([]))
  }, [selectedRegionCode]);

  useEffect(() => {
    if (!selectedDistrictCode || !selectedRegionCode) return;
    // 시군구도 code 전체(법정동코드)로 전달
    fetch(`/api/dongs?district=${encodeURIComponent(selectedDistrictCode)}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setDongs(data)
        else setDongs([])
      })
      .catch(() => setDongs([]))
  }, [selectedDistrictCode, selectedRegionCode]);
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [savedJobIds, setSavedJobIds] = useState<number[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'job' | 'location' | 'search'>('job')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  // ...중복 선언 제거됨...
  const [selectedDistrictCodes, setSelectedDistrictCodes] = useState<string[]>([]);
  const [selectedDongCodes, setSelectedDongCodes] = useState<string[]>([]);
  // 새 컨트롤 바 상태
  const [showRegionPopup, setShowRegionPopup] = useState(false)
  const [showJobPopup, setShowJobPopup] = useState(false)
  const [selectedJobMainCd, setSelectedJobMainCd] = useState<string>('') // 서버 카테고리 코드
  const [selectedJobSubcats, setSelectedJobSubcats] = useState<string[]>([])
  const [selectAllSubcats, setSelectAllSubcats] = useState<boolean>(false)
  const [excludeBar, setExcludeBar] = useState(false)
  const [locationSearchQuery, setLocationSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const PER_PAGE = 10
  // 서버 카테고리 상태
  const [jobMainCats, setJobMainCats] = useState<CategoryItem[]>([])
  const [jobSubCatsByMain, setJobSubCatsByMain] = useState<Record<string, CategoryItem[]>>({})
  const getMainName = (cd?: string) => jobMainCats.find(m => m.cd === cd)?.nm || cd || ''
  const getRangeForMain = (cd: string) => {
    const letter = (cd?.match(/^[A-Za-z]/)?.[0]) || cd?.charAt(0) || 'A'
    return { start: `${letter}01`, end: `${letter}99` }
  }
  const ensureLoadMainCats = async () => {
    if (jobMainCats.length > 0) return
    try {
      const url = `/api/categories?kind=01&depth=1`
      console.log('[categories] fetch main:', url)
      const res = await fetch(url)
      if (res.ok) {
        const data: CategoryItem[] = await res.json()
        console.log('[categories] main ok:', data?.length)
        if (Array.isArray(data) && data.length > 0) {
          setJobMainCats(data)
          // 초기화 시 기본 선택 없음
          setSelectedJobMainCd('')
          return
        }
        console.warn('[categories] main empty')
        setJobMainCats([])
        setSelectedJobMainCd('')
      } else {
        console.warn('[categories] main not ok:', res.status)
        setJobMainCats([])
        setSelectedJobMainCd('')
      }
    } catch {
      setJobMainCats([])
      setSelectedJobMainCd('')
    }
  }
  const ensureLoadSubCats = async (mainCd: string) => {
    if (!mainCd) return
    if (jobSubCatsByMain[mainCd]) return
    try {
      // 서버에서 parent 기반으로 조회 (LIKE 'A__')
      const url = `/api/categories?kind=01&depth=2&parent=${encodeURIComponent(mainCd)}`
      console.log('[categories] fetch sub:', mainCd, url)
      const res = await fetch(url)
      if (res.ok) {
        const data: CategoryItem[] = await res.json()
        console.log('[categories] sub ok:', mainCd, data?.length)
        setJobSubCatsByMain(prev => ({ ...prev, [mainCd]: Array.isArray(data) ? data : [] }))
      } else {
        console.warn('[categories] sub not ok:', mainCd)
        setJobSubCatsByMain(prev => ({ ...prev, [mainCd]: [] }))
      }
    } catch {
      console.warn('[categories] sub error:', mainCd)
      setJobSubCatsByMain(prev => ({ ...prev, [mainCd]: [] }))
    }
  }
  // 최초 로드시 메인 카테고리 로드
  useEffect(() => { ensureLoadMainCats() }, [])

  // localStorage에서 저장된 일자리 ID 목록 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('savedJobs')
    if (saved) {
      setSavedJobIds(JSON.parse(saved))
    }
  }, [])

  // 필터 변경 시 페이지 리셋
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedRegionCode, selectedDistrictCodes, selectedCategories, jobs])

  // 백엔드에서 활성 공고 불러오기
  useEffect(() => {
    const fetchActiveJobs = async () => {
      try {
        const response = await fetch('/api/jobs/active')
        
        if (response.ok) {
          const activeJobs = await response.json()
          
          const convertedJobs = activeJobs.map((job: any) => ({
            id: job.id,
            title: job.title,
            category: job.category || '',
            company: job.company || '',
            location: job.location || '',
            salary: job.salaryType && job.salary ? `${job.salaryType} ${job.salary}` : job.salary || '협의',
            salaryType: job.salaryType || null,
            salaryRaw: job.salary || null,
            description: job.description || '',
            type: '파트타임',
            posted: job.postedDate ? getDaysAgo(job.postedDate) : '최근',
            gender: job.gender || '무관',
            age: job.age || '무관',
            education: job.education || '무관',
            status: job.status,
            deadline: job.deadline,
            startTime: job.startTime,
            endTime: job.endTime
          }))
          
          setJobs(convertedJobs)
        } else {
          setJobs([])
        }
      } catch (error) {
        console.error('Error fetching jobs:', error)
        setJobs([])
      }
    }

    fetchActiveJobs()
  }, [])

  // 일자리 저장/저장 해제
  const handleSaveJob = async (jobId: number) => {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      alert('로그인이 필요합니다.')
      return
    }

    try {
      if (savedJobIds.includes(jobId)) {
        await apiCall(`/api/jobseeker/saved-jobs/${userId}/${jobId}`, { method: 'DELETE' })
        const updatedSavedJobs = savedJobIds.filter(id => id !== jobId)
        setSavedJobIds(updatedSavedJobs)
        localStorage.setItem('savedJobs', JSON.stringify(updatedSavedJobs))
        alert('저장이 해제되었습니다.')
      } else {
        await apiCall(`/api/jobseeker/saved-jobs/${userId}/${jobId}`, { method: 'POST' })
        const updatedSavedJobs = [...savedJobIds, jobId]
        setSavedJobIds(updatedSavedJobs)
        localStorage.setItem('savedJobs', JSON.stringify(updatedSavedJobs))
        alert('일자리가 저장되었습니다.')
      }
    } catch (error) {
      console.error('저장 처리 실패:', error)
      alert('저장 처리에 실패했습니다.')
    }
  }

  // 필터링된 일자리
  const filteredJobs = jobs.filter(job => {
    // 검색: 구직제목, 지역(근무지), 업직종 카테고리
    const q = searchQuery.trim().toLowerCase()
    const qDot = q.replace(/·/g, '.')
    const titleNorm = (job.title || '').toLowerCase()
    const locationNorm = (job.location || '').toLowerCase()
    const categoryNorm = (job.category || '').toLowerCase().replace(/·/g, '.')
    const matchesSearch =
      q === '' ||
      titleNorm.includes(q) ||
      locationNorm.includes(q) ||
      categoryNorm.includes(qDot);

    // 지역명 기반 필터링
    let matchesLocation = true;
    // 선택된 시/도, 시/군/구, 동의 이름을 가져옴
    const regionName = regions.find(r => r.code === selectedRegionCode)?.name || '';
    const districtName = districts.find(d => d.code === selectedDistrictCode)?.name || '';
    const dongName = dongs.find(d => d.code === selectedDongCode)?.name || '';

    if (regionName) {
      matchesLocation = job.location.includes(regionName);
    }
    if (matchesLocation && districtName) {
      matchesLocation = job.location.includes(districtName);
    }
    if (matchesLocation && dongName) {
      matchesLocation = job.location.includes(dongName);
    }

    const baseCategoryMatch = selectedCategories.length === 0 || selectedCategories.some(selectedCat => {
      const normalizedSelected = selectedCat.replace(/·/g, '.').toLowerCase()
      const normalizedJob = (job.category || '').replace(/·/g, '.').toLowerCase()
      return normalizedSelected === normalizedJob
    })
    const subcatMatch = (() => {
      const jobCat = (job.category || '').toLowerCase()
      // 개별 소분류를 선택한 경우: 해당 소분류 중 하나와 일치해야 함
      if (selectedJobSubcats.length > 0) {
        return selectedJobSubcats.some(sub => jobCat.includes(sub.toLowerCase()))
      }
      // '전체' 토글이 켜졌거나, 소분류 선택이 없지만 대분류가 선택된 경우: 대분류 기준으로 즉시 적용
      if ((selectAllSubcats || selectedJobSubcats.length === 0) && selectedJobMainCd) {
        const subs = (jobSubCatsByMain[selectedJobMainCd]?.map(s => s.nm.toLowerCase())) || []
        if (subs.length > 0) {
          return subs.some(s => jobCat.includes(s))
        }
        // 소분류 목록이 아직 없으면 대분류 이름으로 즉시 매칭 시도
        const mainName = getMainName(selectedJobMainCd).toLowerCase()
        if (mainName) {
          return jobCat.includes(mainName)
        }
      }
      // 카테고리 필터 미적용
      return true
    })()
    const barExcluded = excludeBar ? !((job.category || '').toLowerCase().includes('bar')) : true
    const matchesCategory = baseCategoryMatch && subcatMatch && barExcluded
    
    return matchesSearch && matchesLocation && matchesCategory
  })

  // 페이지네이션 계산
  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PER_PAGE))
  const currentSafePage = Math.min(currentPage, totalPages)
  const startIndex = (currentSafePage - 1) * PER_PAGE
  const pageJobs = filteredJobs.slice(startIndex, startIndex + PER_PAGE)

  // 필터링된 지역
  const filteredRegions = regions.filter(region =>
    locationSearchQuery === '' || region.name.includes(locationSearchQuery)
  );

  return (
    <div>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '16px' }}>전체 채용 정보</h1>
      
      {/* 컨트롤 바: 지역 / 업직종 / 검색어 */}
      <div style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        marginBottom: '12px',
        flexWrap: 'wrap',
        position: 'relative',
        // 팝업이 열릴 때 아래 목록을 가리지 않도록 여유 공간 확보
        paddingBottom: (showRegionPopup || showJobPopup) ? 340 : 0
      }}>
        {/* 지역 */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowRegionPopup(!showRegionPopup); setShowJobPopup(false) }}
            style={{
              padding: '10px 12px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
          {(() => {
            const r = regions.find(r => r.code === selectedRegionCode)?.name || ''
            const d = districts.find(d => d.code === selectedDistrictCode)?.name || ''
            const g = dongs.find(dd => dd.code === selectedDongCode)?.name || ''
            const label = [r, d, g].filter(Boolean).join(' ')
            return label || '지역'
          })()}
            <ChevronDown size={16} />
          </button>
          {showRegionPopup && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              width: 'min(760px, calc(100vw - 32px))',
              backgroundColor: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              padding: 12,
              zIndex: 10
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: '#999' }}>지역 선택</div>
                <button
                  onClick={() => { setSelectedRegionCode(''); setSelectedDistrictCode(''); setSelectedDongCode(''); setDistricts([]); setDongs([]); }}
                  style={{ border: 'none', background: 'transparent', color: '#2196f3', cursor: 'pointer', fontSize: 12 }}
                >초기화</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '200px 240px 1fr', gap: 12 }}>
                {/* 시/도 */}
                <div style={{ borderRight: '1px solid #eee', overflowY: 'auto', maxHeight: 220 }}>
                  {filteredRegions.map(region => (
                    <button
                      key={region.code}
                      onClick={() => { setSelectedRegionCode(region.code); setSelectedDistrictCodes([]); setSelectedDongCodes([]); setSelectedDistrictCode(''); setSelectedDongCode(''); setDistricts([]); setDongs([]); }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 10px',
                        border: 'none',
                        background: selectedRegionCode === region.code ? '#e3f2fd' : 'transparent',
                        color: selectedRegionCode === region.code ? '#2196f3' : '#333',
                        cursor: 'pointer',
                        borderRadius: 6
                      }}
                    >
                      {region.name}
                    </button>
                  ))}
                </div>
                {/* 구/군 */}
                <div style={{ borderRight: '1px solid #eee', overflowY: 'auto', maxHeight: 220 }}>
                  {districts.map(district => (
                    <label key={district.code} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                      background: selectedDistrictCodes.includes(district.code) ? '#e3f2fd' : 'transparent', borderRadius: 6, cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedDistrictCodes.includes(district.code)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDistrictCodes(prev => [...prev, district.code]);
                            setSelectedDistrictCode(district.code);
                          } else {
                            setSelectedDistrictCodes(prev => prev.filter(code => code !== district.code));
                            setSelectedDistrictCode('');
                          }
                          setSelectedDongCodes([]);
                          setSelectedDongCode('');
                          setDongs([]);
                        }}
                      />
                      <span style={{ fontSize: 13, color: selectedDistrictCodes.includes(district.code) ? '#2196f3' : '#333' }}>{district.name}</span>
                    </label>
                  ))}
                </div>
                {/* 동 */}
                <div style={{ overflowY: 'auto', overflowX: 'hidden', maxHeight: 220, minWidth: 0 }}>
                  {dongs.map(dong => (
                    <label key={dong.code} style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px',
                      border: selectedDongCodes.includes(dong.code) ? '1px solid #2196f3' : '1px solid #e0e0e0',
                      background: selectedDongCodes.includes(dong.code) ? '#e3f2fd' : '#fff', borderRadius: 6, cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedDongCodes.includes(dong.code)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDongCodes(prev => [...prev, dong.code]);
                            setSelectedDongCode(dong.code);
                          } else {
                            setSelectedDongCodes(prev => prev.filter(code => code !== dong.code));
                            setSelectedDongCode('');
                          }
                        }}
                      />
                      <span style={{ fontSize: 13, color: selectedDongCodes.includes(dong.code) ? '#2196f3' : '#333', whiteSpace: 'nowrap' }}>{dong.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button
                  onClick={() => setShowRegionPopup(false)}
                  style={{ padding: '8px 14px', border: 'none', borderRadius: 6, background: '#2196f3', color: '#fff', cursor: 'pointer' }}
                >적용</button>
              </div>
            </div>
          )}
        </div>
        {/* 업직종 */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowJobPopup(!showJobPopup); setShowRegionPopup(false); ensureLoadMainCats(); if (selectedJobMainCd) ensureLoadSubCats(selectedJobMainCd) }}
            style={{
              padding: '10px 12px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
          {(() => {
            const mainNm = (jobMainCats.find(m => m.cd === selectedJobMainCd)?.nm) || ''
            let display = ''
            if (selectedJobSubcats.length > 0) {
              display = `${selectedJobSubcats.slice(0, 2).join(', ')}${selectedJobSubcats.length > 2 ? ` 외 ${selectedJobSubcats.length - 2}개` : ''}`
            } else if (selectAllSubcats && mainNm) {
              display = mainNm
            } else if (selectedJobMainCd && mainNm) {
              display = mainNm
            }
            return display || '업직종'
          })()}
            <ChevronDown size={16} />
          </button>
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
                <div style={{ fontSize: 12, color: '#999' }}>최대 5개까지 선택 가능</div>
                <button
                  onClick={() => { setSelectedJobMainCd(''); setSelectedJobSubcats([]); setSelectAllSubcats(false); setExcludeBar(false) }}
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
                      onClick={() => { setSelectedJobMainCd(main.cd); setSelectAllSubcats(false); setSelectedJobSubcats([]); ensureLoadSubCats(main.cd) }}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555' }}>
                      <input
                        type="checkbox"
                        checked={excludeBar}
                        onChange={(e) => setExcludeBar(e.target.checked)}
                      />
                      바(Bar) 제외
                    </label>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(140px, 1fr))', gap: 6 }}>
                    {(jobSubCatsByMain[selectedJobMainCd]?.map(s => s.nm) || []).map(sub => {
                      const isAll = sub === '전체'
                      const selected = isAll ? selectAllSubcats : selectedJobSubcats.includes(sub)
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
                              if (isAll) {
                                // '전체' 토글
                                const next = e.target.checked
                                setSelectAllSubcats(next)
                                if (next && selectedJobMainCd) ensureLoadSubCats(selectedJobMainCd)
                                if (next) setSelectedJobSubcats([])
                              } else {
                                if (e.target.checked) {
                                  // 개별 선택 시 '전체' 해제
                                  if (selectAllSubcats) setSelectAllSubcats(false)
                                  setSelectedJobSubcats(prev => prev.length >= 5 ? prev : [...prev, sub])
                                } else {
                                  setSelectedJobSubcats(prev => prev.filter(s => s !== sub))
                                }
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
                  onClick={() => setShowJobPopup(false)}
                  style={{ padding: '8px 14px', border: 'none', borderRadius: 6, background: '#2196f3', color: '#fff', cursor: 'pointer' }}
                >
                  적용
                </button>
              </div>
            </div>
          )}
        </div>
        {/* 검색어 */}
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <Search size={18} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="구직 제목, 지역, 업직종 검색"
            style={{
              width: '100%',
              padding: '10px 12px 10px 36px',
              border: '1px solid #e0e0e0',
              borderRadius: 6,
              fontSize: 14
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              title="지우기"
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
              <X size={16} color="#999" />
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ color: '#666', fontSize: '16px' }}>총 {filteredJobs.length}개의 일자리</div>
      </div>

      {/* 테이블 스타일 목록 */}
      {filteredJobs.length === 0 ? (
        <div style={{
          padding: '48px',
          textAlign: 'center',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <Search size={48} color="#999" style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p style={{ fontSize: '16px', color: '#666', marginBottom: '8px' }}>검색 결과가 없습니다</p>
          <p style={{ fontSize: '14px', color: '#999' }}>다른 검색어나 지역을 선택해보세요.</p>
        </div>
      ) : (
        <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fff' }}>
          {/* 헤더 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '40px 1.8fr 1fr 1fr 1fr 0.8fr 1fr',
            padding: '12px 16px',
            backgroundColor: '#fafafa',
            borderBottom: '1px solid #e0e0e0',
            fontSize: '14px',
            color: '#666',
            fontWeight: 600
          }}>
            <div />
            <div>기업명 / 공고제목</div>
            <div>근무지</div>
            <div>근무시간</div>
            <div>급여</div>
            <div>등록일</div>
            <div>마감일</div>
          </div>
          {/* Rows */}
          {pageJobs.map((job) => {
            const isClosed = isJobClosed(job.status, job.deadline)
            const isDueToday = isDeadlineToday(job.deadline) && !isClosed
            const workTime = job.startTime && job.endTime ? `${job.startTime} ~ ${job.endTime}` : '시간협의'
            const salaryBadge = job.salaryType ? job.salaryType : (job.salary || '').split(' ')[0] || ''
            const salaryAmount = job.salaryRaw ? formatNumber(job.salaryRaw) : formatNumber((job.salary || '').replace(/[^0-9]/g, ''))
            return (
              <div
                key={job.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1.8fr 1fr 1fr 1fr 0.8fr 1fr',
                  padding: '14px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  alignItems: 'center'
                }}
              >
                {/* 즐겨찾기 */}
                <div>
                  <button
                    onClick={() => handleSaveJob(job.id)}
                    title={savedJobIds.includes(job.id) ? '저장됨' : '저장'}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: savedJobIds.includes(job.id) ? '#2196f3' : '#ccc',
                      padding: 0
                    }}
                  >
                    {savedJobIds.includes(job.id) ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                  </button>
                </div>
                {/* 기업/제목 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', color: '#666' }}>{job.company}</div>
                  <button
                    onClick={() => navigate(`/jobseeker/job/${job.id}`)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      textAlign: 'left',
                      padding: 0,
                      fontSize: '15px',
                      fontWeight: 700,
                      color: isClosed ? '#bdbdbd' : '#222',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {isClosed ? '마감 공고입니다.' : job.title}
                  </button>
                </div>
                {/* 근무지 */}
                <div style={{ fontSize: '14px', color: '#555', marginLeft: -50 }}>{job.location}</div>
                {/* 근무시간 */}
                <div style={{ fontSize: '14px', color: '#555' }}>{workTime}</div>
                {/* 급여 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    padding: '3px 8px',
                    backgroundColor: '#e3f2fd',
                    color: '#2196f3',
                    borderRadius: 4,
                    fontSize: '12px',
                    fontWeight: 700
                  }}>
                    {salaryBadge || '급여'}
                  </span>
                  <span style={{ fontSize: '14px', color: '#222', fontWeight: 700 }}>
                    {salaryAmount || job.salary || '협의'}
                  </span>
                </div>
                {/* 등록일 */}
                <div style={{ fontSize: '13px', color: '#999' }}>{job.posted}</div>
                {/* 마감일 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '13px', color: isClosed ? '#d32f2f' : '#666', fontWeight: isClosed ? 700 as any : 400 }}>
                    {formatDate(job.deadline) || '-'}
                  </span>
                  {isDueToday && (
                    <span style={{
                      padding: '3px 8px',
                      backgroundColor: '#fff3e0',
                      color: '#ef6c00',
                      borderRadius: 4,
                      fontSize: '12px',
                      fontWeight: 700
                    }}>
                      마감 임박
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      {/* 페이지네이션 */}
      {filteredJobs.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentSafePage === 1}
            style={{
              padding: '8px 12px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              backgroundColor: currentSafePage === 1 ? '#f5f5f5' : '#ffffff',
              color: '#333',
              cursor: currentSafePage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            이전
          </button>
          <span style={{ fontSize: '14px', color: '#666' }}>
            {currentSafePage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentSafePage === totalPages}
            style={{
              padding: '8px 12px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              backgroundColor: currentSafePage === totalPages ? '#f5f5f5' : '#ffffff',
              color: '#333',
              cursor: currentSafePage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            다음
          </button>
        </div>
      )}
    </div>
  )
}

export default JobSearch
