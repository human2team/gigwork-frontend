import { Outlet } from 'react-router-dom'
import EmployerSidebar from './EmployerSidebar'
import Header from './Header'
import Footer from './Footer'

function EmployerLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1 }}>
        <EmployerSidebar />
        <main style={{ flex: 1, padding: '24px', backgroundColor: '#ffffff' }}>
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}

export default EmployerLayout

