import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo, useRef } from 'react'
import { MapPin, Calendar, Clock, DollarSign, Check } from 'lucide-react'

declare global {
  interface Window { kakao: any }
}

function JobDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isApplying, setIsApplying] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [applicationId, setApplicationId] = useState<number | null>(null)

  // Kakao Map refs
  const mapEl = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const geocoderRef = useRef<any>(null)

  // SDK 로더
  const loadKakao = () =>
    new Promise<any>((resolve) => {
      // 이미 로드됨
      if (window.kakao && window.kakao.maps) return resolve(window.kakao)
      // 스크립트 존재하면 onload 대기
      const existing = document.getElementById('kakao-maps-sdk') as HTMLScriptElement | null
      if (existing) {
        if ((window as any).kakao && (window as any).kakao.maps) return resolve((window as any).kakao)
        existing.addEventListener('load', () => resolve((window as any).kakao))
        return
      }
      // 동적 주입 (index.html 로드 실패 대비)
      const s = document.createElement('script')
      s.id = 'kakao-maps-sdk'
      s.src = 'https://dapi.kakao.com/v2/maps/sdk.js?appkey=0e70b22aff0457c53528a49d4ea6034f&autoload=false&libraries=services'
      s.onload = () => resolve((window as any).kakao)
      document.head.appendChild(s)
    })

  // 지원취소 버튼 핸들러
  const handleCancelApplication = async () => {
    if (!applicationId) {
      alert('지원 정보를 찾을 수 없습니다.')
      return
    }

    if (!window.confirm('정말 지원을 취소하시겠습니까?')) {
      return
    }

    const userId = localStorage.getItem('userId')
    setIsApplying(true)

    try {
      console.log('📤 Canceling application:', applicationId)
      const response = await fetch(`/api/jobseeker/applications/${userId}/${applicationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        console.log('✅ Application canceled')
        setHasApplied(false)
        setApplicationId(null)
        alert('지원이 취소되었습니다.')
      } else {
        const error = await response.json()
        console.error('❌ Cancel failed:', error)
        alert(error.error || '지원 취소에 실패했습니다.')
      }
    } catch (error) {
      console.error('❌ Error canceling application:', error)
      alert('지원 취소 중 오류가 발생했습니다.')
    } finally {
      setIsApplying(false)
    }
  }

  // 지원하기 버튼 핸들러
  const handleApply = async () => {
    // 로그인 확인
    const userId = localStorage.getItem('userId')
    const userType = localStorage.getItem('userType')
    
    console.log('=== 지원하기 버튼 클릭 ===')
    console.log('userId:', userId)
    console.log('userType:', userType)
    
    if (!userId) {
      alert('로그인이 필요합니다.')
      navigate('/jobseeker/login')
      return
    }

    // 구직자인지 확인 (대소문자 구분 없이)
    if (userType?.toUpperCase() !== 'JOBSEEKER') {
      console.log('❌ userType이 JOBSEEKER가 아님:', userType)
      alert('구직자 계정으로만 지원할 수 있습니다.')
      return
    }

    setIsApplying(true)

    try {
      console.log('📤 Applying to job:', id, 'User ID:', userId)
      const response = await fetch(`/api/jobseeker/applications/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: parseInt(id!)
          // 적합도는 백엔드에서 자동 계산됨
        }),
      })

      if (response.ok) {
        console.log('✅ Application successful')
        setHasApplied(true)
        alert('지원이 완료되었습니다!')
      } else {
        const error = await response.json()
        console.error('❌ Application failed:', error)
        alert(error.error || '지원에 실패했습니다.')
      }
    } catch (error) {
      console.error('❌ Error applying:', error)
      alert('지원 중 오류가 발생했습니다.')
    } finally {
      setIsApplying(false)
    }
  }

  // 지원 여부 확인
  useEffect(() => {
    const checkApplicationStatus = async () => {
      if (!id) return

      const userId = localStorage.getItem('userId')
      const userType = localStorage.getItem('userType')
      
      if (!userId || userType?.toUpperCase() !== 'JOBSEEKER') return

      try {
        console.log('🔍 Checking application status for user:', userId, 'job:', id)
        const response = await fetch(`/api/jobseeker/applications/${userId}/check/${id}`)
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Application status:', data.applied)
          setHasApplied(data.applied)
          
          // 지원했다면 applicationId도 가져오기
          if (data.applied) {
            const applicationsResponse = await fetch(`/api/jobseeker/applications/${userId}`)
            if (applicationsResponse.ok) {
              const applications = await applicationsResponse.json()
              const currentApplication = applications.find((app: any) => app.jobId === parseInt(id!))
              if (currentApplication) {
                setApplicationId(currentApplication.id)
              }
            }
          }
        }
      } catch (error) {
        console.error('❌ Error checking application status:', error)
      }
    }

    checkApplicationStatus()
  }, [id])

  useEffect(() => {
    const fetchJobDetail = async () => {
      if (!id) {
        setLoading(false)
        return
      }

      // 백엔드에서 공고 상세 정보 가져오기 시도
      try {
        console.log('🔍 Fetching job detail for id:', id)
        const userType = localStorage.getItem('userType')
        
        // 구직자일 때만 조회수 증가 API 호출
        const apiUrl = userType?.toUpperCase() === 'JOBSEEKER' 
          ? `/api/jobs/detail/${id}`  // 조회수 증가
          : `/api/employer/jobs/detail/${id}`  // 조회수 증가 안 함
        
        console.log('📡 Using API:', apiUrl, 'userType:', userType)
        const response = await fetch(apiUrl)
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Job detail fetched:', data)
          
          // 백엔드 데이터를 JobDetails 형식으로 변환
          const convertedJob = {
            title: data.title,
            category: data.category || '',
            company: data.company || '',
            location: data.location || '',
            postedDate: data.postedDate ? new Date(data.postedDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : '최근',
            tags: ['파트타임'], // 기본 태그
            description: data.description || '',
            qualifications: data.qualifications || [],
            requirements: data.requirements || [],
            otherRequirement: data.otherRequirement || '',
            workingDays: data.workingDays || [],
            workingHours: data.startTime && data.endTime 
              ? `${data.startTime} ~ ${data.endTime}`
              : '협의',
            salary: data.salaryType && data.salary ? `${data.salaryType} ${data.salary}` : data.salary || '협의',
            deadline: data.deadline || '',
            gender: data.gender || '무관',
            age: data.age || '무관',
            education: data.education || '무관'
          }
          setJob(convertedJob)
          setLoading(false)
          return
        } else {
          console.error('❌ Failed to fetch job detail:', response.status)
        }
      } catch (error) {
        console.error('❌ Error fetching job detail:', error)
      }
      
      // 찾지 못한 경우
      setJob(null)
      setLoading(false)
    }

    let isMounted = true
    
    const loadData = async () => {
      await fetchJobDetail()
      if (!isMounted) return
    }
    
    loadData()
    
    return () => {
      isMounted = false
    }
  }, [id])

  // 지도 초기화 (ref 준비 타이밍을 보강)
  const initMapOnce = useRef(false)
  useEffect(() => {
    const init = async () => {
      if (initMapOnce.current) return
      if (!mapEl.current) {
        // 다음 프레임에 재시도
        requestAnimationFrame(init)
        return
      }
      const kakao = await loadKakao()
      kakao.maps.load(() => {
        const center = new kakao.maps.LatLng(37.5665, 126.9780) // 서울 시청
        const map = new kakao.maps.Map(mapEl.current!, { center, level: 5 })
        try { console.log('[KAKAO] map created', map) } catch {}
        const marker = new kakao.maps.Marker({ position: center })
        marker.setMap(map)
        mapRef.current = map
        markerRef.current = marker
        geocoderRef.current = new kakao.maps.services.Geocoder()
        // 초기 레이아웃 강제 업데이트(부모 레이아웃 변화 대응)
        setTimeout(() => { try { map.relayout() } catch {} }, 0)
        kakao.maps.event.addListener(map, 'tilesloaded', () => {
          try { console.log('[KAKAO] tiles loaded') } catch {}
        })
        initMapOnce.current = true
      })
    }
    init()
  }, [])

  // 주소 조합(상세주소가 있다면 우선 사용하도록 확장 가능)
  const fullAddress = useMemo(() => {
    const candidates = [
      job?.location,
      [job?.region, job?.district, job?.dong].filter(Boolean).join(' ')
    ].filter((v) => !!v && String(v).trim().length > 0)
    return candidates[0] || ''
  }, [job])

  // 주소 변경 시 지오코딩
  useEffect(() => {
    const kakao = (window as any).kakao
    if (!kakao || !geocoderRef.current || !mapRef.current || !markerRef.current) return
    if (!fullAddress) return
    geocoderRef.current.addressSearch(fullAddress, (result: any[], status: string) => {
      if (status !== kakao.maps.services.Status.OK || result.length === 0) return
      const { x, y } = result[0]
      const pos = new kakao.maps.LatLng(Number(y), Number(x))
      mapRef.current.setCenter(pos)
      markerRef.current.setPosition(pos)
      try { mapRef.current.relayout() } catch {}
      try { console.log('[KAKAO] geocoded:', fullAddress, { lat: Number(y), lng: Number(x) }) } catch {}
    })
  }, [fullAddress])

  if (loading) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px', textAlign: 'center' }}>
        <p style={{ fontSize: '18px', color: '#666' }}>로딩 중...</p>
      </div>
    )
  }

  if (!job) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px', textAlign: 'center' }}>
        <p style={{ fontSize: '18px', color: '#666', marginBottom: '24px' }}>일자리를 찾을 수 없습니다.</p>
        <button
          onClick={() => navigate('/jobseeker/search')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#2196f3',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          구직 검색으로 돌아가기
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>{job.title}</h1>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '8px 20px',
            backgroundColor: '#f5f5f5',
            color: '#2196f3',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            fontSize: '15px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'inline-block',
            marginLeft: '20px'
          }}
        >
          ← 뒤로 가기
        </button>
      </div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>{job.company}</h2>
          {job.category && (
            <>
              <span style={{ color: '#e0e0e0' }}>|</span>
              <span style={{ 
                color: '#2196f3', 
                fontSize: '16px',
                fontWeight: '500'
              }}>
                {job.category.replace(/\./g, '·')}
              </span>
            </>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '24px', marginBottom: '16px', color: '#666', fontSize: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} />
            {job.location}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} />
            게시일: {job.postedDate}
          </div>
        </div>

        {/* 근무지역 지도 */}
        <section style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>
            근무지역: {fullAddress || '-'}
          </div>
          <div
            ref={mapEl}
            style={{
              width: '100%',
              height: 300,
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              background: '#fafafa'
            }}
          />
        </section>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {job.tags.map((tag: string, index: number) => (
            <span
              key={index}
              style={{
                padding: '6px 12px',
                border: '1px solid #2196f3',
                borderRadius: '4px',
                backgroundColor: '#e3f2fd',
                color: '#2196f3',
                fontSize: '14px'
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <section style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>직무 설명</h2>
        </div>
        <p style={{ color: '#666', lineHeight: '1.6', fontSize: '16px' }}>{job.description}</p>
      </section>

      {job.qualifications && job.qualifications.length > 0 && (
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>자격 요건</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {job.qualifications.map((item: string, index: number) => (
              item && item.trim() && (
                <li key={index} style={{ display: 'flex', alignItems: 'start', gap: '12px', marginBottom: '12px' }}>
                  <Check size={20} color="#2196f3" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ color: '#666', lineHeight: '1.6', fontSize: '16px' }}>{item}</span>
                </li>
              )
            ))}
          </ul>
        </section>
      )}

      {job.requirements && job.requirements.length > 0 && (
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>필요 준비물/능력</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {job.requirements.map((req: string, index: number) => (
              <span
                key={index}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f5f5f5',
                  color: '#333',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                {req}
              </span>
            ))}
            {job.otherRequirement && (
              <span
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f5f5f5',
                  color: '#333',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                기타: {job.otherRequirement}
              </span>
            )}
          </div>
        </section>
      )}

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>지원 자격</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '16px',
          padding: '20px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px'
        }}>
          <div>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '8px' }}>성별</p>
            <p style={{ color: '#333', fontSize: '16px', fontWeight: '600' }}>{job.gender || '무관'}</p>
          </div>
          <div>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '8px' }}>연령</p>
            <p style={{ color: '#333', fontSize: '16px', fontWeight: '600' }}>{job.age || '무관'}</p>
          </div>
          <div>
            <p style={{ color: '#888', fontSize: '14px', marginBottom: '8px' }}>학력</p>
            <p style={{ color: '#333', fontSize: '16px', fontWeight: '600' }}>{job.education || '무관'}</p>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>근무 조건</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {job.workingDays && job.workingDays.length > 0 && (
            <div>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>근무 날짜</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {job.workingDays.map((day: string, index: number) => (
                  <span
                    key={index}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#e3f2fd',
                      color: '#2196f3',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    {day}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#666', fontSize: '16px' }}>
            <Clock size={20} />
            {job.workingHours}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#666', fontSize: '16px' }}>
            <DollarSign size={20} />
            {job.salary}
          </div>
          {job.deadline && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#666', fontSize: '16px' }}>
              <Calendar size={20} />
              지원 마감일: {job.deadline}
            </div>
          )}
        </div>
      </section>

      <div style={{ textAlign: 'center', marginTop: '48px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
        {!hasApplied ? (
          <button
            onClick={handleApply}
            disabled={isApplying}
            style={{
              padding: '16px 48px',
              backgroundColor: isApplying ? '#999' : '#2196f3',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: isApplying ? 'not-allowed' : 'pointer',
              opacity: isApplying ? 0.7 : 1
            }}
          >
            {isApplying ? '지원 중...' : '지금 지원하기'}
          </button>
        ) : (
          <>
            <button
              disabled
              style={{
                padding: '16px 48px',
                backgroundColor: '#4caf50',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'not-allowed',
                opacity: 0.8
              }}
            >
              ✓ 지원 완료
            </button>
            <button
              onClick={handleCancelApplication}
              disabled={isApplying}
              style={{
                padding: '16px 48px',
                backgroundColor: '#ffffff',
                color: '#f44336',
                border: '2px solid #f44336',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: isApplying ? 'not-allowed' : 'pointer',
                opacity: isApplying ? 0.7 : 1
              }}
            >
              {isApplying ? '취소 중...' : '지원 취소'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default JobDetails

