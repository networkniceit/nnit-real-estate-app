export default function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-copy">
        <p className="eyebrow">Discover your home</p>
        <h2>Modern living designed for every device.</h2>
        <p>
          Explore polished real estate listings with responsive layouts, clean details, and fast browsing on phone, tablet, and desktop.
        </p>
        <div className="hero-actions">
          <a className="button button-primary" href="#properties">
            See listings
          </a>
          <a className="button button-secondary" href="#features">
            Why NNIT
          </a>
        </div>
      </div>

      <div className="hero-image">
        <div className="hero-card">
          <span>Featured</span>
          <strong>City residence with rooftop terrace</strong>
          <div>3 beds • 2 baths • 125 m²</div>
        </div>
      </div>
    </section>
  )
}
