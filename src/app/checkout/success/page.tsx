// src/app/checkout/success/page.tsx
'use client'

import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useCart } from '@/context/CartContext'
import { useEffect } from 'react'

const BG = '#0a0a0aff'
const ACCENT = '#d32f2f'

export default function CheckoutSuccessPage() {
  const { clear } = useCart()

  useEffect(() => {
    // limpa o carrinho depois do pagamento confirmado
    clear()
  }, [clear])

  return (
    <div className="min-h-screen text-white" style={{ background: BG }}>
      <Header accent={ACCENT} />

      <main className="mx-auto max-w-[1100px] px-4 pb-24 pt-14">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-300" />
            <div>
              <div className="text-[20px] font-semibold text-white">Payment approved</div>
              <div className="mt-2 text-[13px] text-white/55">
                Seu pagamento foi confirmado. Se você tiver dashboard/keys, você pode liberar por lá.
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-[13px] font-extrabold text-black transition hover:opacity-95"
                >
                  Open Dashboard
                </Link>
                <Link
                  href="/#popular"
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] px-5 py-3 text-[13px] font-extrabold text-white/80 transition hover:border-white/18 hover:bg-white/[0.04] hover:text-white"
                >
                  Back to Store
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
