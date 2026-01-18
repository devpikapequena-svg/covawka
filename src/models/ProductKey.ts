// src/models/ProductKey.ts
import mongoose, { Schema, models } from 'mongoose'

const ProductKeySchema = new Schema(
  {
    productKey: { type: String, required: true, unique: true },

    gameId: { type: String, required: true },
    productId: { type: String, required: true },
    planId: { type: String, required: true }, // day/week/month

    status: { type: String, enum: ['available', 'assigned', 'sent'], default: 'available' },

    assignedToUserId: { type: String, default: null },
    orderId: { type: String, default: null },

    assignedAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },

    // validade da key após entrega
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
)

// ✅ index pra acelerar estoque/alloc
ProductKeySchema.index({ status: 1, gameId: 1, productId: 1, planId: 1 })

export default models.ProductKey || mongoose.model('ProductKey', ProductKeySchema)
