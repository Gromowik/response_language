import { useEffect, useMemo, useState } from 'react'
import styles from './ReadmeViewer.module.css'

const TODO_URL = '/work/TODO.md'

function renderMarkdown(source) {
  if (typeof window !== 'undefined' && window.marked?.parse) {
    return window.marked.parse(source, { breaks: false, gfm: true })
  }
  return `<pre>${source
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')}</pre>`
}

export default function WorkTodoViewer() {
  const [source, setSource] = useState('')
  const [error, setError] = useState(null)
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

  useEffect(() => {
    let cancelled = false
    fetch(TODO_URL, { cache: 'no-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`Не удалось загрузить ${TODO_URL}`)
        return res.text()
      })
      .then((text) => {
        if (!cancelled) {
          setSource(text)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Ошибка')
          setSource('')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const html = useMemo(() => renderMarkdown(source || ''), [source, ready])

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <p className={styles.kicker}>Рабочий отпечаток · процесс</p>
        <h1 className={styles.title}>TODO</h1>
        <p className={styles.lead}>
          Живой след работы из <code>public/work/TODO.md</code> — слои, решения, что дальше.
        </p>
      </header>
      {error ? (
        <p className={styles.lead}>{error}</p>
      ) : !source ? (
        <p className={styles.lead}>Загрузка…</p>
      ) : (
        <article
          className={styles.markdown}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  )
}
