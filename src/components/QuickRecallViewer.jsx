import { useMemo, useState, useEffect } from 'react'
import quickRecallSource from '../../public/quick_recall.md?raw'
import styles from './ReadmeViewer.module.css'

function renderMarkdown(source) {
  if (typeof window !== 'undefined' && window.marked?.parse) {
    return window.marked.parse(source, { breaks: true, gfm: true })
  }
  return `<pre>${source
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')}</pre>`
}

export default function QuickRecallViewer() {
  const [ready, setReady] = useState(
    () => typeof window !== 'undefined' && Boolean(window.marked?.parse)
  )

  useEffect(() => {
    if (ready) return
    const id = window.setInterval(() => {
      if (window.marked?.parse) {
        setReady(true)
        window.clearInterval(id)
      }
    }, 50)
    return () => window.clearInterval(id)
  }, [ready])

  const html = useMemo(() => renderMarkdown(quickRecallSource), [ready])

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <p className={styles.kicker}>Quick recall</p>
        <h1 className={styles.title}>Суть и возможности</h1>
        <p className={styles.lead}>
          Краткое напоминание о смысле лент, обмена и направлений развития — из{' '}
          <code>RL/public/quick_recall.md</code>.
        </p>
      </header>
      <article
        className={styles.markdown}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
