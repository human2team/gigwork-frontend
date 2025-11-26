import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { User, Search, Briefcase, MessageCircle, Settings } from 'lucide-react'

const menuItems = [
  { path: '/jobseeker/search', icon: Search, label: '채용 검색' },
  { path: '/jobseeker/recommendations', icon: Briefcase, label: '추천 채용' },
  { path: '/jobseeker/chatbot', icon: MessageCircle, label: '챗봇' },
  { path: '/jobseeker/my-page', icon: User, label: '프로필' },
  { path: '/jobseeker/settings', icon: Settings, label: '설정' },
]

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <aside 
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      style={{
        width: isExpanded ? '240px' : '72px',
        backgroundColor: '#f5f5f5',
        padding: '24px 12px',
        borderRight: '1px solid #e0e0e0',
        transition: 'width 0.3s ease',
        overflow: 'hidden'
      }}
    >
      <nav>
        {menuItems
          .filter(item => item.path !== '/jobseeker/recommendations')
          .map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                marginBottom: '8px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: isActive ? '#e3f2fd' : 'transparent',
                color: isActive ? '#2196f3' : '#333',
                cursor: 'pointer',
                fontSize: '16px',
                textAlign: 'left',
                whiteSpace: 'nowrap',
                justifyContent: isExpanded ? 'flex-start' : 'center'
              }}
            >
              <Icon size={20} />
              {isExpanded && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar

