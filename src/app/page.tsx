// src/app/dashboard-landing/page.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import WhyChoose from '@/components/WhyChoose'

const BG = '#0a0a0aff'
const ACCENT = '#e73232ff'

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}


export default function DashboardLanding() {
  const [query, setQuery] = useState('')

  const games = useMemo(
    () => [
      { id: 'fivem', name: 'FiveM', img: '/products/fivem.png', price: 4.99, products: 12, online: true },
      { id: 'freefire', name: 'Free Fire', img: '/products/freefire.png', price: 5.99, products: 5, online: true },
      { id: 'valorant', name: 'Valorant', img: '/products/valorant.png', price: 4.99, products: 38, online: true },
      { id: 'cs2', name: 'Counter Strike 2', img: '/products/cs2.png', price: 2.99, products: 4, online: true },
    ],
    []
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return games
    return games.filter((g) => g.name.toLowerCase().includes(q))
  }, [games, query])

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      <Header accent={ACCENT} />
      <Hero accent={ACCENT} />

      {/* POPULAR GAMES (igual já está) */}
      <section id="popular" className="relative">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute -top-40 left-1/2 h-[520px] w-[880px] -translate-x-1/2 blur-3xl"
            style={{ background: `radial-gradient(closest-side, ${ACCENT}22, transparent 70%)` }}
          />
        </div>

        <div className="relative mx-auto max-w-[1500px] px-4 pb-16 pt-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[14px] font-semibold text-white/85">Popular games</div>
              <div className="mt-1 text-[12px] text-white/45">A curated selection of premium tools for your favorite games.</div>
            </div>

            <Link href="#" className="mt-1 text-[12px] font-semibold text-white/60 transition hover:text-white">
              View catalog
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {filtered.map((g) => (
              <Link
                key={g.id}
                href={`/store/${g.id}`}
                className={cn(
                  'group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]',
                  'transition hover:border-white/18 hover:bg-white/[0.03]'
                )}
              >
                <div className="relative h-[140px] w-full overflow-hidden">
                  <Image
                    src={g.img}
                    alt={g.name}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/10 to-black/60" />
                </div>

                <div className="px-4 pb-4 pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="truncate text-[14px] font-semibold text-white">{g.name}</div>

                    <div className="inline-flex items-center gap-2 text-[11px] font-semibold">
                      <span className={cn('h-2 w-2 rounded-full', g.online ? 'bg-emerald-400' : 'bg-red-400')} />
                      <span className={cn(g.online ? 'text-emerald-200/90' : 'text-red-200/90')}>
                        {g.online ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-1 text-[11px] text-white/40">Secure • Instant delivery</div>

                  <div className="mt-3 h-px w-full bg-white/10" />

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] text-white/35">FROM</div>
                      <div className="text-[13px] font-semibold text-white">${Number(g.price).toFixed(2)}</div>
                    </div>

                    <div
                      className={cn(
                        'inline-flex h-[32px] items-center justify-center rounded-lg px-4',
                        'border border-white/10 bg-white/[0.03] text-[12px] font-semibold text-white/70',
                        'transition group-hover:border-white/18 group-hover:bg-white/[0.06] group-hover:text-white'
                      )}
                    >
                      View
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <button
            type="button"
            className={cn(
              'mt-8 w-full rounded-xl border border-white/10 bg-white/[0.02] py-3',
              'text-[12px] font-semibold text-white/60 transition',
              'hover:border-white/18 hover:bg-white/[0.04] hover:text-white'
            )}
          >
            Show more
          </button>
        </div>
      </section>

      <WhyChoose accent={ACCENT} />
      <Footer />
    </div>
  )
}
