import type { FashionProduct } from '@/core/domain'
import { sizeGuideFor } from '../domain/sizeGuide'
import { CloseIcon } from './Icons'
import { Modal } from './Modal'
import { eyebrow } from './styles'

interface SizeGuideDialogProps {
  readonly product: FashionProduct
  readonly open: boolean
  readonly onClose: () => void
}

export function SizeGuideDialog({ product, open, onClose }: SizeGuideDialogProps) {
  const guide = sizeGuideFor(product)
  return (
    <Modal open={open} onClose={onClose} label="Guía de tallas" placement="center">
      <div className="grid gap-6 p-gutter">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={`${eyebrow} text-ink-muted`}>Guía de tallas</p>
            <h2 className="font-display text-4xl">{guide?.title ?? 'Talla única'}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar guía de tallas"
            className="grid size-11 place-items-center"
          >
            <CloseIcon />
          </button>
        </div>
        {guide ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">Medidas por talla para {product.title}</caption>
                <thead>
                  <tr className={`${eyebrow} border-b border-ink`}>
                    <th scope="col" className="py-3 pr-4 font-normal">
                      Talla
                    </th>
                    {guide.columns.map((column) => (
                      <th key={column} scope="col" className="py-3 pr-4 font-normal">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {guide.rows.map((row) => (
                    <tr key={row.size} className="border-b border-line">
                      <th scope="row" className="py-3 pr-4 font-display text-xl font-normal">
                        {row.size}
                      </th>
                      {row.values.map((value, i) => (
                        <td key={guide.columns[i]} className="py-3 pr-4 tabular-nums">
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-ink-muted">{guide.tip}</p>
          </>
        ) : (
          <p className="text-ink-muted">
            Esta pieza es de talla única y se adapta a la mayoría de medidas.
          </p>
        )}
      </div>
    </Modal>
  )
}
