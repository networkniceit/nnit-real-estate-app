import PropertyCard from './PropertyCard'

export default function PropertyGrid({ properties }) {
  if (!properties.length) {
    return (
      <div className="empty-state">
        <p>No properties match your search yet.</p>
        <p>Try a different location or remove search terms.</p>
      </div>
    )
  }

  return (
    <div className="property-grid">
      {properties.map((property) => (
        <div key={property.id} className="property-card">
          <span className="badge">{property.tag}</span>

          <h3>{property.title}</h3>

          <p className="meta">{property.city}</p>

          <div className="property-details">
            <span>{property.bedrooms} beds</span>
            <span>{property.bathrooms} baths</span>
          </div>

          <div className="property-price">
            {property.price}
          </div>

          <button className="card-button">
            View details
          </button>
        </div>
      ))}
    </div>
  )
}
