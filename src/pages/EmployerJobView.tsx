import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Calendar, DollarSign, Clock, Info, ClipboardList, UserCheck, Briefcase, CheckCircle, AlarmClock, BookOpen, FileText } from 'lucide-react'
import { useState, useEffect } from 'react'

function EmployerJobView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const isPastDeadline = (deadline?: string) => {
    if (!deadline) return false
    const d = new Date(deadline)
    if (isNaN(d.getTime())) return false
    const today = new Date()
    d.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    return d.getTime() < today.getTime()
  }

  useEffect(() => {
    const fetchJobDetail = async () => {
      try {
        console.log('🔍 Fetching job detail for id:', id)
        const response = await fetch(`/api/employer/jobs/detail/${id}`)
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Job detail fetched:', data)
          
          // 상태를 한글로 변환
          const statusMap: { [key: string]: string } = {
            'ACTIVE': '진행중',
            'CLOSED': '마감',
            'PENDING': '대기'
          }
          
          const transformedData = {
            ...data,
            status: statusMap[data.status] || data.status,
            views: data.views || 0,
            applicants: data.applicants || 0
          }
          
          setJob(transformedData)
        } else {
          console.error('❌ Failed to fetch job detail:', response.status)
          alert('공고를 찾을 수 없습니다.')
        }
      } catch (error) {
        console.error('❌ Error fetching job detail:', error)
        alert('공고를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchJobDetail()
    }
  }, [id])

  const handleStatusToggle = async () => {
    if (!job) return
    
    const currentStatus = job.status
    const newStatus = currentStatus === '진행중' ? 'CLOSED' : 'ACTIVE'

    // 재개 시 마감일 경과 여부 체크
    if (newStatus === 'ACTIVE' && isPastDeadline(job.deadline)) {
      alert('마감일이 지난 공고는 재개할 수 없습니다.\n수정 화면에서 마감일을 변경한 후 재개해 주세요.')
      return
    }
    const confirmMessage = currentStatus === '진행중' 
      ? '공고를 마감하시겠습니까? 마감 후에는 구직자들이 지원할 수 없습니다.'
      : '공고를 다시 진행 상태로 변경하시겠습니까?'
    
    if (!window.confirm(confirmMessage)) return
    
    setUpdating(true)
    try {
      const response = await fetch(`/api/employer/jobs/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        const data = await response.json()
        const statusMap: { [key: string]: string } = {
          'ACTIVE': '진행중',
          'CLOSED': '마감',
          'PENDING': '대기'
        }
        
        setJob({
          ...job,
          status: statusMap[data.status] || data.status
        })
        
        alert(newStatus === 'CLOSED' ? '공고가 마감되었습니다.' : '공고가 다시 진행 중으로 변경되었습니다.')
      } else {
        const error = await response.json()
        alert(error.message || '상태 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error updating job status:', error)
      alert('상태 변경 중 오류가 발생했습니다.')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '48px', textAlign: 'center' }}>
        <p style={{ fontSize: '18px', color: '#666' }}>로딩 중...</p>
      </div>
    )
  }

  if (!job) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '48px', textAlign: 'center' }}>
        <p style={{ fontSize: '18px', color: '#666' }}>일자리를 찾을 수 없습니다.</p>
        <button
          onClick={() => navigate('/employer/jobs')}
          style={{
            marginTop: '24px',
            padding: '12px 24px',
            border: '1px solid #2196f3',
            borderRadius: '6px',
            backgroundColor: '#2196f3',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          공고 관리로 돌아가기
        </button>
      </div>
    )
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
            fontSize: '14px'
          }}
        >
          <ArrowLeft size={18} />
          목록으로
        </button>
      </div>

      <div style={{
        padding: '32px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e0e0e0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px' }}>{job.title}</h1>
        
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
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
          <div style={{ display: 'flex', gap: '24px', marginBottom: '16px', color: '#666', fontSize: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <MapPin size={18} />
              <span>{job.location}</span>
              {job.addressDetail && (
                <span style={{ color: '#666', marginLeft: '8px', fontSize: '13px', fontWeight: 400 }}>
                  <span style={{ color: '#2196f3', fontWeight: 500 }}>상세주소:</span> {job.addressDetail}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} />
              등록일: {job.postedDate}
            </div>
            {job.deadline && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} />
                마감일: {job.deadline}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={18} />
              {job.salaryType} {job.salary}
            </div>
            {job.startTime && job.endTime && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} />
                {job.startTime} ~ {job.endTime}
              </div>
            )}
          </div>
        </div>

        <section style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #e0e0e0' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={24} style={{ color: '#2196f3' }} /> 직무 설명
          </h2>
          <p style={{ color: '#666', lineHeight: '1.8', fontSize: '16px', whiteSpace: 'pre-wrap' }}>{job.description}</p>
        </section>

        {job.qualifications && job.qualifications.length > 0 && job.qualifications[0] && (
          <section style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #e0e0e0' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClipboardList size={24} style={{ color: '#2196f3' }} /> 자격 요건
            </h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {job.qualifications.map((qual: string, index: number) => (
                qual.trim() && (
                  <li key={index} style={{ 
                    padding: '8px 0', 
                    color: '#666', 
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'start',
                    gap: '8px'
                  }}>
                    <span style={{ color: '#2196f3', marginTop: '6px' }}>•</span>
                    <span>{qual}</span>
                  </li>
                )
              ))}
            </ul>
          </section>
        )}

        <section style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #e0e0e0' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={24} style={{ color: '#2196f3' }} /> 지원 자격
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '14px', color: '#999', marginBottom: '4px' }}>성별</p>
              <p style={{ fontSize: '16px', color: '#333', fontWeight: '500' }}>{job.gender || '무관'}</p>
            </div>
            <div>
              <p style={{ fontSize: '14px', color: '#999', marginBottom: '4px' }}>연령</p>
              <p style={{ fontSize: '16px', color: '#333', fontWeight: '500' }}>{job.age || '무관'}</p>
            </div>
            <div>
              <p style={{ fontSize: '14px', color: '#999', marginBottom: '4px' }}>학력</p>
              <p style={{ fontSize: '16px', color: '#333', fontWeight: '500' }}>{job.education || '무관'}</p>
            </div>
          </div>
        </section>

        {job.workingDays && job.workingDays.length > 0 && (
          <section style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #e0e0e0' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlarmClock size={24} style={{ color: '#2196f3' }} /> 근무 시간
            </h2>
            <div style={{ marginBottom: '12px' }}>
              <p style={{ color: '#666', fontSize: '16px', marginBottom: '8px' }}>
                <strong>근무 날짜:</strong> {job.workingDays.length}일
              </p>
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
            {job.startTime && job.endTime && (
              <p style={{ color: '#666', fontSize: '16px' }}>
                <strong>근무 시간:</strong> {job.startTime} ~ {job.endTime}
              </p>
            )}
          </section>
        )}

        {((job.requirements && job.requirements.filter((req: string) => {
          if (!req || !req.trim()) return false
          // "기타(직접입력)" 완전히 제외
          if (req.trim() === '기타(직접입력)' || req.includes('기타(직접입력)')) return false
          // "기타:"로 시작하는 것 제외
          if (/^기타\s*:?\s*/.test(req.trim())) return false
          return true
        }).length > 0) || (job.otherRequirement && job.otherRequirement.trim())) && (
          <section style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #e0e0e0' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={24} style={{ color: '#2196f3' }} /> 필요 준비물/능력
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {(job.requirements || [])
                .filter((req: string) => {
                  if (!req || !req.trim()) return false
                  // "기타(직접입력)" 완전히 제외
                  if (req.trim() === '기타(직접입력)' || req.includes('기타(직접입력)')) return false
                  // "기타:"로 시작하는 것 제외
                  if (/^기타\s*:?\s*/.test(req.trim())) return false
                  return true
                })
                .map((req: string, index: number) => (
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
              {job.otherRequirement && job.otherRequirement.trim() && (
                <span
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f5f5f5',
                    color: '#333',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  {/* "기타:" 또는 "기타 :" 등 모든 변형 제거 */}
                  {job.otherRequirement.replace(/^기타\s*:?\s*/i, '').trim()}
                </span>
              )}
            </div>
          </section>
        )}

        <section style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={24} style={{ color: '#2196f3' }} /> 공고 정보
            </h2>
            <button
              onClick={handleStatusToggle}
              disabled={updating || (job.status !== '진행중' && isPastDeadline(job.deadline))}
              style={{
                padding: '8px 16px',
                border: job.status === '진행중' ? '1px solid #f44336' : '1px solid #4caf50',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                color: job.status === '진행중' ? '#f44336' : '#4caf50',
                cursor: (updating || (job.status !== '진행중' && isPastDeadline(job.deadline))) ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: (updating || (job.status !== '진행중' && isPastDeadline(job.deadline))) ? 0.6 : 1
              }}
            >
              {updating ? '처리중...' : (job.status === '진행중' ? '공고 마감하기' : '공고 재개하기')}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>상태</p>
              <p style={{ fontSize: '16px', fontWeight: '600' }}>
                <span style={{
                  padding: '4px 12px',
                  backgroundColor: job.status === '진행중' ? '#4caf50' : job.status === '마감' ? '#999' : '#ff9800',
                  color: '#ffffff',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {job.status}
                </span>
              </p>
            </div>
            <div>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>지원자 수</p>
              <p style={{ fontSize: '16px', fontWeight: '600' }}>{job.applicants}명</p>
            </div>
            <div>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>조회수</p>
              <p style={{ fontSize: '16px', fontWeight: '600' }}>{job.views}</p>
            </div>
            <div>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>등록일</p>
              <p style={{ fontSize: '16px', fontWeight: '600' }}>{job.postedDate}</p>
            </div>
            <div>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>마감일</p>
              <p style={{ fontSize: '16px', fontWeight: '600' }}>{job.deadline || '미정'}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default EmployerJobView

