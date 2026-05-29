const mongoose = require('mongoose')

const TransactionSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'usd' },
  commissionRate: { type: Number, default: 0.05 },
  commissionAmount: { type: Number, default: 0 },
  sellerAmount: { type: Number, default: 0 },
  stripeSessionId: { type: String },
  status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Transaction', TransactionSchema)
