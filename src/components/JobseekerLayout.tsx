import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import Footer from './Footer'

function JobseekerLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      <Header />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '24px', backgroundColor: '#ffffff' }}>
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}

export default JobseekerLayout

