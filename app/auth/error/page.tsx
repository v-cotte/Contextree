export default function AuthError() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: '12px'
    }}>
      <h1 style={{ fontSize: '20px', fontWeight: 500 }}>
        Authentication error
      </h1>
      <p style={{ color: 'var(--color-text-secondary)' }}>
        Something went wrong. Please try again.
      </p>
      <a href="/auth/login" style={{ color: 'var(--color-text-info)' }}>
        Back to login
      </a>
    </div>
  )
}