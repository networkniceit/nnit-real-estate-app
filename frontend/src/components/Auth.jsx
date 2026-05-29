import { useState } from 'react'

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const base = 'http://localhost:4000/api/auth'

  const submit = async () => {
    try {
      const url = mode === 'login' ? `${base}/login` : `${base}/register`
      const res = await fetch(url, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name, email, password }) })
      const data = await res.json()
      if (data.error) return alert(data.error)
      if (data.token) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        onAuth && onAuth(data.user)
        setName(''); setEmail(''); setPassword('')
      }
    } catch (err) {
      console.error(err)
      alert('Auth failed')
    }
  }

  return (
    <div style={{display:'flex',gap:12,alignItems:'center'}}>
      <div>
        <button onClick={()=>setMode('login')} style={{padding:8,marginRight:8,background:mode==='login'? '#111827':'#eee',color: mode==='login'?'white':'black'}}>Login</button>
        <button onClick={()=>setMode('register')} style={{padding:8,background:mode==='register'? '#111827':'#eee',color: mode==='register'?'white':'black'}}>Register</button>
      </div>

      {mode==='register' && (
        <input placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} style={{padding:8}} />
      )}

      <input placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} style={{padding:8}} />
      <input placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} style={{padding:8}} />
      <button onClick={submit} style={{padding:'8px 12px',background:'#111827',color:'white',border:'none',borderRadius:8}}>{mode==='login'?'Sign in':'Sign up'}</button>
    </div>
  )
}
