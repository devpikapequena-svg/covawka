// src/app/api/admin/keys/stock/route.ts
import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import ProductKey from '@/models/ProductKey'
import { requireAdmin } from '@/lib/requireAdmin'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const gameId = String(searchParams.get('gameId') || '').trim()
  const productId = String(searchParams.get('productId') || '').trim()
  const planId = String(searchParams.get('planId') || '').trim()

  if (!gameId || !productId || !planId) {
    return NextResponse.json({ ok: false, error: 'Missing params' }, { status: 400 })
  }

  await dbConnect()

  const [available, assigned, sent] = await Promise.all([
    ProductKey.countDocuments({ gameId, productId, planId, status: 'available' }),
    ProductKey.countDocuments({ gameId, productId, planId, status: 'assigned' }),
    ProductKey.countDocuments({ gameId, productId, planId, status: 'sent' }),
  ])

  return NextResponse.json({ ok: true, counts: { available, assigned, sent } })
}
