// src/context/CartContext.tsx
'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type PlanId = 'day' | 'week' | 'month'

export type CartItem = {
  key: string // unique: gameId:productId:planId
  gameId: string
  productId: string
  title: string
  cover?: string | null
  tag?: string | null
  planId: PlanId
  planLabel: string
  unitPrice: number
  quantity: number
}

type CartState = {
  items: CartItem[]
  count: number
  subtotal: number

  addItem: (item: Omit<CartItem, 'key'>) => void
  removeItem: (key: string) => void
  updateQty: (key: string, qty: number) => void
  clear: () => void
}

const CartContext = createContext<CartState | null>(null)

function safeParse<T>(v: string | null): T | null {
  try {
    return v ? (JSON.parse(v) as T) : null
  } catch {
    return null
  }
}

const STORAGE_KEY = 'store_cart_v1'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    const saved = safeParse<CartItem[]>(typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null)
    if (saved?.length) setItems(saved)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const count = useMemo(() => items.reduce((a, b) => a + (b.quantity || 0), 0), [items])

  const subtotal = useMemo(() => {
    return items.reduce((sum, it) => sum + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0), 0)
  }, [items])

  const api = useMemo<CartState>(() => {
    return {
      items,
      count,
      subtotal,

      addItem: (item) => {
        const key = `${item.gameId}:${item.productId}:${item.planId}`
        setItems((prev) => {
          const idx = prev.findIndex((x) => x.key === key)
          if (idx >= 0) {
            const copy = [...prev]
            copy[idx] = { ...copy[idx], quantity: (copy[idx].quantity || 1) + (item.quantity || 1) }
            return copy
          }
          return [...prev, { ...item, key }]
        })
      },

      removeItem: (key) => setItems((prev) => prev.filter((x) => x.key !== key)),

      updateQty: (key, qty) => {
        const q = Math.max(1, Math.min(99, Math.floor(qty || 1)))
        setItems((prev) => prev.map((x) => (x.key === key ? { ...x, quantity: q } : x)))
      },

      clear: () => setItems([]),
    }
  }, [items, count, subtotal])

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
