import { useState, useEffect } from 'react'
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

export default function ExchangeFieldViewer() {
  const [html, setHtml] = useState('<p>Загрузка…</p>')
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const waitForMarked = () =>
          new Promise((resolve) => {
            if (window.marked?.parse) {
              resolve()
              return
            }
            const id = window.setInterval(() => {
              if (window.marked?.parse) {
                window.clearInterval(id)
                resolve()
              }
            }, 50)
          })

        const [response] = await Promise.all([
          fetch('/exchange_field.md', { cache: 'no-cache' }),
          waitForMarked(),
        ])

        if (!response.ok) {
          throw new Error(`Не удалось загрузить exchange_field.md (${response.status})`)
        }

        const source = await response.text()
        if (!cancelled) {
          setHtml(renderMarkdown(source))
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Ошибка загрузки')
          setHtml('')
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <p className={styles.kicker}>Exchange field</p>
        <h1 className={styles.title}>Поле обмена — TODO и разговор</h1>
        <p className={styles.lead}>
          План площадки встречи людей для обмена и конспект смысла —{' '}
          <code>RL/public/exchange_field.md</code>. Сюда же дописываем идеи по ходу.
        </p>
      </header>
      {error ? (
        <p className={styles.lead}>{error}</p>
      ) : (
        <article
          className={styles.markdown}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  )
}
