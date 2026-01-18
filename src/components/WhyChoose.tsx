// src/components/DashboardLandingWhyChoose.tsx
'use client'

import { Gauge, ShieldCheck, Sparkles } from 'lucide-react'

type Props = {
  accent: string
}

export default function WhyChoose({ accent }: Props) {
  return (
    <section className="relative">
      <div className="pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-[1500px] px-4 py-20">
        <h2 className="text-center text-[26px] font-semibold text-white md:text-[32px]">
          Why Choose <span style={{ color: accent }}>COVIL</span>?
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-8 text-center transition hover:border-white/20">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: accent }}>
              <Sparkles className="h-6 w-6 text-white" />
            </div>

            <h3 className="mt-4 text-[16px] font-semibold text-white">24/7 Support</h3>

            <p className="mt-2 text-[13px] leading-relaxed text-white/55">
              Our hard-working team is always available to help with anything you need across all our products.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-8 text-center transition hover:border-white/20">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: accent }}>
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>

            <h3 className="mt-4 text-[16px] font-semibold text-white">Secure &amp; Trusted</h3>

            <p className="mt-2 text-[13px] leading-relaxed text-white/55">
              We prioritise your safety with premium security standards and a commitment to privacy.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-8 text-center transition hover:border-white/20">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: accent }}>
              <Gauge className="h-6 w-6 text-white" />
            </div>

            <h3 className="mt-4 text-[16px] font-semibold text-white">Reliable Performance</h3>

            <p className="mt-2 text-[13px] leading-relaxed text-white/55">
              High-quality, stable tools engineered for smooth performance and long-term satisfaction.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
