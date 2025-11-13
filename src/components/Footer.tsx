function Footer() {
  return (
    <footer style={{
      padding: '24px',
      textAlign: 'center',
      backgroundColor: '#ffffff',
      borderTop: '1px solid #e0e0e0',
      color: '#666',
      fontSize: '14px'
    }}>
      <div style={{ marginBottom: '8px' }}>
        <a href="#" style={{ color: '#666', textDecoration: 'none', margin: '0 8px' }}>회사 소개</a>
        <a href="#" style={{ color: '#666', textDecoration: 'none', margin: '0 8px' }}>개인정보처리방침</a>
        <a href="#" style={{ color: '#666', textDecoration: 'none', margin: '0 8px' }}>이용 약관</a>
      </div>
      <div>© 2025 AI GigWork. All rights reserved.</div>
    </footer>
  )
}

export default Footer

