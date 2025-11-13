import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Bot, User, Trash2 } from 'lucide-react'

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
          text: '안녕하세요! AI GigWork 챗봇입니다. 어떤 도움이 필요하신가요?',
          sender: 'bot',
          timestamp: new Date()
        }]
      }
    }
    return [{
      id: 1,
      text: '안녕하세요! AI GigWork 챗봇입니다. 어떤 도움이 필요하신가요?',
      sender: 'bot',
      timestamp: new Date()
    }]
  })
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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

  const handleSend = () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages([...messages, userMessage])
    setInputText('')

    // 타이핑 표시
    setIsTyping(true)

    // 챗봇 응답 시뮬레이션 (타이핑 애니메이션)
    setTimeout(() => {
      setIsTyping(false)
      const { text, action } = generateBotResponse(inputText)
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

  const generateBotResponse = (userInput: string): { text: string; action?: { label: string; path: string } } => {
    const lowerInput = userInput.toLowerCase()

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
      text: '죄송합니다. 더 정확한 답변을 위해 질문을 다시 말씀해주시거나, 다음 중 하나를 선택해주세요:\n\n• 일자리 추천 받기\n• 프로필 관리 방법\n• 적합도 점수 설명\n• 지원 방법 안내'
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>AI 챗봇</h1>
          <p style={{ color: '#666', fontSize: '16px' }}>
            일자리 추천, 프로필 관리, 적합도 점수 등에 대해 질문해보세요!
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
        </div>
      </div>

      {/* 빠른 질문 버튼들 */}
      <div style={{
        marginTop: '16px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        {['일자리 추천 받기', '프로필 관리 방법', '적합도 점수 설명', '지원 방법 안내'].map((quickQuestion) => (
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
  )
}

export default Chatbot

