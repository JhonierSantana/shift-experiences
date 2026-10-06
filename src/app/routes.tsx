import { Link, Outlet, ScrollRestoration, isRouteErrorResponse, useRouteError } from 'react-router'
import type { RouteObject } from 'react-router'
import { MAIN_CONTENT_ID, useDocumentScope } from '@/engine'

export const ROOT_ROUTE_ID = 'root'

function RootLayout() {
  return (
    <>
      <a
        href={`#${MAIN_CONTENT_ID}`}
        className="sr-only z-(--shift-z-overlay) rounded-control bg-accent px-4 py-2 font-semibold text-accent-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Saltar al contenido
      </a>
      <Outlet />
      <ScrollRestoration />
    </>
  )
}

function StatusPage({ title, detail }: { readonly title: string; readonly detail: string }) {
  useDocumentScope('selector')
  return (
    <main
      id={MAIN_CONTENT_ID}
      tabIndex={-1}
      className="grid min-h-dvh content-center justify-items-start gap-4 px-gutter"
    >
      <h1 className="font-display text-5xl font-bold">{title}</h1>
      <p className="text-ink-muted">{detail}</p>
      <Link to="/" className="font-semibold text-accent underline underline-offset-4">
        Volver a SHIFT
      </Link>
    </main>
  )
}

function RootNotFound() {
  return <StatusPage title="404" detail="Esta ruta no pertenece a ninguna experiencia." />
}

function RootError() {
  const error = useRouteError()
  const detail = isRouteErrorResponse(error)
    ? `${String(error.status)} ${error.statusText}`
    : 'No pudimos cargar esta experiencia. Revisa tu conexión e inténtalo de nuevo.'
  return <StatusPage title="Algo salió mal" detail={detail} />
}

function BootFallback() {
  return <div aria-busy="true" className="min-h-dvh" />
}

/**
 * Static tree: only the selector and a catch-all. Experience subtrees
 * (/fashion, /food, /market) are discovered lazily by the engine.
 */
export const appRoutes: RouteObject[] = [
  {
    id: ROOT_ROUTE_ID,
    Component: RootLayout,
    ErrorBoundary: RootError,
    HydrateFallback: BootFallback,
    children: [
      {
        index: true,
        lazy: {
          Component: async () => (await import('@/features/selector')).SelectorPage,
        },
      },
      { path: '*', Component: RootNotFound },
    ],
  },
]
