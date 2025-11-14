import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import JobseekerLogin from './pages/JobseekerLogin'
import EmployerLogin from './pages/EmployerLogin'
import JobseekerSignup from './pages/JobseekerSignup'
import EmployerSignup from './pages/EmployerSignup'
import TermsOfService from './pages/TermsOfService'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Profile from './pages/Profile'
import JobSearch from './pages/JobSearch'
import Recommendations from './pages/Recommendations'
import JobDetails from './pages/JobDetails'
import Chatbot from './pages/Chatbot'
import JobManagement from './pages/JobManagement'
import JobPosting from './pages/JobPosting'
import EmployerJobView from './pages/EmployerJobView'
import EmployerJobEdit from './pages/EmployerJobEdit'
import Applications from './pages/Applications'
import ApplicationDetail from './pages/ApplicationDetail'
import CandidateSearch from './pages/CandidateSearch'
import EmployerSettings from './pages/EmployerSettings'
import JobseekerSettings from './pages/JobseekerSettings'
import JobseekerLayout from './components/JobseekerLayout'
import EmployerLayout from './components/EmployerLayout'
import CandidateDetail from './pages/CandidateDetail'

function App() {
  return (
    <Routes>
      {/* 메인 페이지 */}
      <Route path="/" element={<Home />} />
      
      {/* 로그인 페이지 */}
      <Route path="/login/jobseeker" element={<JobseekerLogin />} />
      <Route path="/login/employer" element={<EmployerLogin />} />
      
      {/* 회원가입 페이지 */}
      <Route path="/signup/jobseeker" element={<JobseekerSignup />} />
      <Route path="/signup/employer" element={<EmployerSignup />} />
      
      {/* 약관 및 정책 페이지 */}
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      
      {/* 구직자 레이아웃 */}
      <Route path="/jobseeker" element={<JobseekerLayout />}>
        <Route path="my-page" element={<Profile />} />
        <Route path="search" element={<JobSearch />} />
        <Route path="recommendations" element={<Recommendations />} />
        <Route path="job/:id" element={<JobDetails />} />
        <Route path="chatbot" element={<Chatbot />} />
        <Route path="settings" element={<JobseekerSettings />} />
      </Route>
      
      {/* 사업자 레이아웃 */}
      <Route path="/employer" element={<EmployerLayout />}>
        <Route index element={<Navigate to="/employer/jobs" replace />} />
        <Route path="dashboard" element={<Navigate to="/employer/jobs" replace />} />
        <Route path="jobs" element={<JobManagement />} />
        <Route path="jobs/posting" element={<JobPosting />} />
        <Route path="jobs/:id" element={<EmployerJobView />} />
        <Route path="jobs/:id/edit" element={<EmployerJobEdit />} />
        <Route path="applications" element={<Applications />} />
        <Route path="applications/:id" element={<ApplicationDetail />} />
        <Route path="candidates" element={<CandidateSearch />} />
        <Route path="candidates/:id" element={<CandidateDetail />} />
        <Route path="settings" element={<EmployerSettings />} />
      </Route>
    </Routes>
  )
}

export default App

