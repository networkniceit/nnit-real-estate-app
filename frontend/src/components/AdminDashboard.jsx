import { useState } from 'react'

export default function AdminDashboard({ visible, onClose }) {
  const [token, setToken] = useState('')
  const [users, setUsers] = useState([])
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(false)

  if (!visible) return null

  const effectiveToken = token || (typeof localStorage !== 'undefined' && localStorage.getItem('token'))
  const authHeader = effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {}

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('http://localhost:4000/api/admin/users', { headers: authHeader })
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      alert('Failed to fetch users (check token)')
    } finally {
      setLoading(false)
    }
  }

  const fetchProperties = async () => {
    setLoading(true)
    try {
      const res = await fetch('http://localhost:4000/api/admin/properties', { headers: authHeader })
      const data = await res.json()
      setProperties(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      alert('Failed to fetch properties (check token)')
    } finally {
      setLoading(false)
    }
  }

  const deleteProperty = async (id) => {
    if (!confirm('Delete property?')) return
    try {
      await fetch(`http://localhost:4000/api/admin/properties/${id}`, { method: 'DELETE', headers: authHeader })
      setProperties((p) => p.filter((x) => x._id !== id && x.id !== Number(id)))
    } catch (err) {
      console.error(err)
      alert('Delete failed')
    }
  }

  return (
    <div style={{position:'fixed',left:0,top:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}}>
      <div style={{width:'90%',maxWidth:980,background:'white',borderRadius:12,padding:20,maxHeight:'90%',overflow:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <h2>Admin Dashboard</h2>
          <div>
            <input placeholder="Admin token" value={token} onChange={(e)=>setToken(e.target.value)} style={{padding:8,marginRight:8,width:360}} />
            <button onClick={onClose} style={{padding:'8px 12px'}}>Close</button>
          </div>
        </div>

        <div style={{display:'flex',gap:12,marginBottom:12}}>
          <button onClick={fetchUsers} style={{padding:'8px 12px'}}>Load Users</button>
          <button onClick={fetchProperties} style={{padding:'8px 12px'}}>Load Properties</button>
        </div>

        {loading && <div>Loading...</div>}

        <h3>Users</h3>
        <div>
          {users.map(u=> (
            <div key={u._id || u.id} style={{padding:10,borderBottom:'1px solid #eee'}}>
              <strong>{u.name}</strong> — {u.email} — <em>{u.role}</em>
            </div>
          ))}
        </div>

        <h3 style={{marginTop:20}}>Properties</h3>
        <div>
          {properties.map(p=> (
            <div key={p._id || p.id} style={{display:'flex',justifyContent:'space-between',padding:10,borderBottom:'1px solid #eee'}}>
              <div>
                <strong>{p.title}</strong>
                <div style={{color:'#666'}}>{p.location} — {p.price}</div>
              </div>
              <div>
                <button onClick={()=>deleteProperty(p._id || p.id)} style={{background:'#ef4444',color:'white',border:'none',padding:'8px 12px',borderRadius:8}}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
