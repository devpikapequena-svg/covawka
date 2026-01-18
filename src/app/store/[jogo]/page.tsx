// src/app/store/[jogo]/page.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ChevronDown, SlidersHorizontal, ShoppingBag } from 'lucide-react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import WhyChoose from '@/components/WhyChoose'

const BG = '#0a0a0aff'
const ACCENT = '#d32f2f'

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

type GameCatalog = {
  id: string
  name: string
  heroTitle: string
  heroSubtitle?: string
  heroDesc?: string
  heroCtaLabel?: string
  heroCtaHref?: string
  heroImage?: string
  products: Array<{
    id: string
    title: string
    cover: string
    price: number
    tag?: string
  }>
}

const CATALOG: Record<string, GameCatalog> = {
  fivem: {
    id: 'fivem',
    name: 'FiveM',
    heroTitle: 'FiveM Tools',
    heroSubtitle: 'Premium products • Instant delivery',
    heroDesc: 'Browse a curated selection of high-quality products for FiveM, with fast access and reliable support.',
    heroCtaLabel: 'Browse products',
    heroCtaHref: '#products',
    heroImage: '/hero.png',
    products: [
      { id: 'fivem-external', title: 'FiveM External', cover: '/mockup/fivem.png', price: 10.49, tag: 'UNDETECTED' },
     { id: 'fivem-bypass', title: 'FiveM Bypass', cover: '/mockup/bypass.png', price: 30.49, tag: 'UNDETECTED' },
    ],
  },
  valorant: {
    id: 'valorant',
    name: 'Valorant',
    heroTitle: 'Valorant',
    heroSubtitle: 'Premium products • Instant delivery',
    heroDesc: 'Browse a curated selection of high-quality products for Valorant, with fast access and reliable support.',
    heroCtaLabel: 'Browse products',
    heroCtaHref: '#products',
    heroImage: '/hero.png',
    products: [
      { id: 'valorant-aimcolor', title: 'Valorant Aim Color', cover: '/mockup/valorantaim.png', price: 12.99, tag: 'AVAILABLE' },
      { id: 'valorant-external', title: 'Valorant External', cover: '/mockup/valorantexternal.png', price: 9.99, tag: 'AVAILABLE' },
    ],
  },
  cs2: {
    id: 'cs2',
    name: 'Counter Strike 2',
    heroTitle: 'CS2 Tools',
    heroSubtitle: 'Premium products • Instant delivery',
    heroDesc: 'Browse a curated selection of high-quality products for CS2, with fast access and reliable support.',
    heroCtaLabel: 'Browse products',
    heroCtaHref: '#products',
    heroImage: '/hero.png',
    products: [
      { id: 'cs2-external', title: 'Cs2 External', cover: '/mockup/cs2.png', price: 7.49, tag: 'AVAILABLE' },
    ],
  },
  freefire: {
    id: 'freefire',
    name: 'Free Fire',
    heroTitle: 'Free Fire Tools',
    heroSubtitle: 'Premium products • Instant delivery',
    heroDesc: 'Browse a curated selection of high-quality products for Free Fire, with fast access and reliable support.',
    heroCtaLabel: 'Browse products',
    heroCtaHref: '#products',
    heroImage: '/hero.png',
   products: [
      { id: 'freefire-mobile', title: 'Free-fire Mobile', cover: '/mockup/freefire-mobile.png', price: 5.99, tag: 'UNDETECTED' },
      { id: 'freefire-ios', title: 'Free-fire IOS', cover: '/mockup/freefire-ios.png', price: 15.99, tag: 'UNDETECTED' },
    { id: 'freefire-emulador', title: 'Free-fire Emulador', cover: '/mockup/freefire.png', price: 10.99, tag: 'UNDETECTED' },

    ],    
  },
}

type SortKey = 'featured' | 'price_asc' | 'price_desc' | 'name_asc'

export default function StoreGamePage({ params }: { params: { jogo: string } }) {
  const jogo = (params?.jogo || '').toLowerCase()
  const game = CATALOG[jogo]

  const [sort, setSort] = useState<SortKey>('featured')

  const products = useMemo(() => {
    const list = game?.products ? [...game.products] : []
    switch (sort) {
      case 'price_asc':
        return list.sort((a, b) => a.price - b.price)
      case 'price_desc':
        return list.sort((a, b) => b.price - a.price)
      case 'name_asc':
        return list.sort((a, b) => a.title.localeCompare(b.title))
      default:
        return list
    }
  }, [game?.products, sort])

  if (!game) {
    return (
      <div className="min-h-screen" style={{ background: BG }}>
        <Header accent={ACCENT} />
        <div className="mx-auto max-w-[1500px] px-4 py-14">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
            <div className="text-[20px] font-semibold text-white">Game not found</div>
            <div className="mt-2 text-[13px] text-white/55">
              This category doesn’t exist. Go back to the store.
            </div>

            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-[13px] font-extrabold text-black transition hover:opacity-95"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: BG }}>
      <Header accent={ACCENT} />

      {/* HERO (usando seu component) */}
      <Hero accent={ACCENT} />

      {/* STORE CONTENT (igual o layout da imagem: breadcrumb + header card + grid) */}
      <section id="products" className="relative">

        <div className="relative mx-auto max-w-[1500px] px-4 pb-16 pt-10">
          {/* breadcrumb bar */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[12px] text-white/55">
                <Link href="/" className="transition hover:text-white">
                  Home
                </Link>
                <span className="text-white/25">/</span>
                <Link href="/#popular" className="transition hover:text-white">
                  Store
                </Link>
                <span className="text-white/25">/</span>
                <span className="text-white/85">{game.name}</span>
              </div>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-[12px] font-semibold text-white/60 transition hover:border-white/18 hover:bg-white/[0.04] hover:text-white"
              >
                <SlidersHorizontal className="h-4 w-4 opacity-80" />
                All Activity
              </button>
            </div>
          </div>

          {/* title / controls card */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="px-6 py-6">
              <div className="text-[28px] font-semibold text-white">{game.name} Products</div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-white/[0.02] px-6 py-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-semibold text-white/80">
                {products.length} PRODUCTS
              </div>

              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className={cn(
                    'h-[34px] appearance-none rounded-xl border border-white/10 bg-white/[0.02] px-3 pr-9',
                    'text-[12px] font-semibold text-white/70 outline-none transition',
                    'hover:border-white/18 hover:bg-white/[0.04]'
                  )}
                >
                  <option value="featured">SORT BY: Featured</option>
                  <option value="price_asc">SORT BY: Price (Low)</option>
                  <option value="price_desc">SORT BY: Price (High)</option>
                  <option value="name_asc">SORT BY: Name</option>
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
              </div>
            </div>
          </div>

          {/* products grid (cards bem iguais ao print) */}
<div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/store/${game.id}/${p.id}`}
                className={cn(
                  'group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]',
                  'transition hover:border-white/18 hover:bg-white/[0.03]'
                )}
              >
                <div className="relative h-[220px] w-full overflow-hidden">
                  <Image
                    src={p.cover}
                    alt={p.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.02]"
                  />
                </div>

                <div className="px-5 pb-5 pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-semibold text-white">{p.title}</div>

                      <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-200/90">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        {p.tag || 'AVAILABLE'}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="text-[16px] font-semibold text-emerald-300">
                        ${p.price.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div
                      className={cn(
                        'inline-flex w-full items-center justify-center gap-2 rounded-xl',
                        'border border-white/10 bg-white/[0.03] px-4 py-3',
                        'text-[12px] font-semibold text-white/75 transition',
                        'group-hover:border-white/18 group-hover:bg-white/[0.05] group-hover:text-white'
                      )}
                    >
                      <ShoppingBag className="h-4 w-4 opacity-90" />
                      Buy Now
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <WhyChoose accent={ACCENT} />
      <Footer />
    </div>
  )
}
