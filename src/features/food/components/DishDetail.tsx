import { useRef, useState, type SyntheticEvent } from 'react'
import { Link } from 'react-router'
import { MAX_LINE_QUANTITY } from '@/core/cart'
import {
  formatMoney,
  type Allergen,
  type CartLineOf,
  type FoodItem,
  type FoodOptionGroup,
} from '@/core/domain'
import { Capability } from '@/engine'
import { MAX_NOTE_LENGTH, foodCart, selectionAllergens } from '../domain'
import {
  checkSelection,
  groupHint,
  groupState,
  picksToSelection,
  previewTotal,
  selectionToPicks,
  togglePick,
  type Picks,
} from '../domain/dish'
import { ALLERGEN_LABELS, SPICE_LABELS } from '../domain/menuFilters'
import { useOrderUi } from '../state/orderUi'
import { DishMedia } from './DishMedia'
import { CheckIcon, ClockIcon, CloseIcon, FlameIcon } from './Icons'
import { QuantityStepper } from './QuantityStepper'
import { btnPrimary, btnOutline, eyebrow, iconBtn, inputBase } from './styles'

interface DishDetailProps {
  readonly product: FoodItem
  /** page: two columns with a sticky action bar. sheet: scrolling body inside a dialog. */
  readonly layout: 'page' | 'sheet'
  /** Called after a successful add (the sheet closes itself). */
  readonly onDone?: () => void
  readonly onClose?: () => void
  /** Editing a line already in the order: it is replaced by the new choice. */
  readonly editLine?: CartLineOf<'food'>
}

interface OptionGroupProps {
  readonly group: FoodOptionGroup
  readonly picks: Picks
  readonly showErrors: boolean
  readonly onToggle: (group: FoodOptionGroup, optionId: string) => void
}

function OptionGroup({ group, picks, showErrors, onToggle }: OptionGroupProps) {
  const chosen = picks[group.id] ?? []
  const state = groupState(group, chosen.length)
  const invalid = showErrors && state !== 'ok'
  const single = group.max === 1
  const atMax = !single && chosen.length >= group.max
  return (
    <fieldset
      data-group={group.id}
      data-invalid={invalid}
      tabIndex={-1}
      className={`grid gap-2 rounded-3xl border-2 p-3 outline-none ${
        invalid ? 'border-accent' : 'border-transparent'
      }`}
    >
      <legend className="flex w-full items-baseline justify-between gap-3 px-1">
        <span className="font-display text-lg font-bold">{group.label}</span>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
            group.min > 0 ? 'bg-ink text-surface' : 'bg-(--food-cream-deep) text-ink'
          }`}
        >
          {group.min > 0 ? `Requerido · ${groupHint(group)}` : groupHint(group)}
        </span>
      </legend>
      {group.options.map((option) => {
        const checked = chosen.includes(option.id)
        const disabled = atMax && !checked
        return (
          <label
            key={option.id}
            className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border-2 px-3 py-2 transition-colors duration-(--shift-duration-fast) has-[:checked]:border-ink has-[:checked]:bg-(--food-cream-deep) has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-(--shift-focus) ${
              disabled ? 'cursor-not-allowed opacity-50' : 'border-line-strong bg-surface-raised'
            }`}
          >
            <input
              type={single ? 'radio' : 'checkbox'}
              name={`opt-${group.id}`}
              checked={checked}
              disabled={disabled}
              onChange={() => {
                onToggle(group, option.id)
              }}
              className="size-5 shrink-0 accent-(--food-leaf)"
            />
            <span className="flex-1">{option.label}</span>
            {option.priceDelta.amount > 0 ? (
              <span className="text-sm font-semibold tabular-nums text-ink-muted">
                + {formatMoney(option.priceDelta)}
              </span>
            ) : null}
          </label>
        )
      })}
    </fieldset>
  )
}

/** Dish customization form: option groups validated by the domain adapter, live total, add/replace in the order. */
export function DishDetail({ product, layout, onDone, onClose, editLine }: DishDetailProps) {
  const [picks, setPicks] = useState<Picks>(() =>
    editLine ? selectionToPicks(editLine.selection) : {},
  )
  const [note, setNote] = useState(editLine?.selection.note ?? '')
  const [quantity, setQuantity] = useState(editLine?.quantity ?? 1)
  const [issues, setIssues] = useState<readonly string[]>([])
  const [attempted, setAttempted] = useState(false)
  const [added, setAdded] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const openDrawer = useOrderUi((s) => s.openDrawer)
  const announce = useOrderUi((s) => s.announce)

  const selection = picksToSelection(product, picks, note)
  const total = previewTotal(product, selection, quantity)
  const allergens = selectionAllergens(product, selection)
  const [media] = product.media
  const isSheet = layout === 'sheet'

  const submit = (event: SyntheticEvent) => {
    event.preventDefault()
    setAdded(false)
    const found = checkSelection(product, selection, quantity)
    if (found.length > 0) {
      setAttempted(true)
      setIssues(found.map((issue) => issue.message))
      const target = formRef.current?.querySelector<HTMLElement>('[data-invalid="true"]')
      if (target) {
        target.scrollIntoView({ block: 'center' })
        target.focus()
      }
      return
    }

    const { add, remove } = foodCart.store.getState()
    if (editLine) remove(editLine.id)
    const result = add(product, selection, quantity)
    if (!result.ok) {
      // Put the original line back so a failed edit never loses the dish.
      if (editLine) add(editLine.product, editLine.selection, editLine.quantity)
      setAttempted(true)
      setIssues(result.issues.map((issue) => issue.message))
      return
    }
    setAttempted(false)
    setIssues([])
    setAdded(true)
    announce(`${editLine ? 'Actualizado' : 'Añadido al pedido'}: ${product.title}`)
    onDone?.()
  }

  const details = (
    <>
      <Body product={product} allergens={allergens} />
      <Options
        product={product}
        picks={picks}
        attempted={attempted}
        note={note}
        onNote={setNote}
        onToggle={(group, optionId) => {
          setPicks((current) => togglePick(group, current, optionId))
        }}
        issues={issues}
      />
    </>
  )

  return (
    <form
      ref={formRef}
      noValidate
      aria-label={`Personalizar ${product.title}`}
      onSubmit={submit}
      className={
        isSheet
          ? 'flex max-h-[calc(92dvh-1.5rem)] flex-col md:max-h-[88dvh]'
          : 'grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-start lg:gap-10'
      }
    >
      <div
        className={
          isSheet ? 'min-h-0 flex-1 overflow-y-auto overscroll-contain' : 'lg:sticky lg:top-24'
        }
      >
        <div className="relative">
          <DishMedia
            media={media}
            priority
            sizes="(min-width: 1024px) 40vw, 100vw"
            className={isSheet ? 'max-h-56 w-full' : 'w-full rounded-card shadow-(--food-shadow)'}
          />
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className={`${iconBtn} absolute top-3 right-3 bg-surface-raised/90 shadow-(--food-shadow)`}
            >
              <CloseIcon />
            </button>
          ) : null}
        </div>
        {isSheet ? <div className="grid gap-5 px-gutter pt-4 pb-6">{details}</div> : null}
      </div>

      {!isSheet ? <div className="grid gap-6">{details}</div> : null}

      <div
        className={`z-10 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface-raised px-gutter py-3 ${
          isSheet
            ? 'pb-[max(0.75rem,env(safe-area-inset-bottom))]'
            : 'sticky bottom-16 rounded-3xl border shadow-(--food-shadow) md:bottom-4 lg:col-start-2'
        }`}
      >
        <QuantityStepper
          value={quantity}
          min={1}
          max={MAX_LINE_QUANTITY}
          label={product.title}
          onChange={setQuantity}
        />
        <button
          type="submit"
          disabled={!product.available}
          className={`${btnPrimary} flex-1 sm:flex-none`}
        >
          {editLine ? 'Guardar cambios' : 'Añadir al pedido'} · {formatMoney(total)}
        </button>
        {!isSheet && added ? (
          <p
            role="status"
            className="flex w-full flex-wrap items-center gap-3 rounded-2xl bg-(--food-leaf) px-4 py-2 font-semibold text-white"
          >
            <CheckIcon /> Añadido a tu pedido
            <button
              type="button"
              onClick={openDrawer}
              className={`${btnOutline} min-h-11 border-white text-white hover:bg-white hover:text-(--food-leaf)`}
            >
              Ver pedido
            </button>
            <Link to="/food/menu" className="underline underline-offset-4">
              Seguir pidiendo
            </Link>
          </p>
        ) : null}
      </div>
    </form>
  )
}

function Body({
  product,
  allergens,
}: {
  readonly product: FoodItem
  readonly allergens: readonly Allergen[]
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <h1 className="font-display text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">
          {product.title}
        </h1>
        <p className="font-display text-2xl font-bold text-accent">{formatMoney(product.price)}</p>
        <p className="text-ink-muted">{product.description}</p>
      </div>
      <ul className="flex flex-wrap gap-2 text-sm font-semibold" aria-label="Datos del plato">
        <li className="inline-flex items-center gap-1.5 rounded-full bg-(--food-cream-deep) px-3 py-1">
          <ClockIcon /> {product.prepTimeMinutes} min de preparación
        </li>
        {product.spiceLevel > 0 ? (
          <li className="inline-flex items-center gap-1.5 rounded-full bg-(--food-cream-deep) px-3 py-1">
            <FlameIcon /> {SPICE_LABELS[product.spiceLevel]}
          </li>
        ) : null}
        {product.tags.map((tag) => (
          <li key={tag} className="rounded-full bg-(--food-leaf) px-3 py-1 text-white">
            {tag}
          </li>
        ))}
        {!product.available ? (
          <li className="rounded-full bg-ink px-3 py-1 text-surface">Agotado hoy</li>
        ) : null}
      </ul>

      <section aria-labelledby="dish-ingredients" className="grid gap-1.5">
        <h2 id="dish-ingredients" className={eyebrow}>
          Ingredientes
        </h2>
        <p>{product.ingredients.join(', ')}.</p>
      </section>

      <section aria-labelledby="dish-allergens" className="grid gap-1.5">
        <h2 id="dish-allergens" className={eyebrow}>
          Alérgenos
        </h2>
        {allergens.length > 0 ? (
          <p>Contiene: {allergens.map((a) => ALLERGEN_LABELS[a].toLowerCase()).join(', ')}.</p>
        ) : (
          <p>No contiene alérgenos declarados.</p>
        )}
      </section>

      <Capability name="nutritionInfo">
        <section aria-labelledby="dish-nutrition" className="grid gap-2">
          <h2 id="dish-nutrition" className={eyebrow}>
            Información nutricional · {product.nutrition.servingGrams} g
          </h2>
          <dl className="grid grid-cols-4 gap-2 text-center">
            {[
              ['Energía', `${String(product.nutrition.kcal)} kcal`],
              ['Proteína', `${String(product.nutrition.proteinGrams)} g`],
              ['Carbos', `${String(product.nutrition.carbsGrams)} g`],
              ['Grasa', `${String(product.nutrition.fatGrams)} g`],
            ].map(([term, value]) => (
              <div key={term} className="rounded-2xl bg-(--food-cream-deep) px-1 py-2">
                <dt className="text-xs text-ink-muted">{term}</dt>
                <dd className="text-sm font-bold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </Capability>
    </div>
  )
}

function Options({
  product,
  picks,
  attempted,
  note,
  onNote,
  onToggle,
  issues,
}: {
  readonly product: FoodItem
  readonly picks: Picks
  readonly attempted: boolean
  readonly note: string
  readonly onNote: (value: string) => void
  readonly onToggle: (group: FoodOptionGroup, optionId: string) => void
  readonly issues: readonly string[]
}) {
  return (
    <div className="grid gap-4">
      {issues.length > 0 ? (
        <div role="alert" className="grid gap-1 rounded-2xl border-2 border-accent p-3 text-accent">
          {issues.map((message) => (
            <p key={message} className="font-semibold">
              {message}
            </p>
          ))}
        </div>
      ) : null}
      <Capability name="customization">
        {product.optionGroups.map((group) => (
          <OptionGroup
            key={group.id}
            group={group}
            picks={picks}
            showErrors={attempted}
            onToggle={onToggle}
          />
        ))}
      </Capability>
      <div className="grid gap-1.5">
        <label htmlFor={`note-${product.id}`} className="font-display text-lg font-bold">
          Nota para la cocina <span className="text-sm font-normal text-ink-muted">· opcional</span>
        </label>
        <textarea
          id={`note-${product.id}`}
          rows={2}
          maxLength={MAX_NOTE_LENGTH}
          value={note}
          onChange={(event) => {
            onNote(event.target.value)
          }}
          placeholder="Ej.: sin cebolla, salsa aparte"
          className={`${inputBase} py-3`}
        />
        <p className="text-right text-xs text-ink-muted">
          {note.length}/{MAX_NOTE_LENGTH}
        </p>
      </div>
    </div>
  )
}
