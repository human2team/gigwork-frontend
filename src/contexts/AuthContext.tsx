import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

type UserType = 'jobseeker' | 'employer' | null

interface AuthContextType {
  userType: UserType
  isAuthenticated: boolean
  login: (type: 'jobseeker' | 'employer') => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userType, setUserType] = useState<UserType>(null)

  useEffect(() => {
    // 페이지 로드 시 localStorage에서 인증 상태 확인
    const savedUserType = localStorage.getItem('userType') as UserType
    if (savedUserType === 'jobseeker' || savedUserType === 'employer') {
      setUserType(savedUserType)
    }
  }, [])

  const login = (type: 'jobseeker' | 'employer') => {
    setUserType(type)
    localStorage.setItem('userType', type)
  }

  const logout = () => {
    setUserType(null)
    localStorage.removeItem('userType')
  }

  return (
    <AuthContext.Provider
      value={{
        userType,
        isAuthenticated: userType !== null,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}


