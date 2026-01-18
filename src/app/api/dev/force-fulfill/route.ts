// src/app/api/dev/force-fulfill/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Order from '@/models/Order'
import ProductKey from '@/models/ProductKey'
import { requireAdmin } from '@/lib/requireAdmin'

export const runtime = 'nodejs'

function planDays(planId: any) {
  const p = String(planId || '').toLowerCase()
  if (p === 'day') return 1
  if (p === 'week') return 7
  if (p === 'month') return 30
  return 0
}

function addDays(d: Date, days: number) {
  const x = new Date(d.getTime())
  x.setDate(x.getDate() + days)
  return x
}

export async function POST(req: NextRequest) {
  // ✅ só DEV
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'Disabled in production' }, { status: 403 })
  }

  // ✅ só admin
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const transactionHash = String(body?.transaction_hash || '').trim()
  if (!transactionHash) {
    return NextResponse.json({ ok: false, error: 'transaction_hash obrigatório' }, { status: 400 })
  }

  await dbConnect()

  const order = await Order.findOne({ transactionHash })
  if (!order) return NextResponse.json({ ok: false, error: 'Order não encontrada' }, { status: 404 })

  if (order.status === 'delivered') {
    return NextResponse.json({ ok: true, delivered: true, order })
  }

  const now = new Date()

  // força paid
  order.status = 'paid'
  order.paidAt = now

  for (const it of order.items) {
    const need = Number(it.quantity || 1)
    const already = Array.isArray((it as any).deliveredKeys) ? (it as any).deliveredKeys.length : 0
    const missing = Math.max(0, need - already)
    if (missing <= 0) continue

    const days = planDays((it as any).planId)
    const expiresAt = days > 0 ? addDays(now, days) : null

    for (let i = 0; i < missing; i++) {
      const keyDoc = await ProductKey.findOneAndUpdate(
        {
          status: 'available',
          gameId: (it as any).gameId,
          productId: (it as any).productId,
          planId: (it as any).planId,

          // extra hardening (se existir no schema)
          assignedToUserId: null,
          orderId: null,
        },
        {
          $set: {
            status: 'sent',
            assignedToUserId: order.userId,
            orderId: String(order._id),
            assignedAt: now,
            sentAt: now,
            expiresAt,
          },
        },
        { new: true }
      )

      if (!keyDoc) {
        return NextResponse.json(
          { ok: false, error: `Sem estoque para ${(it as any).title || (it as any).productId}` },
          { status: 409 }
        )
      }

      ;(it as any).deliveredKeys = [...(((it as any).deliveredKeys || []) as string[]), String((keyDoc as any).productKey)]
      ;(it as any).expiresAt = expiresAt
    }
  }

  order.status = 'delivered'
  order.deliveredAt = now
  await order.save()

  return NextResponse.json({ ok: true, delivered: true, order })
}
