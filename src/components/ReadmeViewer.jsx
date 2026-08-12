import { useMemo, useState, useEffect } from 'react'
import readmeSource from '../../README.md?raw'
import styles from './ReadmeViewer.module.css'

function renderMarkdown(source) {
  if (typeof window !== 'undefined' && window.marked?.parse) {
    return window.marked.parse(source, { breaks: false, gfm: true })
  }
  return `<pre>${source
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')}</pre>`
}

export default function ReadmeViewer() {
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

  const html = useMemo(() => renderMarkdown(readmeSource), [ready])

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <p className={styles.kicker}>Project docs</p>
        <h1 className={styles.title}>README</h1>
        <p className={styles.lead}>
          Описание проекта из файла <code>RL/README.md</code> — структура лент, метрики, пары и сценарии.
        </p>
      </header>
      <article
        className={styles.markdown}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
