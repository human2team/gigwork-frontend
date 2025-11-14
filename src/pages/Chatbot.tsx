import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Bot, User, Trash2, MapPin, DollarSign, ArrowRight, Bookmark, BookmarkCheck } from 'lucide-react'
import JobPreferencesCard from '../components/JobPreferencesCard'

interface Message {
  id: number
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  action?: {
    label: string
    path: string
  }
}

interface Job {
  id: number
  title: string
  category: string
  company: string
  location: string
  salary: string
  description: string
  type: string
  posted: string
  hourlyWage?: number
  qualifications?: string[]
}

interface UserJobPreferences {
  gender: string | null
  age: number | null
  place: string | null
  work_days: string | null
  start_time: string | null
  end_time: string | null
  hourly_wage: number | null
  requirements: string | null
  category: string | null
}

function Chatbot() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>(() => {
    // localStorage에서 대화 내역 불러오기
    const saved = localStorage.getItem('chatHistory')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      } catch (e) {
        return [{
          id: 1,
          text: '안녕하세요! AI GigWork 챗봇입니다. 원하시는 일자리 조건을 자유롭게 말씀해주세요. 예: "강남에서 주 5일, 시급 15,000원 이상 서빙 일자리 찾아줘"',
          sender: 'bot',
          timestamp: new Date()
        }]
      }
    }
    return [{
      id: 1,
      text: '안녕하세요! AI GigWork 챗봇입니다. 원하시는 일자리 조건을 자유롭게 말씀해주세요. 예: "강남에서 주 5일, 시급 15,000원 이상 서빙 일자리 찾아줘"',
      sender: 'bot',
      timestamp: new Date()
    }]
  })
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [userPreferences, setUserPreferences] = useState<UserJobPreferences>({
    gender: null,
    age: null,
    place: null,
    work_days: null,
    start_time: null,
    end_time: null,
    hourly_wage: null,
    requirements: null,
    category: null
  })
  const [searchResults, setSearchResults] = useState<Job[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [savedJobIds, setSavedJobIds] = useState<number[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 저장된 일자리 ID 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('savedJobs')
    if (saved) {
      setSavedJobIds(JSON.parse(saved))
    }
  }, [])

  // 대화 내역 저장
  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(messages))
  }, [messages])

  // 대화 내역 삭제
  const clearHistory = () => {
    const initialMessage = {
      id: 1,
      text: '안녕하세요! AI GigWork 챗봇입니다. 어떤 도움이 필요하신가요?',
      sender: 'bot' as const,
      timestamp: new Date()
    }
    setMessages([initialMessage])
    localStorage.removeItem('chatHistory')
  }

  const handleSend = async () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages([...messages, userMessage])
    const currentInput = inputText
    setInputText('')

    // 타이핑 표시
    setIsTyping(true)

    // TODO: 실제 AI API 호출로 교체
    // const response = await fetch('/api/chatbot', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ message: currentInput, preferences: userPreferences })
    // })
    // const data = await response.json()

    // 임시 응답 시뮬레이션 (실제 구현 시 제거)
    setTimeout(() => {
      setIsTyping(false)
      const { text, action, preferences } = generateBotResponse(currentInput)
      
      // AI가 추출한 사용자 선호도 업데이트
      if (preferences) {
        setUserPreferences(prev => ({
          ...prev,
          ...preferences
        }))
      }

      const botMessage: Message = {
        id: messages.length + 2,
        text: text,
        sender: 'bot',
        timestamp: new Date(),
        action: action
      }
      setMessages(prev => [...prev, botMessage])
    }, 800)
  }

  const generateBotResponse = (userInput: string): { 
    text: string
    action?: { label: string; path: string }
    preferences?: Partial<UserJobPreferences>
  } => {
    const lowerInput = userInput.toLowerCase()

    // AI가 사용자 입력에서 정보 추출 (실제로는 백엔드 AI API에서 처리)
    const extractedPreferences: Partial<UserJobPreferences> = {}
    
    // 지역 추출
    const places = ['강남', '서울', '부산', '대구', '인천', '광주', '대전', '울산', '판교', '홍대', '신촌', '이태원']
    places.forEach(place => {
      if (lowerInput.includes(place)) {
        extractedPreferences.place = place
      }
    })

    // 시급 추출
    const wageMatch = userInput.match(/(\d+,?\d+)\s*원/)
    if (wageMatch) {
      extractedPreferences.hourly_wage = parseInt(wageMatch[1].replace(/,/g, ''))
    }

    // 근무일 추출
    if (lowerInput.includes('주 5일') || lowerInput.includes('주5일')) {
      extractedPreferences.work_days = '주 5일'
    } else if (lowerInput.includes('주 6일') || lowerInput.includes('주6일')) {
      extractedPreferences.work_days = '주 6일'
    } else if (lowerInput.includes('주말') || lowerInput.includes('토일')) {
      extractedPreferences.work_days = '주말'
    }

    // 카테고리 추출
    const categories = ['서빙', '주방', '배달', '편의점', '카페', '사무', '청소', '경비', '포장', '제조']
    categories.forEach(category => {
      if (lowerInput.includes(category)) {
        extractedPreferences.category = category
      }
    })

    // 시간대 추출
    if (lowerInput.includes('오전') || lowerInput.includes('아침')) {
      extractedPreferences.start_time = '09:00'
      extractedPreferences.end_time = '13:00'
    } else if (lowerInput.includes('오후') || lowerInput.includes('점심')) {
      extractedPreferences.start_time = '13:00'
      extractedPreferences.end_time = '18:00'
    } else if (lowerInput.includes('저녁') || lowerInput.includes('야간')) {
      extractedPreferences.start_time = '18:00'
      extractedPreferences.end_time = '23:00'
    }

    // 정보가 추출되었으면 확인 메시지 반환
    if (Object.keys(extractedPreferences).length > 0) {
      let confirmText = '입력하신 조건을 확인했습니다:\n\n'
      if (extractedPreferences.place) confirmText += `📍 지역: ${extractedPreferences.place}\n`
      if (extractedPreferences.category) confirmText += `💼 직종: ${extractedPreferences.category}\n`
      if (extractedPreferences.work_days) confirmText += `📅 근무일: ${extractedPreferences.work_days}\n`
      if (extractedPreferences.hourly_wage) confirmText += `💰 시급: ${extractedPreferences.hourly_wage.toLocaleString()}원\n`
      if (extractedPreferences.start_time) confirmText += `⏰ 시간: ${extractedPreferences.start_time} ~ ${extractedPreferences.end_time}\n`
      
      confirmText += '\n추가 조건이 있으시면 말씀해주세요. 없으시면 아래 검색 버튼을 눌러주세요!'

      return {
        text: confirmText,
        preferences: extractedPreferences
      }
    }

    // 키워드 기반 응답
    if (lowerInput.includes('안녕') || lowerInput.includes('하이')) {
      return {
        text: '안녕하세요! AI GigWork 챗봇입니다. 일자리 추천이나 프로필 관리에 대해 도와드릴 수 있습니다.'
      }
    }

    if (lowerInput.includes('추천') || lowerInput.includes('일자리')) {
      return {
        text: '맞춤형 일자리 추천을 받으시려면 아래 버튼을 클릭하세요. 프로필 정보(자격증, 경력, 신체 데이터)를 바탕으로 AI가 최적의 일자리를 추천해드립니다.',
        action: { label: '📋 추천 페이지로 이동', path: '/jobseeker/recommendations' }
      }
    }

    if (lowerInput.includes('프로필') || lowerInput.includes('정보') || lowerInput.includes('내정보')) {
      return {
        text: '프로필 페이지에서 개인정보, 자격증, 경력, 신체 속성을 관리할 수 있습니다. 정보를 입력하시면 더 정확한 추천을 받으실 수 있습니다.',
        action: { label: '👤 프로필 페이지로 이동', path: '/jobseeker/profile' }
      }
    }

    if (lowerInput.includes('자격증') || lowerInput.includes('라이센스')) {
      return {
        text: '자격증 정보는 프로필 페이지의 "자격증" 탭에서 추가하실 수 있습니다. 보유하신 자격증이 많을수록 더 다양한 일자리 추천을 받으실 수 있습니다.',
        action: { label: '📜 프로필 페이지로 이동', path: '/jobseeker/profile' }
      }
    }

    if (lowerInput.includes('적합도') || lowerInput.includes('점수')) {
      return {
        text: '적합도 점수는 개인의 자격증, 경력, 신체 데이터 등을 종합적으로 분석하여 계산됩니다. 85% 이상은 높은 적합도, 75-84%는 중간 적합도, 75% 미만은 낮은 적합도로 표시됩니다.',
        action: { label: '📊 추천 페이지에서 확인', path: '/jobseeker/recommendations' }
      }
    }

    if (lowerInput.includes('신체') || lowerInput.includes('근력') || lowerInput.includes('키') || lowerInput.includes('몸무게')) {
      return {
        text: '신체 속성 정보는 프로필 페이지의 "신체 속성" 탭에서 입력하실 수 있습니다. 근력, 키, 몸무게, 걸음수 등의 정보를 입력하시면 체력이 필요한 일자리 추천에 도움이 됩니다.',
        action: { label: '💪 프로필 페이지로 이동', path: '/jobseeker/profile' }
      }
    }

    if (lowerInput.includes('검색') || lowerInput.includes('찾기') || lowerInput.includes('구직')) {
      return {
        text: '일자리 검색 페이지에서 키워드, 위치, 직종 유형 등으로 필터링하여 검색하실 수 있습니다.',
        action: { label: '🔍 검색 페이지로 이동', path: '/jobseeker/search' }
      }
    }

    if (lowerInput.includes('급여') || lowerInput.includes('시급') || lowerInput.includes('월급')) {
      return {
        text: '각 일자리의 급여 정보는 일자리 상세 페이지에서 확인하실 수 있습니다. 시급제 또는 월급제, 그리고 협의 가능 여부가 표시됩니다.'
      }
    }

    if (lowerInput.includes('지원') || lowerInput.includes('신청')) {
      return {
        text: '일자리에 지원하시려면 일자리 상세 페이지 하단의 "지원하기" 버튼을 클릭하시면 됩니다. 지원 방법과 마감일이 각 일자리 상세 정보에 안내되어 있습니다.',
        action: { label: '🔍 일자리 검색하기', path: '/jobseeker/search' }
      }
    }

    if (lowerInput.includes('설정')) {
      return {
        text: '설정 페이지에서 계정 정보를 관리할 수 있습니다.',
        action: { label: '⚙️ 설정 페이지로 이동', path: '/jobseeker/settings' }
      }
    }

    if (lowerInput.includes('도움') || lowerInput.includes('help')) {
      return {
        text: '다음과 같은 도움을 드릴 수 있습니다:\n\n1. 일자리 추천 및 검색\n2. 프로필 관리 안내\n3. 적합도 점수 설명\n4. 자격증 및 경력 정보 입력\n5. 신체 속성 데이터 관리\n6. 일자리 지원 방법\n\n원하시는 내용을 말씀해주세요!'
      }
    }

    // 기본 응답
    return {
      text: '원하시는 일자리 조건을 더 구체적으로 말씀해주세요.\n\n예시:\n• "강남에서 주 5일 서빙 일자리 찾아줘"\n• "시급 2만원 이상 카페 알바"\n• "주말만 가능한 배달 일자리"\n\n또는 일반적인 질문도 가능합니다:\n• 일자리 추천 받기\n• 프로필 관리 방법\n• 적합도 점수 설명'
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSearch = async () => {
    setIsSearching(true)
    try {
      const response = await fetch('/api/jobs/active')
      if (response.ok) {
        let jobs = await response.json()
        
        // 필터 적용
        if (userPreferences.place) {
          jobs = jobs.filter((job: any) => 
            job.location?.includes(userPreferences.place!)
          )
        }
        if (userPreferences.category) {
          jobs = jobs.filter((job: any) => 
            job.category?.includes(userPreferences.category!)
          )
        }
        if (userPreferences.hourly_wage) {
          jobs = jobs.filter((job: any) => {
            const wage = job.hourlyWage || parseInt(job.salary?.replace(/[^0-9]/g, '') || '0')
            return wage >= userPreferences.hourly_wage!
          })
        }
        
        // 결과 변환
        const convertedJobs: Job[] = jobs.map((job: any) => ({
          id: job.id,
          title: job.title,
          category: job.category || '',
          company: job.company || '',
          location: job.location || '',
          salary: job.salary || `${job.hourlyWage?.toLocaleString()}원/시간`,
          description: job.description || '',
          type: job.type || '',
          posted: job.postedDate || new Date().toISOString(),
          hourlyWage: job.hourlyWage,
          qualifications: job.qualifications || []
        }))
        
        setSearchResults(convertedJobs)
      }
    } catch (error) {
      console.error('검색 오류:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleResetPreferences = () => {
    setUserPreferences({
      gender: null,
      age: null,
      place: null,
      work_days: null,
      start_time: null,
      end_time: null,
      hourly_wage: null,
      requirements: null,
      category: null
    })
    setSearchResults([])
  }

  const toggleSaveJob = (jobId: number) => {
    const newSavedIds = savedJobIds.includes(jobId)
      ? savedJobIds.filter(id => id !== jobId)
      : [...savedJobIds, jobId]
    
    setSavedJobIds(newSavedIds)
    localStorage.setItem('savedJobs', JSON.stringify(newSavedIds))
  }

  const getDaysAgo = (dateString: string): string => {
    const today = new Date()
    const postedDate = new Date(dateString)
    const diffTime = today.getTime() - postedDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return '오늘'
    if (diffDays === 1) return '1일전'
    if (diffDays < 7) return `${diffDays}일전`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주전`
    return `${Math.floor(diffDays / 30)}개월전`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 150px)', gap: '20px' }}>
      {/* 상단 영역: 채팅 + 조건 카드 */}
      <div style={{ display: 'flex', gap: '20px', height: searchResults.length > 0 ? '50%' : '100%', transition: 'height 0.3s ease' }}>
        {/* 좌측 채팅 영역 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>AI 챗봇 일자리 검색</h1>
            <p style={{ color: '#666', fontSize: '14px' }}>
              원하시는 조건을 자유롭게 말씀해주세요
            </p>
          </div>
          <button
            onClick={clearHistory}
            style={{
              padding: '8px 16px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              color: '#666',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5'
              e.currentTarget.style.borderColor = '#ff5252'
              e.currentTarget.style.color = '#ff5252'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff'
              e.currentTarget.style.borderColor = '#e0e0e0'
              e.currentTarget.style.color = '#666'
            }}
          >
            <Trash2 size={16} />
            대화 내역 삭제
          </button>
        </div>

        {/* 채팅 영역 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#f9f9f9',
          borderRadius: '12px',
          border: '1px solid #e0e0e0',
          overflow: 'hidden'
        }}>
        {/* 메시지 영역 */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              {message.sender === 'bot' && (
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#2196f3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Bot size={20} color="#ffffff" />
                </div>
              )}

              <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: message.sender === 'user' ? '#2196f3' : '#ffffff',
                  color: message.sender === 'user' ? '#ffffff' : '#333',
                  border: message.sender === 'bot' ? '1px solid #e0e0e0' : 'none',
                  boxShadow: message.sender === 'bot' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {message.text}
                </div>
                <div style={{ fontSize: '11px', color: '#999', paddingLeft: '4px' }}>
                  {message.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                {message.action && message.sender === 'bot' && (
                  <button
                    onClick={() => navigate(message.action!.path)}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: '#2196f3',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 4px rgba(33, 150, 243, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#1976d2'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(33, 150, 243, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#2196f3'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(33, 150, 243, 0.3)'
                    }}
                  >
                    {message.action.label}
                  </button>
                )}
              </div>

              {message.sender === 'user' && (
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <User size={20} color="#666" />
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#2196f3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Bot size={20} color="#ffffff" />
              </div>
              <div style={{
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                border: '1px solid #e0e0e0',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                display: 'flex',
                gap: '4px',
                alignItems: 'center'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#2196f3',
                  animation: 'bounce 1.4s infinite ease-in-out'
                }} />
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#2196f3',
                  animation: 'bounce 1.4s infinite ease-in-out 0.2s'
                }} />
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#2196f3',
                  animation: 'bounce 1.4s infinite ease-in-out 0.4s'
                }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <style>{`
          @keyframes bounce {
            0%, 60%, 100% {
              transform: translateY(0);
            }
            30% {
              transform: translateY(-10px);
            }
          }
        `}</style>

        {/* 입력 영역 */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid #e0e0e0',
          backgroundColor: '#ffffff',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요... (Enter: 전송, Shift+Enter: 줄바꿈)"
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '16px',
              resize: 'none',
              minHeight: '48px',
              maxHeight: '120px',
              fontFamily: 'inherit'
            }}
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            style={{
              padding: '12px 24px',
              backgroundColor: inputText.trim() ? '#2196f3' : '#e0e0e0',
              color: inputText.trim() ? '#ffffff' : '#999',
              border: 'none',
              borderRadius: '8px',
              cursor: inputText.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            <Send size={20} />
            전송
          </button>
          {Object.values(userPreferences).some(val => val !== null) && (
            <button
              onClick={handleSearch}
              style={{
                padding: '12px 24px',
                backgroundColor: '#4caf50',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#45a049'
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#4caf50'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(76, 175, 80, 0.3)'
              }}
            >
              🔍 조건으로 검색
            </button>
          )}
        </div>
      </div>

        {/* 빠른 질문 버튼들 */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          {['강남에서 주 5일 서빙 일자리', '시급 2만원 이상 카페', '주말만 가능한 배달', '일자리 추천 받기'].map((quickQuestion) => (
            <button
              key={quickQuestion}
              onClick={() => {
                setInputText(quickQuestion)
                setTimeout(() => handleSend(), 100)
              }}
              style={{
                padding: '8px 16px',
                border: '1px solid #2196f3',
                borderRadius: '20px',
                backgroundColor: 'transparent',
                color: '#2196f3',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e3f2fd'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              {quickQuestion}
            </button>
          ))}
        </div>
      </div>

        {/* 우측 일자리 조건 카드 */}
        <div style={{ width: '300px', flexShrink: 0 }}>
          <JobPreferencesCard 
            preferences={userPreferences}
            onReset={handleResetPreferences}
          />
        </div>
      </div>

      {/* 하단 검색 결과 영역 */}
      {searchResults.length > 0 && (
        <div style={{
          flex: 1,
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e0e0e0',
          padding: '24px',
          overflowY: 'auto'
        }}>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>검색 결과 ({searchResults.length}개)</h2>
            <button
              onClick={() => setSearchResults([])}
              style={{
                padding: '8px 16px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                color: '#666',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              결과 닫기
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
            {searchResults.map((job) => {
              const isSaved = savedJobIds.includes(job.id)
              return (
                <div
                  key={job.id}
                  style={{
                    padding: '20px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '12px',
                    backgroundColor: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  onClick={() => navigate(`/jobseeker/job/${job.id}`)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleSaveJob(job.id)
                    }}
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      padding: '8px',
                      border: 'none',
                      borderRadius: '8px',
                      backgroundColor: isSaved ? '#fff3e0' : '#f5f5f5',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={20} color="#ff9800" />
                    ) : (
                      <Bookmark size={20} color="#999" />
                    )}
                  </button>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{
                        padding: '4px 12px',
                        backgroundColor: '#e3f2fd',
                        color: '#2196f3',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {job.category}
                      </span>
                      <span style={{ color: '#999', fontSize: '12px' }}>
                        {getDaysAgo(job.posted)}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', paddingRight: '40px' }}>
                      {job.title}
                    </h3>
                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '4px' }}>
                      {job.company}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={16} color="#666" />
                      <span style={{ color: '#666', fontSize: '14px' }}>{job.location}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <DollarSign size={16} color="#4caf50" />
                      <span style={{ color: '#4caf50', fontWeight: '600', fontSize: '16px' }}>
                        {job.salary}
                      </span>
                    </div>
                    {job.qualifications && job.qualifications.length > 0 && (
                      <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {job.qualifications.slice(0, 3).map((qual, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#f5f5f5',
                              color: '#666',
                              borderRadius: '8px',
                              fontSize: '12px'
                            }}
                          >
                            {qual}
                          </span>
                        ))}
                        {job.qualifications.length > 3 && (
                          <span style={{ color: '#999', fontSize: '12px' }}>+{job.qualifications.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{
                    marginTop: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#2196f3',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        navigate(`/jobseeker/job/${job.id}`);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2196f3',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '14px',
                        fontWeight: '500',
                        padding: 0
                      }}
                    >
                      자세히 보기 <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default Chatbot

