// src/components/DashboardLandingHero.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'

type Props = {
  accent: string
}

export default function Hero({ accent }: Props) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <Image src="/hero2.png" alt="Hero background" fill priority className="object-cover" />
      </div>

      <div className="relative mx-auto grid max-w-[1500px] grid-cols-1 items-center gap-2.5 px-4 py-0.5 md:grid-cols-2 md:py-0">
        <div>
          <h1 className="mt-6 text-[46px] font-medium leading-[1.05] tracking-[-0.02em] text-white md:text-[64px]">
            Powerful Tools
            <br />
            <span style={{ color: accent }}>Unmatched</span>
          </h1>

          <p className="mt-5 text-[18px] font-bold text-white/85">Next-Gen Features &amp; Reliable Support</p>

          <p className="mt-3 max-w-[560px] text-[14px] leading-relaxed text-white/60">
            Explore a curated library of legitimate tools designed for usability and performance. Get great value and
            reliable support at every step.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="#popular"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-[13px] font-extrabold text-black transition hover:opacity-95"
            >
              Explore Tools <span aria-hidden>→</span>
            </Link>

            <Link
              href="#"
              className="inline-flex items-center justify-center rounded-xl bg-white/10 px-6 py-3 text-[13px] font-extrabold text-white transition hover:bg-white/15"
            >
              DMA Products
            </Link>
          </div>
        </div>

        <div className="relative hidden md:block">
          <div className="relative ml-auto aspect-[1/1] w-full max-w-[520px]" />
        </div>
      </div>
    </section>
  )
}
