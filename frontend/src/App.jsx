import { useEffect, useMemo, useState } from 'react'
import {
  FaSearch,
  FaWhatsapp,
  FaEnvelope,
  FaGlobeEurope
} from 'react-icons/fa'
import AdminDashboard from './components/AdminDashboard'
import Auth from './components/Auth'
import PropertyCard from './components/PropertyCard'
import SellerDashboard from './components/SellerDashboard'

function App() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)

  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [price, setPrice] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [type, setType] = useState('')

  const [image, setImage] = useState(null)

  const [search, setSearch] = useState('')
  const [preview, setPreview] = useState(null)
  const [showAdmin, setShowAdmin] = useState(false)
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [favoriteIds, setFavoriteIds] = useState([])
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [sellerData, setSellerData] = useState(null)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [sellerError, setSellerError] = useState(null)
  const [subscribeLoading, setSubscribeLoading] = useState(false)

  const getToken = () => {
    if (typeof localStorage === 'undefined') return null
    return localStorage.getItem('token')
  }

  const loadFavorites = async (authenticatedUser = user) => {
    if (!authenticatedUser) {
      setFavoriteIds([])
      return
    }

    try {
      const token = getToken()
      const res = await fetch('http://localhost:4000/api/favorites', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const data = await res.json()
      if (Array.isArray(data)) {
        setFavoriteIds(data.map((item) => item._id || item.id))
      } else {
        setFavoriteIds([])
      }
    } catch (err) {
      console.error('Load favorites error', err)
      setFavoriteIds([])
    }
  }

  const handleAuth = (u) => {
    setUser(u)
    loadFavorites(u)
    loadSellerDashboard(u)
  }

  const subscribePlan = async () => {
    if (!user) {
      alert('Login before subscribing')
      return
    }

    setSubscribeLoading(true)
    try {
      const token = getToken()
      const res = await fetch('http://localhost:4000/api/payments/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Unable to start subscription checkout')
      }
    } catch (err) {
      console.error('Subscription error', err)
      alert('Unable to start subscription checkout')
    } finally {
      setSubscribeLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setFavoriteIds([])
    setSellerData(null)
  }

  // =========================
  // LOAD PROPERTIES
  // =========================

  const loadProperties = async () => {
    try {
      setLoading(true)

      const res = await fetch('http://localhost:4000/api/properties')
      const data = await res.json()

      setProperties(data)
    } catch (err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true)
        const res = await fetch('http://localhost:4000/api/properties')
        const data = await res.json()
        setProperties(data)
      } catch (err) {
        console.log(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProperties()
  }, [])

  // =========================
  // SEARCH
  // =========================

  const filtered = useMemo(() => {
    const query = search.toLowerCase()

    return properties.filter((p) => {
      return (
        p.title?.toLowerCase().includes(query) ||
        p.location?.toLowerCase().includes(query) ||
        p.type?.toLowerCase().includes(query)
      )
    })
  }, [search, properties])

  // =========================
  // IMAGE PREVIEW
  // =========================

  const handleImage = (e) => {
    const file = e.target.files[0]

    if (file) {
      setImage(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  const toggleFavorite = async (property) => {
    if (!user) {
      alert('Please login to save favorites')
      return
    }

    const propertyId = property._id || property.id
    const isFavorite = favoriteIds.includes(propertyId)
    const token = getToken()

    try {
      const res = await fetch(`http://localhost:4000/api/favorites/${propertyId}`, {
        method: isFavorite ? 'DELETE' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const data = await res.json()
      if (Array.isArray(data.favorites)) {
        setFavoriteIds(data.favorites.map((fav) => fav.toString()))
      } else if (data.message) {
        setFavoriteIds((current) => {
          if (isFavorite) {
            return current.filter((id) => id !== propertyId)
          }
          return [...current, propertyId]
        })
      }
    } catch (err) {
      console.error('Favorite toggle error', err)
      alert('Unable to update favorites')
    }
  }

  const purchaseProperty = async (propertyId) => {
    if (!user) {
      alert('Please sign in to purchase this property')
      return
    }

    setCheckoutLoading(true)
    try {
      const token = getToken()
      const res = await fetch('http://localhost:4000/api/payments/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ propertyId })
      })
      const data = await res.json()
      if (data.error) {
        alert(data.error)
        return
      }
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Unable to start checkout')
      }
    } catch (err) {
      console.error('Purchase error', err)
      alert('Unable to start payment')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const loadSellerDashboard = async (authenticatedUser = user) => {
    if (!authenticatedUser) return
    setDashboardLoading(true)
    setSellerError(null)

    try {
      const token = getToken()
      const res = await fetch('http://localhost:4000/api/seller/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const data = await res.json()
      if (res.ok) {
        setSellerData(data)
      } else {
        setSellerData(null)
        setSellerError(data.error || 'Unable to load seller dashboard')
      }
    } catch (err) {
      console.error('Seller dashboard error', err)
      setSellerError('Unable to load seller dashboard')
      setSellerData(null)
    } finally {
      setDashboardLoading(false)
    }
  }

  // =========================
  // ADD PROPERTY
  // =========================

  const addProperty = async () => {
    if (!title || !location || !price) {
      alert('Please complete all required fields')
      return
    }

    const formData = new FormData()

    formData.append('title', title)
    formData.append('location', location)
    formData.append('price', price)
    formData.append('bedrooms', bedrooms)
    formData.append('bathrooms', bathrooms)
    formData.append('type', type)

    if (image) {
      formData.append('image', image)
    }

    try {
      await fetch('http://localhost:4000/api/properties', {
        method: 'POST',
        body: formData
      })

      setTitle('')
      setLocation('')
      setPrice('')
      setBedrooms('')
      setBathrooms('')
      setType('')
      setImage(null)
      setPreview(null)

      loadProperties()

      alert('Property uploaded successfully')
    } catch (err) {
      console.log(err)
      alert('Upload failed')
    }
  }

  return (
    <div
      style={{
        fontFamily: 'Arial',
        background: '#f3f4f6',
        minHeight: '100vh',
        padding: 20
      }}
    >
      {/* HEADER */}

      <div
        style={{
          background: '#111827',
          color: 'white',
          padding: 30,
          borderRadius: 20,
          marginBottom: 30
        }}
      >
        <h1
          style={{
            fontSize: 40,
            marginBottom: 10
          }}
        >
          NNIT Real Estate
        </h1>

        <p
          style={{
            fontSize: 18,
            opacity: 0.9
          }}
        >
          Premium global property marketplace
        </p>

        <div
          style={{
            marginTop: 20,
            lineHeight: 2
          }}
        >
          <p>
            <FaEnvelope style={{ marginRight: 10 }} />
            networkniceit@gmail.com
          </p>

          <p>
            <FaGlobeEurope style={{ marginRight: 10 }} />
            Germany
          </p>

          <p>
            <FaWhatsapp style={{ marginRight: 10 }} />
            +49 15259031025
          </p>
        </div>
        <div style={{ position: 'absolute', top: 30, right: 30, display: 'flex', gap: 10, alignItems: 'center' }}>
          <Auth onAuth={handleAuth} />
          {user ? (
            <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
              <span style={{color:'#fff'}}>{user.name}</span>
              <button onClick={loadSellerDashboard} style={{padding:8,borderRadius:8,background:'#10b981',color:'white',border:'none'}}>Seller Dashboard</button>
              <button onClick={subscribePlan} style={{padding:8,borderRadius:8,background:'#2563eb',color:'white',border:'none'}} disabled={subscribeLoading}>
                {subscribeLoading ? 'Subscribing...' : 'Subscribe'}
              </button>
              <button onClick={logout} style={{padding:8,borderRadius:8}}>Logout</button>
            </div>
          ) : null}
          <button
            onClick={() => setShowAdmin(true)}
            style={{ background: '#374151', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 8 }}
          >
            Admin
          </button>
        </div>
      </div>
      {/* FLOATING WHATSAPP BUTTON */}
      <a
        href="https://wa.me/4915259031025?text=Hello%20NNIT%20Real%20Estate"
        target="_blank"
        rel="noreferrer"
        style={{
          position: 'fixed',
          right: 20,
          bottom: 20,
          background: '#25D366',
          color: 'white',
          width: 56,
          height: 56,
          borderRadius: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 18px rgba(0,0,0,0.15)',
          textDecoration: 'none'
        }}
      >
        <FaWhatsapp />
      </a>
      <AdminDashboard visible={showAdmin} onClose={()=>setShowAdmin(false)} />

      {/* SEARCH */}

      <div
        style={{
          background: 'white',
          borderRadius: 15,
          padding: 15,
          display: 'flex',
          alignItems: 'center',
          marginBottom: 30,
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}
      >
        <FaSearch />

        <input
          placeholder="Search properties, city, type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            border: 'none',
            outline: 'none',
            marginLeft: 10,
            width: '100%',
            fontSize: 16
          }}
        />
      </div>

      {/* UPLOAD FORM */}

      <div
        style={{
          background: 'white',
          padding: 25,
          borderRadius: 20,
          marginBottom: 40,
          boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
        }}
      >
        <h2 style={{ marginBottom: 20 }}>
          Upload Property
        </h2>

        <input
          placeholder="Property title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={inputStyle}
        />

        <input
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          style={inputStyle}
        />

        <input
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          style={inputStyle}
        />

        <input
          placeholder="Bedrooms"
          value={bedrooms}
          onChange={(e) => setBedrooms(e.target.value)}
          style={inputStyle}
        />

        <input
          placeholder="Bathrooms"
          value={bathrooms}
          onChange={(e) => setBathrooms(e.target.value)}
          style={inputStyle}
        />

        <input
          placeholder="Property Type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={inputStyle}
        />

        <input
          type="file"
          onChange={handleImage}
          style={{ marginBottom: 20 }}
        />

        {preview && (
          <img
            src={preview}
            alt="Preview"
            style={{
              width: 300,
              borderRadius: 15,
              marginBottom: 20,
              display: 'block'
            }}
          />
        )}

        <button
          onClick={addProperty}
          style={{
            background: '#111827',
            color: 'white',
            border: 'none',
            padding: '14px 24px',
            borderRadius: 12,
            cursor: 'pointer',
            fontSize: 16,
            fontWeight: 'bold'
          }}
        >
          Upload Property
        </button>
      </div>

      <SellerDashboard
        sellerData={sellerData}
        loading={dashboardLoading}
        error={sellerError}
        onRefresh={() => loadSellerDashboard()}
        onSubscribe={subscribePlan}
        subscribeLoading={subscribeLoading}
      />

      {/* LOADING */}

      {loading && (
        <h2 style={{ textAlign: 'center' }}>
          Loading properties...
        </h2>
      )}

      {/* EMPTY STATE */}

      {!loading && filtered.length === 0 && (
        <h2 style={{ textAlign: 'center' }}>
          No properties found
        </h2>
      )}

      {/* PROPERTY GRID */}

      <div className="property-grid">
        {filtered.map((p) => (
          <PropertyCard
            key={p._id || p.id || p.title}
            property={p}
            isFavorite={favoriteIds.includes(p._id || p.id)}
            onToggleFavorite={() => toggleFavorite(p)}
            onPurchase={purchaseProperty}
            checkoutLoading={checkoutLoading}
            user={user}
          />
        ))}
      </div>
    </div>
  )
}

const inputStyle = {
  display: 'block',
  width: '100%',
  padding: 14,
  marginBottom: 15,
  borderRadius: 12,
  border: '1px solid #d1d5db',
  fontSize: 16,
  boxSizing: 'border-box'
}

export default App