import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
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
                    variant={application.suitability >= 85 ? 'success' : application.suitability >= 75 ? 'warning' : 'error'}
                    size="sm"
                  >
                    적합도: {application.suitability}%
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

