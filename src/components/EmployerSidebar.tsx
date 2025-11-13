import { useNavigate, useLocation } from 'react-router-dom'
import { Briefcase, FileText, Users, Settings } from 'lucide-react'

const menuItems = [
  { path: '/employer/jobs', icon: Briefcase, label: '공고 관리' },
  { path: '/employer/applications', icon: FileText, label: '지원자 관리' },
  { path: '/employer/candidates', icon: Users, label: '인재 검색' },
  { path: '/employer/settings', icon: Settings, label: '설정' },
]

function EmployerSidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <aside style={{
      width: '240px',
      backgroundColor: '#f5f5f5',
      padding: '24px',
      borderRight: '1px solid #e0e0e0'
    }}>
      <nav>
        {menuItems.map((item) => {
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
                textAlign: 'left'
              }}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

export default EmployerSidebar

