import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type HTMLInputTypeAttribute } from 'react'
import { useForm, useWatch, type UseFormRegister } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { add, formatMoney } from '@/core/domain'
import { isRepositoryError } from '@/core/repositories'
import { usePlaceOrder } from '@/infra/query'
import { MediaImage } from '../components/MediaImage'
import { buttonPrimary, inputBase } from '../components/styles'
import { marketCart, marketData } from '../domain'
import {
  DELIVERY_METHODS,
  FREE_SHIPPING_FROM,
  checkoutSchema,
  deliveryFee,
  qualifiesForFreeShipping,
  toOrderInput,
  type CheckoutField,
  type CheckoutValues,
} from '../domain/checkout'

interface FieldProps {
  readonly name: CheckoutField
  readonly label: string
  readonly register: UseFormRegister<CheckoutValues>
  readonly error: string | undefined
  readonly optional?: boolean
  readonly type?: HTMLInputTypeAttribute
  readonly autoComplete?: string
  readonly inputMode?: 'text' | 'email' | 'tel' | 'numeric'
  readonly className?: string
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
  className = '',
}: FieldProps) {
  const errorId = `${name}-error`
  return (
    <div className={`grid gap-1 ${className}`}>
      <label htmlFor={name} className="font-semibold">
        {label}
        {optional ? <span className="font-normal text-ink-muted"> (opcional)</span> : null}
      </label>
      <input
        id={name}
        type={type}
        {...(autoComplete ? { autoComplete } : {})}
        {...(inputMode ? { inputMode } : {})}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        aria-required={optional ? undefined : true}
        className={`${inputBase} aria-invalid:border-(--market-deal)`}
        {...register(name)}
      />
      <p
        id={errorId}
        role={error ? 'alert' : undefined}
        className="min-h-5 text-sm font-semibold text-(--market-deal)"
      >
        {error}
      </p>
    </div>
  )
}

const defaultValues: CheckoutValues = {
  email: '',
  recipient: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  region: '',
  delivery: 'standard',
}

const card = 'grid gap-x-4 rounded-card border border-line bg-surface-raised p-4 sm:grid-cols-2'

export function CheckoutPage() {
  const navigate = useNavigate()
  const summary = marketCart.useCart(marketCart.selectSummary)
  const order = usePlaceOrder(marketData)
  const [placed, setPlaced] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues,
    mode: 'onTouched',
  })

  const lines = summary.lines.map((l) => l.line)
  const freeStandard = qualifiesForFreeShipping(lines, summary.subtotal)
  const delivery = useWatch({ control, name: 'delivery' })
  const fee = deliveryFee(delivery, freeStandard)
  const total = add(summary.subtotal, fee)

  const place = handleSubmit((data) => {
    order.mutate(toOrderInput(data, lines, freeStandard), {
      onSuccess: (created) => {
        setPlaced(true)
        void navigate(`/market/confirmacion/${created.id}`)
        marketCart.store.getState().clear()
      },
    })
  })

  if (summary.lines.length === 0 && !placed) {
    return (
      <section className="grid min-h-[50dvh] content-center justify-items-start gap-3 px-gutter py-section">
        <title>Carrito vacío · Plaza</title>
        <h1 className="font-display text-2xl font-extrabold">Tu carrito está vacío</h1>
        <p className="max-w-prose text-ink-muted">Añade un producto para poder pagar.</p>
        <Link to="/market" className={buttonPrimary}>
          Explorar ofertas
        </Link>
      </section>
    )
  }

  const errorMessage = (name: CheckoutField) => errors[name]?.message
  const placeError = order.error
    ? isRepositoryError(order.error)
      ? order.error.message
      : 'No pudimos procesar tu pedido. Inténtalo de nuevo.'
    : null

  return (
    <div className="px-gutter py-4">
      <title>Pagar · Plaza</title>
      <h1 className="mb-3 font-display text-2xl font-extrabold tracking-tight">Finalizar compra</h1>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <form
          noValidate
          aria-label="Datos del pedido"
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            void place()
          }}
        >
          <fieldset className={card}>
            <legend className="mb-2 float-left w-full font-display text-lg font-extrabold sm:col-span-2">
              1. Contacto y dirección
            </legend>
            <Field
              name="email"
              label="Correo"
              type="email"
              autoComplete="email"
              inputMode="email"
              register={register}
              error={errorMessage('email')}
              className="sm:col-span-2"
            />
            <Field
              name="recipient"
              label="Nombre completo"
              autoComplete="name"
              register={register}
              error={errorMessage('recipient')}
            />
            <Field
              name="phone"
              label="Teléfono"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              register={register}
              error={errorMessage('phone')}
            />
            <Field
              name="line1"
              label="Dirección"
              autoComplete="address-line1"
              register={register}
              error={errorMessage('line1')}
              className="sm:col-span-2"
            />
            <Field
              name="line2"
              label="Apartamento, torre, barrio"
              optional
              autoComplete="address-line2"
              register={register}
              error={errorMessage('line2')}
              className="sm:col-span-2"
            />
            <Field
              name="city"
              label="Ciudad"
              autoComplete="address-level2"
              register={register}
              error={errorMessage('city')}
            />
            <Field
              name="region"
              label="Departamento"
              autoComplete="address-level1"
              register={register}
              error={errorMessage('region')}
            />
          </fieldset>

          <fieldset className="grid gap-2 rounded-card border border-line bg-surface-raised p-4">
            <legend className="mb-2 float-left w-full font-display text-lg font-extrabold">
              2. Método de envío
            </legend>
            {DELIVERY_METHODS.map((method) => {
              const price = deliveryFee(method.id, freeStandard)
              return (
                <label
                  key={method.id}
                  className="flex cursor-pointer items-start gap-3 rounded-control border border-line-strong p-3 transition-colors duration-(--shift-duration-fast) has-[:checked]:border-accent has-[:checked]:bg-surface has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-(--shift-focus)"
                >
                  <input
                    type="radio"
                    value={method.id}
                    className="mt-1 size-4 accent-(--shift-accent)"
                    {...register('delivery')}
                  />
                  <span className="grid flex-1 gap-0.5">
                    <span className="font-semibold">{method.label}</span>
                    <span className="text-sm text-ink-muted">{method.eta}</span>
                  </span>
                  <span className="font-mono font-semibold tabular-nums">
                    {price.amount === 0 ? 'Gratis' : formatMoney(price)}
                  </span>
                </label>
              )
            })}
            <p className="text-sm text-ink-muted">
              Envío estándar gratis desde{' '}
              {formatMoney({ amount: FREE_SHIPPING_FROM, currency: 'COP' })} o cuando todos tus
              productos tienen envío gratis.
            </p>
            {errorMessage('delivery') ? (
              <p role="alert" className="text-sm font-semibold text-(--market-deal)">
                {errorMessage('delivery')}
              </p>
            ) : null}
          </fieldset>

          <p className="text-sm text-ink-muted">
            Es una tienda de demostración: no se realiza ningún cobro real.
          </p>
          {placeError ? (
            <div
              role="alert"
              className="grid gap-1 rounded-card border-2 border-(--market-deal) p-3"
            >
              <p className="font-semibold text-(--market-deal)">{placeError}</p>
              <p className="text-sm text-ink-muted">Puedes reintentar; tu carrito sigue intacto.</p>
            </div>
          ) : null}
          <button
            type="submit"
            className={`${buttonPrimary} min-h-12 text-base`}
            disabled={order.isPending}
          >
            {order.isPending
              ? 'Procesando…'
              : placeError
                ? 'Reintentar pedido'
                : 'Confirmar pedido'}
          </button>
        </form>

        <aside
          aria-labelledby="summary-title"
          className="rounded-card border border-line bg-surface-raised p-4 lg:sticky lg:top-28"
        >
          <h2 id="summary-title" className="mb-2 font-display text-lg font-extrabold">
            Resumen
          </h2>
          <ul className="divide-y divide-line border-y border-line">
            {summary.lines.map(({ line, price, description }) => (
              <li key={line.id} className="grid grid-cols-[3.5rem_1fr_auto] gap-3 py-2.5">
                <MediaImage media={line.product.media[0]} className="rounded-control" />
                <div className="grid content-center">
                  <p className="line-clamp-2 leading-snug font-semibold">{description.title}</p>
                  <p className="text-xs text-ink-muted">Cantidad {line.quantity}</p>
                </div>
                <p className="self-center font-mono font-semibold tabular-nums">
                  {formatMoney(price.total)}
                </p>
              </li>
            ))}
          </ul>
          <dl className="mt-3 grid gap-1.5">
            {summary.savings.amount > 0 ? (
              <div className="flex justify-between font-semibold text-(--market-deal)">
                <dt>Ahorras</dt>
                <dd className="font-mono tabular-nums">−{formatMoney(summary.savings)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd className="font-mono tabular-nums">{formatMoney(summary.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Envío</dt>
              <dd className="font-mono tabular-nums">
                {fee.amount === 0 ? 'Gratis' : formatMoney(fee)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-line pt-2">
              <dt className="font-semibold">Total</dt>
              <dd className="font-mono text-2xl font-bold tabular-nums">{formatMoney(total)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  )
}
