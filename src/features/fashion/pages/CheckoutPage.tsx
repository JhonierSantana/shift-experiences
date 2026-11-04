import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState, type HTMLInputTypeAttribute } from 'react'
import { useForm, useWatch, type UseFormRegister } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { add, formatMoney } from '@/core/domain'
import { isRepositoryError } from '@/core/repositories'
import { usePlaceOrder } from '@/infra/query'
import { MediaImage } from '../components/MediaImage'
import { buttonOutline, buttonPrimary, eyebrow, inputBase } from '../components/styles'
import { fashionCart, fashionData } from '../domain'
import {
  DELIVERY_METHODS,
  FREE_SHIPPING_FROM,
  STEP_FIELDS,
  checkoutSchema,
  deliveryFee,
  deliveryLabel,
  toOrderInput,
  type CheckoutField,
  type CheckoutValues,
} from '../domain/checkout'

const STEPS = [
  { id: 'contact', label: 'Contacto y envío' },
  { id: 'delivery', label: 'Entrega' },
  { id: 'review', label: 'Revisión' },
] as const

type StepId = (typeof STEPS)[number]['id']

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
      <label htmlFor={name} className={eyebrow}>
        {label}
        {optional ? <span className="text-ink-muted"> · opcional</span> : null}
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
      <p id={errorId} role={error ? 'alert' : undefined} className="min-h-5 text-sm text-accent">
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
  postalCode: '',
  instructions: '',
  delivery: 'standard',
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const summary = fashionCart.useCart(fashionCart.selectSummary)
  const order = usePlaceOrder(fashionData)
  const [step, setStep] = useState<StepId>('contact')
  const [placed, setPlaced] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const firstRender = useRef(true)

  const {
    register,
    handleSubmit,
    trigger,
    control,
    getValues,
    formState: { errors },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues,
    mode: 'onTouched',
  })

  const delivery = useWatch({ control, name: 'delivery' })
  const fee = deliveryFee(delivery, summary.subtotal)
  const total = add(summary.subtotal, fee)

  // Move focus to the step heading on step changes (not on first paint).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    headingRef.current?.focus()
  }, [step])

  const goTo = async (target: StepId) => {
    const index = STEPS.findIndex((s) => s.id === target)
    const current = STEPS.findIndex((s) => s.id === step)
    if (index > current) {
      for (const done of STEPS.slice(current, index)) {
        if (done.id === 'review') continue
        const ok = await trigger(STEP_FIELDS[done.id], { shouldFocus: true })
        if (!ok) return
      }
    }
    setStep(target)
  }

  const place = handleSubmit((data) => {
    order.mutate(
      toOrderInput(
        data,
        summary.lines.map((l) => l.line),
        summary.subtotal,
      ),
      {
        onSuccess: (created) => {
          setPlaced(true)
          void navigate(`/fashion/confirmacion/${created.id}`)
          fashionCart.store.getState().clear()
        },
      },
    )
  })

  if (summary.lines.length === 0 && !placed) {
    return (
      <section className="grid min-h-[60dvh] content-center justify-items-start gap-6 px-gutter py-section">
        <h1 className="font-display text-6xl italic">Tu bolsa está vacía</h1>
        <p className="max-w-prose text-ink-muted">
          Añade una pieza para poder finalizar tu compra.
        </p>
        <Link to="/fashion/catalogo" className={buttonPrimary}>
          Ver la colección
        </Link>
      </section>
    )
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step)
  // Read once when the review step renders (a step change re-renders, so values are current).
  const values = step === 'review' ? getValues() : defaultValues
  const errorMessage = (name: CheckoutField) => errors[name]?.message
  const placeError = order.error
    ? isRepositoryError(order.error)
      ? order.error.message
      : 'No pudimos procesar tu pedido. Inténtalo de nuevo.'
    : null

  return (
    <div className="px-gutter pt-10 pb-section lg:pt-16">
      <title>Finalizar compra · Maison Vela</title>
      <h1 className="mb-10 font-display text-6xl leading-none sm:text-7xl">Finalizar compra</h1>

      <ol
        aria-label="Pasos"
        className="mb-12 flex flex-wrap gap-x-6 gap-y-2 border-b border-line pb-4"
      >
        {STEPS.map((s, i) => (
          <li
            key={s.id}
            {...(s.id === step ? { 'aria-current': 'step' as const } : {})}
            className={`${eyebrow} ${s.id === step ? 'text-ink' : 'text-ink-muted'}`}
          >
            {String(i + 1).padStart(2, '0')} · {s.label}
          </li>
        ))}
      </ol>

      <div className="grid gap-12 lg:grid-cols-12 lg:gap-20">
        <form
          noValidate
          aria-label="Datos del pedido"
          className="lg:col-span-7"
          onSubmit={(event) => {
            event.preventDefault()
            if (step === 'review') void place()
            else void goTo(STEPS[stepIndex + 1]?.id ?? 'review')
          }}
        >
          <h2 ref={headingRef} tabIndex={-1} className="mb-8 font-display text-4xl outline-none">
            {STEPS[stepIndex]?.label}
          </h2>

          {step === 'contact' ? (
            <div className="grid gap-x-8 sm:grid-cols-2">
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
              <Field
                name="postalCode"
                label="Código postal"
                optional
                inputMode="numeric"
                autoComplete="postal-code"
                register={register}
                error={errorMessage('postalCode')}
              />
              <Field
                name="instructions"
                label="Indicaciones de entrega"
                optional
                register={register}
                error={errorMessage('instructions')}
              />
            </div>
          ) : null}

          {step === 'delivery' ? (
            <fieldset className="grid gap-3">
              <legend className="sr-only">Método de entrega</legend>
              {DELIVERY_METHODS.map((method) => {
                const price = deliveryFee(method.id, summary.subtotal)
                return (
                  <label
                    key={method.id}
                    className="flex cursor-pointer items-start gap-4 border border-line-strong p-5 transition-colors duration-(--shift-duration-base) ease-brand has-[:checked]:border-ink has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-4"
                  >
                    <input
                      type="radio"
                      value={method.id}
                      className="mt-1.5 size-4 accent-ink"
                      {...register('delivery')}
                    />
                    <span className="grid flex-1 gap-1">
                      <span className="font-display text-2xl">{method.label}</span>
                      <span className="text-sm text-ink-muted">{method.eta}</span>
                    </span>
                    <span className="tabular-nums">
                      {price.amount === 0 ? 'Gratis' : formatMoney(price)}
                    </span>
                  </label>
                )
              })}
              <p className="text-sm text-ink-muted">
                Envío estándar gratis desde{' '}
                {formatMoney({ amount: FREE_SHIPPING_FROM, currency: 'COP' })}.
              </p>
              {errorMessage('delivery') ? (
                <p role="alert" className="text-sm text-accent">
                  {errorMessage('delivery')}
                </p>
              ) : null}
            </fieldset>
          ) : null}

          {step === 'review' ? (
            <div className="grid gap-8">
              <section
                aria-labelledby="review-contact"
                className="grid gap-2 border-b border-line pb-6"
              >
                <div className="flex items-baseline justify-between">
                  <h3 id="review-contact" className={eyebrow}>
                    Envío a
                  </h3>
                  <button
                    type="button"
                    aria-label="Editar datos de envío"
                    onClick={() => {
                      void goTo('contact')
                    }}
                    className={`${eyebrow} min-h-11 underline underline-offset-4`}
                  >
                    Editar
                  </button>
                </div>
                <p>
                  {values.recipient} · {values.phone}
                </p>
                <p className="text-ink-muted">
                  {values.line1}
                  {values.line2 ? `, ${values.line2}` : ''}, {values.city}, {values.region}
                </p>
                <p className="text-ink-muted">{values.email}</p>
              </section>
              <section
                aria-labelledby="review-delivery"
                className="grid gap-2 border-b border-line pb-6"
              >
                <div className="flex items-baseline justify-between">
                  <h3 id="review-delivery" className={eyebrow}>
                    Entrega
                  </h3>
                  <button
                    type="button"
                    aria-label="Editar método de entrega"
                    onClick={() => {
                      void goTo('delivery')
                    }}
                    className={`${eyebrow} min-h-11 underline underline-offset-4`}
                  >
                    Editar
                  </button>
                </div>
                <p>
                  {deliveryLabel(delivery)} · {fee.amount === 0 ? 'Gratis' : formatMoney(fee)}
                </p>
              </section>
              <p className="text-sm text-ink-muted">
                Es una tienda de demostración: no se realiza ningún cobro real.
              </p>
              {placeError ? (
                <div role="alert" className="grid gap-3 border border-accent p-4">
                  <p className="text-accent">{placeError}</p>
                  <p className="text-sm text-ink-muted">
                    Puedes reintentar; tu bolsa sigue intacta.
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-10 flex flex-wrap gap-3">
            {stepIndex > 0 ? (
              <button
                type="button"
                className={buttonOutline}
                onClick={() => {
                  setStep(STEPS[stepIndex - 1]?.id ?? 'contact')
                }}
              >
                Volver
              </button>
            ) : null}
            <button type="submit" className={buttonPrimary} disabled={order.isPending}>
              {step === 'review'
                ? order.isPending
                  ? 'Procesando…'
                  : placeError
                    ? 'Reintentar pedido'
                    : 'Confirmar pedido'
                : 'Continuar'}
            </button>
          </div>
        </form>

        <aside
          aria-labelledby="summary-title"
          className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start"
        >
          <h2 id="summary-title" className={`${eyebrow} mb-6 text-ink-muted`}>
            Resumen
          </h2>
          <ul className="divide-y divide-line border-y border-line">
            {summary.lines.map(({ line, price, description }) => {
              const [thumb] = line.product.media
              return (
                <li key={line.id} className="grid grid-cols-[4.5rem_1fr_auto] gap-4 py-4">
                  <MediaImage media={thumb} />
                  <div className="grid content-center gap-1">
                    <p className="font-display text-lg leading-tight">{description.title}</p>
                    <p className="text-sm text-ink-muted">
                      {description.details.join(' · ')} · x{line.quantity}
                    </p>
                  </div>
                  <p className="self-center tabular-nums">{formatMoney(price.total)}</p>
                </li>
              )
            })}
          </ul>
          <dl className="mt-6 grid gap-2">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatMoney(summary.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Envío</dt>
              <dd className="tabular-nums">{fee.amount === 0 ? 'Gratis' : formatMoney(fee)}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-ink pt-3">
              <dt className={eyebrow}>Total</dt>
              <dd className="font-display text-3xl tabular-nums">{formatMoney(total)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  )
}
