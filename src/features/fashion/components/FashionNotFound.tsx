import { Link } from 'react-router'

/** Brand override of the engine's NotFound slot. */
export function FashionNotFound() {
  return (
    <section className="grid min-h-[60dvh] content-center gap-8 px-gutter py-section">
      <p className="text-[0.7rem] tracking-[0.28em] text-ink-muted uppercase">Error 404</p>
      <h1 className="font-display text-6xl italic sm:text-8xl">Pieza fuera de colección</h1>
      <Link
        to="/fashion"
        className="justify-self-start border-b border-current pb-1 text-[0.7rem] tracking-[0.28em] uppercase"
      >
        Volver a la maison
      </Link>
    </section>
  )
}
