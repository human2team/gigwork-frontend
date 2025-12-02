import { Briefcase, MapPin, FileText, User, Calendar, Award, ClipboardList, CheckCircle, Layers, X, ArrowLeft, Save, ChevronDown } from 'lucide-react';
  import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function JobPosting() {
  const navigate = useNavigate()
  // 백엔드 컬럼 제한(varchar(255))에 맞춰 프런트에서도 길이 제한
  const MAX_VARCHAR = 255
  // work_days 컬럼은 운영 DB에서 더 짧을 수 있어 보수적으로 200자로 제한
  const MAX_WORKDAYS_LEN = 200
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    company: '',
    location: '',
    addressDetail: '',
    description: '',
    qualifications: [''],
    requirements: [] as string[],
    otherRequirement: '',
    workingDays: [] as string[],
    startTime: '',
    endTime: '',
    salary: '',
    salaryType: '시급',
    deadline: '',
    gender: '무관',
    age: '무관',
    education: '무관'
  })

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState('서울')
  const [selectedDistrict, setSelectedDistrict] = useState('전체')
  const [selectedDong, setSelectedDong] = useState('전체')
  const [showRegionPopup, setShowRegionPopup] = useState(false)

  // 카테고리(백엔드 연동)
  type CategoryItem = { cd: string; nm: string }
  const [jobMainCats, setJobMainCats] = useState<CategoryItem[]>([])
  const [jobSubCatsByMain, setJobSubCatsByMain] = useState<Record<string, CategoryItem[]>>({})
  const [selectedJobMainCd, setSelectedJobMainCd] = useState<string>('')
  const [selectedJobSub, setSelectedJobSub] = useState<{ cd: string; nm: string } | null>(null)
  const [showCategoryPopup, setShowCategoryPopup] = useState(false)

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

  // 시/도 및 구/군 데이터
  // 지역 데이터 API 기반 동적 로딩
  type RegionItem = { code: string; name: string; sido?: string; sgg?: string; umd?: string }
  type DistrictItem = { code: string; name: string; sido?: string; sgg?: string; umd?: string }
  type DongItem = { code: string; name: string; sido?: string; sgg?: string; umd?: string }
  const [regions, setRegions] = useState<RegionItem[]>([])
  const [districts, setDistricts] = useState<DistrictItem[]>([])
  const [dongs, setDongs] = useState<DongItem[]>([])

  // 시/도 불러오기
  useEffect(() => {
    fetch('/api/regions')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setRegions(data)
      })
      .catch(() => setRegions([]))
  }, [])

  // 구/군 불러오기
  useEffect(() => {
    if (!selectedRegion) return;
    const regionObj = regions.find(r => r.name === selectedRegion);
    if (!regionObj) return;
    fetch(`/api/districts?region=${encodeURIComponent(regionObj.code)}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setDistricts(data)
        else setDistricts([])
      })
      .catch(() => setDistricts([]))
  }, [selectedRegion, regions]);

  // 동 불러오기
  useEffect(() => {
    if (!selectedRegion || !selectedDistrict) return;
    const regionObj = regions.find(r => r.name === selectedRegion);
    const districtObj = districts.find(d => d.name === selectedDistrict);
    if (!regionObj || !districtObj) return;
    fetch(`/api/dongs?district=${encodeURIComponent(districtObj.code)}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setDongs(data)
        else setDongs([])
      })
      .catch(() => setDongs([]))
  }, [selectedRegion, selectedDistrict, regions, districts]);

  // 구/군별 동 데이터 (주요 구만 포함)
  // getDistricts 함수 제거, dongs 상태 사용

  const requirementOptions = [
    '통장사본',
    '신분증',
    '영어',
    '일본어',
    '중국어',
    '운전면허증',
    '원활한 커뮤니케이션',
    '무거운 짐 운반',
    '기타(직접입력)'
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    // 텍스트 필드는 255자 제한 적용
    const capped = (() => {
      if (['title', 'category', 'company', 'location', 'description', 'otherRequirement', 'salary', 'salaryType', 'gender', 'age', 'education'].includes(name)) {
        return String(value).slice(0, MAX_VARCHAR)
      }
      return value
    })()
    setFormData({
      ...formData,
      [name]: capped
    })
  }

  const handleArrayChange = (index: number, value: string, field: 'qualifications') => {
    const newArray = [...formData[field]]
    newArray[index] = value
    setFormData({
      ...formData,
      [field]: newArray
    })
  }

  const addArrayItem = (field: 'qualifications') => {
    setFormData({
      ...formData,
      [field]: [...formData[field], '']
    })
  }

  const removeArrayItem = (index: number, field: 'qualifications') => {
    const newArray = formData[field].filter((_, i) => i !== index)
    setFormData({
      ...formData,
      [field]: newArray.length > 0 ? newArray : ['']
    })
  }

  // 달력 관련 함수들
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    // 빈 칸 추가 (첫 주 시작 전)
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    // 날짜 추가
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }

  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const toggleWorkingDay = (date: Date) => {
    const dateStr = formatDate(date)
    if (formData.workingDays.includes(dateStr)) {
      setFormData({
        ...formData,
        workingDays: formData.workingDays.filter(d => d !== dateStr)
      })
    } else {
      setFormData({
        ...formData,
        workingDays: [...formData.workingDays, dateStr].sort()
      })
    }
  }

  const isSelected = (date: Date) => {
    return formData.workingDays.includes(formatDate(date))
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isPast = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  // 지역 변경 핸들러
  const handleRegionChange = (region: string) => {
    setSelectedRegion(region)
    setSelectedDistrict('')
    setSelectedDong('')
    setFormData({
      ...formData,
      location: region
    })
  }

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district)
    setSelectedDong('')
    const location = `${selectedRegion} ${district}`
    setFormData({
      ...formData,
      location: location
    })
  }

  const handleDongChange = (dong: string) => {
    setSelectedDong(dong)
    const location = `${selectedRegion} ${selectedDistrict} ${dong}`
    setFormData({
      ...formData,
      location: location
    })
  }

  const handleRequirementChange = (requirement: string) => {
    if (requirement === '건너뛰기') {
      // 건너뛰기를 선택하면 모든 선택 해제
      setFormData({
        ...formData,
        requirements: [],
        otherRequirement: ''
      })
      return
    }

    const isOther = requirement === '기타(직접입력)'
    const currentRequirements = formData.requirements.filter(r => r !== '기타(직접입력)')
    
    if (formData.requirements.includes(requirement)) {
      // 이미 선택된 항목이면 제거
      setFormData({
        ...formData,
        requirements: currentRequirements.filter(r => r !== requirement),
        otherRequirement: isOther ? '' : formData.otherRequirement
      })
    } else {
      // 최대 5개까지 선택 가능
      if (currentRequirements.length >= 5 && !isOther) {
        alert('최대 5개까지 선택할 수 있습니다.')
        return
      }
      
      if (isOther) {
        setFormData({
          ...formData,
          requirements: [...currentRequirements, requirement],
          otherRequirement: ''
        })
      } else {
        // 다른 항목을 선택하면 건너뛰기는 자동으로 해제됨 (이미 빈 배열이므로)
        setFormData({
          ...formData,
          requirements: [...currentRequirements, requirement]
        })
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 필수 필드 검증
    if (!formData.title || !(selectedJobSub?.nm || formData.category) || !formData.company || !formData.location || !formData.description) {
      alert('모든 필수 항목을 입력해주세요.')
      return
    }
    // 길이 검증(백엔드 varchar(255) 초과 방지)
    const over = (label: string, v: any) => String(v ?? '').length > MAX_VARCHAR
    const payloadCategoryName = (selectedJobSub?.nm === '전체'
      ? (jobMainCats.find(m => m.cd === selectedJobMainCd)?.nm || formData.category)
      : (selectedJobSub?.nm || formData.category))
    const lengthErrors: string[] = []
    if (over('직무 제목', formData.title)) lengthErrors.push('직무 제목')
    if (over('직업 카테고리', payloadCategoryName)) lengthErrors.push('직업 카테고리')
    if (over('회사명', formData.company)) lengthErrors.push('회사명')
    if (over('위치', formData.location)) lengthErrors.push('위치')
    if (over('직무 설명', formData.description)) lengthErrors.push('직무 설명')
    if (over('기타 요구사항', formData.otherRequirement)) lengthErrors.push('기타 요구사항')
    if (over('급여', formData.salary)) lengthErrors.push('급여')
    if (over('급여 유형', formData.salaryType)) lengthErrors.push('급여 유형')
    if (lengthErrors.length > 0) {
      alert(`다음 항목의 길이가 너무 깁니다(최대 ${MAX_VARCHAR}자):\n- ${lengthErrors.join('\n- ')}`)
      return
    }
    
    // 근무 날짜 검증
    if (formData.workingDays.length === 0) {
      alert('근무 날짜를 최소 1일 이상 선택해주세요.')
      setShowCalendar(true)
      return
    }
    
    // 근무 시간 검증
    if (!formData.startTime || !formData.endTime) {
      alert('시작 시간과 종료 시간을 모두 입력해주세요.')
      return
    }
    
    if (formData.startTime >= formData.endTime) {
      alert('종료 시간은 시작 시간보다 늦어야 합니다.')
      return
    }
    
    try {
      const employerId = localStorage.getItem('userId')
      if (!employerId) {
        alert('로그인이 필요합니다.')
        navigate('/login/employer')
        return
      }

      // 파생 필드 만들기
      const startM = (() => { const [h,m] = (formData.startTime||'00:00').split(':').map(Number); return h*60+(m||0) })()
      const endM = (() => { const [h,m] = (formData.endTime||'00:00').split(':').map(Number); return h*60+(m||0) })()
      const diffMin = Math.max(0, endM - startM)
      const toHHMM = (t: string) => (t && t.length >= 5) ? t.slice(0, 5) : (t || '00:00')
      const startTimeSec = toHHMM(formData.startTime)
      const endTimeSec = toHHMM(formData.endTime)
      const workHoursStr = `${startTimeSec}~${endTimeSec}`
      const jobTypeDerived = diffMin >= 480 ? '풀타임' : '파트타임'
      const postedDateIso = new Date().toISOString()

      // workDays 200자 제한 안전 처리(보수적)
      const buildWorkDaysSafe = (days: string[]): string => {
        let acc = ''
        for (let i = 0; i < days.length; i++) {
          const token = days[i]
          const next = acc ? acc + ',' + token : token
          if (next.length > MAX_WORKDAYS_LEN) break
          acc = next
        }
        return acc
      }
      const originalWorkDaysJoined = formData.workingDays.join(',')
      const workDaysJoined = buildWorkDaysSafe(formData.workingDays)
      if (workDaysJoined.length < originalWorkDaysJoined.length) {
        alert(`선택한 근무 날짜가 너무 많아 일부 날짜는 저장에서 제외됩니다.\n최대 ${MAX_WORKDAYS_LEN}자 제한으로 전송 가능한 범위만 저장합니다.`)
      }

      // 전송 페이로드 구성(백엔드 기대 스키마와 맞춤)
      const payload = {
        title: formData.title.slice(0, MAX_VARCHAR),
        category: (selectedJobSub?.nm === '전체'
          ? (jobMainCats.find(m => m.cd === selectedJobMainCd)?.nm || formData.category)
          : (selectedJobSub?.nm || formData.category)).slice(0, MAX_VARCHAR),
        categoryCode: (selectedJobSub?.cd || '').slice(0, MAX_VARCHAR),
        categoryName: (selectedJobSub?.nm === '전체'
          ? (jobMainCats.find(m => m.cd === selectedJobMainCd)?.nm || formData.category)
          : (selectedJobSub?.nm || formData.category)).slice(0, MAX_VARCHAR),
        company: formData.company.slice(0, MAX_VARCHAR),
        location: (selectedRegion === '서울' && selectedDistrict === '전체' && selectedDong === '전체') ? '' : formData.location.slice(0, MAX_VARCHAR),
        region: selectedRegion.slice(0, MAX_VARCHAR),
        district: selectedDistrict.slice(0, MAX_VARCHAR),
        dong: (selectedDong || '').slice(0, MAX_VARCHAR),
        addressDetail: formData.addressDetail.slice(0, MAX_VARCHAR),
        description: formData.description.slice(0, MAX_VARCHAR),
        // 배열 전송(백엔드가 ArrayList를 기대)
        qualifications: formData.qualifications
          .filter(q => q.trim() !== '')
          .map(q => q.slice(0, 60)),
        requirements: formData.requirements.filter(r => r !== '기타(직접입력)'),
        otherRequirement: formData.otherRequirement 
          ? formData.otherRequirement.replace(/^기타\s*:?\s*/i, '').trim().slice(0, MAX_VARCHAR)
          : '',
        // 백엔드 컬럼명과 매핑: work_days / work_hours 로 매핑될 수 있도록 키 이름 맞춤
        workDays: workDaysJoined,
        work_days: workDaysJoined, // alias for backend snake_case
        workHours: workHoursStr,
        work_hours: workHoursStr, // alias for backend snake_case
        startTime: startTimeSec,
        endTime: endTimeSec,
        salary: formData.salary.slice(0, MAX_VARCHAR),
        salaryType: formData.salaryType.slice(0, MAX_VARCHAR),
        deadline: formData.deadline || null,
        gender: formData.gender.slice(0, MAX_VARCHAR),
        age: formData.age.slice(0, MAX_VARCHAR),
        education: formData.education.slice(0, MAX_VARCHAR),
        // 기본 상태/타입/날짜
        status: 'OPEN',
        e_status: 'OPEN', // alias for backend snake_case naming
        jobType: jobTypeDerived,
        job_type: jobTypeDerived, // alias
        postedDate: postedDateIso,
        posted_date: postedDateIso, // alias
        created_at: postedDateIso,
        updated_at: postedDateIso,
        employer_id: Number(employerId),
        // 관측용 초기값
        views: 0,
      }

      // 백엔드 API 호출
      const response = await fetch(`/api/employer/jobs/${employerId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (response.ok) {
        alert('일자리 공고가 등록되었습니다!')
        navigate('/employer/jobs')
      } else {
        console.warn('[job posting] payload=', payload)
        try {
          alert(data.message || data.error || `공고 등록에 실패했습니다. (HTTP ${response.status})`)
        } catch {
          try {
            const text = await response.text()
            alert(text || `공고 등록에 실패했습니다. (HTTP ${response.status})`)
          } catch {
            alert(`공고 등록에 실패했습니다. (HTTP ${response.status})`)
          }
        }
      }
    } catch (error) {
      console.error('공고 등록 에러:', error)
      alert('공고 등록 중 오류가 발생했습니다. 다시 시도해주세요.')
    }
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button
          onClick={() => navigate('/employer/jobs')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#666'
          }}
        >
          <ArrowLeft size={16} />
          뒤로가기
        </button>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ClipboardList size={28} style={{ color: '#2196f3' }} />
          일자리 공고 등록
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* 기본 정보 */}
        <section style={{
          marginBottom: '32px',
          padding: '24px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={20} style={{ color: '#4caf50' }} />
            기본 정보
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                직업 카테고리 <span style={{ color: '#f44336' }}>*</span>
              </label>
              <button
                type="button"
                onClick={() => { setShowCategoryPopup(!showCategoryPopup); ensureLoadMainCats(); if (selectedJobMainCd) ensureLoadSubCats(selectedJobMainCd) }}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>
                  {(() => {
                    const subNm = selectedJobSub?.nm
                    if (subNm) {
                      return subNm === '전체'
                        ? (jobMainCats.find(m => m.cd === selectedJobMainCd)?.nm || '전체')
                        : subNm
                    }
                    return formData.category || '카테고리 선택'
                  })()}
                </span>
                <ChevronDown size={18} color="#999" />
              </button>
              {showCategoryPopup && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  width: 640,
                  backgroundColor: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: 8,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  padding: 12,
                  zIndex: 20
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: '#999' }}>하위(소분류)에서 1개 선택</div>
                    <button
                      type="button"
                      onClick={() => { setSelectedJobMainCd(jobMainCats[0]?.cd || ''); setSelectedJobSub(null) }}
                      style={{ border: 'none', background: 'transparent', color: '#2196f3', cursor: 'pointer', fontSize: 12 }}
                    >
                      초기화
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 12, maxHeight: 320 }}>
                    <div style={{ borderRight: '1px solid #eee', overflowY: 'auto', maxHeight: 220 }}>
                      {jobMainCats.map(main => (
                        <button
                          type="button"
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
                    <div style={{ overflowY: 'auto', maxHeight: 220 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(140px, 1fr))', gap: 6 }}>
                        {(jobSubCatsByMain[selectedJobMainCd] || []).map(sub => {
                          const selected = selectedJobSub?.nm === sub.nm
                          return (
                            <label key={sub.cd} style={{
                              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px',
                              border: selected ? '1px solid #2196f3' : '1px solid #e0e0e0',
                              background: selected ? '#e3f2fd' : '#fff', borderRadius: 6, cursor: 'pointer'
                            }}>
                              <input
                                type="radio"
                                name="categorySub"
                                checked={selected}
                                onChange={() => {
                                  setSelectedJobSub({ cd: sub.cd, nm: sub.nm })
                                  const mainNm = jobMainCats.find(m => m.cd === selectedJobMainCd)?.nm || ''
                                  const nameToSet = sub.nm === '전체' ? (mainNm || '전체') : sub.nm
                                  setFormData(prev => ({ ...prev, category: nameToSet }))
                                  setShowCategoryPopup(false)
                                }}
                              />
                              <span style={{ fontSize: 13, color: selected ? '#2196f3' : '#333', whiteSpace: 'nowrap' }}>{sub.nm}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                직무 제목 <span style={{ color: '#f44336' }}>*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="예: 데이터 입력 전문가"
                required
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                위치 <span style={{ color: '#f44336' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => { setShowRegionPopup(!showRegionPopup) }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    justifyContent: 'space-between'
                  }}
                >
                  <span
                    style={
                      selectedRegion === '서울' && selectedDistrict === '전체' && selectedDong === '전체'
                        ? { color: '#bdbdbd', fontSize: '16px' }
                        : { color: '#333', fontSize: '16px', fontWeight: '500' }
                    }
                  >
                    {selectedRegion === '서울' && selectedDistrict === '전체' && selectedDong === '전체'
                      ? '근무지를 입력하세요'
                      : ([selectedRegion, selectedDistrict, selectedDong].filter(Boolean).join(' ') + (formData.addressDetail ? ' ' + formData.addressDetail : ''))}
                  </span>
                  <ChevronDown size={18} color="#999" />
                </button>
              </div>
              {showRegionPopup && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  width: 'min(900px, calc(100vw - 32px))',
                  backgroundColor: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: 8,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  padding: 12,
                  zIndex: 20
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '200px 240px 1fr', gap: 12 }}>
                    {/* 시/도 */}
                    <div style={{ borderRight: '1px solid #eee', overflowY: 'auto', maxHeight: 220 }}>
                      {regions.map(region => (
                        <button
                          type="button"
                          key={region.code}
                          onClick={() => { 
                            setSelectedRegion(region.name); 
                            setSelectedDistrict(''); 
                            setSelectedDong(''); 
                            setFormData(prev => ({ ...prev, location: region.name })) 
                          }}
                          style={{
                            width: '100%', textAlign: 'left', padding: '8px 10px', border: 'none',
                            background: selectedRegion === region.name ? '#e3f2fd' : 'transparent',
                            color: selectedRegion === region.name ? '#2196f3' : '#333', cursor: 'pointer', borderRadius: 6
                          }}
                        >
                          {region.name}
                        </button>
                      ))}
                    </div>
                    {/* 구/군 */}
                    <div style={{ borderRight: '1px solid #eee', overflowY: 'auto', maxHeight: 220 }}>
                      {districts.map(district => (
                        <button
                          type="button"
                          key={district.code}
                          onClick={() => { 
                            setSelectedDistrict(district.name); 
                            setSelectedDong(''); 
                            setFormData(prev => ({ ...prev, location: `${selectedRegion} ${district.name}` })) 
                          }}
                          style={{
                            width: '100%', textAlign: 'left', padding: '8px 10px', border: 'none',
                            background: selectedDistrict === district.name ? '#e3f2fd' : 'transparent',
                            color: selectedDistrict === district.name ? '#2196f3' : '#333', cursor: 'pointer', borderRadius: 6
                          }}
                        >
                          {district.name}
                        </button>
                      ))}
                    </div>
                    {/* 동 */}
                    <div style={{ overflowY: 'auto', overflowX: 'hidden', maxHeight: '60vh', minWidth: 0 }}>
                      {selectedDistrict ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(180px, 1fr))', gap: 8 }}>
                          {(dongs.length > 0 ? dongs : [{ code: '', name: '전체' }]).map(dong => {
                            const selected = (selectedDong || '') === (dong.name === '전체' ? '' : dong.name)
                            return (
                              <label key={dong.code || dong.name} style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px',
                                border: selected ? '1px solid #2196f3' : '1px solid #e0e0e0',
                                background: selected ? '#e3f2fd' : '#fff', borderRadius: 6, cursor: 'pointer'
                              }}>
                                <input
                                  type="radio"
                                  name="dong"
                                  checked={selected}
                                  onChange={() => { 
                                    setSelectedDong(dong.name === '전체' ? '' : dong.name);
                                    setFormData(prev => ({ ...prev, location: [selectedRegion, selectedDistrict, dong.name === '전체' ? '' : dong.name, formData.addressDetail].filter(Boolean).join(' ') }))
                                  }}
                                />
                                <span style={{ fontSize: 13, color: selected ? '#2196f3' : '#333', whiteSpace: 'nowrap' }}>{dong.name}</span>
                              </label>
                            )
                          })}
                        </div>
                      ) : (
                        <div style={{ fontSize: 13, color: '#999' }}>구/군을 먼저 선택하세요</div>
                      )}
                      {/* 상세 주소 입력란 */}
                      <div style={{ marginTop: 16 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                          상세 주소
                        </label>
                        <input
                          type="text"
                          name="addressDetail"
                          value={formData.addressDetail}
                          onChange={e => {
                            const value = e.target.value.slice(0, MAX_VARCHAR)
                            setFormData(prev => ({
                              ...prev,
                              addressDetail: value,
                              location: [selectedRegion, selectedDistrict, selectedDong, value].filter(Boolean).join(' ')
                            }))
                          }}
                          placeholder="상세 주소를 입력하세요 (예: 123-45 롯데백화점 5층)"
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '6px',
                            fontSize: '16px',
                            marginTop: '8px'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={() => { setShowRegionPopup(false) }}
                      style={{ padding: '8px 14px', border: 'none', borderRadius: 6, background: '#2196f3', color: '#fff', cursor: 'pointer' }}
                    >
                      적용
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                회사명 <span style={{ color: '#f44336' }}>*</span>
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="회사명을 입력하세요"
                required
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

        </section>

        {/* 직무 설명 */}
        <section style={{
          marginBottom: '32px',
          padding: '24px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} style={{ color: '#ff9800' }} />
            직무 설명
          </h2>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              직무 설명 <span style={{ color: '#f44336' }}>*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="회사 소개 및 직무에 대한 상세한 설명을 입력하세요"
              required
              rows={6}
              maxLength={255}
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
            <div style={{ fontSize: '12px', color: '#999', textAlign: 'right' }}>
              {formData.description.length} / 255
            </div>
          </div>
        </section>

        {/* 필요 자격 */}
        <section style={{
          marginBottom: '32px',
          padding: '24px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={20} style={{ color: '#9c27b0' }} />
            필요 자격
          </h2>
          
          {formData.qualifications.map((item, index) => (
            <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                value={item}
                onChange={(e) => handleArrayChange(index, e.target.value, 'qualifications')}
                placeholder="필요 자격을 입력하세요"
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
              {formData.qualifications.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayItem(index, 'qualifications')}
                  style={{
                    padding: '12px',
                    border: '1px solid #f44336',
                    borderRadius: '6px',
                    backgroundColor: '#ffffff',
                    color: '#f44336',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <X size={20} />
                </button>
              )}
            </div>
          ))}
          
          <button
            type="button"
            onClick={() => addArrayItem('qualifications')}
            style={{
              padding: '8px 16px',
              border: '1px dashed #2196f3',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              color: '#2196f3',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            + 항목 추가
          </button>
        </section>

        {/* 지원 자격 */}
        <section style={{
          marginBottom: '32px',
          padding: '24px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={20} style={{ color: '#00bcd4' }} />
            지원 자격
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                성별 <span style={{ color: '#f44336' }}>*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px',
                  backgroundColor: '#fff',
                  cursor: 'pointer'
                }}
              >
                <option value="무관">무관</option>
                <option value="남성">남성</option>
                <option value="여성">여성</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                연령 <span style={{ color: '#f44336' }}>*</span>
              </label>
              <select
                name="age"
                value={formData.age}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px',
                  backgroundColor: '#fff',
                  cursor: 'pointer'
                }}
              >
                <option value="무관">무관</option>
                <option value="20대">20대</option>
                <option value="30대">30대</option>
                <option value="40대">40대</option>
                <option value="50대">50대</option>
                <option value="60대 이상">60대 이상</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                학력 <span style={{ color: '#f44336' }}>*</span>
              </label>
              <select
                name="education"
                value={formData.education}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px',
                  backgroundColor: '#fff',
                  cursor: 'pointer'
                }}
              >
                <option value="무관">무관</option>
                <option value="고졸">고졸</option>
                <option value="대졸">대졸</option>
                <option value="석사">석사</option>
                <option value="박사">박사</option>
              </select>
            </div>
            <div>
              {/* 추가 자격 조건 영역 */}
            </div>
          </div>
        </section>

        {/* 구직자 준비물/능력 */}
        <section style={{
          marginBottom: '32px',
          padding: '24px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={20} style={{ color: '#ff9800' }} />
            구직자가 준비해야 할 준비물이나 능력이 있다면 선택해주세요! (최대 5개)
          </h2>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
            필요 없다면 "건너뛰기"를 선택하세요.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            {requirementOptions.map((option) => (
              <label
                key={option}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  border: formData.requirements.includes(option) ? '2px solid #2196f3' : '1px solid #e0e0e0',
                  borderRadius: '6px',
                  backgroundColor: formData.requirements.includes(option) ? '#e3f2fd' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!formData.requirements.includes(option)) {
                    e.currentTarget.style.borderColor = '#2196f3'
                    e.currentTarget.style.backgroundColor = '#f5f5f5'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!formData.requirements.includes(option)) {
                    e.currentTarget.style.borderColor = '#e0e0e0'
                    e.currentTarget.style.backgroundColor = '#ffffff'
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.requirements.includes(option)}
                  onChange={() => handleRequirementChange(option)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '14px', userSelect: 'none' }}>{option}</span>
              </label>
            ))}
            
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                border: formData.requirements.length === 0 ? '2px solid #4caf50' : '1px solid #e0e0e0',
                borderRadius: '6px',
                backgroundColor: formData.requirements.length === 0 ? '#e8f5e9' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (formData.requirements.length > 0) {
                  e.currentTarget.style.borderColor = '#4caf50'
                  e.currentTarget.style.backgroundColor = '#f5f5f5'
                }
              }}
              onMouseLeave={(e) => {
                if (formData.requirements.length > 0) {
                  e.currentTarget.style.borderColor = '#e0e0e0'
                  e.currentTarget.style.backgroundColor = '#ffffff'
                }
              }}
            >
              <input
                type="checkbox"
                checked={formData.requirements.length === 0}
                onChange={() => handleRequirementChange('건너뛰기')}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer'
                }}
              />
              <span style={{ fontSize: '14px', userSelect: 'none', color: '#4caf50', fontWeight: '500' }}>건너뛰기</span>
            </label>
          </div>

          {formData.requirements.includes('기타(직접입력)') && (
            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                기타 내용 입력
              </label>
              <input
                type="text"
                value={formData.otherRequirement}
                onChange={(e) => setFormData({ ...formData, otherRequirement: e.target.value })}
                placeholder="기타 준비물이나 능력을 입력하세요"
              maxLength={255}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>
          )}

          {formData.requirements.length > 0 && formData.requirements.length <= 5 && (
            <p style={{ fontSize: '12px', color: '#666', marginTop: '12px' }}>
              선택된 항목: {formData.requirements.length}개 / 5개
            </p>
          )}
        </section>

        {/* 근무 시간 설정 */}
        <section style={{
          marginBottom: '32px',
          padding: '24px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>근무 시간 설정</h2>
          
          {/* 근무 날짜 선택 */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              근무 날짜 선택 <span style={{ color: '#f44336' }}>*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                fontSize: '16px',
                textAlign: 'left',
                marginBottom: '12px'
              }}
            >
              {formData.workingDays.length > 0 
                ? `${formData.workingDays.length}일 선택됨 (클릭하여 수정)`
                : '근무 날짜를 선택하세요'}
            </button>

            {showCalendar && (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
                padding: '20px',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <button
                    type="button"
                    onClick={prevMonth}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      backgroundColor: '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    ←
                  </button>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
                  </h3>
                  <button
                    type="button"
                    onClick={nextMonth}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      backgroundColor: '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    →
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
                  {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                    <div key={day} style={{
                      textAlign: 'center',
                      padding: '8px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: day === '일' ? '#f44336' : day === '토' ? '#2196f3' : '#333'
                    }}>
                      {day}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                  {getDaysInMonth(currentMonth).map((date, index) => {
                    if (!date) {
                      return <div key={index} style={{ padding: '8px' }} />
                    }
                    const selected = isSelected(date)
                    const today = isToday(date)
                    const past = isPast(date)
                    
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => !past && toggleWorkingDay(date)}
                        disabled={past}
                        style={{
                          padding: '8px',
                          border: selected ? '2px solid #2196f3' : '1px solid #e0e0e0',
                          borderRadius: '6px',
                          backgroundColor: selected ? '#e3f2fd' : past ? '#f5f5f5' : '#ffffff',
                          cursor: past ? 'not-allowed' : 'pointer',
                          color: past ? '#999' : selected ? '#2196f3' : '#333',
                          fontSize: '14px',
                          fontWeight: today ? 'bold' : 'normal',
                          position: 'relative'
                        }}
                      >
                        {date.getDate()}
                        {today && (
                          <span style={{
                            position: 'absolute',
                            bottom: '2px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '4px',
                            height: '4px',
                            backgroundColor: '#2196f3',
                            borderRadius: '50%'
                          }} />
                        )}
                      </button>
                    )
                  })}
                </div>

                {formData.workingDays.length > 0 && (
                  <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
                    <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>선택된 날짜:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {formData.workingDays.map((dateStr) => {
                        const date = new Date(dateStr)
                        return (
                          <span
                            key={dateStr}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#e3f2fd',
                              color: '#2196f3',
                              borderRadius: '20px',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            {date.getMonth() + 1}/{date.getDate()}
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  workingDays: formData.workingDays.filter(d => d !== dateStr)
                                })
                              }}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: '#2196f3',
                                cursor: 'pointer',
                                padding: 0,
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <X size={14} />
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 근무 시간 설정 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                시작 시간 <span style={{ color: '#f44336' }}>*</span>
              </label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
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
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                종료 시간 <span style={{ color: '#f44336' }}>*</span>
              </label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                required
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
        </section>

        {/* 급여 */}
        <section style={{
          marginBottom: '32px',
          padding: '24px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>급여</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                급여 유형 <span style={{ color: '#f44336' }}>*</span>
              </label>
              <select
                name="salaryType"
                value={formData.salaryType}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              >
                <option value="시급">시급</option>
                <option value="일급">일급</option>
                <option value="주급">주급</option>
                <option value="월급">월급</option>
                <option value="연봉">연봉</option>
                <option value="협의">협의</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                급여 <span style={{ color: '#f44336' }}>*</span>
              </label>
              <input
                type="text"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                placeholder="예: 35,000원 - 45,000원 (경력에 따라 협의)"
                required
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
        </section>

        {/* 마감일 */}
        <section style={{
          marginBottom: '32px',
          padding: '24px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>마감일</h2>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              지원 마감일
            </label>
            <input
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '16px'
              }}
            />
          </div>
        </section>

        {/* 버튼 */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px' }}>
          <button
            type="button"
            onClick={() => navigate('/employer/jobs')}
            style={{
              padding: '12px 24px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <X size={20} />
            취소
          </button>
          <button
            type="submit"
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: '#2196f3',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Save size={20} />
            공고 등록
          </button>
        </div>
      </form>
    </div>
  )
}

export default JobPosting

