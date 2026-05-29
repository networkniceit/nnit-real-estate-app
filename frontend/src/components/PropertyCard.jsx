import { FaHeart, FaMapMarkerAlt, FaWhatsapp, FaBed, FaBath, FaHome } from 'react-icons/fa'

export default function PropertyCard({ property, isFavorite, onToggleFavorite, onPurchase, checkoutLoading, user }) {
  const propertyId = property._id || property.id
  const badge = property.type || property.tag || 'Property'

  return (
    <article className="property-card">
      <span className="badge">{badge}</span>
      <h3>{property.title}</h3>
      <p className="meta">{property.location}</p>

      {property.image && (
        <img
          src={property.image}
          alt={property.title}
          style={{ width: '100%', height: 230, objectFit: 'cover', borderRadius: 18 }}
        />
      )}

      <div className="property-details">
        <span>
          <FaBed style={{ marginRight: 6 }} />
          {property.bedrooms || property.beds || 0} beds
        </span>
        <span>
          <FaBath style={{ marginRight: 6 }} />
          {property.bathrooms || property.baths || 0} baths
        </span>
        <span>
          <FaHome style={{ marginRight: 6 }} />
          {property.type || 'Luxury'}
        </span>
      </div>

      <div className="property-price">{property.price || `$${property.priceNumber || 0}`}</div>

      <button
        className="card-button"
        type="button"
        onClick={() => onPurchase(propertyId)}
        disabled={!user || checkoutLoading}
      >
        {user ? (checkoutLoading ? 'Starting checkout...' : 'Buy now') : 'Login to buy'}
      </button>

      <button
        className="card-button"
        type="button"
        onClick={() => onToggleFavorite(property)}
        style={{ background: isFavorite ? '#ef4444' : '#111827' }}
      >
        {isFavorite ? 'Remove Favorite' : 'Save Favorite'}
      </button>

      <a
        className="card-button"
        href={`https://wa.me/4915259031025?text=Hello%20NNIT%20Real%20Estate%20about%20${encodeURIComponent(property.title)}`}
        target="_blank"
        rel="noreferrer"
        style={{ background: '#25D366', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <FaWhatsapp style={{ marginRight: 8 }} />
        Contact
      </a>
    </article>
  )
}
