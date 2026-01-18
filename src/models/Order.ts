// src/models/Order.ts
import mongoose, { Schema, models } from 'mongoose'

const OrderItemSchema = new Schema(
  {
    gameId: String,
    productId: String,
    title: String,
    cover: String,
    tag: String,
    planId: String,
    planLabel: String,
    unitPrice: Number,
    quantity: Number,

    // keys entregues
    deliveredKeys: { type: [String], default: [] },

    // validade da entrega (pra esse item)
    expiresAt: { type: Date, default: null },
  },
  { _id: false }
)

const OrderSchema = new Schema(
  {
    userId: { type: String, required: true },

    externalId: { type: String, required: true },
    transactionHash: { type: String, required: true, index: true, unique: true },

    status: {
      type: String,
      // ✅ ADICIONEI "delivering" (lock)
      enum: ['waiting_payment', 'paid', 'delivering', 'delivered', 'failed', 'canceled'],
      default: 'waiting_payment',
      index: true,
    },

    amount: { type: Number, required: true },
    currency: { type: String, default: 'BRL' },

    customer: {
      name: String,
      email: String,
      phone: String,
    },

    items: { type: [OrderItemSchema], default: [] },

    paidAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true }
)

export default models.Order || mongoose.model('Order', OrderSchema)
