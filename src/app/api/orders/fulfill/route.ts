// src/app/api/orders/fulfill/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Order from '@/models/Order'
import ProductKey from '@/models/ProductKey'
import { requireUser } from '@/lib/requireUser'

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

async function checkTriboPaid(origin: string, transactionHash: string) {
  const url = `${origin}/api/create-payment?transaction_hash=${encodeURIComponent(transactionHash)}`
  const res = await fetch(url, { method: 'GET', cache: 'no-store' })
  const data = await res.json().catch(() => null)
  const status = String(data?.status || '').toLowerCase()
  return status === 'paid' || status === 'pago' || status === 'approved'
}

export async function POST(req: NextRequest) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const body = await req.json().catch(() => null)
  const transactionHash = String(body?.transaction_hash || '').trim()
  if (!transactionHash) {
    return NextResponse.json({ ok: false, error: 'transaction_hash obrigatório' }, { status: 400 })
  }

  await dbConnect()

  // 1) acha o pedido do usuário
  const baseOrder = await Order.findOne({ transactionHash, userId: user.uid })
  if (!baseOrder) return NextResponse.json({ ok: false, error: 'Order não encontrado' }, { status: 404 })

  // idempotência
  if (baseOrder.status === 'delivered') {
    return NextResponse.json({ ok: true, delivered: true, order: baseOrder })
  }

  // 2) confirma pagamento server-side
  const origin = req.nextUrl.origin
  const paid = await checkTriboPaid(origin, transactionHash)
  if (!paid) return NextResponse.json({ ok: false, error: 'Pagamento ainda não confirmado' }, { status: 409 })

  const now = new Date()

  // 3) LOCK: só 1 request consegue mudar pra delivering
  const locked = await Order.findOneAndUpdate(
    {
      _id: baseOrder._id,
      userId: user.uid,
      status: { $in: ['waiting_payment', 'paid'] },
    },
    {
      $set: {
        status: 'delivering',
        paidAt: baseOrder.paidAt || now,
      },
    },
    { new: true }
  )

  // Se não conseguiu lock, outra request já está entregando/entregou
  if (!locked) {
    const fresh = await Order.findById(baseOrder._id)
    if (fresh?.status === 'delivered') return NextResponse.json({ ok: true, delivered: true, order: fresh })
    return NextResponse.json({ ok: true, delivering: true }, { status: 202 })
  }

  // 4) ALLOCATE KEYS (com lock)
  for (const it of locked.items) {
    const need = Number(it.quantity || 1)
    const already = Array.isArray(it.deliveredKeys) ? it.deliveredKeys.length : 0
    const missing = Math.max(0, need - already)
    if (missing <= 0) continue

    const days = planDays(it.planId)
    const expiresAt = days > 0 ? addDays(now, days) : null

    const delivered: string[] = []

    for (let i = 0; i < missing; i++) {
      const keyDoc = await ProductKey.findOneAndUpdate(
        {
          status: 'available',
          gameId: it.gameId,
          productId: it.productId,
          planId: it.planId,

          // ✅ extra segurança (evita doc "available" sujo)
          assignedToUserId: null,
          orderId: null,
        },
        {
          $set: {
            status: 'sent',
            assignedToUserId: user.uid,
            orderId: String(locked._id),
            assignedAt: now,
            sentAt: now,
            expiresAt: expiresAt,
          },
        },
        { new: true }
      )

      if (!keyDoc) {
        // volta pedido pra paid se faltar estoque (não marca delivered)
        locked.status = 'paid'
        await locked.save()

        return NextResponse.json(
          { ok: false, error: `Sem estoque de keys para ${it.title} (${it.planLabel || it.planId}).` },
          { status: 409 }
        )
      }

      delivered.push(String((keyDoc as any).productKey))
    }

    it.deliveredKeys = [...(it.deliveredKeys || []), ...delivered]
    it.expiresAt = expiresAt
  }

  locked.status = 'delivered'
  locked.deliveredAt = now
  await locked.save()

  return NextResponse.json({ ok: true, delivered: true, order: locked })
}
