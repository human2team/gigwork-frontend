import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, User, MapPin, Briefcase, Award, MessageSquare, ChevronDown, X } from 'lucide-react'

function CandidateSearch() {
  const navigate = useNavigate()
  const employerUserId = localStorage.getItem('userId') || ''
  const [employerProfileId, setEmployerProfileId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [locationFilter, setLocationFilter] = useState('전체')
  const [licenseFilter, setLicenseFilter] = useState('전체')
  const [minSuitability, setMinSuitability] = useState(0)
  const [candidates, setCandidates] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string>('')
  const [busyIds, setBusyIds] = useState<number[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [proposedIds, setProposedIds] = useState<number[]>(() => {
    const key = employerUserId ? `proposedIds:${employerUserId}` : 'proposedIds:guest'
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  });
  // JobSearch 스타일 컨트롤 바용
  const [showRegionPopup, setShowRegionPopup] = useState(false)
  const [showJobPopup, setShowJobPopup] = useState(false)
  const regionOptions = [
    '전체','서울','경기','인천','부산','대구','광주','대전','울산','세종',
    '강원','충북','충남','전북','전남','경북','경남','제주'
  ]
  // 업직종 2단(백엔드 연동)
  type CategoryItem = { cd: string; nm: string }
  const [jobMainCats, setJobMainCats] = useState<CategoryItem[]>([])
  const [jobSubCatsByMain, setJobSubCatsByMain] = useState<Record<string, CategoryItem[]>>({})
  const [selectedJobMainCd, setSelectedJobMainCd] = useState<string>('')
  const [selectedJobSubcats, setSelectedJobSubcats] = useState<string[]>([])
  const [excludeBar, setExcludeBar] = useState(false)
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

  const setProposedIdsWithStorage = (updater: number[] | ((prev: number[]) => number[])) => {
    setProposedIds(prev => {
      const next = typeof updater === 'function' ? (updater as (p: number[]) => number[])(prev) : updater
      const key = employerUserId ? `proposedIds:${employerUserId}` : 'proposedIds:guest'
      localStorage.setItem(key, JSON.stringify(next))
      return next
    })
  }

  useEffect(() => {
    // 사업자 프로필 ID 동기화 (proposals API는 EmployerProfile ID 요구)
    const fetchEmployerProfileId = async () => {
      const userId = localStorage.getItem('userId')
      const userType = (localStorage.getItem('userType') || '').toUpperCase()
      if (!userId || userType !== 'EMPLOYER') {
        setEmployerProfileId('')
        return
      }
      try {
        const res = await fetch(`/api/employer/profile/${userId}`)
        if (res.ok) {
          const data = await res.json()
          if (data && data.id) {
            setEmployerProfileId(String(data.id))
          } else {
            setEmployerProfileId('')
          }
        } else {
          setEmployerProfileId('')
        }
      } catch {
        setEmployerProfileId('')
      }
    }
    fetchEmployerProfileId()
  }, [employerUserId])

  useEffect(() => {
    // API 호출로 후보자 목록을 불러옴
    const fetchCandidates = async () => {
      try {
        const params = new URLSearchParams()
        if (searchQuery) params.append('search', searchQuery)
        if (locationFilter !== '전체') params.append('location', locationFilter)
        if (licenseFilter !== '전체') params.append('license', licenseFilter)
        if (minSuitability > 0) params.append('minSuitability', String(minSuitability))
        const response = await fetch(`/api/candidates?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setCandidates(data)
        } else {
          setCandidates([])
        }
      } catch (e) {
        setCandidates([])
      }
    }
    fetchCandidates()
    // 사업자 공고 목록 동기화
    const fetchEmployerJobs = async () => {
      const currentEmployerId = localStorage.getItem('userId')
      const userType = (localStorage.getItem('userType') || '').toUpperCase()
      if (!currentEmployerId || userType !== 'EMPLOYER') {
        setJobs([])
        setSelectedJobId('')
        return
      }
      try {
        const res = await fetch(`/api/employer/jobs/${currentEmployerId}`)
        if (res.ok) {
          const data = await res.json()
          setJobs(Array.isArray(data) ? data : [])
          if (Array.isArray(data) && data.length > 0 && !selectedJobId) {
            setSelectedJobId(String(data[0].id))
          }
        } else {
          setJobs([])
        }
      } catch {
        setJobs([])
      }
    }
    fetchEmployerJobs()
    // 이미 제안한 후보자 목록 불러오기 (로그인된 employerId 필요)
    const fetchProposed = async () => {
      const currentEmployerId = employerProfileId || ''
      if (!currentEmployerId) {
        setProposedIdsWithStorage([])
        return;
      }
      try {
        // 가능한 엔드포인트 순회. 404를 줄이기 위해 가장 일반적인 쿼리파라미터 형태를 먼저 시도
        const tryUrls = [
          `/api/proposals?employerId=${currentEmployerId}`,
          `/api/proposals/employer/${currentEmployerId}`,
          `/api/proposals/employer/${currentEmployerId}/jobseekers`
        ];
        let fetched: any[] | null = null;
        let lastStatus: number | undefined = undefined;
        for (const url of tryUrls) {
          const res = await fetch(url);
          lastStatus = res.status;
          if (!res.ok) continue;
          const data = await res.json().catch(() => []);
          if (Array.isArray(data)) {
            fetched = data;
            break;
          } else if (Array.isArray((data as any).content)) {
            // 페이지네이션 형태(content 필드)
            fetched = (data as any).content;
            break;
          }
        }
        if (fetched) {
          const ids = fetched.map((p: any) => {
            const raw =
              p.jobseekerId ??
              p.jobSeekerId ??
              p.jobseekerID ??
              p.jobSeekerID ??
              p.jobseeker?.id ??
              p.jobSeeker?.id;
            const num = typeof raw === 'string' ? parseInt(raw, 10) : raw;
            return Number.isFinite(num) ? num : null;
          }).filter((id: any) => id !== null) as number[];
          setProposedIdsWithStorage(ids);
        } else {
          console.warn('proposals fetch failed; last status:', lastStatus);
          // 서버에서 제공하지 않으면 DB 기준 동기화가 불가 → 로컬 상태를 유지
        }
      } catch (e) {
        console.warn('proposals fetch error:', e);
      }
    };
    fetchProposed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, locationFilter, licenseFilter, minSuitability, employerUserId, employerProfileId, selectedJobId])

  const getSuitabilityColor = (score: number) => {
    if (score >= 85) return '#4caf50'
    if (score >= 75) return '#ff9800'
    return '#f44336'
  }

  // 희망 근무지역 헬퍼 (DB 스키마/케이스/중첩 객체 다양성 고려)
  const pickFirst = (obj: any, paths: string[][]): string => {
    for (const p of paths) {
      let cur = obj
      for (const key of p) {
        if (cur == null) { cur = undefined; break }
        cur = cur[key]
      }
      if (cur != null && cur !== '') return String(cur)
    }
    return ''
  }
  const getPreferredRegion = (c: any): string => pickFirst(c, [
    ['preferredRegion'], ['preferred_region'], ['preferredregion'],
    ['profile','preferredRegion'], ['profile','preferred_region'],
    ['jobseekerProfile','preferredRegion'], ['jobseekerProfile','preferred_region'],
  ])
  const getPreferredDistrict = (c: any): string => pickFirst(c, [
    ['preferredDistrict'], ['preferred_district'], ['preferreddistrict'],
    ['profile','preferredDistrict'], ['profile','preferred_district'],
    ['jobseekerProfile','preferredDistrict'], ['jobseekerProfile','preferred_district'],
  ])
  const getPreferredDong = (c: any): string => pickFirst(c, [
    ['preferredDong'], ['preferred_dong'], ['preferreddong'],
    ['profile','preferredDong'], ['profile','preferred_dong'],
    ['jobseekerProfile','preferredDong'], ['jobseekerProfile','preferred_dong'],
  ])
  const getPreferredLocationText = (c: any): string => {
    const region = getPreferredRegion(c)
    const district = getPreferredDistrict(c)
    const dong = getPreferredDong(c)
    const parts = [region, district, (dong && dong !== '전체') ? dong : ''].filter(Boolean)
    if (parts.length === 0) return c?.location || '희망 지역 정보 없음'
    return parts.join(' ')
  }

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         candidate.experience?.some((exp: string) => exp.toLowerCase().includes(searchQuery.toLowerCase()))
    const preferredText = getPreferredLocationText(candidate)
    const matchesLocation = locationFilter === '전체' || preferredText.includes(locationFilter)
    const matchesLicense = licenseFilter === '전체' || candidate.licenses?.some((license: string) => license.includes(licenseFilter))
    const matchesSuitability = candidate.suitability >= minSuitability
    // 업직종 카테고리 매칭(유연한 필드 대응)
    const rawCats: any[] = []
    if ((candidate as any).category) rawCats.push((candidate as any).category)
    if ((candidate as any).categories) rawCats.push(...(candidate as any).categories)
    if ((candidate as any).desiredCategory) rawCats.push((candidate as any).desiredCategory)
    if ((candidate as any).desiredCategories) rawCats.push(...(candidate as any).desiredCategories)
    if ((candidate as any).targetCategories) rawCats.push(...(candidate as any).targetCategories)
    const catTexts = rawCats
      .flat()
      .filter((v) => v != null)
      .map((v) => String(v).toLowerCase())
    const subcatMatch =
      selectedJobSubcats.length === 0 ||
      selectedJobSubcats.some(sub => catTexts.some(ct => ct.includes(sub.toLowerCase())))
    const barExcludedOk = excludeBar ? catTexts.every(ct => !ct.includes('bar')) : true
    const matchesCategory = subcatMatch && barExcludedOk
    return matchesSearch && matchesLocation && matchesLicense && matchesSuitability && matchesCategory
  })

  return (
    <div>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '16px' }}>전체 인재</h1>

      {/* 컨트롤 바: 지역 / 검색어 */}
      <div style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        marginBottom: '12px',
        flexWrap: 'wrap',
        position: 'relative',
        paddingBottom: (showRegionPopup || showJobPopup) ? 320 : 0
      }}>
        {/* 지역 */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowRegionPopup(!showRegionPopup)}
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
            지역{locationFilter !== '전체' ? `(${locationFilter})` : ''}
            <ChevronDown size={16} />
          </button>
          {showRegionPopup && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              width: 260,
              backgroundColor: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              padding: 12,
              zIndex: 10
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: '#999' }}>한 지역 선택</div>
                <button
                  type="button"
                  onClick={() => setLocationFilter('전체')}
                  style={{ border: 'none', background: 'transparent', color: '#2196f3', cursor: 'pointer', fontSize: 12 }}
                >
                  초기화
                </button>
              </div>
              <div style={{ overflowY: 'auto', maxHeight: 180 }}>
                {regionOptions.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { setLocationFilter(r); setShowRegionPopup(false) }}
                    style={{
                      width: '100%', textAlign: 'left', padding: '8px 10px', border: 'none',
                      background: locationFilter === r ? '#e3f2fd' : 'transparent',
                      color: locationFilter === r ? '#2196f3' : '#333', cursor: 'pointer', borderRadius: 6
                    }}
                  >
                    {r}
                  </button>
                ))}
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
            placeholder="이름, 경력, 기술 검색"
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
        {/* 보조 필터: 자격증, 적합도 */}
        <select
          value={licenseFilter}
          onChange={(e) => setLicenseFilter(e.target.value)}
          style={{
            padding: '10px 12px',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            backgroundColor: '#ffffff',
            fontSize: 14
          }}
        >
          <option>전체</option>
          <option>운전면허증</option>
          <option>포크레인 면허</option>
          <option>바리스타 자격증</option>
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#666' }}>최소 적합도</span>
          <input
            type="range"
            min={0}
            max={100}
            value={minSuitability}
            onChange={(e) => setMinSuitability(parseInt(e.target.value))}
          />
          <span style={{ fontSize: 12, color: '#333', minWidth: 40, textAlign: 'right' }}>{minSuitability}%</span>
        </div>
      </div>

      {/* 보조 바: 통계 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ color: '#666', fontSize: '16px' }}>
          총 {filteredCandidates.length}명의 인재
        </div>
      </div>

      {/* 기존 상단 필터 박스 영역은 제거하고, 공고 선택만 유지 */}
      <div style={{ marginBottom: 12 }}>
        {/* 제안 보낼 공고 선택 (사업자만) */}
        {jobs.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
            <label style={{ fontSize: '14px', fontWeight: 600, minWidth: '120px' }}>제안 보낼 공고</label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              style={{
                padding: '12px',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '16px',
                backgroundColor: '#ffffff',
                minWidth: '280px'
              }}
            >
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 테이블 스타일 목록 */}
      {filteredCandidates.length === 0 ? (
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
            gridTemplateColumns: '1.6fr 2fr 1.2fr 0.8fr 1fr',
            padding: '12px 16px',
            backgroundColor: '#fafafa',
            borderBottom: '1px solid #e0e0e0',
            fontSize: '14px',
            color: '#666',
            fontWeight: 600
          }}>
            <div>이름 / 경력</div>
            <div>이력서 요약</div>
            <div>희망근무지역</div>
            <div>수정일</div>
            <div style={{ textAlign: 'right' }}>액션</div>
          </div>
          {/* Rows */}
          {filteredCandidates.map((candidate) => {
            const updatedAgo = candidate.updatedAt ? candidate.updatedAt : '최근'
            return (
              <div
                key={candidate.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.6fr 2fr 1.2fr 0.8fr 1fr',
                  padding: '14px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  alignItems: 'center'
                }}
              >
                {/* 이름/경력 */}
                <div
                  onClick={() => navigate(`/employer/candidates/${candidate.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, cursor: 'pointer' }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', background: '#e3f2fd',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto'
                  }}>
                    <User size={20} color="#2196f3" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: 15, color: '#222' }}>{candidate.name}</strong>
                      <span style={{ fontSize: 13, color: '#666' }}>({candidate.age}세)</span>
                      {proposedIds.includes(candidate.id) && (
                        <span style={{
                          padding: '2px 8px',
                          backgroundColor: '#e8f5e9',
                          color: '#2e7d32',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 600
                        }}>이미 제안함</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      적합도 <span style={{
                        padding: '2px 6px',
                        backgroundColor: '#e3f2fd',
                        color: '#2196f3',
                        borderRadius: 10,
                        fontWeight: 700
                      }}>{candidate.suitability}%</span>
                    </div>
                  </div>
                </div>
                {/* 요약 */}
                <div
                  onClick={() => navigate(`/employer/candidates/${candidate.id}`)}
                  style={{ fontSize: 14, color: '#555', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', cursor: 'pointer' }}
                >
                  {candidate.summary || candidate.experience?.[0] || '요약 정보가 없습니다.'}
                </div>
                {/* 희망지역 */}
                <div style={{ fontSize: 14, color: '#555' }}>
                  <MapPin size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  {getPreferredLocationText(candidate)}
                </div>
                {/* 수정일 */}
                <div style={{ fontSize: 13, color: '#999' }}>{updatedAgo}</div>
                {/* 액션 */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  {proposedIds.includes(candidate.id) ? (
                    <button
                      onClick={async () => {
                    if (!window.confirm(`${candidate.name}님에게 보낸 제안을 취소하시겠습니까?`)) return;
                    try {
                      const employerId = employerProfileId || ''
                      if (!selectedJobId) {
                        alert('먼저 상단에서 제안 보낼 공고를 선택하세요.');
                        return;
                      }
                      const jobId = selectedJobId;
                      const jobseekerId = candidate.id;
                      setBusyIds(prev => [...prev, candidate.id])
                      const res = await fetch(`/api/proposals?jobId=${jobId}&jobseekerId=${jobseekerId}&employerId=${employerId}`, {
                        method: 'DELETE'
                      });
                      setBusyIds(prev => prev.filter(id => id !== candidate.id))
                      if (res.ok) {
                        setProposedIdsWithStorage(prev => prev.filter(id => id !== candidate.id));
                        setToast({ message: '채용 제안이 취소되었습니다.', type: 'success' })
                        setTimeout(() => setToast(null), 2000)
                      } else {
                        // 실패해도 proposedIds에서 제거하여 버튼이 제안하기로 변경되게 함
                        setProposedIdsWithStorage(prev => prev.filter(id => id !== candidate.id));
                        const data = await res.json().catch(() => ({}));
                        setToast({ message: data.error || '채용 제안 취소에 실패했습니다.', type: 'error' })
                        setTimeout(() => setToast(null), 2500)
                      }
                    } catch (e) {
                      // 네트워크 등 예외 발생 시에도 proposedIds에서 제거
                      setProposedIdsWithStorage(prev => prev.filter(id => id !== candidate.id));
                      setToast({ message: '채용 제안 취소에 실패했습니다.', type: 'error' })
                      setTimeout(() => setToast(null), 2500)
                    }
                      }}
                      style={{
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: 6,
                        backgroundColor: '#bdbdbd',
                        color: '#ffffff',
                        cursor: busyIds.includes(candidate.id) ? 'not-allowed' : 'pointer',
                        fontSize: 13,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        opacity: busyIds.includes(candidate.id) ? 0.7 : 1
                      }}
                      disabled={busyIds.includes(candidate.id)}
                    >
                      <MessageSquare size={16} />
                      제안 취소
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                    if (!window.confirm(`${candidate.name}님에게 채용 제안을 보내시겠습니까?`)) return;
                    try {
                      const employerId = employerProfileId || ''
                      if (!employerId) {
                        alert('사업자로 로그인해주세요.');
                        return;
                      }
                      if (!selectedJobId) {
                        alert('먼저 상단에서 제안 보낼 공고를 선택하세요.');
                        return;
                      }
                      if (proposedIds.includes(candidate.id)) {
                        setToast({ message: '이미 제안한 지원자입니다.', type: 'error' })
                        setTimeout(() => setToast(null), 2000)
                        return;
                      }
                      const jobIdNum = parseInt(selectedJobId, 10);
                      const employerIdNum = parseInt(employerId, 10);
                      const jobseekerIdNum = parseInt(String(candidate.id), 10);
                      if (!Number.isFinite(jobIdNum) || !Number.isFinite(employerIdNum) || !Number.isFinite(jobseekerIdNum)) {
                        console.error('[proposals] invalid ids', { jobId: selectedJobId, employerId, jobseekerId: candidate.id });
                        alert('제안에 필요한 식별자가 올바르지 않습니다. 다시 로그인하거나 페이지를 새로고침 해주세요.');
                        return;
                      }
                      const jobId = String(jobIdNum);
                      const jobseekerId = String(jobseekerIdNum);
                      // 디버깅 로그
                      console.log('[proposals] POST ids', { jobId, jobseekerId, employerId });
                      setBusyIds(prev => [...prev, candidate.id])
                      const res = await fetch('/api/proposals', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: `jobId=${jobId}&jobseekerId=${jobseekerId}&employerId=${employerId}`
                      });
                      setBusyIds(prev => prev.filter(id => id !== candidate.id))
                      if (res.ok) {
                        setProposedIdsWithStorage(prev => [...prev, candidate.id]);
                        setToast({ message: '채용 제안이 성공적으로 전송되었습니다.', type: 'success' })
                        setTimeout(() => setToast(null), 2000)
                      } else {
                        const data = await res.json().catch(() => ({}));
                        console.warn('[proposals] POST failed', data);
                        setToast({ message: data.error || '채용 제안 전송에 실패했습니다.', type: 'error' })
                        setTimeout(() => setToast(null), 2500)
                      }
                    } catch (e) {
                      setToast({ message: '채용 제안 전송에 실패했습니다.', type: 'error' })
                      setTimeout(() => setToast(null), 2500)
                    }
                      }}
                      style={{
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: 6,
                        backgroundColor: proposedIds.includes(candidate.id) ? '#bdbdbd' : '#2196f3',
                        color: '#ffffff',
                        cursor: proposedIds.includes(candidate.id) || busyIds.includes(candidate.id) ? 'not-allowed' : 'pointer',
                        fontSize: 13,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        opacity: proposedIds.includes(candidate.id) || busyIds.includes(candidate.id) ? 0.7 : 1
                      }}
                      disabled={proposedIds.includes(candidate.id) || busyIds.includes(candidate.id)}
                    >
                      <MessageSquare size={16} />
                      제안하기
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 토스트 알림 */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: toast.type === 'success' ? '#4caf50' : '#f44336',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 1000,
          fontWeight: 600
        }}>
          {toast.message}
        </div>
      )}
      {filteredCandidates.length === 0 && (
        <div style={{
          padding: '48px',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <p style={{ fontSize: '16px', color: '#666' }}>조건에 맞는 인재를 찾을 수 없습니다.</p>
        </div>
      )}
    </div>
  )
}

export default CandidateSearch

