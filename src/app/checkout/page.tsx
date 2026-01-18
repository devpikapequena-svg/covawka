// src/app/checkout/page.tsx
'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Phone, Mail, User as UserIcon, QrCode, Shield } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useCart } from '@/context/CartContext'
import { useMe } from '@/hooks/useMe'

const BG = '#0a0a0aff'
const ACCENT = '#d32f2f'

function onlyDigits(s: string) {
  return (s || '').replace(/\D/g, '')
}
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}
function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function makeExternalId(prefix: string) {
  const rand = Math.random().toString(16).slice(2, 10).toUpperCase()
  const ts = Date.now().toString(16).toUpperCase()
  return `${prefix}_${ts}_${rand}`
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function SoftDivider() {
  return (
    <div className="relative my-5 h-px w-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  )
}

function Field({
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = 'text',
  hint,
  colSpan = 1,
}: {
  label: string
  icon: React.ReactNode
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  hint?: string
  colSpan?: 1 | 2
}) {
  return (
    <label className={`block ${colSpan === 2 ? 'md:col-span-2' : ''}`}>
      <span className="mb-2 block text-[12px] font-medium text-white/60">{label}</span>

      <div
        className={[
          'group relative flex items-center gap-2 rounded-2xl border border-white/10',
          'px-3.5 py-3.5',
          'transition hover:border-white/15',
          'bg-white/[0.02]',
        ].join(' ')}
      >
        <div className="pointer-events-none text-white/55 transition group-focus-within:text-white/75">{icon}</div>

        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          type={type}
          className="w-full bg-transparent text-[13px] text-white/85 outline-none placeholder:text-white/30"
          placeholder={placeholder}
        />
      </div>

      {hint ? <p className="mt-2 text-[11px] text-white/40">{hint}</p> : null}
    </label>
  )
}

type CreatePaymentResponse = {
  transaction_hash?: string
  status?: string
  amount?: number
  payment_method?: 'pix'
  pix?: { qrCodeText?: string | null; qrCodeImageBase64?: string | null; expiresAt?: string | null }
  error?: string
  message?: string
  details?: any
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal } = useCart()

  // ✅ pega o usuário via /api/auth/me (cookie httpOnly)
const { user, isLoggedIn, loading: meLoading } = useMe()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [cpf, setCpf] = useState('') // opcional

  const [err, setErr] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // ✅ se carrinho vazio, volta
  useEffect(() => {
    if (items.length === 0) router.replace('/cart')
  }, [items.length, router])

  // ✅ se não estiver logado, manda pro login
  useEffect(() => {
    if (meLoading) return
    if (!isLoggedIn) {
      router.replace(`/login?returnTo=${encodeURIComponent('/checkout')}`)
    }
  }, [meLoading, isLoggedIn, router])

  // ✅ opcional: preenche email automaticamente com o do usuário
  useEffect(() => {
    if (user?.email && !email) setEmail(user.email)
  }, [user?.email]) // eslint-disable-line react-hooks/exhaustive-deps

  const summaryLines = useMemo(() => {
    return items.map((it) => ({
      key: it.key,
      title: it.title,
      meta: `${it.gameId.toUpperCase()} • ${it.planLabel}`,
      price: it.unitPrice * it.quantity,
    }))
  }, [items])

  function validate() {
    setErr(null)
    const nameTrim = fullName.trim()
    const emailTrim = email.trim()
    const phoneDigits = onlyDigits(phone)

    if (items.length === 0) return 'Carrinho vazio.'
    if (nameTrim.length < 3) return 'Informe seu nome completo.'
    if (!isValidEmail(emailTrim)) return 'Informe um e-mail válido.'
    if (phoneDigits.length < 10) return 'Informe um número válido com DDD.'
    return null
  }

  async function handleGeneratePix() {
    if (meLoading) return
    if (!isLoggedIn) {
      router.replace(`/login?returnTo=${encodeURIComponent('/checkout')}`)
      return
    }

    const baseErr = validate()
    if (baseErr) return setErr(baseErr)

    try {
      setSubmitting(true)
      setErr(null)

      const externalId = makeExternalId('STORE')
      const utmQuery =
        typeof window !== 'undefined'
          ? Object.fromEntries(new URLSearchParams(window.location.search))
          : {}

      // ✅ IMPORTANTE:
      // NÃO precisa mandar userId aqui.
      // O server pega o user pelo cookie (requireUser) e grava Order.userId.
      const payload = {
        name: fullName.trim(),
        email: email.trim(),
        phone: onlyDigits(phone),
        cpf: cpf.trim() ? onlyDigits(cpf) : undefined,
        amount: subtotal,
        externalId,
        utmQuery,
        plan: 'store',
        items: items.map((it) => ({
          gameId: it.gameId,
          productId: it.productId,
          planId: it.planId,
          planLabel: it.planLabel,
          title: it.title,
          unitPrice: it.unitPrice,
          quantity: it.quantity,
          cover: it.cover || null,
          tag: it.tag || null,
          product_hash: `${it.gameId}_${it.productId}_${it.planId}`,
        })),
      }

      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ✅ cookie
        body: JSON.stringify(payload),
      })

      const data = (await res.json().catch(() => null)) as CreatePaymentResponse | null

      if (!res.ok) {
        const msg = data?.error || data?.message || 'Falha ao criar pagamento.'
        throw new Error(msg)
      }

      const transactionHash = data?.transaction_hash || ''
      const qrCodeText = data?.pix?.qrCodeText || null
      const qrCodeImageBase64 = data?.pix?.qrCodeImageBase64 || null
      const expiresAt = data?.pix?.expiresAt || null

      if (!transactionHash) throw new Error('A TriboPay não retornou transaction_hash.')
      if (!qrCodeText && !qrCodeImageBase64) throw new Error('A TriboPay não retornou QR Code.')

      // ✅ salva contexto do último pagamento (pra /checkout/pay renderizar)
      sessionStorage.setItem(
        'store_last_payment_context',
        JSON.stringify({
          kind: 'store',
          externalId,
          transaction_hash: transactionHash,
          createdAt: new Date().toISOString(),
          amount: subtotal,
          customer: {
            name: fullName.trim(),
            email: email.trim(),
            phone: onlyDigits(phone),
            cpf: cpf.trim() ? onlyDigits(cpf) : null,
          },
          items,
          pix: { qrCodeText, qrCodeImageBase64, expiresAt },
        })
      )

      router.push(
        `/checkout/pay?transaction_hash=${encodeURIComponent(transactionHash)}&externalId=${encodeURIComponent(externalId)}`
      )
    } catch (e: any) {
      console.error(e)
      setErr(e?.message || 'Erro ao gerar pagamento.')
    } finally {
      setSubmitting(false)
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
              onClick={() => router.push('/cart')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-[12px] font-semibold text-white/70 transition hover:border-white/18 hover:bg-white/[0.04] hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to cart
            </button>

            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] text-white/55">
              <Shield className="h-4 w-4" style={{ color: ACCENT }} />
              Pagamento PIX seguro
            </div>
          </div>

          {/* ✅ pequeno status de conta */}
          <div className="mt-3 text-[12px] text-white/45">
            {meLoading ? (
              'Verificando sessão…'
            ) : isLoggedIn ? (
              <>
                Logado como <span className="text-white/75">{user?.email || user?.username || 'Account'}</span>
              </>
            ) : (
              'Você precisa estar logado.'
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* LEFT */}
          <div className="rounded-[22px] border border-white/10 bg-white/[0.02]">
            <div className="px-5 pt-5 md:px-6 md:pt-6">
              <p className="text-[14px] font-medium text-white/85">Dados do comprador</p>
              <p className="mt-1 text-[12px] text-white/45">Usado para identificar a cobrança.</p>
              <SoftDivider />
            </div>

            <div className="px-5 pb-5 md:px-6 md:pb-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Nome"
                  icon={<UserIcon className="h-4 w-4" />}
                  value={fullName}
                  onChange={setFullName}
                  placeholder="Seu nome completo"
                />
                <Field
                  label="E-mail"
                  icon={<Mail className="h-4 w-4" />}
                  value={email}
                  onChange={setEmail}
                  placeholder="seuemail@dominio.com"
                  type="email"
                />
                <Field
                  label="Telefone"
                  icon={<Phone className="h-4 w-4" />}
                  value={phone}
                  onChange={setPhone}
                  placeholder="(11) 99999-9999"
                  hint="Use DDD + número."
                  colSpan={2}
                />
              </div>

              {err && (
                <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                  <p className="text-[12px] text-red-200">{err}</p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleGeneratePix}
                  disabled={submitting || items.length === 0 || meLoading || !isLoggedIn}
                  className={cn(
                    'inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-5',
                    'bg-white text-[13px] font-medium text-black transition',
                    'hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed'
                  )}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Gerando PIX
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4" />
                      Gerar PIX
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="rounded-[22px] border border-white/10 bg-white/[0.02]">
            <div className="p-5 md:p-6">
              <p className="text-[12px] text-white/60">Resumo</p>

              <div className="mt-4 space-y-3">
                {summaryLines.map((l) => (
                  <div key={l.key} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-white/85">{l.title}</div>
                      <div className="mt-1 text-[11px] text-white/45">{l.meta}</div>
                    </div>
                    <div className="shrink-0 text-[12px] font-semibold text-white/80">{formatBRL(l.price)}</div>
                  </div>
                ))}
              </div>

              <SoftDivider />

              <div className="space-y-3 text-[12px]">
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Subtotal</span>
                  <span className="text-white/80">{formatBRL(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60">Taxas</span>
                  <span className="text-white/80">{formatBRL(0)}</span>
                </div>

                <div className="h-px w-full bg-white/10" />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-white/60">Total</span>
                  <span className="text-[16px] font-semibold tracking-[-0.02em]" style={{ color: ACCENT }}>
                    {formatBRL(subtotal)}
                  </span>
                </div>
              </div>

              <div className="mt-4 text-[12px] text-white/45">
                Depois de pagar, o sistema entrega automático na sua conta.
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
