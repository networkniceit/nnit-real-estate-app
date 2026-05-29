const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cloudinary = require('cloudinary').v2
require('dotenv').config()

const properties = require('./data/properties')
const User = require('./models/User')
const Property = require('./models/Property')
const Transaction = require('./models/Transaction')

const app = express()
const port = process.env.PORT || 4000

app.use(cors())

// UPLOADS: serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// MULTER
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'))
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + file.originalname.replace(/\s+/g, '-')
    cb(null, unique)
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only JPEG, PNG and WEBP images are allowed'))
    }
  }
})

async function getImageUrl(req, file) {
  if (!file) return null

  const localUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`

  if (cloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'nnit_real_estate/properties',
        resource_type: 'image'
      })
      fs.unlink(file.path, () => {})
      return result.secure_url
    } catch (err) {
      console.error('Cloudinary upload failed', err)
      fs.unlink(file.path, () => {})
      return localUrl
    }
  }

  return localUrl
}

// ==========
// MONGODB
// ==========
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nnit_real_estate'

mongoose
  .connect(mongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error', err))

const jwtSecret = process.env.JWT_SECRET || 'change_this_secret'
const cloudinaryConfigured = Boolean(process.env.CLOUDINARY_URL || process.env.CLOUDINARY_CLOUD_NAME)

function parsePriceNumber(price) {
  const numeric = Number(String(price).replace(/[^0-9.]/g, '').trim())
  return Number.isFinite(numeric) ? numeric : 0
}

const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  })
}

// ==============
// AUTH MIDDLEWARE
// ==============
function authenticate(req, res, next) {
  const auth = req.headers.authorization
  if (!auth) return res.status(401).json({ error: 'Missing Authorization' })

  const parts = auth.split(' ')
  if (parts.length !== 2) return res.status(401).json({ error: 'Invalid Authorization' })

  const token = parts[1]
  try {
    const decoded = jwt.verify(token, jwtSecret)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' })
  next()
}

// FRONTEND DIST
const frontendDist = path.resolve(__dirname, '../frontend/dist')

console.log('Serving dist from', frontendDist)

// REQUEST LOGGER
app.use((req, res, next) => {
  console.log('REQ', req.method, req.path)
  next()
})

// STATIC FILES
app.use(
  express.static(frontendDist, {
    index: 'index.html',
    extensions: ['html'],
    fallthrough: true,
    redirect: false
  })
)

// =======================
// GET PROPERTIES
// =======================
app.get('/api/properties', (req, res) => {
  const { q } = req.query

  // If MongoDB is connected, prefer DB results
  if (mongoose.connection.readyState === 1) {
    const filter = {}
    if (q) {
      const query = String(q)
      filter.$or = [
        { title: new RegExp(query, 'i') },
        { location: new RegExp(query, 'i') },
        { tag: new RegExp(query, 'i') }
      ]
    }

    Property.find(filter)
      .then((docs) => res.json(docs))
      .catch((err) => {
        console.error('Property find error', err)
        res.status(500).json({ error: 'DB error' })
      })
    return
  }

  let results = properties

  if (q) {
    const query = String(q).toLowerCase()

    results = results.filter((property) => {
      return (
        property.title.toLowerCase().includes(query) ||
        property.location.toLowerCase().includes(query) ||
        property.tag.toLowerCase().includes(query)
      )
    })
  }

  res.json(results)
})

// =======================
// AUTH: register / login
// =======================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password required' })
    }

    const existing = await User.findOne({ email })
    if (existing) return res.status(400).json({ error: 'Email already in use' })

    const hash = await bcrypt.hash(password, 10)

    const user = new User({ name, email, password: hash })
    await user.save()

    const token = jwt.sign({ id: user._id, role: user.role }, jwtSecret, { expiresIn: '7d' })

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    console.error('Register error', err)
    res.status(500).json({ error: 'Server error' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ error: 'Invalid credentials' })

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' })

    const token = jwt.sign({ id: user._id, role: user.role }, jwtSecret, { expiresIn: '7d' })

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    console.error('Login error', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// =======================
// ADD PROPERTY (UPLOAD)
// =======================
app.post('/api/properties', upload.single('image'), async (req, res) => {
  try {
    const { title, location, price, bedrooms, bathrooms, type } = req.body

    if (!title || !location || !price) {
      return res.status(400).json({ error: 'Title, location and price are required.' })
    }

    const imageUrl = await getImageUrl(req, req.file)
    const owner = req.user?.id || null

    const priceNumber = parsePriceNumber(price)
    const currency = 'usd'

    const newProperty = {
      id: properties.length + 1,
      title,
      location,
      price,
      priceNumber,
      currency,
      bedrooms,
      bathrooms,
      type,
      image: imageUrl,
      owner,
      commissionRate: 0.05
    }

    properties.push(newProperty)

    if (mongoose.connection.readyState === 1) {
      const doc = new Property({
        title,
        location,
        price,
        priceNumber,
        currency,
        bedrooms: bedrooms ? Number(bedrooms) : undefined,
        bathrooms: bathrooms ? Number(bathrooms) : undefined,
        type,
        image: imageUrl,
        owner,
        commissionRate: 0.05
      })

      const saved = await doc.save()
      return res.json({ message: 'Property added', property: saved })
    }

    return res.json({ message: 'Property added', property: newProperty })
  } catch (err) {
    console.error('Add property error', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// =======================
// FAVORITES
// =======================
app.get('/api/favorites', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('favorites')
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user.favorites)
  } catch (err) {
    console.error('Favorites load error', err)
    res.status(500).json({ error: 'Server error' })
  }
})

app.post('/api/favorites/:propertyId', authenticate, async (req, res) => {
  try {
    const { propertyId } = req.params
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({ error: 'Invalid property id' })
    }

    const property = await Property.findById(propertyId)
    if (!property) return res.status(404).json({ error: 'Property not found' })

    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ error: 'User not found' })

    if (user.favorites.some((fav) => fav.toString() === propertyId)) {
      return res.json({ message: 'Already favorited', favorites: user.favorites })
    }

    user.favorites.push(propertyId)
    await user.save()

    res.json({ message: 'Favorite added', favorites: user.favorites })
  } catch (err) {
    console.error('Add favorite error', err)
    res.status(500).json({ error: 'Server error' })
  }
})

app.delete('/api/favorites/:propertyId', authenticate, async (req, res) => {
  try {
    const { propertyId } = req.params
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({ error: 'Invalid property id' })
    }

    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ error: 'User not found' })

    user.favorites = user.favorites.filter((fav) => fav.toString() !== propertyId)
    await user.save()

    res.json({ message: 'Favorite removed', favorites: user.favorites })
  } catch (err) {
    console.error('Remove favorite error', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// =======================
// PAYMENTS
// =======================
app.use(express.json())

app.post('/api/payments/purchase', authenticate, async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe is not configured' })

  try {
    const { propertyId } = req.body
    if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({ error: 'Valid propertyId is required' })
    }

    const property = await Property.findById(propertyId).populate('owner')
    if (!property) return res.status(404).json({ error: 'Property not found' })
    if (!property.priceNumber || property.priceNumber <= 0) {
      return res.status(400).json({ error: 'Property price is invalid' })
    }

    const buyer = await User.findById(req.user.id)
    if (!buyer) return res.status(404).json({ error: 'Buyer not found' })

    const seller = property.owner || buyer
    const commissionRate = property.commissionRate || 0.05
    const amount = Math.round(property.priceNumber * 100)
    const commissionAmount = Math.round(amount * commissionRate)
    const sellerAmount = amount - commissionAmount

    const transaction = new Transaction({
      property: property._id,
      buyer: buyer._id,
      seller: seller._id,
      amount,
      currency: property.currency || 'usd',
      commissionRate,
      commissionAmount,
      sellerAmount,
      status: 'pending'
    })

    await transaction.save()

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: buyer.email,
      line_items: [
        {
          price_data: {
            currency: property.currency || 'usd',
            product_data: {
              name: `Purchase: ${property.title}`
            },
            unit_amount: amount
          },
          quantity: 1
        }
      ],
      metadata: {
        transactionId: transaction._id.toString(),
        propertyId: property._id.toString(),
        sellerId: seller._id.toString(),
        buyerId: buyer._id.toString()
      },
      success_url: `${process.env.SUCCESS_URL || 'http://localhost:5173'}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CANCEL_URL || 'http://localhost:5173'}`
    })

    transaction.stripeSessionId = session.id
    await transaction.save()

    res.json({ url: session.url, sessionId: session.id })
  } catch (err) {
    console.error('Checkout error', err)
    res.status(500).json({ error: 'Payment error' })
  }
})

app.post('/api/payments/subscribe', authenticate, async (req, res) => {
  if (!stripe || !process.env.STRIPE_SUBSCRIPTION_PRICE_ID) {
    return res.status(500).json({ error: 'Stripe subscription is not configured' })
  }

  try {
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ error: 'User not found' })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: user.email,
      line_items: [{ price: process.env.STRIPE_SUBSCRIPTION_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.SUCCESS_URL || 'http://localhost:5173'}`,
      cancel_url: `${process.env.CANCEL_URL || 'http://localhost:5173'}`
    })

    res.json({ url: session.url, sessionId: session.id })
  } catch (err) {
    console.error('Subscribe error', err)
    res.status(500).json({ error: 'Subscription error' })
  }
})

app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(500).json({ error: 'Stripe webhook is not configured' })
  }

  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature error', err)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const txId = session.metadata?.transactionId
    if (txId && mongoose.Types.ObjectId.isValid(txId)) {
      const transaction = await Transaction.findById(txId)
      if (transaction) {
        transaction.status = 'paid'
        await transaction.save()
      }
    }
  }

  res.json({ received: true })
})

app.get('/api/seller/dashboard', authenticate, async (req, res) => {
  try {
    const sellerId = req.user.id
    const properties = await Property.find({ owner: sellerId })
    const transactions = await Transaction.find({ seller: sellerId }).populate('property buyer')

    const totalSales = transactions.length
    const totalRevenue = transactions.reduce((sum, tx) => sum + (tx.sellerAmount || 0), 0)
    const totalCommission = transactions.reduce((sum, tx) => sum + (tx.commissionAmount || 0), 0)

    res.json({ properties, transactions, metrics: { totalSales, totalRevenue, totalCommission } })
  } catch (err) {
    console.error('Seller dashboard error', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// =======================
// ADMIN ROUTES
// =======================
app.get('/api/admin/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password')
    res.json(users)
  } catch (err) {
    console.error('Admin users error', err)
    res.status(500).json({ error: 'Server error' })
  }
})

app.get('/api/admin/properties', authenticate, requireAdmin, async (req, res) => {
  try {
    const props = await Property.find()
    res.json(props)
  } catch (err) {
    console.error('Admin properties error', err)
    res.status(500).json({ error: 'Server error' })
  }
})

app.delete('/api/admin/properties/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    await Property.findByIdAndDelete(id)
    res.json({ message: 'Deleted' })
  } catch (err) {
    console.error('Admin delete property error', err)
    res.status(500).json({ error: 'Server error' })
  }
})

app.patch('/api/admin/users/:id/role', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { role } = req.body
    const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-password')
    res.json(user)
  } catch (err) {
    console.error('Admin update role error', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// =======================
// CONTACT FORM
// =======================
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body

  if (!name || !email || !message) {
    return res.status(400).json({
      error: 'Name, email, and message are required.'
    })
  }

  console.log('Contact request received:', {
    name,
    email,
    message
  })

  res.json({
    message:
      'Thank you! Your request has been received. We will be in touch soon.'
  })
})

// =======================
// SPA FALLBACK
// =======================
app.use((req, res) => {
  const indexPath = path.join(frontendDist, 'index.html')

  console.log('SPA fallback', req.method, req.path)

  if (!req.path.startsWith('/api')) {
    return res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('sendFile error', err)
        return res.status(500).end()
      }
    })
  }

  return res.status(404).json({
    error: 'Not found'
  })
})
// =======================
// START SERVER
// =======================
app.listen(port, () => {
  console.log(
    `NNIT Real Estate backend listening on http://localhost:${port}`
  )
})
