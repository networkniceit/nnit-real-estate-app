const mongoose = require('mongoose')

const PropertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: String, required: true },
  priceNumber: { type: Number },
  currency: { type: String, default: 'usd' },
  bedrooms: { type: Number },
  bathrooms: { type: Number },
  type: { type: String },
  image: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tag: { type: String },
  commissionRate: { type: Number, default: 0.05 },
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Property', PropertySchema)
