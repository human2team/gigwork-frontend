import { MapPin, Calendar, Clock, DollarSign, Briefcase, User, Hash, FileText } from 'lucide-react'

interface JobPreferences {
  gender: string | null
  age: number | null
  place: string | null
  work_days: string | null
  start_time: string | null
  end_time: string | null
  hourly_wage: number | null
  requirements: string | null
  category: string | null
  categories?: string | null
  job_text?: string | null
  person_text?: string | null
}

interface JobPreferencesCardProps {
  preferences: JobPreferences
  onReset?: () => void
}

function JobPreferencesCard({ preferences, onReset }: JobPreferencesCardProps) {
  const hasAnyValue = Object.values(preferences).some(val => val !== null)

  const preferenceItems = [
    { key: 'job_text', label: '하고 싶은 일', icon: FileText, color: '#607d8b', bgColor: '#eceff1', value: preferences.job_text, placeholder: '미입력' },
    { key: 'person_text', label: '내 정보', icon: FileText, color: '#455a64', bgColor: '#e8ecef', value: preferences.person_text, placeholder: '미입력' },
    { key: 'place', label: '지역', icon: MapPin, color: '#2196f3', bgColor: '#e3f2fd', value: preferences.place, placeholder: '미입력' },
    { key: 'category', label: '직종', icon: Briefcase, color: '#4caf50', bgColor: '#e8f5e9', value: preferences.categories || preferences.category, placeholder: '미입력' },
    { key: 'work_days', label: '근무일', icon: Calendar, color: '#ff9800', bgColor: '#fff3e0', value: preferences.work_days, placeholder: '미입력' },
    { key: 'hourly_wage', label: '시급', icon: DollarSign, color: '#9c27b0', bgColor: '#f3e5f5', value: preferences.hourly_wage ? `${preferences.hourly_wage.toLocaleString()}원` : null, placeholder: '미입력' },
    { key: 'start_time', label: '시작시간', icon: Clock, color: '#e91e63', bgColor: '#fce4ec', value: preferences.start_time, placeholder: '미입력' },
    { key: 'end_time', label: '종료시간', icon: Clock, color: '#e91e63', bgColor: '#fce4ec', value: preferences.end_time, placeholder: '미입력' },
    { key: 'gender', label: '성별', icon: User, color: '#00bcd4', bgColor: '#e0f7fa', value: preferences.gender, placeholder: '미입력' },
    { key: 'age', label: '나이', icon: Hash, color: '#ff5722', bgColor: '#fbe9e7', value: preferences.age ? `${preferences.age}세` : null, placeholder: '미입력' }
  ]

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '2px solid #e0e0e0',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      transition: 'all 0.3s',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 헤더 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '2px solid #f5f5f5'
      }}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '700', 
          color: '#333',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '4px',
            height: '18px',
            backgroundColor: '#2196f3',
            borderRadius: '2px'
          }} />
          일자리 검색 조건
        </h3>
        {hasAnyValue && onReset && (
          <button
            onClick={onReset}
            style={{
              padding: '6px 14px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              backgroundColor: '#f5f5f5',
              color: '#666',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ffebee'
              e.currentTarget.style.borderColor = '#ff5252'
              e.currentTarget.style.color = '#ff5252'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5'
              e.currentTarget.style.borderColor = '#e0e0e0'
              e.currentTarget.style.color = '#666'
            }}
          >
            초기화
          </button>
        )}
      </div>

      {/* 조건 리스트 */}
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginBottom: hasAnyValue ? '16px' : '0',
        maxHeight: 'calc(100vh - 300px)',
        overflowY: 'auto',
        paddingRight: '4px'
      }}>
        {preferenceItems.map((item) => {
          const Icon = item.icon
          const hasValue = item.value !== null

          return (
            <div 
              key={item.key}
              style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '10px', 
                padding: '12px',
                backgroundColor: hasValue ? item.bgColor : '#fafafa',
                border: hasValue ? `2px solid ${item.color}20` : '2px dashed #e0e0e0',
                borderRadius: '8px',
                transition: 'all 0.3s',
                boxSizing: 'border-box',
                width: '100%'
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: hasValue ? item.color : '#e0e0e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.3s'
              }}>
                <Icon size={18} color="#ffffff" strokeWidth={2.5} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontSize: '11px', 
                  color: '#999',
                  fontWeight: '600',
                  marginBottom: '2px',
                  letterSpacing: '0.3px'
                }}>
                  {item.label}
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: hasValue ? '600' : '400',
                  color: hasValue ? '#333' : '#bbb',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                  lineHeight: 1.6
                }}>
                  {hasValue ? item.value : item.placeholder}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 빈 상태 메시지 */}
      {!hasAnyValue && (
        <div style={{
          textAlign: 'center',
          padding: '20px 12px',
          color: '#999',
          fontSize: '13px',
          lineHeight: '1.5',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🗂️</div>
          <div style={{ fontWeight: '600', marginBottom: '6px', color: '#666', fontSize: '14px' }}>
            입력된 조건 없음
          </div>
          <div style={{ fontSize: '12px' }}>
            챗봇에 조건을 말해주시면<br />
            AI가 자동으로 분석하여<br />
            여기에 표시됩니다
          </div>
        </div>
      )}
    </div>
  )
}

export default JobPreferencesCard
