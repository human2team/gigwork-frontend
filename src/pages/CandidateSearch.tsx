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
  // 지역(시/도/구/동) - OpenAPI 동적 로드 (JobSearch와 동일 패턴)
  type RegionItem = { code: string; name: string; sido?: string; sgg?: string; umd?: string }
  type DistrictItem = { code: string; name: string }
  type DongItem = { code: string; name: string }
  const [regions, setRegions] = useState<RegionItem[]>([])
  const [districts, setDistricts] = useState<DistrictItem[]>([])
  const [dongs, setDongs] = useState<DongItem[]>([])
  const [selectedRegionCode, setSelectedRegionCode] = useState<string>('')
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<string>('')
  const [selectedDongCode, setSelectedDongCode] = useState<string>('')
  useEffect(() => {
    fetch('/api/regions')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRegions(data.map((r: any) => ({
            code: r.code, name: r.name, sido: r.sido, sgg: r.sgg, umd: r.umd
          })))
        } else {
          setRegions([])
        }
      })
      .catch(() => setRegions([]))
  }, [])
  useEffect(() => {
    if (!selectedRegionCode) return
    fetch(`/api/districts?region=${encodeURIComponent(selectedRegionCode)}`)
      .then(res => res.json())
      .then(data => { setDistricts(Array.isArray(data) ? data : []) })
      .catch(() => setDistricts([]))
  }, [selectedRegionCode])
  useEffect(() => {
    if (!selectedDistrictCode) return
    fetch(`/api/dongs?district=${encodeURIComponent(selectedDistrictCode)}`)
      .then(res => res.json())
      .then(data => { setDongs(Array.isArray(data) ? data : []) })
      .catch(() => setDongs([]))
  }, [selectedDistrictCode])
  // 업직종 2단(백엔드 연동)
  type CategoryItem = { cd: string; nm: string }
  const [jobMainCats, setJobMainCats] = useState<CategoryItem[]>([])
  const [jobSubCatsByMain, setJobSubCatsByMain] = useState<Record<string, CategoryItem[]>>({})
  const [selectedJobMainCd, setSelectedJobMainCd] = useState<string>('')
  const [selectedJobSubcats, setSelectedJobSubcats] = useState<string[]>([])
  const [selectAllSubcats, setSelectAllSubcats] = useState<boolean>(false)
  const [excludeBar, setExcludeBar] = useState(false)
  const ensureLoadMainCats = async () => {
    if (jobMainCats.length > 0) return
    try {
      const res = await fetch(`/api/categories?kind=01&depth=1`)
      if (res.ok) {
        const data: CategoryItem[] = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setJobMainCats(data)
          setSelectedJobMainCd('')
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, locationFilter, licenseFilter, minSuitability])

  // 이미 제안한 후보자 목록 불러오기 (로그인된 employerId 필요)
  useEffect(() => {
    const fetchProposed = async () => {
      const currentEmployerId = employerProfileId || ''
      if (!currentEmployerId) {
        setProposedIdsWithStorage([])
        return;
      }
      try {
        // 가능한 엔드포인트 순회. 서버 구현에 맞게 우선순위 조정
        const tryUrls = [
          `/api/proposals/employer/${currentEmployerId}`,
          `/api/proposals/employer/${currentEmployerId}/jobseekers`,
          `/api/proposals?employerId=${currentEmployerId}`
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
  }, [employerProfileId])

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
    ['jobseeker','preferredRegion'], ['jobseeker','preferred_region'],
    ['user','preferredRegion'], ['user','preferred_region'],
    ['profile','preferredRegion'], ['profile','preferred_region'],
    ['jobseekerProfile','preferredRegion'], ['jobseekerProfile','preferred_region'],
  ])
  const getPreferredDistrict = (c: any): string => pickFirst(c, [
    ['preferredDistrict'], ['preferred_district'], ['preferreddistrict'],
    ['jobseeker','preferredDistrict'], ['jobseeker','preferred_district'],
    ['user','preferredDistrict'], ['user','preferred_district'],
    ['profile','preferredDistrict'], ['profile','preferred_district'],
    ['jobseekerProfile','preferredDistrict'], ['jobseekerProfile','preferred_district'],
  ])
  const getPreferredDong = (c: any): string => pickFirst(c, [
    ['preferredDong'], ['preferred_dong'], ['preferreddong'],
    ['jobseeker','preferredDong'], ['jobseeker','preferred_dong'],
    ['user','preferredDong'], ['user','preferred_dong'],
    ['profile','preferredDong'], ['profile','preferred_dong'],
    ['jobseekerProfile','preferredDong'], ['jobseekerProfile','preferred_dong'],
  ])
  const getPreferredLocationText = (c: any): string => {
    const region = getPreferredRegion(c)
    const district = getPreferredDistrict(c)
    const dong = getPreferredDong(c)
    const parts = [region, district, (dong && dong !== '전체') ? dong : ''].filter(Boolean)
    if (parts.length === 0) return '희망 지역 정보 없음'
    return parts.join(' ')
  }

  const normalizeKo = (s: string): string => {
    return String(s || '')
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/(특별자치도|특별자치시|광역시|특별시|자치구|시|군|구|도|동|읍|면)/g, '')
  }

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         candidate.experience?.some((exp: string) => exp.toLowerCase().includes(searchQuery.toLowerCase()))
    const preferredText = getPreferredLocationText(candidate)
    const matchesLocation = (() => {
      if (locationFilter === '전체') return true
      const nf = normalizeKo(locationFilter)
      const np = normalizeKo(preferredText)
      if (!nf) return true
      return np.includes(nf) || nf.includes(np)
    })()
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
    const subcatMatch = (() => {
      // 개별 소분류 선택 시: 그 중 하나라도 포함되면 통과
      if (selectedJobSubcats.length > 0) {
        return selectedJobSubcats.some(sub => catTexts.some(ct => ct.includes(sub.toLowerCase())))
      }
      // '전체' 선택 또는 대분류만 선택 시: 해당 대분류의 모든 소분류 중 하나라도 포함되면 통과
      if ((selectAllSubcats || selectedJobSubcats.length === 0) && selectedJobMainCd) {
        const subs = (jobSubCatsByMain[selectedJobMainCd]?.map(s => s.nm.toLowerCase())) || []
        if (subs.length > 0) {
          return subs.some(s => catTexts.some(ct => ct.includes(s)))
        }
        // 소분류 목록을 아직 못 불러왔으면 대분류 이름으로 우선 매칭 시도
        const main = jobMainCats.find(m => m.cd === selectedJobMainCd)?.nm?.toLowerCase() || ''
        return main ? catTexts.some(ct => ct.includes(main)) : true
      }
      // 카테고리 필터 미적용
      return true
    })()
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
            {locationFilter === '전체' ? '지역' : locationFilter}
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
                  type="button"
                  onClick={() => {
                    setSelectedRegionCode(''); setSelectedDistrictCode(''); setSelectedDongCode('');
                    setDistricts([]); setDongs([]); setLocationFilter('전체');
                  }}
                  style={{ border: 'none', background: 'transparent', color: '#2196f3', cursor: 'pointer', fontSize: 12 }}
                >
                  초기화
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '200px 240px 1fr', gap: 12 }}>
                {/* 시/도 */}
                <div style={{ borderRight: '1px solid #eee', overflowY: 'auto', maxHeight: 220 }}>
                  {regions.map(region => (
                    <button
                      key={region.code}
                      type="button"
                      onClick={() => { 
                        setSelectedRegionCode(region.code); 
                        setSelectedDistrictCode(''); 
                        setSelectedDongCode('');
                        setDistricts([]); setDongs([]); 
                        // 즉시 매칭: 시/도 선택만으로도 필터 적용
                        setLocationFilter(region.name || '전체')
                      }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '8px 10px', border: 'none',
                        background: selectedRegionCode === region.code ? '#e3f2fd' : 'transparent',
                        color: selectedRegionCode === region.code ? '#2196f3' : '#333', cursor: 'pointer', borderRadius: 6
                      }}
                    >
                      {region.name}
                    </button>
                  ))}
                </div>
                {/* 구/군 */}
                <div style={{ borderRight: '1px solid #eee', overflowY: 'auto', maxHeight: 220 }}>
                  {districts.map(d => (
                    <button
                      key={d.code}
                      type="button"
                      onClick={() => { 
                        setSelectedDistrictCode(d.code); 
                        setSelectedDongCode(''); 
                        setDongs([]);
                        // 즉시 매칭: 시/도 + 구/군 조합으로 필터 적용
                        const r = regions.find(r => r.code === selectedRegionCode)?.name || ''
                        const display = [r, d.name].filter(Boolean).join(' ') || d.name
                        setLocationFilter(display)
                      }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '8px 10px', border: 'none',
                        background: selectedDistrictCode === d.code ? '#e3f2fd' : 'transparent',
                        color: selectedDistrictCode === d.code ? '#2196f3' : '#333', cursor: 'pointer', borderRadius: 6
                      }}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
                {/* 동 */}
                <div style={{ overflowY: 'auto', maxHeight: 220 }}>
                  {dongs.map(dg => (
                    <button
                      key={dg.code}
                      type="button"
                      onClick={() => {
                        setSelectedDongCode(dg.code);
                        // 즉시 매칭: 시/도 + 구/군 + 동 조합으로 필터 적용
                        const r = regions.find(r => r.code === selectedRegionCode)?.name || ''
                        const g = districts.find(d => d.code === selectedDistrictCode)?.name || ''
                        const display = [r, g, dg.name].filter(Boolean).join(' ')
                        setLocationFilter(display || dg.name)
                      }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '6px 8px', border: 'none',
                        background: selectedDongCode === dg.code ? '#e3f2fd' : 'transparent',
                        color: selectedDongCode === dg.code ? '#2196f3' : '#333', cursor: 'pointer', borderRadius: 6
                      }}
                    >
                      {dg.name}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => {
                    const r = regions.find(r => r.code === selectedRegionCode)?.name || ''
                    const g = districts.find(d => d.code === selectedDistrictCode)?.name || ''
                    const d = dongs.find(dd => dd.code === selectedDongCode)?.name || ''
                    const display = [r, g, d].filter(Boolean).join(' ') || '전체'
                    setLocationFilter(display)
                    setShowRegionPopup(false)
                  }}
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
                                const next = e.target.checked
                                setSelectAllSubcats(next)
                                if (next) setSelectedJobSubcats([])
                              } else {
                                if (e.target.checked) {
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
            <div>프로필 요약</div>
            <div>희망근무지역</div>
            <div>수정일</div>
            <div style={{ textAlign: 'center' }}>액션</div>
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
                {/* 프로필 요약 + 업종별 카테고리 */}
                <div
                  onClick={() => navigate(`/employer/candidates/${candidate.id}`)}
                  style={{ fontSize: 14, color: '#555', overflow: 'hidden', cursor: 'pointer' }}
                >
                  <div style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {candidate.summary || candidate.experience?.[0] || '요약 정보가 없습니다.'}
                  </div>
                  {(() => {
                    const desiredRaw = Array.isArray(candidate.desiredCategories)
                      ? candidate.desiredCategories
                      : (candidate.desiredCategory ? [candidate.desiredCategory] : [])
                    const desiredNames = desiredRaw
                      .map((v: any) => String(v).trim())
                      .filter((v: string) => v.length > 0)
                    if (desiredNames.length === 0) return null
                    const display = `${desiredNames.slice(0, 3).join(', ')}${desiredNames.length > 3 ? ` 외 ${desiredNames.length - 3}개` : ''}`
                    return (
                      <div style={{ marginTop: 4, fontSize: 12, color: '#888', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {display}
                      </div>
                    )
                  })()}
                </div>
                {/* 희망지역 */}
                <div style={{ fontSize: 14, color: '#555' }}>
                  <MapPin size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  {getPreferredLocationText(candidate)}
                </div>
                {/* 수정일 */}
                <div style={{ fontSize: 13, color: '#999' }}>{updatedAgo}</div>
                {/* 액션 */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
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

