// src/app/checkout/pay/page.tsx
'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Shield, QrCode, Copy, Loader2, CheckCircle2, X, LogIn } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const BG = '#0a0a0aff'
const ACCENT = '#d32f2f'

type PayStatusUI = 'awaiting' | 'paid' | 'pending' | 'failed'

type StoredContext = {
  kind: 'store'
  externalId?: string
  transaction_hash: string
  createdAt: string
  amount: number
  customer: { name: string; email: string; phone: string; cpf?: string | null }
  items: any[]
  pix?: {
    qrCodeText?: string | null
    qrCodeImageBase64?: string | null
    expiresAt?: string | null
  }
}

type MeUser = { uid: string; email: string; username: string; role?: string }
type MeResponse = { ok: true; user: MeUser } | { ok: false }

function normalizeStatus(s: any): PayStatusUI {
  const v = String(s || '').toLowerCase()
  if (v === 'paid' || v === 'pago' || v === 'approved') return 'paid'
  if (v === 'pending' || v === 'pendente' || v === 'awaiting' || v === 'waiting_payment') return 'pending'
  if (v === 'canceled' || v === 'cancelled' || v === 'refunded' || v === 'failed') return 'failed'
  return 'awaiting'
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function SoftDivider() {
  return (
    <div className="relative my-5 h-px w-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  )
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export default function CheckoutPayPage() {
  const router = useRouter()
  const sp = useSearchParams()

  const transactionHashQS = sp.get('transaction_hash') || ''
  const externalIdQS = sp.get('externalId') || ''

  const [ctx, setCtx] = useState<StoredContext | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const [status, setStatus] = useState<PayStatusUI>('awaiting')
  const [copied, setCopied] = useState(false)
  const [checking, setChecking] = useState(false)

  // auth
  const [meLoading, setMeLoading] = useState(true)
  const [meUser, setMeUser] = useState<MeUser | null>(null)

  // fulfill
  const [fulfilling, setFulfilling] = useState(false)
  const [fulfilled, setFulfilled] = useState(false)

  // admin dev button
  const [forceLoading, setForceLoading] = useState(false)

  // evita race condition
  const reqIdRef = useRef(0)

  const effectiveHash = ctx?.transaction_hash || transactionHashQS || ''

  const pixText = ctx?.pix?.qrCodeText || ''
  const pixImg = ctx?.pix?.qrCodeImageBase64 || ''
  const expiresAt = ctx?.pix?.expiresAt || ''

  const expiresLabel = useMemo(() => {
    if (!expiresAt) return null
    try {
      return new Date(expiresAt).toLocaleString('pt-BR')
    } catch {
      return null
    }
  }, [expiresAt])

  async function fetchMe() {
    const my = ++reqIdRef.current
    try {
      setMeLoading(true)
      const res = await fetch('/api/auth/me', { method: 'GET', credentials: 'include', cache: 'no-store' })
      const data = (await res.json().catch(() => null)) as MeResponse | null
      if (my !== reqIdRef.current) return

      if (!res.ok || !data || (data as any)?.ok !== true) {
        setMeUser(null)
        return
      }

      setMeUser((data as any).user as MeUser)
    } catch {
      if (my !== reqIdRef.current) return
      setMeUser(null)
    } finally {
      if (my !== reqIdRef.current) return
      setMeLoading(false)
    }
  }

  useEffect(() => {
    fetchMe()
    const onAuthChanged = () => fetchMe()
    window.addEventListener('auth:changed', onAuthChanged as any)
    return () => window.removeEventListener('auth:changed', onAuthChanged as any)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // tenta carregar o contexto do sessionStorage (pra UI do QR)
  useEffect(() => {
    const raw = sessionStorage.getItem('store_last_payment_context')
    if (!raw) {
      // sem ctx, ainda dá pra continuar via transaction_hash na URL
      if (!transactionHashQS) setErr('Pagamento não encontrado.')
      return
    }

    try {
      const parsed = JSON.parse(raw) as StoredContext
      if (!parsed?.transaction_hash) {
        setErr('Pagamento inválido.')
        return
      }
      // se veio hash na URL e não bate, invalida
      if (transactionHashQS && parsed.transaction_hash !== transactionHashQS) {
        setErr('Pagamento inválido ou expirado.')
        return
      }
      setCtx(parsed)
    } catch {
      setErr('Erro ao carregar pagamento.')
    }
  }, [transactionHashQS])

  // polling status
  useEffect(() => {
    const th = effectiveHash
    if (!th) return

    let alive = true
    let timer: any = null

    async function tick() {
      try {
        setChecking(true)
        const url = `/api/create-payment?transaction_hash=${encodeURIComponent(th)}`
        const res = await fetch(url, { method: 'GET', credentials: 'include', cache: 'no-store' })
        const data = await res.json().catch(() => null)
        if (!alive) return

        if (res.ok) {
          const next = normalizeStatus(data?.status)
          setStatus(next)

          // atualiza pix (se tiver ctx)
          const nextPix = data?.pix || null
          if (nextPix && (nextPix.qrCodeText || nextPix.qrCodeImageBase64)) {
            setCtx((prev) => (prev ? { ...prev, pix: { ...prev.pix, ...nextPix } } : prev))
          }

          if (next === 'paid') {
            if (timer) clearInterval(timer)
            timer = null
          }
        }
      } catch {
        // ignore
      } finally {
        if (alive) setChecking(false)
      }
    }

    tick()
    timer = setInterval(tick, 10000)

    return () => {
      alive = false
      if (timer) clearInterval(timer)
    }
  }, [effectiveHash])

  // ✅ fulfill só se: pago + logado
  useEffect(() => {
    if (!effectiveHash) return
    if (status !== 'paid') return
    if (fulfilled || fulfilling) return
    if (meLoading) return
    if (!meUser) return // sem user logado => não entrega

    ;(async () => {
      try {
        setErr(null)
        setFulfilling(true)

        const res = await fetch('/api/orders/fulfill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ transaction_hash: effectiveHash }),
        })

        const data = await res.json().catch(() => null)
        if (!res.ok) {
          // se cair aqui: ou order não é do user logado, ou ainda não pago, etc.
          throw new Error(data?.error || data?.message || 'Falha ao entregar o pedido.')
        }

        setFulfilled(true)

        const qs = new URLSearchParams()
        qs.set('transaction_hash', effectiveHash)
        if (ctx?.externalId) qs.set('externalId', ctx.externalId)
        else if (externalIdQS) qs.set('externalId', externalIdQS)

        router.replace(`/checkout/success?${qs.toString()}`)
      } catch (e: any) {
        setErr(e?.message || 'Erro ao entregar as keys.')
      } finally {
        setFulfilling(false)
      }
    })()
  }, [status, effectiveHash, meLoading, meUser, fulfilled, fulfilling, router, ctx?.externalId, externalIdQS])

  async function copyPix() {
    if (!pixText) return
    try {
      await navigator.clipboard.writeText(pixText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setErr('Erro ao copiar.')
    }
  }

  function StatusPill() {
    const base = 'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px]'

    if (status === 'paid') {
      return (
        <div className={base} style={{ borderColor: `rgba(34,197,94,0.45)`, background: 'rgba(34,197,94,0.10)' }}>
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          <span className="text-white/85">Pago</span>
        </div>
      )
    }
    if (status === 'failed') {
      return (
        <div className={base} style={{ borderColor: 'rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.10)' }}>
          <X className="h-4 w-4 text-red-200" />
          <span className="text-red-200">Falhou</span>
        </div>
      )
    }
    if (status === 'pending') {
      return (
        <div className={base} style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)' }}>
          <Loader2 className="h-4 w-4 animate-spin text-white/60" />
          <span className="text-white/70">Aguardando</span>
        </div>
      )
    }
    return (
      <div className={base} style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.03)' }}>
        <QrCode className="h-4 w-4 text-white/55" />
        <span className="text-white/70">Gerado</span>
      </div>
    )
  }

  const loginHref = useMemo(() => {
    const rt = `/checkout/pay?transaction_hash=${encodeURIComponent(effectiveHash || transactionHashQS)}${
      (ctx?.externalId || externalIdQS) ? `&externalId=${encodeURIComponent(ctx?.externalId || externalIdQS)}` : ''
    }`
    return `/login?returnTo=${encodeURIComponent(rt)}`
  }, [effectiveHash, transactionHashQS, ctx?.externalId, externalIdQS])

  const isAdmin = !!meUser && meUser.role === 'admin'

  async function forcePaidAndDeliver() {
    if (!effectiveHash) return
    try {
      setErr(null)
      setForceLoading(true)

      const res = await fetch('/api/dev/force-fulfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ transaction_hash: effectiveHash }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Falha ao forçar entrega.')

      const qs = new URLSearchParams()
      qs.set('transaction_hash', effectiveHash)
      if (ctx?.externalId) qs.set('externalId', ctx.externalId)
      else if (externalIdQS) qs.set('externalId', externalIdQS)

      router.replace(`/checkout/success?${qs.toString()}`)
    } catch (e: any) {
      setErr(e?.message || 'Erro.')
    } finally {
      setForceLoading(false)
    }
  }

  return (
    <div className="min-h-screen text-white" style={{ background: BG }}>
      <Header accent={ACCENT} />

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute left-1/2 top-[-140px] h-[420px] w-[820px] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: `radial-gradient(closest-side, ${ACCENT}22, transparent 70%)` }}
        />
      </div>

      <main className="relative mx-auto max-w-[1500px] px-4 pb-20 pt-10">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => router.push('/checkout')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-[12px] font-semibold text-white/70 transition hover:border-white/18 hover:bg-white/[0.04] hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div className="flex items-center gap-3">
              <div className="text-[12px] text-white/55">{checking ? 'Verificando status' : 'Status'}</div>
              <StatusPill />
              <div className="hidden items-center gap-2 rounded-full px-3 py-1.5 text-[12px] text-white/55 md:inline-flex">
                <Shield className="h-4 w-4" style={{ color: ACCENT }} />
                Pagamento seguro
              </div>
            </div>
          </div>
        </div>

        {/* ✅ bloqueio: pago mas não logado => avisa e força login pra entregar na conta certa */}
        {status === 'paid' && !meLoading && !meUser ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <p className="text-[14px] font-semibold text-white/90">Pagamento confirmado ✅</p>
            <p className="mt-2 text-[13px] text-white/55">
              Agora faça login para <b>entregar as keys na sua conta</b>.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={loginHref}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[12px] font-extrabold text-white transition"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}66, rgba(255,255,255,0.06))`,
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
              >
                <LogIn className="h-4 w-4" />
                Fazer login pra receber
              </Link>

              <button
                onClick={() => fetchMe()}
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] px-5 py-3 text-[12px] font-extrabold text-white/80 transition hover:border-white/18 hover:bg-white/[0.04] hover:text-white"
              >
                Já loguei, atualizar
              </button>
            </div>
          </div>
        ) : null}

        {!effectiveHash && err ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <p className="text-[13px] text-red-200">{err}</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[22px] border border-white/10 bg-white/[0.02]">
              <div className="px-5 pt-5 md:px-6 md:pt-6">
                <p className="text-[14px] font-medium text-white/85">QR Code</p>
                <p className="mt-1 text-[12px] text-white/45">Abra o app do banco e escaneie.</p>
                <SoftDivider />
              </div>

              <div className="px-5 pb-5 md:px-6 md:pb-6">
                <div className="grid place-items-center rounded-2xl p-5">
                  {pixImg ? (
                    <img
                      alt="QR Code PIX"
                      className="h-[280px] w-[280px] rounded-2xl bg-white p-3"
                      src={pixImg.startsWith('data:image') ? pixImg : `data:image/png;base64,${pixImg}`}
                    />
                  ) : (
                    <div className="flex h-[280px] w-[280px] items-center justify-center rounded-2xl border border-white/10">
                      <QrCode className="h-10 w-10 text-white/50" />
                    </div>
                  )}
                </div>

                {expiresLabel ? <p className="mt-4 text-[11px] text-white/40">Expira em: {expiresLabel}</p> : null}
                {err ? <p className="mt-4 text-[12px] text-red-300">{err}</p> : null}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.02]">
                <div className="p-5 md:p-6">
                  <p className="text-[12px] text-white/60">Código PIX</p>

                  <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="break-all text-[12px] leading-relaxed text-white/80">{pixText || '-'}</p>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={copyPix}
                      disabled={!pixText}
                      className={cn(
                        'inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl',
                        'border border-white/10 text-[13px] transition hover:bg-white/[0.05]',
                        'disabled:cursor-not-allowed disabled:opacity-60'
                      )}
                    >
                      <Copy className="h-4 w-4" />
                      {copied ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/[0.02]">
                <div className="p-5 md:p-6">
                  <p className="text-[12px] text-white/60">Resumo</p>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[12px] text-white/60">Total</span>
                    <span className="text-[16px] font-semibold tracking-[-0.02em]" style={{ color: ACCENT }}>
                      {formatBRL(ctx?.amount || 0)}
                    </span>
                  </div>

                  <SoftDivider />

                  <div className="space-y-2 text-[12px] text-white/60">
                    <div className="flex items-center justify-between">
                      <span>Transação</span>
                      <span className="max-w-[260px] truncate text-right text-white/80">{effectiveHash}</span>
                    </div>
                    {externalIdQS ? (
                      <div className="flex items-center justify-between">
                        <span>External ID</span>
                        <span className="max-w-[260px] truncate text-right text-white/80">{externalIdQS}</span>
                      </div>
                    ) : null}
                  </div>

                  {status === 'paid' ? (
                    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-[13px] font-semibold text-white/85">Pagamento confirmado</p>
                      <p className="mt-1 text-[12px] text-white/55">
                        {!meLoading && meUser
                          ? fulfilling
                            ? 'Entregando suas keys…'
                            : fulfilled
                              ? 'Entregue ✅'
                              : 'Finalizando…'
                          : 'Faça login para entregar na sua conta.'}
                      </p>
                    </div>
                  ) : null}

                  {/* ✅ DEV TOOL: só admin */}
                  {isAdmin ? (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-[12px] font-semibold text-white/80">Admin tools (DEV)</div>
                      <div className="mt-2 text-[12px] text-white/55">Força paid + entrega keys (somente DEV).</div>

                      <button
                        onClick={forcePaidAndDeliver}
                        disabled={!effectiveHash || forceLoading}
                        className={cn(
                          'mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl',
                          'border border-white/10 bg-white/[0.02] px-4 text-[13px] font-extrabold text-white/85 transition',
                          'hover:border-white/18 hover:bg-white/[0.04]',
                          'disabled:cursor-not-allowed disabled:opacity-60'
                        )}
                      >
                        {forceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Marcar como paid + entregar
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
