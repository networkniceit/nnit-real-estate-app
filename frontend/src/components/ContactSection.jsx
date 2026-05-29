import { useState } from 'react'

export default function ContactSection({ status, onSubmit }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSending(true)

    try {
      await onSubmit({ name, email, message })
      setName('')
      setEmail('')
      setMessage('')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="section-block contact-section" id="contact">
      <div className="section-heading">
        <h2>Ready to explore your next home?</h2>
        <p>Contact the NNIT Real Estate team for personal support and property tours.</p>
      </div>
      <div className="contact-grid">
        <form className="contact-form" onSubmit={handleSubmit}>
          <label htmlFor="contact-name">Name</label>
          <input
            id="contact-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            required
          />

          <label htmlFor="contact-email">Email</label>
          <input
            id="contact-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />

          <label htmlFor="contact-message">Message</label>
          <textarea
            id="contact-message"
            rows="5"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Tell us what you are looking for"
            required
          />

          <button className="button button-primary" type="submit" disabled={sending}>
            {sending ? 'Sending...' : 'Send request'}
          </button>

          {status.error && <p className="status-message status-error">{status.error}</p>}
          {status.message && <p className="status-message status-success">{status.message}</p>}
        </form>

        <div className="contact-info">
          <h3>Enterprise support</h3>
          <p>
            Connect with our team for bespoke property sourcing, guided tours, and
            corporate relocation inquiries.
          </p>
          <p>
            <strong>Email:</strong> hello@nnit-real-estate.app
          </p>
          <p>
            <strong>Phone:</strong> +49 15259031025
          </p>
        </div>
      </div>
    </section>
  )
}
