import { useEffect, useMemo, useState } from 'react'
import styles from './ExchangeField.module.css'
import ExchangeFieldViewer from './ExchangeFieldViewer'
import {
  PROJECTION_KINDS,
  createEmptyPlayerCard,
  loadPlayerCards,
  savePlayerCards,
  upsertPlayerCard,
  removePlayerCard,
  validatePlayerCard,
  filterPlayerCards,
  groupCardsByTheme,
  toggleSelectedForExchange,
  projectionKindLabel,
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
  const [tab, setTab] = useState('cards')
  const [cards, setCards] = useState(() => loadPlayerCards())
  const [mode, setMode] = useState('list')
  const [selectedId, setSelectedId] = useState(null)
  const [draft, setDraft] = useState(null)
  const [errors, setErrors] = useState({})
  const [themeQuery, setThemeQuery] = useState('')
  const [selfQuery, setSelfQuery] = useState('')
  const [searchMode, setSearchMode] = useState('both')

  useEffect(() => {
    savePlayerCards(cards)
  }, [cards])

  const selected = cards.find((c) => c.id === selectedId) || null

  const filteredCards = useMemo(
    () => filterPlayerCards(cards, { themeQuery, selfQuery, mode: searchMode }),
    [cards, themeQuery, selfQuery, searchMode]
  )

  const grouped = useMemo(() => groupCardsByTheme(filteredCards), [filteredCards])
  const selectedCount = cards.filter((c) => c.selectedForExchange).length

  const openView = (id) => {
    setSelectedId(id)
    setMode('view')
    setErrors({})
  }

  const openCreate = (overrides = {}) => {
    const blank = createEmptyPlayerCard(overrides)
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

  const handleToggleSelect = (id, e) => {
    e?.stopPropagation?.()
    setCards((prev) => toggleSelectedForExchange(prev, id))
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>Exchange field · фазы 1–3</p>
        <h1 className={styles.title}>Поле обмена</h1>
        <p className={styles.lead}>
          Карточки <strong>тема ↔ Я</strong>: несколько проекций на тему, поиск по теме и/или личному.
          Пока локально в этом браузере.
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
            <button type="button" className={styles.button} onClick={() => openCreate()}>
              + Новая карточка
            </button>
            <span className={styles.hint} style={{ margin: 0 }}>
              {filteredCards.length} из {cards.length}
              {selectedCount > 0 ? ` · выбрано для обмена: ${selectedCount}` : ''}
            </span>
          </div>

          <div className={styles.searchPanel}>
            <p className={styles.hint} style={{ marginTop: 0 }}>
              Поиск: тема и/или персональное («Я», общее Я, название проекции). Режим «оба» —
              совпадение по заполненным полям сразу.
            </p>
            <div className={styles.searchRow}>
              <div className={styles.field} style={{ marginBottom: 0, flex: 1, minWidth: 160 }}>
                <label htmlFor="ef-search-theme">Тема</label>
                <input
                  id="ef-search-theme"
                  value={themeQuery}
                  onChange={(e) => setThemeQuery(e.target.value)}
                  placeholder="фрагмент темы"
                  disabled={searchMode === 'self'}
                />
              </div>
              <div className={styles.field} style={{ marginBottom: 0, flex: 1, minWidth: 160 }}>
                <label htmlFor="ef-search-self">Персональное</label>
                <input
                  id="ef-search-self"
                  value={selfQuery}
                  onChange={(e) => setSelfQuery(e.target.value)}
                  placeholder="фрагмент «Я»"
                  disabled={searchMode === 'theme'}
                />
              </div>
            </div>
            <div className={styles.searchModes}>
              {[
                { id: 'both', label: 'Оба' },
                { id: 'theme', label: 'Только тема' },
                { id: 'self', label: 'Только Я' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`${styles.tab} ${searchMode === m.id ? styles.tabActive : ''}`}
                  onClick={() => setSearchMode(m.id)}
                >
                  {m.label}
                </button>
              ))}
              {(themeQuery || selfQuery) && (
                <button
                  type="button"
                  className={styles.buttonGhost}
                  onClick={() => {
                    setThemeQuery('')
                    setSelfQuery('')
                  }}
                >
                  Сбросить
                </button>
              )}
            </div>
          </div>

          <p className={styles.hint}>
            На одну тему можно держать несколько проекций (базовая / в теме / сегодняшняя). Звезда —
            «ближе для обмена» (локальная пометка выбора).
          </p>

          {filteredCards.length === 0 ? (
            <div className={styles.empty}>
              {cards.length === 0
                ? 'Пока нет карточек. Создайте первую — тему и «Я».'
                : 'Ничего не найдено. Смягчите поиск или сбросьте фильтр.'}
            </div>
          ) : (
            <div className={styles.themeGroups}>
              {grouped.map((group) => (
                <section key={group.theme} className={styles.themeGroup}>
                  <div className={styles.themeGroupHeader}>
                    <h2 className={styles.themeGroupTitle}>
                      {group.theme}
                      <span className={styles.themeCount}>{group.items.length}</span>
                    </h2>
                    <button
                      type="button"
                      className={styles.buttonGhost}
                      onClick={() =>
                        openCreate({
                          theme: group.theme,
                          projectionKind: 'today',
                          projectionLabel: 'Ещё одна проекция',
                        })
                      }
                    >
                      + Проекция к теме
                    </button>
                  </div>
                  <div className={styles.list}>
                    {group.items.map((card) => (
                      <div key={card.id} className={styles.cardRow}>
                        <button
                          type="button"
                          className={`${styles.selectToggle} ${
                            card.selectedForExchange ? styles.selectToggleOn : ''
                          }`}
                          title={
                            card.selectedForExchange
                              ? 'Убрать из выбранных для обмена'
                              : 'Отметить как ближе для обмена'
                          }
                          onClick={(e) => handleToggleSelect(card.id, e)}
                        >
                          {card.selectedForExchange ? '★' : '☆'}
                        </button>
                        <button
                          type="button"
                          className={styles.card}
                          onClick={() => openView(card.id)}
                        >
                          <p className={styles.cardLabel}>
                            {projectionKindLabel(card.projectionKind)}
                            {card.projectionLabel ? ` · ${card.projectionLabel}` : ''}
                          </p>
                          <p className={styles.cardSelf}>{snippet(card.self)}</p>
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
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
              <button
                type="button"
                className={styles.buttonGhost}
                onClick={() =>
                  openCreate({
                    theme: selected.theme,
                    projectionKind: 'today',
                    selfBase: selected.selfBase || '',
                  })
                }
              >
                + Проекция к теме
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
            {projectionKindLabel(selected.projectionKind)}
            {selected.projectionLabel ? ` · ${selected.projectionLabel}` : ''}
            {' · '}
            Обновлено: {formatDate(selected.updatedAt)}
            {selected.selectedForExchange ? ' · ★ выбрана для обмена' : ''}
          </p>

          <div className={styles.actions} style={{ marginBottom: '1rem' }}>
            <button
              type="button"
              className={styles.buttonGhost}
              onClick={() => handleToggleSelect(selected.id)}
            >
              {selected.selectedForExchange
                ? '★ Убрать из выбранных для обмена'
                : '☆ Отметить как ближе для обмена'}
            </button>
          </div>

          {selected.projectionLabel ? (
            <div className={styles.viewBlock}>
              <h3>Название проекции</h3>
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

          {cards.filter((c) => c.theme === selected.theme && c.id !== selected.id).length > 0 ? (
            <div className={styles.viewBlock}>
              <h3>Другие проекции этой темы</h3>
              <ul className={styles.relatedList}>
                {cards
                  .filter((c) => c.theme === selected.theme && c.id !== selected.id)
                  .map((c) => (
                    <li key={c.id}>
                      <button type="button" className={styles.linkButton} onClick={() => openView(c.id)}>
                        {projectionKindLabel(c.projectionKind)}
                        {c.projectionLabel ? ` · ${c.projectionLabel}` : ''}
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}
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
            <label htmlFor="ef-kind">Тип проекции</label>
            <select
              id="ef-kind"
              value={draft.projectionKind || 'inTheme'}
              onChange={(e) => updateDraft('projectionKind', e.target.value)}
            >
              {PROJECTION_KINDS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </select>
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
