import { useEffect, useState } from 'react'
import styles from './ExchangeField.module.css'
import ExchangeFieldViewer from './ExchangeFieldViewer'
import {
  createEmptyPlayerCard,
  loadPlayerCards,
  savePlayerCards,
  upsertPlayerCard,
  removePlayerCard,
  validatePlayerCard,
} from '../utils/playerCardStorage'

function formatDate(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return '—'
  }
}

function snippet(text, max = 180) {
  const t = (text || '').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max).trim()}…`
}

export default function ExchangeField() {
  const [tab, setTab] = useState('cards') // 'cards' | 'notes'
  const [cards, setCards] = useState(() => loadPlayerCards())
  const [mode, setMode] = useState('list') // 'list' | 'view' | 'edit'
  const [selectedId, setSelectedId] = useState(null)
  const [draft, setDraft] = useState(null)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    savePlayerCards(cards)
  }, [cards])

  const selected = cards.find((c) => c.id === selectedId) || null

  const openView = (id) => {
    setSelectedId(id)
    setMode('view')
    setErrors({})
  }

  const openCreate = () => {
    const blank = createEmptyPlayerCard()
    setDraft(blank)
    setSelectedId(blank.id)
    setMode('edit')
    setErrors({})
  }

  const openEdit = (card) => {
    setDraft({ ...card })
    setSelectedId(card.id)
    setMode('edit')
    setErrors({})
  }

  const backToList = () => {
    setMode('list')
    setSelectedId(null)
    setDraft(null)
    setErrors({})
  }

  const handleSave = () => {
    if (!draft) return
    const nextErrors = validatePlayerCard(draft)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setCards((prev) => upsertPlayerCard(prev, draft))
    setSelectedId(draft.id)
    setMode('view')
    setDraft(null)
    setErrors({})
  }

  const handleDelete = (id) => {
    const card = cards.find((c) => c.id === id)
    const label = card?.theme || 'эту карточку'
    if (!window.confirm(`Удалить карточку «${label}»?`)) return
    setCards((prev) => removePlayerCard(prev, id))
    backToList()
  }

  const updateDraft = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>Exchange field · фаза 1</p>
        <h1 className={styles.title}>Поле обмена</h1>
        <p className={styles.lead}>
          Карточки игрока: связка <strong>тема ↔ Я</strong>. Пока всё локально (этот браузер).
          Поиск, связи и ленты Object Tape подключим позже — не спеша.
        </p>
      </header>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'cards' ? styles.tabActive : ''}`}
          onClick={() => setTab('cards')}
        >
          Мои карточки
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'notes' ? styles.tabActive : ''}`}
          onClick={() => setTab('notes')}
        >
          TODO / разговор
        </button>
      </div>

      {tab === 'notes' ? (
        <div className={styles.notesBox}>
          <ExchangeFieldViewer embedded />
        </div>
      ) : mode === 'list' ? (
        <>
          <div className={styles.toolbar}>
            <button type="button" className={styles.button} onClick={openCreate}>
              + Новая карточка
            </button>
            <span className={styles.hint} style={{ margin: 0 }}>
              {cards.length} {cards.length === 1 ? 'карточка' : 'карточек'}
            </span>
          </div>
          <p className={styles.hint}>
            Тема — вход для встречи. «Я» — честный образ (в теме или общий силуэт). Видео ~10 мин —
            по желанию. Можно несколько проекций на одну тему.
          </p>

          {cards.length === 0 ? (
            <div className={styles.empty}>Пока нет карточек. Создайте первую — тему и «Я».</div>
          ) : (
            <div className={styles.list}>
              {cards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  className={styles.card}
                  onClick={() => openView(card.id)}
                >
                  <p className={styles.cardTheme}>{card.theme || 'Без темы'}</p>
                  {card.projectionLabel ? (
                    <p className={styles.cardLabel}>{card.projectionLabel}</p>
                  ) : null}
                  <p className={styles.cardSelf}>{snippet(card.self)}</p>
                </button>
              ))}
            </div>
          )}
        </>
      ) : mode === 'view' && selected ? (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>{selected.theme}</h2>
            <div className={styles.actions}>
              <button type="button" className={styles.buttonGhost} onClick={backToList}>
                ← К списку
              </button>
              <button type="button" className={styles.button} onClick={() => openEdit(selected)}>
                Редактировать
              </button>
              <button
                type="button"
                className={styles.buttonDanger}
                onClick={() => handleDelete(selected.id)}
              >
                Удалить
              </button>
            </div>
          </div>
          <p className={styles.meta}>
            Обновлено: {formatDate(selected.updatedAt)}
            {selected.projectionLabel ? ` · ${selected.projectionLabel}` : ''}
          </p>

          {selected.projectionLabel ? (
            <div className={styles.viewBlock}>
              <h3>Проекция</h3>
              <p>{selected.projectionLabel}</p>
            </div>
          ) : null}

          {selected.selfBase ? (
            <div className={styles.viewBlock}>
              <h3>Я (общее, по желанию)</h3>
              <p>{selected.selfBase}</p>
            </div>
          ) : null}

          <div className={styles.viewBlock}>
            <h3>Я в теме / презентация</h3>
            <p>{selected.self}</p>
          </div>

          <div className={styles.viewBlock}>
            <h3>Видео о себе (~10 мин)</h3>
            {selected.selfVideoUrl ? (
              <p>
                <a href={selected.selfVideoUrl} target="_blank" rel="noopener noreferrer">
                  {selected.selfVideoUrl}
                </a>
              </p>
            ) : (
              <p>Не указано</p>
            )}
          </div>
        </div>
      ) : mode === 'edit' && draft ? (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              {cards.some((c) => c.id === draft.id) ? 'Редактирование' : 'Новая карточка'}
            </h2>
            <button type="button" className={styles.buttonGhost} onClick={backToList}>
              Отмена
            </button>
          </div>

          <div className={styles.field}>
            <label htmlFor="ef-theme">Тема</label>
            <input
              id="ef-theme"
              value={draft.theme}
              onChange={(e) => updateDraft('theme', e.target.value)}
              placeholder="Например: электромагнитные волны"
            />
            {errors.theme ? <p className={styles.error}>{errors.theme}</p> : null}
          </div>

          <div className={styles.field}>
            <label htmlFor="ef-label">
              Название проекции <span className={styles.optional}>(необязательно)</span>
            </label>
            <input
              id="ef-label"
              value={draft.projectionLabel}
              onChange={(e) => updateDraft('projectionLabel', e.target.value)}
              placeholder="Я сегодня в этой теме"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="ef-self-base">
              Я — общее <span className={styles.optional}>(необязательно)</span>
            </label>
            <textarea
              id="ef-self-base"
              value={draft.selfBase}
              onChange={(e) => updateDraft('selfBase', e.target.value)}
              placeholder="Честный общий силуэт: какой ты есть, без привязки только к одной теме"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="ef-self">Я в теме / презентация</label>
            <textarea
              id="ef-self"
              value={draft.self}
              onChange={(e) => updateDraft('self', e.target.value)}
              placeholder="Как ты живёшь эту тему сейчас: состояние, взгляд, что хочешь обменять"
            />
            {errors.self ? <p className={styles.error}>{errors.self}</p> : null}
          </div>

          <div className={styles.field}>
            <label htmlFor="ef-video">
              Ссылка на видео (~10 мин) <span className={styles.optional}>(необязательно)</span>
            </label>
            <input
              id="ef-video"
              value={draft.selfVideoUrl}
              onChange={(e) => updateDraft('selfVideoUrl', e.target.value)}
              placeholder="https://…"
            />
            {errors.selfVideoUrl ? <p className={styles.error}>{errors.selfVideoUrl}</p> : null}
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.button} onClick={handleSave}>
              Сохранить
            </button>
            <button type="button" className={styles.buttonGhost} onClick={backToList}>
              Отмена
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.empty}>Карточка не найдена.</div>
      )}
    </div>
  )
}
