import { useEffect, useMemo, useState } from 'react'
import styles from './TranslationReflection.module.css'
import {
  loadWorkspace,
  saveWorkspace,
  getSeedWorkspace,
  upsertObject,
  removeObject,
  upsertTranslation,
  removeTranslation,
  createEmptyObject,
  createEmptyTranslation,
  objectPower,
  incomingTranslations,
  outgoingTranslations,
  findObject,
  kindLabel,
} from '../utils/translationReflectionStorage'

function formatPower(n) {
  return (Math.round(n * 100) / 100).toFixed(2)
}

export default function TranslationReflection() {
  const [workspace, setWorkspace] = useState(() => loadWorkspace())
  const [selectedId, setSelectedId] = useState(null)
  const [draftObject, setDraftObject] = useState(null)
  const [draftTranslation, setDraftTranslation] = useState(null)
  const [flash, setFlash] = useState('')
  const [focusMode, setFocusMode] = useState(false)

  useEffect(() => {
    saveWorkspace(workspace)
  }, [workspace])

  useEffect(() => {
    if (!selectedId && workspace.objects[0]) {
      setSelectedId(workspace.objects[0].id)
    }
  }, [workspace.objects, selectedId])

  const selected = findObject(workspace, selectedId)
  const sortedObjects = useMemo(() => {
    return [...workspace.objects].sort(
      (a, b) => objectPower(workspace, b.id) - objectPower(workspace, a.id)
    )
  }, [workspace])

  const visibleObjects = useMemo(() => {
    if (!focusMode || !selectedId) return sortedObjects
    const related = new Set([selectedId])
    workspace.translations.forEach((t) => {
      if (t.fromId === selectedId) related.add(t.toId)
      if (t.toId === selectedId) related.add(t.fromId)
    })
    return sortedObjects.filter((o) => related.has(o.id))
  }, [sortedObjects, focusMode, selectedId, workspace.translations])

  const showFlash = (msg) => {
    setFlash(msg)
    window.setTimeout(() => setFlash(''), 2800)
  }

  const updateText = (value) => {
    setWorkspace((prev) => ({ ...prev, reflectionText: value }))
  }

  const handleReseed = async () => {
    if (
      !window.confirm(
        'Загрузить сид из примера (example.md)? Текущие карточки и трансляции будут заменены. Текст размышления тоже обновится.'
      )
    ) {
      return
    }
    let text = ''
    try {
      const res = await fetch('/example.md', { cache: 'no-cache' })
      if (res.ok) text = await res.text()
    } catch {
      /* use built-in short seed text */
    }
    const next = getSeedWorkspace(text || undefined)
    setWorkspace(next)
    setSelectedId(next.objects[0]?.id || null)
    setDraftObject(null)
    setDraftTranslation(null)
    showFlash('Сид загружен: объекты и трансляции из примера.')
  }

  const startNewObject = () => {
    setDraftObject(createEmptyObject({ name: '' }))
    setDraftTranslation(null)
  }

  const startEditObject = (obj) => {
    setDraftObject({ ...obj })
    setDraftTranslation(null)
  }

  const saveObjectDraft = () => {
    if (!draftObject) return
    if (!(draftObject.name || '').trim()) {
      showFlash('Укажите имя карточки.')
      return
    }
    setWorkspace((prev) => upsertObject(prev, draftObject))
    setSelectedId(draftObject.id)
    setDraftObject(null)
    showFlash('Карточка сохранена.')
  }

  const deleteObject = (id) => {
    const obj = findObject(workspace, id)
    if (!obj) return
    if (!window.confirm(`Удалить «${obj.name}» и все её трансляции?`)) return
    setWorkspace((prev) => removeObject(prev, id))
    if (selectedId === id) setSelectedId(null)
    setDraftObject(null)
  }

  const startNewTranslation = () => {
    if (!selected) {
      showFlash('Сначала выберите карточку-источник.')
      return
    }
    setDraftTranslation(
      createEmptyTranslation({
        fromId: selected.id,
        toId: workspace.objects.find((o) => o.id !== selected.id)?.id || '',
        kind: 'constant',
        importance: 0.6,
      })
    )
    setDraftObject(null)
  }

  const saveTranslationDraft = () => {
    if (!draftTranslation) return
    if (!draftTranslation.fromId || !draftTranslation.toId) {
      showFlash('Нужны обе стороны трансляции.')
      return
    }
    if (draftTranslation.fromId === draftTranslation.toId) {
      showFlash('Трансляция к самой себе пока не нужна.')
      return
    }
    setWorkspace((prev) => upsertTranslation(prev, draftTranslation))
    setDraftTranslation(null)
    showFlash('Трансляция сохранена.')
  }

  const nameOf = (id) => findObject(workspace, id)?.name || '—'

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>Reflection · подготовка плоскости</p>
        <h1 className={styles.title}>Размышление → трансляции</h1>
        <p className={styles.lead}>
          Среда для перевода мысли в карточки объектов и направленные связи{' '}
          <strong>A → B</strong>. Это не поле обмена людей, а подготовительный слой
          тематической плоскости: что сохраняется, что меняется, что проявляется ярко.
          Почва для упражнений — вкладка <strong>Seeds</strong> (сборник сидов).
        </p>
      </header>

      {flash ? <p className={styles.flash}>{flash}</p> : null}

      <div className={styles.toolbar}>
        <button type="button" className={styles.button} onClick={handleReseed}>
          Засеять из example.md
        </button>
        <button type="button" className={styles.buttonGhost} onClick={startNewObject}>
          + Карточка
        </button>
        <button type="button" className={styles.buttonGhost} onClick={startNewTranslation}>
          + Трансляция
        </button>
        <button
          type="button"
          className={`${styles.buttonGhost} ${focusMode ? styles.toggleOn : ''}`}
          onClick={() => setFocusMode((v) => !v)}
          disabled={!selected}
        >
          {focusMode ? 'Показать все' : 'Только связи выбранной'}
        </button>
        <span className={styles.meta}>
          {workspace.objects.length} объектов · {workspace.translations.length} трансляций
        </span>
      </div>

      <div className={styles.layout}>
        <section className={styles.column}>
          <h2 className={styles.sectionTitle}>Текст размышления</h2>
          <p className={styles.hint}>
            Пишите свободно. Справа — уже выделенные объекты и стрелки. Сид можно
            подтянуть из <code>public/example.md</code>.
          </p>
          <textarea
            className={styles.reflection}
            value={workspace.reflectionText}
            onChange={(e) => updateText(e.target.value)}
            placeholder="Здесь живёт сырое размышление…"
            rows={18}
          />
        </section>

        <section className={styles.column}>
          <h2 className={styles.sectionTitle}>Объекты (мощность = сумма исходящих)</h2>
          <p className={styles.hint}>
            Мощность карточки — сумма важностей трансляций, которые из неё исходят.
          </p>

          {draftObject ? (
            <div className={styles.editor}>
              <h3 className={styles.editorTitle}>
                {workspace.objects.some((o) => o.id === draftObject.id)
                  ? 'Редактирование карточки'
                  : 'Новая карточка'}
              </h3>
              <label className={styles.label}>
                Имя
                <input
                  value={draftObject.name}
                  onChange={(e) => setDraftObject({ ...draftObject, name: e.target.value })}
                />
              </label>
              <label className={styles.label}>
                Описание
                <textarea
                  value={draftObject.description}
                  onChange={(e) =>
                    setDraftObject({ ...draftObject, description: e.target.value })
                  }
                  rows={3}
                />
              </label>
              <div className={styles.row}>
                <button type="button" className={styles.button} onClick={saveObjectDraft}>
                  Сохранить
                </button>
                <button
                  type="button"
                  className={styles.buttonGhost}
                  onClick={() => setDraftObject(null)}
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : null}

          {draftTranslation ? (
            <div className={styles.editor}>
              <h3 className={styles.editorTitle}>Трансляция →</h3>
              <label className={styles.label}>
                От
                <select
                  value={draftTranslation.fromId}
                  onChange={(e) =>
                    setDraftTranslation({ ...draftTranslation, fromId: e.target.value })
                  }
                >
                  <option value="">—</option>
                  {workspace.objects.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.label}>
                К
                <select
                  value={draftTranslation.toId}
                  onChange={(e) =>
                    setDraftTranslation({ ...draftTranslation, toId: e.target.value })
                  }
                >
                  <option value="">—</option>
                  {workspace.objects.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.label}>
                Тип
                <select
                  value={draftTranslation.kind}
                  onChange={(e) =>
                    setDraftTranslation({ ...draftTranslation, kind: e.target.value })
                  }
                >
                  <option value="constant">Константа / суть</option>
                  <option value="change">Перемена</option>
                  <option value="manifest">Яркое проявление</option>
                  <option value="other">Другое</option>
                </select>
              </label>
              <label className={styles.label}>
                Важность ({draftTranslation.importance})
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={draftTranslation.importance}
                  onChange={(e) =>
                    setDraftTranslation({
                      ...draftTranslation,
                      importance: Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className={styles.label}>
                Заметка
                <textarea
                  value={draftTranslation.note}
                  onChange={(e) =>
                    setDraftTranslation({ ...draftTranslation, note: e.target.value })
                  }
                  rows={2}
                  placeholder="груз → постоянная масса"
                />
              </label>
              <div className={styles.row}>
                <button type="button" className={styles.button} onClick={saveTranslationDraft}>
                  Сохранить
                </button>
                <button
                  type="button"
                  className={styles.buttonGhost}
                  onClick={() => setDraftTranslation(null)}
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : null}

          <div className={styles.objectList}>
            {visibleObjects.length === 0 ? (
              <div className={styles.empty}>Пока нет карточек. Засейте пример или создайте первую.</div>
            ) : (
              visibleObjects.map((obj) => {
                const power = objectPower(workspace, obj.id)
                const active = obj.id === selectedId
                return (
                  <button
                    key={obj.id}
                    type="button"
                    className={`${styles.objectCard} ${active ? styles.objectCardActive : ''}`}
                    onClick={() => setSelectedId(obj.id)}
                  >
                    <span className={styles.objectName}>{obj.name}</span>
                    <span className={styles.power}>P {formatPower(power)}</span>
                    {obj.description ? (
                      <span className={styles.objectDesc}>{obj.description}</span>
                    ) : null}
                  </button>
                )
              })
            )}
          </div>
        </section>
      </div>

      {selected ? (
        <section className={styles.detail}>
          <div className={styles.detailHeader}>
            <div>
              <h2 className={styles.sectionTitle}>{selected.name}</h2>
              <p className={styles.meta}>
                Мощность исходящих: {formatPower(objectPower(workspace, selected.id))}
              </p>
            </div>
            <div className={styles.row}>
              <button
                type="button"
                className={styles.buttonGhost}
                onClick={() => startEditObject(selected)}
              >
                Править
              </button>
              <button
                type="button"
                className={styles.buttonGhost}
                onClick={startNewTranslation}
              >
                + Исходящая →
              </button>
              <button
                type="button"
                className={styles.buttonDanger}
                onClick={() => deleteObject(selected.id)}
              >
                Удалить
              </button>
            </div>
          </div>

          {selected.description ? (
            <p className={styles.detailDesc}>{selected.description}</p>
          ) : null}

          <div className={styles.linksGrid}>
            <div>
              <h3 className={styles.subTitle}>Исходящие →</h3>
              {outgoingTranslations(workspace, selected.id).length === 0 ? (
                <p className={styles.hint}>Нет исходящих трансляций.</p>
              ) : (
                <ul className={styles.linkList}>
                  {outgoingTranslations(workspace, selected.id).map((t) => (
                    <li key={t.id} className={styles.linkItem}>
                      <div>
                        <strong>{selected.name}</strong> → <strong>{nameOf(t.toId)}</strong>
                        <span className={styles.kind}>{kindLabel(t.kind)}</span>
                        <span className={styles.imp}>{formatPower(t.importance)}</span>
                        {t.note ? <p className={styles.note}>{t.note}</p> : null}
                      </div>
                      <div className={styles.row}>
                        <button
                          type="button"
                          className={styles.buttonGhost}
                          onClick={() => setDraftTranslation({ ...t })}
                        >
                          Править
                        </button>
                        <button
                          type="button"
                          className={styles.buttonDanger}
                          onClick={() =>
                            setWorkspace((prev) => removeTranslation(prev, t.id))
                          }
                        >
                          Удалить
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className={styles.subTitle}>← Входящие</h3>
              {incomingTranslations(workspace, selected.id).length === 0 ? (
                <p className={styles.hint}>Нет входящих трансляций.</p>
              ) : (
                <ul className={styles.linkList}>
                  {incomingTranslations(workspace, selected.id).map((t) => (
                    <li key={t.id} className={styles.linkItem}>
                      <div>
                        <strong>{nameOf(t.fromId)}</strong> → <strong>{selected.name}</strong>
                        <span className={styles.kind}>{kindLabel(t.kind)}</span>
                        <span className={styles.imp}>{formatPower(t.importance)}</span>
                        {t.note ? <p className={styles.note}>{t.note}</p> : null}
                      </div>
                      <button
                        type="button"
                        className={styles.buttonGhost}
                        onClick={() => setSelectedId(t.fromId)}
                      >
                        К источнику
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
