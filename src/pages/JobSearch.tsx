import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, DollarSign, Bookmark, ArrowRight, BookmarkCheck, ChevronDown, X } from 'lucide-react'
import { apiCall } from '../utils/api'

// 상대 시간 계산 함수 (분/시간/일/주/개월)
const getDaysAgo = (dateString: string): string => {
  if (!dateString) return '최근'
  const now = new Date()
  const d = new Date(dateString)
  const ms = now.getTime() - d.getTime()
  const minutes = Math.floor(ms / (1000 * 60))
  const hours = Math.floor(ms / (1000 * 60 * 60))
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
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

// 시/도 데이터
const regions: Record<string, string[]> = {
  '전체': [],
  '서울': ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'],
  '부산': ['강서구', '금정구', '기장군', '남구', '동구', '동래구', '부산진구', '북구', '사상구', '사하구', '서구', '수영구', '연제구', '영도구', '중구', '해운대구'],
  '대구': ['남구', '달서구', '달성군', '동구', '북구', '서구', '수성구', '중구'],
  '인천': ['강화군', '계양구', '미추홀구', '남동구', '동구', '부평구', '서구', '연수구', '옹진군', '중구'],
  '광주': ['광산구', '남구', '동구', '북구', '서구'],
  '대전': ['대덕구', '동구', '서구', '유성구', '중구'],
  '울산': ['남구', '동구', '북구', '울주군', '중구'],
  '세종': ['세종시'],
  '경기': ['가평군', '고양시', '과천시', '광명시', '광주시', '구리시', '군포시', '김포시', '남양주시', '동두천시', '부천시', '성남시', '수원시', '시흥시', '안산시', '안성시', '안양시', '양주시', '양평군', '여주시', '연천군', '오산시', '용인시', '의왕시', '의정부시', '이천시', '파주시', '평택시', '포천시', '하남시', '화성시'],
  '강원': ['강릉시', '고성군', '동해시', '삼척시', '속초시', '양구군', '양양군', '영월군', '원주시', '인제군', '정선군', '철원군', '춘천시', '태백시', '평창군', '홍천군', '화천군', '횡성군'],
  '충북': ['괴산군', '단양군', '보은군', '영동군', '옥천군', '음성군', '제천시', '증평군', '진천군', '청주시', '충주시'],
  '충남': ['계룡시', '공주시', '금산군', '논산시', '당진시', '보령시', '부여군', '서산시', '서천군', '아산시', '예산군', '천안시', '청양군', '태안군', '홍성군'],
  '전북': ['고창군', '군산시', '김제시', '남원시', '무주군', '부안군', '순창군', '완주군', '익산시', '임실군', '장수군', '전주시', '정읍시', '진안군'],
  '전남': ['강진군', '고흥군', '곡성군', '광양시', '구례군', '나주시', '담양군', '목포시', '무안군', '보성군', '순천시', '신안군', '여수시', '영광군', '영암군', '완도군', '장성군', '장흥군', '진도군', '함평군', '해남군', '화순군'],
  '경북': ['경산시', '경주시', '고령군', '구미시', '군위군', '김천시', '문경시', '봉화군', '상주시', '성주군', '안동시', '영덕군', '영양군', '영주시', '영천시', '예천군', '울릉군', '울진군', '의성군', '청도군', '청송군', '칠곡군', '포항시'],
  '경남': ['거제시', '거창군', '고성군', '김해시', '남해군', '밀양시', '사천시', '산청군', '양산시', '의령군', '진주시', '진해시', '창녕군', '창원시', '통영시', '하동군', '함안군', '함양군', '합천군'],
  '제주': ['서귀포시', '제주시']
}

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
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [savedJobIds, setSavedJobIds] = useState<number[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'job' | 'location' | 'search'>('job')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedRegion, setSelectedRegion] = useState<string>('전체')
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([])
  const [selectedDongs, setSelectedDongs] = useState<string[]>([])
  // 새 컨트롤 바 상태
  const [showRegionPopup, setShowRegionPopup] = useState(false)
  const [showJobPopup, setShowJobPopup] = useState(false)
  const [selectedJobMainCd, setSelectedJobMainCd] = useState<string>('') // 서버 카테고리 코드
  const [selectedJobSubcats, setSelectedJobSubcats] = useState<string[]>([])
  const [excludeBar, setExcludeBar] = useState(false)
  const [locationSearchQuery, setLocationSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const PER_PAGE = 9
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
          setSelectedJobMainCd(data[0].cd)
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
  }, [searchQuery, selectedRegion, selectedDistricts, selectedCategories, jobs])

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
    const matchesSearch = searchQuery === '' || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    let matchesLocation = true
    if (selectedRegion !== '전체' || selectedDistricts.length > 0) {
      if (selectedDistricts.length > 0) {
        // 동이 선택되어 있으면 동 기준으로, 아니면 구/군 기준으로
        if (selectedDongs.length > 0) {
          // '전체'가 포함되어 있으면 동 필터를 구/군 기준으로 완화
          if (selectedDongs.includes('전체')) {
            matchesLocation = selectedDistricts.some(district => job.location.includes(district))
          } else {
            matchesLocation = selectedDongs.some(dong => job.location.includes(dong))
          }
        } else {
          matchesLocation = selectedDistricts.some(district => job.location.includes(district))
        }
      } else if (selectedRegion !== '전체') {
        matchesLocation = job.location.includes(selectedRegion)
      }
    }
    
    // 카테고리 매칭: 기존 selectedCategories 또는 새 selectedJobSubcats 중 하나라도 일치
    const baseCategoryMatch = selectedCategories.length === 0 || selectedCategories.some(selectedCat => {
      const normalizedSelected = selectedCat.replace(/·/g, '.').toLowerCase()
      const normalizedJob = (job.category || '').replace(/·/g, '.').toLowerCase()
      return normalizedSelected === normalizedJob
    })
    const subcatMatch =
      selectedJobSubcats.length === 0 ||
      selectedJobSubcats.some(sub => (job.category || '').toLowerCase().includes(sub.toLowerCase()))
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
  const filteredRegions = Object.keys(regions).filter(region =>
    locationSearchQuery === '' || region.includes(locationSearchQuery)
  )

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
            지역{selectedDistricts.length > 0 || selectedDongs.length > 0 ? `(${(selectedDongs.length || selectedDistricts.length)})` : ''}
            <ChevronDown size={16} />
          </button>
          {showRegionPopup && (
          <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              width: 760,
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
                  onClick={() => { setSelectedRegion('전체'); setSelectedDistricts([]); setSelectedDongs([]) }}
                  style={{ border: 'none', background: 'transparent', color: '#2196f3', cursor: 'pointer', fontSize: 12 }}
                >
                  초기화
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '200px 240px 320px', gap: 12 }}>
                {/* 시/도 */}
                <div style={{ borderRight: '1px solid #eee', overflowY: 'auto', maxHeight: 220 }}>
                  {Object.keys(regions).filter(r => r !== '전체').map(region => (
                    <button
                      key={region}
                      onClick={() => { setSelectedRegion(region); setSelectedDistricts([]); setSelectedDongs([]) }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 10px',
                        border: 'none',
                        background: selectedRegion === region ? '#e3f2fd' : 'transparent',
                        color: selectedRegion === region ? '#2196f3' : '#333',
                        cursor: 'pointer',
                        borderRadius: 6
                      }}
                    >
                      {region}
                    </button>
                  ))}
                </div>
                {/* 구/군 */}
                <div style={{ borderRight: '1px solid #eee', overflowY: 'auto', maxHeight: 220 }}>
                  {selectedRegion !== '전체' && regions[selectedRegion]?.map(district => {
                    const selected = selectedDistricts.includes(district)
                    return (
                      <label key={district} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                        background: selected ? '#e3f2fd' : 'transparent', borderRadius: 6, cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDistricts(prev => [...prev, district])
                              // 해당 구 선택 시 동 초기화
                              setSelectedDongs(prev => prev.filter(d => !getDongs(selectedRegion, district).includes(d)))
                            } else {
                              setSelectedDistricts(prev => prev.filter(d => d !== district))
                              setSelectedDongs(prev => prev.filter(d => !getDongs(selectedRegion, district).includes(d)))
                            }
                          }}
                        />
                        <span style={{ fontSize: 13, color: selected ? '#2196f3' : '#333' }}>{district}</span>
                      </label>
                    )
                  })}
                </div>
                {/* 동 */}
                <div style={{ overflowY: 'auto', maxHeight: 220 }}>
                  {selectedRegion !== '전체' && selectedDistricts.length > 0 ? (
                    <>
                      {selectedDistricts.map(district => {
                        const dongs = getDongs(selectedRegion, district)
                        return (
                          <div key={district} style={{ marginBottom: 8 }}>
                            <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>{district}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(140px, 1fr))', gap: 6 }}>
                              {(dongs.length > 0 ? dongs : ['전체']).map(dong => {
                                const selected = selectedDongs.includes(dong)
                                return (
                                  <label key={`${district}-${dong}`} style={{
                                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px',
                                    border: selected ? '1px solid #2196f3' : '1px solid #e0e0e0',
                                    background: selected ? '#e3f2fd' : '#fff', borderRadius: 6, cursor: 'pointer'
                                  }}>
                                    <input
                                      type="checkbox"
                                      checked={selected}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedDongs(prev => prev.length >= 5 ? prev : [...prev, dong])
                                        } else {
                                          setSelectedDongs(prev => prev.filter(d => d !== dong))
                                        }
                                      }}
                                    />
                                    <span style={{ fontSize: 13, color: selected ? '#2196f3' : '#333', whiteSpace: 'nowrap' }}>{dong}</span>
                                  </label>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </>
                  ) : (
                    <div style={{ fontSize: 13, color: '#999' }}>구/군을 먼저 선택하세요</div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button
                  onClick={() => setShowRegionPopup(false)}
                  style={{ padding: '8px 14px', border: 'none', borderRadius: 6, background: '#2196f3', color: '#fff', cursor: 'pointer' }}
                >
                  적용
                </button>
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
            업직종{selectedJobSubcats.length > 0 ? `(${selectedJobSubcats.length})` : ''}
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
                  onClick={() => { if (jobMainCats[0]) setSelectedJobMainCd(jobMainCats[0].cd); setSelectedJobSubcats([]); setExcludeBar(false) }}
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
                      const selected = selectedJobSubcats.includes(sub)
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
                                setSelectedJobSubcats(prev => prev.length >= 5 ? prev : [...prev, sub])
                              } else {
                                setSelectedJobSubcats(prev => prev.filter(s => s !== sub))
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
            placeholder="구직 제목, 기술 또는 회사 입력"
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
                <div style={{ fontSize: '14px', color: '#555' }}>{job.location}</div>
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
