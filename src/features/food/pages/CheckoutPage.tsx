import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, type HTMLInputTypeAttribute } from 'react'
import { useForm, type UseFormRegister } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { formatMoney } from '@/core/domain'
import { isRepositoryError } from '@/core/repositories'
import { usePlaceOrder } from '@/infra/query'
import { FulfillmentToggle } from '../components/FulfillmentToggle'
import { PriceBreakdown } from '../components/PriceBreakdown'
import { btnPrimary, eyebrow, inputBase } from '../components/styles'
import { foodCart, foodData } from '../domain'
import {
  ASAP,
  PAYMENT_METHODS,
  checkoutSchema,
  toOrderInput,
  type CheckoutValues,
} from '../domain/checkout'
import { nextSlots, openStatus } from '../domain/hours'
import { PICKUP_ADDRESS, quote as buildQuote } from '../domain/pricing'
import { useNow } from '../lib/useNow'
import { useOrderUi } from '../state/orderUi'

type TextName = 'recipient' | 'phone' | 'email' | 'line1' | 'line2' | 'city' | 'instructions'

interface FieldProps {
  readonly name: TextName
  readonly label: string
  readonly register: UseFormRegister<CheckoutValues>
  readonly error: string | undefined
  readonly optional?: boolean
  readonly type?: HTMLInputTypeAttribute
  readonly autoComplete?: string
  readonly inputMode?: 'text' | 'email' | 'tel'
}

function Field({
  name,
  label,
  register,
  error,
  optional = false,
  type = 'text',
  autoComplete,
  inputMode,
}: FieldProps) {
  const errorId = `${name}-error`
  return (
    <div className="grid gap-1.5">
      <label htmlFor={name} className="font-semibold">
        {label}
        {optional ? <span className="font-normal text-ink-muted"> · opcional</span> : null}
      </label>
      <input
        id={name}
        type={type}
        {...(autoComplete ? { autoComplete } : {})}
        {...(inputMode ? { inputMode } : {})}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        aria-required={optional ? undefined : true}
        className={inputBase}
        {...register(name)}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-sm font-semibold text-accent">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function Section({
  title,
  children,
}: {
  readonly title: string
  readonly children: React.ReactNode
}) {
  return (
    <section className="grid gap-4 rounded-card bg-surface-raised p-5 shadow-(--food-shadow)">
      <h2 className="font-display text-xl font-extrabold">{title}</h2>
      {children}
    </section>
  )
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const summary = foodCart.useCart(foodCart.selectSummary)
  const { mode, tip, promoCode, setPromo } = useOrderUi()
  const order = usePlaceOrder(foodData)
  const now = useNow()

  const slots = useMemo(() => nextSlots(now), [now])
  const open = openStatus(now).open
  const quote = buildQuote({ subtotal: summary.subtotal, mode, tip, promoCode })

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      mode,
      recipient: '',
      phone: '',
      email: '',
      line1: '',
      line2: '',
      city: 'Bogotá',
      instructions: '',
      slot: open ? ASAP : (slots[0]?.value ?? ''),
      payment: 'card',
    },
    mode: 'onTouched',
  })

  // The toggle lives in the shared order preferences; the schema needs the mode too.
  useEffect(() => {
    setValue('mode', mode)
    if (mode === 'pickup') clearErrors(['line1', 'city'])
  }, [mode, setValue, clearErrors])

  const place = handleSubmit((data) => {
    const slotLabel = slots.find((s) => s.value === data.slot)?.label ?? ''
    order.mutate(
      toOrderInput(
        data,
        summary.lines.map((l) => l.line),
        quote,
        slotLabel,
      ),
      {
        onSuccess: (created) => {
          void navigate(`/food/pedido/${created.id}`)
          foodCart.store.getState().clear()
          setPromo(null)
        },
      },
    )
  })

  if (summary.lines.length === 0 && !order.isSuccess) {
    return (
      <section className="grid min-h-[60dvh] content-center justify-items-start gap-5 px-gutter py-section">
        <title>Tu pedido · Brasa &amp; Co.</title>
        <h1 className="font-display text-4xl font-extrabold">Tu pedido está vacío</h1>
        <p className="max-w-prose text-ink-muted">Elige algo del menú para poder pagar.</p>
        <Link to="/food/menu" className={btnPrimary}>
          Ver el menú
        </Link>
      </section>
    )
  }

  const placeError = order.error
    ? isRepositoryError(order.error)
      ? order.error.message
      : 'No pudimos procesar tu pedido. Inténtalo de nuevo.'
    : null
  const blocked = quote.shortfall > 0

  return (
    <div className="px-gutter py-6">
      <title>Pagar · Brasa &amp; Co.</title>
      <h1 className="mb-6 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
        Casi listo
      </h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_24rem] lg:items-start lg:gap-10">
        <form
          id="checkout-form"
          noValidate
          aria-label="Datos del pedido"
          onSubmit={(event) => {
            event.preventDefault()
            void place()
          }}
          className="grid gap-5"
        >
          <Section title="¿Cómo lo recibes?">
            <FulfillmentToggle />
          </Section>

          <Section title="Tus datos">
            <Field
              name="recipient"
              label="Nombre"
              autoComplete="name"
              register={register}
              error={errors.recipient?.message}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                name="phone"
                label="Teléfono"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                register={register}
                error={errors.phone?.message}
              />
              <Field
                name="email"
                label="Correo"
                type="email"
                autoComplete="email"
                inputMode="email"
                register={register}
                error={errors.email?.message}
              />
            </div>
          </Section>

          {mode === 'delivery' ? (
            <Section title="Dirección de entrega">
              <Field
                name="line1"
                label="Dirección"
                autoComplete="address-line1"
                register={register}
                error={errors.line1?.message}
              />
              <Field
                name="line2"
                label="Apartamento, torre, barrio"
                optional
                autoComplete="address-line2"
                register={register}
                error={errors.line2?.message}
              />
              <Field
                name="city"
                label="Ciudad"
                autoComplete="address-level2"
                register={register}
                error={errors.city?.message}
              />
              <Field
                name="instructions"
                label="Indicaciones para el repartidor"
                optional
                register={register}
                error={errors.instructions?.message}
              />
            </Section>
          ) : (
            <Section title="Recoges en">
              <p className="font-semibold">Brasa &amp; Co. · {PICKUP_ADDRESS}</p>
              <p className="text-sm text-ink-muted">
                Tu pedido te espera en el mostrador con tu nombre.
              </p>
            </Section>
          )}

          <Section title={mode === 'delivery' ? '¿Cuándo llega?' : '¿Cuándo pasas?'}>
            <div className="grid gap-1.5">
              <label htmlFor="slot" className="font-semibold">
                Hora
              </label>
              <select
                id="slot"
                aria-invalid={errors.slot ? true : undefined}
                className={inputBase}
                {...register('slot')}
              >
                {open ? <option value={ASAP}>Lo antes posible</option> : null}
                {slots.map((slot) => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </select>
              {open ? null : (
                <p className="text-sm text-ink-muted">
                  Ahora estamos cerrados; programa tu pedido para cuando abramos.
                </p>
              )}
              {errors.slot ? (
                <p role="alert" className="text-sm font-semibold text-accent">
                  {errors.slot.message}
                </p>
              ) : null}
            </div>
          </Section>

          <Section title="Pago">
            <fieldset className="grid gap-2">
              <legend className="sr-only">Método de pago</legend>
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.id}
                  className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 border-line-strong px-4 py-2 has-[:checked]:border-ink has-[:checked]:bg-(--food-cream-deep) has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-(--shift-focus)"
                >
                  <input
                    type="radio"
                    value={method.id}
                    className="size-5 accent-(--food-leaf)"
                    {...register('payment')}
                  />
                  <span className="grid">
                    <span className="font-semibold">{method.label}</span>
                    <span className="text-sm text-ink-muted">{method.hint}</span>
                  </span>
                </label>
              ))}
              <p className="text-sm text-ink-muted">
                Demostración: no se realiza ningún cobro real ni se piden datos de tarjeta.
              </p>
            </fieldset>
          </Section>

          {/* Sticky above the tab bar on mobile, plain block on desktop. */}
          <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 grid gap-2 rounded-3xl border border-line bg-surface-raised p-3 shadow-(--food-shadow) md:bottom-4">
            {placeError ? (
              <div role="alert" className="rounded-2xl border-2 border-accent p-3">
                <p className="font-semibold text-accent">{placeError}</p>
                <p className="text-sm text-ink-muted">
                  Puedes reintentar; tu pedido sigue intacto.
                </p>
              </div>
            ) : null}
            {blocked ? (
              <p role="status" className="text-sm font-semibold text-accent">
                Te faltan {formatMoney({ amount: quote.shortfall, currency: 'COP' })} para el mínimo
                de domicilio. Agrega algo o elige recoger.
              </p>
            ) : null}
            <button
              type="submit"
              disabled={order.isPending || blocked}
              className={`${btnPrimary} w-full`}
            >
              {order.isPending
                ? 'Enviando a la cocina…'
                : `${placeError ? 'Reintentar pedido' : 'Confirmar pedido'} · ${formatMoney(quote.total)}`}
            </button>
          </div>
        </form>

        <aside
          aria-labelledby="summary-title"
          className="grid gap-4 rounded-card bg-surface-raised p-5 shadow-(--food-shadow) lg:sticky lg:top-24"
        >
          <h2 id="summary-title" className={eyebrow}>
            Resumen
          </h2>
          <ul className="grid gap-3">
            {summary.lines.map(({ line, price, description }) => (
              <li key={line.id} className="flex justify-between gap-3">
                <div className="grid">
                  <p className="font-semibold">
                    {line.quantity} × {description.title}
                  </p>
                  {description.details.map((detail) => (
                    <p key={detail} className="text-sm text-ink-muted">
                      {detail}
                    </p>
                  ))}
                </div>
                <p className="tabular-nums">{formatMoney(price.total)}</p>
              </li>
            ))}
          </ul>
          <PriceBreakdown subtotal={summary.subtotal} fees={quote.fees} total={quote.total} />
          <Link
            to="/food/menu"
            className="justify-self-start font-semibold underline underline-offset-4"
          >
            Seguir pidiendo
          </Link>
        </aside>
      </div>
    </div>
  )
}
