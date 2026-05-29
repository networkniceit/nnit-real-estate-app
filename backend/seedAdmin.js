const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config()
const User = require('./models/User')

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nnit_real_estate'

async function run() {
  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@nnit.local'
  const adminPass = process.env.SEED_ADMIN_PASS || 'Admin123!'
  const adminName = process.env.SEED_ADMIN_NAME || 'Administrator'

  const existing = await User.findOne({ email: adminEmail })
  if (existing) {
    console.log('Admin already exists:', adminEmail)
    process.exit(0)
  }

  const hash = await bcrypt.hash(adminPass, 10)
  const admin = new User({ name: adminName, email: adminEmail, password: hash, role: 'admin' })
  await admin.save()

  console.log('Seeded admin user:')
  console.log('  email:', adminEmail)
  console.log('  password:', adminPass)
  process.exit(0)
}

run().catch((err)=>{
  console.error(err)
  process.exit(1)
})
