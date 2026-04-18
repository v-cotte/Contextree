'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)
    const supabase = createClient()

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) setError(error.message)
      else setMessage('Check your email for a confirmation link.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else { router.push('/'); router.refresh() }
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-secondary)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: '10%', left: '50%',
        transform: 'translateX(-50%)',
        width: '600px', height: '400px',
        background: 'radial-gradient(ellipse, rgba(139,127,232,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%', maxWidth: '380px',
        background: 'chatvar(--bg-primary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '32px',
        display: 'flex', flexDirection: 'column', gap: '20px',
        position: 'relative',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '4px' }}>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: '26px',
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
            marginBottom: '6px',
          }}>
            Contextree
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {isSignUp ? 'Create your account' : 'Sign in to continue'}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                padding: '9px 12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-default)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
                width: '100%',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent)' }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border-default)' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              style={{
                padding: '9px 12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-default)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
                width: '100%',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent)' }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border-default)' }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
        </div>

        {error && (
          <div style={{
            padding: '10px 12px',
            background: 'rgba(226,81,74,0.08)',
            border: '1px solid rgba(226,81,74,0.2)',
            borderRadius: '8px',
            fontSize: '12.5px',
            color: 'var(--danger)',
          }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{
            padding: '10px 12px',
            background: 'rgba(76,175,125,0.08)',
            border: '1px solid rgba(76,175,125,0.2)',
            borderRadius: '8px',
            fontSize: '12.5px',
            color: 'var(--success)',
          }}>
            {message}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !email || !password}
          style={{
            padding: '10px',
            border: 'none',
            borderRadius: '9px',
            background: loading || !email || !password
              ? 'var(--border-emphasis)'
              : 'linear-gradient(135deg, #7C70DC, #9B8FE8)',
            color: 'white',
            fontSize: '13px',
            fontWeight: 500,
            cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
            width: '100%',
          }}
        >
          {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
        </button>

        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null) }}
          style={{
            background: 'none', border: 'none',
            fontSize: '12.5px',
            color: 'var(--text-faint)',
            cursor: 'pointer',
            padding: 0,
            textAlign: 'center',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-secondary)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-faint)' }}
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  )
}