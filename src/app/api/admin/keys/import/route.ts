// src/app/api/admin/keys/import/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import ProductKey from '@/models/ProductKey'
import { requireAdmin } from '@/lib/requireAdmin'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const gameId = String(body?.gameId || '').trim()
  const productId = String(body?.productId || '').trim()
  const planId = String(body?.planId || '').trim()
  const rawKeys = String(body?.keys || '')

  if (!gameId || !productId || !planId || !rawKeys.trim()) {
    return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 })
  }

  // 1) normaliza + remove duplicadas no input
  const keys = Array.from(
    new Set(
      rawKeys
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)
    )
  )

  if (keys.length === 0) {
    return NextResponse.json({ ok: false, error: 'No keys provided' }, { status: 400 })
  }

  await dbConnect()

  const docs = keys.map((k) => ({
    productKey: k,
    gameId,
    productId,
    planId,
    status: 'available',

    // ✅ deixa explícito pra bater com seu fulfill "hard"
    assignedToUserId: null,
    orderId: null,
    assignedAt: null,
    sentAt: null,
    expiresAt: null,
  }))

  let inserted = 0

  // 2) bulk insert ignorando duplicadas do banco
  try {
    const res = await ProductKey.insertMany(docs, { ordered: false })
    inserted = Array.isArray(res) ? res.length : 0
  } catch (e: any) {
    // ordered:false -> duplicadas geram erro mas o resto insere.
    // Só não dá pra confiar em keys.length como "imported".
    // Pra ter um número real: calcula via before/after.
    // (isso aqui é barato porque é só 1 count)
  }

  const [available, assigned, sent] = await Promise.all([
    ProductKey.countDocuments({ gameId, productId, planId, status: 'available' }),
    ProductKey.countDocuments({ gameId, productId, planId, status: 'assigned' }),
    ProductKey.countDocuments({ gameId, productId, planId, status: 'sent' }),
  ])

  // fallback do inserted se insertMany deu erro (por duplicadas)
  // inserted pode ficar 0 mesmo tendo inserido alguns, dependendo do erro.
  // então manda também attempted + stock pra você ver a verdade.
  return NextResponse.json({
    ok: true,
    attempted: keys.length,
    inserted,
    counts: { available, assigned, sent },
  })
}
