import { useEffect, useId, useState, type KeyboardEvent } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { formatMoney } from '@/core/domain'
import { useProductList } from '@/infra/query'
import { marketData } from '../domain'
import { priceDisplay } from '../domain/pricing'
import { SearchIcon } from './Icons'
import { MediaImage } from './MediaImage'

const MIN_CHARS = 2
const SUGGESTIONS = 5

function useDebounced(value: string, ms: number): string {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value)
    }, ms)
    return () => {
      clearTimeout(timer)
    }
  }, [value, ms])
  return debounced
}

/** Prominent header search: submit goes to the listing; typing shows a few product suggestions (combobox). */
export function SearchBox() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const onSearchPage = pathname === '/market/buscar'
  const [value, setValue] = useState(onSearchPage ? (params.get('q') ?? '') : '')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const listId = useId()
  const term = useDebounced(value.trim(), 200)
  const enabled = term.length >= MIN_CHARS

  const suggestions = useProductList(marketData, { search: term, pageSize: SUGGESTIONS })
  const items = enabled && open ? (suggestions.data?.items ?? []) : []
  const showList = open && enabled && value.trim().length >= MIN_CHARS
  // One extra "see all" row after the products.
  const rowCount = items.length + 1

  const go = (to: string) => {
    setOpen(false)
    setActive(-1)
    void navigate(to)
  }

  const submit = () => {
    const q = value.trim()
    go(q ? `/market/buscar?q=${encodeURIComponent(q)}` : '/market/buscar')
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false)
      setActive(-1)
    } else if (event.key === 'ArrowDown' && showList) {
      event.preventDefault()
      setActive((a) => (a + 1) % rowCount)
    } else if (event.key === 'ArrowUp' && showList) {
      event.preventDefault()
      setActive((a) => (a <= 0 ? rowCount - 1 : a - 1))
    } else if (event.key === 'Enter' && showList && active >= 0) {
      event.preventDefault()
      const product = items[active]
      if (product) go(`/market/producto/${product.id}`)
      else submit()
    }
  }

  return (
    <form
      role="search"
      className="relative order-last flex w-full basis-full sm:order-none sm:w-auto sm:min-w-0 sm:flex-1 sm:basis-0"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <label htmlFor="market-search" className="sr-only">
        Buscar en Plaza
      </label>
      <input
        id="market-search"
        type="search"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? `${listId}-${String(active)}` : undefined}
        autoComplete="off"
        placeholder="Buscar productos, marcas y más"
        value={value}
        onChange={(event) => {
          setValue(event.target.value)
          setOpen(true)
          setActive(-1)
        }}
        onFocus={() => {
          setOpen(true)
        }}
        onBlur={() => {
          setOpen(false)
        }}
        onKeyDown={onKeyDown}
        className="min-h-11 w-full rounded-l-control border-2 border-r-0 border-accent bg-surface-raised px-3 placeholder:text-ink-muted"
      />
      <button
        type="submit"
        className="inline-flex min-h-11 items-center gap-2 rounded-r-control bg-accent px-4 font-semibold text-accent-ink transition-colors duration-(--shift-duration-fast) hover:bg-ink"
      >
        <SearchIcon />
        <span className="hidden sm:inline">Buscar</span>
        <span className="sr-only sm:hidden">Buscar</span>
      </button>

      <ul
        id={listId}
        role="listbox"
        aria-label="Sugerencias de búsqueda"
        hidden={!showList}
        className="plaza-drop absolute top-full right-0 left-0 z-(--shift-z-overlay) mt-1 overflow-hidden rounded-card border border-line bg-surface-raised shadow-lg"
      >
        {showList && suggestions.isPending ? (
          <li role="presentation" className="px-3 py-3 text-sm text-ink-muted">
            Buscando…
          </li>
        ) : null}
        {items.map((product, index) => (
          // Mouse/touch pick on mousedown so the input's blur does not close the list first.
          <li
            key={product.id}
            id={`${listId}-${String(index)}`}
            role="option"
            aria-selected={active === index}
            onMouseDown={(event) => {
              event.preventDefault()
              go(`/market/producto/${product.id}`)
            }}
            className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${active === index ? 'bg-surface' : ''}`}
          >
            <MediaImage media={product.media[0]} className="size-10 shrink-0 rounded-control" />
            <span className="min-w-0 flex-1 truncate">{product.title}</span>
            <span className="font-mono text-sm font-semibold">
              {formatMoney(priceDisplay(product).current)}
            </span>
          </li>
        ))}
        {showList && !suggestions.isPending && items.length === 0 ? (
          <li role="presentation" className="px-3 py-3 text-sm text-ink-muted">
            Sin sugerencias para “{value.trim()}”.
          </li>
        ) : null}
        {showList ? (
          <li
            id={`${listId}-${String(items.length)}`}
            role="option"
            aria-selected={active === items.length}
            onMouseDown={(event) => {
              event.preventDefault()
              submit()
            }}
            className={`cursor-pointer border-t border-line px-3 py-2.5 font-semibold text-accent ${active === items.length ? 'bg-surface' : ''}`}
          >
            Ver todos los resultados para “{value.trim()}”
          </li>
        ) : null}
      </ul>
    </form>
  )
}
