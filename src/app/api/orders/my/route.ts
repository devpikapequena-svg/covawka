// src/app/api/orders/my/route.ts
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Order from '@/models/Order'
import { requireUser } from '@/lib/requireUser'

export const runtime = 'nodejs'

export async function GET() {
  const user = await requireUser()
  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  await dbConnect()

  // ✅ não manda pro dashboard pedidos "waiting_payment"
  const orders = await Order.find({
    userId: user.uid,
    status: { $ne: 'waiting_payment' },
  })
    .sort({ createdAt: -1 })
    .lean()

  return NextResponse.json({ ok: true, orders })
}
