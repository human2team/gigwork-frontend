import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { UserProvider } from './contexts/UserContext'
import { JobProvider } from './contexts/JobContext'
import { ApplicationProvider } from './contexts/ApplicationContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { setupFetchInterceptor } from './utils/fetchInterceptor'
import './index.css'

// Fetch API 인터셉터 활성화 - 모든 fetch 호출에 JWT 토큰 자동 추가
setupFetchInterceptor()

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <UserProvider>
            <JobProvider>
              <ApplicationProvider>
                <App />
              </ApplicationProvider>
            </JobProvider>
          </UserProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)

