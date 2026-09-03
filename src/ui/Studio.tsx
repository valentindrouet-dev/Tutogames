/**
 * Studio de découpe.
 *
 * Sert à produire les rectangles `crop` des tutoriels : on affiche une page
 * de règles ingérée, on trace un rectangle au doigt ou à la souris, et le
 * Studio rend le littéral TypeScript à coller dans src/games/<jeu>.ts.
 *
 * Les coordonnées produites sont normalisées (0 à 1) : elles restent valides
 * si l'on re-ingéré le PDF à une autre résolution.
 */

import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import type { Tutorial } from '../engine/types'
import { pageUrl, useManifest } from '../engine/assets'
import { ArrowLeft, ArrowRight, Check, Close, Home } from './icons'

interface Rect { x: number; y: number; w: number; h: number }

/** Rectangle normalisé construit à partir de deux coins, borne à la page. */
function rectFrom(ax: number, ay: number, bx: number, by: number): Rect {
  const x = Math.min(ax, bx)
  const y = Math.min(ay, by)
  return {
    x: Math.max(0, Math.min(1, x)),
    y: Math.max(0, Math.min(1, y)),
    w: Math.min(1 - x, Math.abs(bx - ax)),
    h: Math.min(1 - y, Math.abs(by - ay)),
  }
}

const r3 = (n: number) => Number(n.toFixed(3))

export function Studio({ tutorials, onExit }: { tutorials: Tutorial[]; onExit: () => void }) {
  const [tutorial, setTutorial] = useState<Tutorial>(tutorials[0])
  const [printed, setPrinted] = useState(1)
  const [rect, setRect] = useState<Rect | null>(null)
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null)
  const [copied, setCopied] = useState(false)

  const manifest = useManifest(tutorial?.source.assetId ?? '')
  const surface = useRef<HTMLDivElement>(null)

  const offset = tutorial?.source.pageOffset ?? 0
  const fileIndex = printed + offset
  const page = manifest ? manifest.pages.find((p) => p.n === fileIndex) : undefined

  useEffect(() => setRect(null), [printed, tutorial])
  useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(id)
  }, [copied])

  /** Position du pointeur en coordonnées normalisées de la page. */
  function pointAt(e: RPointerEvent<HTMLDivElement>) {
    const box = surface.current!.getBoundingClientRect()
    return {
      x: (e.clientX - box.left) / box.width,
      y: (e.clientY - box.top) / box.height,
    }
  }

  const snippet = rect
    ? `crop: { page: ${printed}, x: ${r3(rect.x)}, y: ${r3(rect.y)}, w: ${r3(rect.w)}, h: ${r3(rect.h)} },`
    : `crop: { page: ${printed} },`

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
    } catch {
      // Presse-papiers refusé (contexte non sécurisé) : le texte reste
      // sélectionnable à l'écran, on ne bloque pas l'utilisateur.
    }
  }

  const total = manifest ? manifest.pages.length : 0
  const maxPrinted = total - offset

  return (
    <div className="app">
      <header className="topbar">
        <button type="button" className="btn btn-ghost btn-icon" onClick={onExit} aria-label="Retour à l'accueil">
          <Home aria-hidden />
        </button>
        <div className="topbar-id">
          <span className="topbar-title">Studio de découpe</span>
          <span className="topbar-sub">{tutorial?.source.pdf ?? '—'}</span>
        </div>
        <div className="topbar-spacer" />
        {tutorials.length > 1 && (
          <select
            className="btn btn-ghost"
            value={tutorial.id}
            onChange={(e) => setTutorial(tutorials.find((t) => t.id === e.target.value) ?? tutorials[0])}
          >
            {tutorials.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        )}
      </header>

      {manifest === false ? (
        <div className="stage" style={{ gridTemplateColumns: '1fr' }}>
          <p className="empty">
            Aucune page ingérée pour « {tutorial?.title} ».<br />
            Lancez <code>npm run ingest -- {tutorial?.source.pdf ? `rules/${tutorial.source.pdf}` : '<pdf>'} {tutorial?.source.assetId}</code>,
            puis rechargez cette page.
          </p>
        </div>
      ) : !manifest ? (
        <div className="stage" style={{ gridTemplateColumns: '1fr' }}>
          <p className="empty">Chargement des pages…</p>
        </div>
      ) : (
        <main className="stage studio-stage">
          <div className="studio-canvas">
            {page ? (
              <div
                ref={surface}
                className="studio-page"
                style={{
                  aspectRatio: `${page.w} / ${page.h}`,
                  backgroundImage: `url("${pageUrl(manifest.assetId, page.file)}")`,
                }}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId)
                  const p = pointAt(e)
                  setDrag(p)
                  setRect({ x: p.x, y: p.y, w: 0, h: 0 })
                }}
                onPointerMove={(e) => {
                  if (!drag) return
                  const p = pointAt(e)
                  setRect(rectFrom(drag.x, drag.y, p.x, p.y))
                }}
                onPointerUp={() => setDrag(null)}
                onPointerCancel={() => setDrag(null)}
              >
                {rect && rect.w > 0 && rect.h > 0 && (
                  <div
                    className="studio-rect"
                    style={{
                      left: `${rect.x * 100}%`,
                      top: `${rect.y * 100}%`,
                      width: `${rect.w * 100}%`,
                      height: `${rect.h * 100}%`,
                    }}
                  />
                )}
              </div>
            ) : (
              <p className="empty">
                Page {printed} introuvable dans le PDF (index {fileIndex} sur {total}).<br />
                Vérifiez <code>source.pageOffset</code> dans src/games/{tutorial.id}.ts.
              </p>
            )}
          </div>

          <aside className="stage-visual">
            <div className="widget">
              <div className="widget-title">Page du livret</div>
              <div className="counter">
                <button
                  type="button"
                  className="counter-btn"
                  onClick={() => setPrinted((n) => Math.max(1 - offset, n - 1))}
                  disabled={fileIndex <= 1}
                  aria-label="Page précédente"
                >
                  <ArrowLeft aria-hidden width={26} height={26} />
                </button>
                <div>
                  <div className="counter-val">{printed}</div>
                  <div className="counter-unit">fichier p.{fileIndex} / {total}</div>
                </div>
                <button
                  type="button"
                  className="counter-btn"
                  onClick={() => setPrinted((n) => n + 1)}
                  disabled={printed >= maxPrinted}
                  aria-label="Page suivante"
                >
                  <ArrowRight aria-hidden width={26} height={26} />
                </button>
              </div>
            </div>

            <div className="widget">
              <div className="widget-title">À coller dans src/games/{tutorial.id}.ts</div>
              <code className="studio-snippet">{snippet}</code>
              <div className="meta-row">
                <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={copy}>
                  {copied ? <><Check aria-hidden /> Copie</> : 'Copier'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setRect(null)}
                  disabled={!rect}
                  aria-label="Effacer le rectangle"
                >
                  <Close aria-hidden />
                </button>
              </div>
            </div>

            <p className="studio-help">
              Tracez un rectangle sur la page pour cadrer un élément de matériel.
              Sans rectangle, la découpe référence la page entière.
            </p>
          </aside>
        </main>
      )}
    </div>
  )
}
