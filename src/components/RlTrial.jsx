import { useEffect, useMemo, useState } from 'react'
import styles from './RlTrial.module.css'
import {
  addMessage,
  emptyTapeItem,
  loadTrialState,
  saveTrialState,
  sortTape,
} from '../utils/rlTrialStorage'

const OBJECTS_URL = '/work/lever_rl_trial_objects.json'
const TALK_URL = '/work/what_could_be_new.md'

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString()
  } catch {
    return ''
  }
}

function renderMarkdown(source) {
  if (typeof window !== 'undefined' && window.marked?.parse) {
    return window.marked.parse(source, { breaks: true, gfm: true })
  }
  return `<pre>${source
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')}</pre>`
}

function TapeEditor({ title, hint, items, onChange, allowAdd }) {
  const sorted = sortTape(items)

  const update = (id, patch) => {
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  }

  const remove = (id) => {
    onChange(items.filter((it) => it.id !== id))
  }

  const add = () => {
    const nextOrder =
      items.reduce((m, it) => Math.max(m, Number(it.order) || 0), 0) + 1
    onChange([...items, emptyTapeItem({ order: nextOrder, source: 'user' })])
  }

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>{title}</h2>
      {hint ? <p className={styles.hint}>{hint}</p> : null}
      {sorted.length === 0 ? (
        <p className={styles.hint}>Лента пуста.</p>
      ) : (
        <table className={styles.tapeTable}>
          <thead>
            <tr>
              <th>order</th>
              <th>IN</th>
              <th>Имя</th>
              <th>Текст</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((it) => (
              <tr key={it.id}>
                <td>
                  <input
                    className={styles.numInput}
                    type="number"
                    min={0}
                    value={it.order ?? 0}
                    onChange={(e) => update(it.id, { order: Number(e.target.value) })}
                  />
                </td>
                <td>
                  <input
                    className={styles.numInput}
                    type="number"
                    min={0}
                    max={10}
                    value={it.in ?? 0}
                    onChange={(e) => update(it.id, { in: Number(e.target.value) })}
                  />
                </td>
                <td>
                  <input
                    className={styles.input}
                    value={it.name || ''}
                    onChange={(e) => update(it.id, { name: e.target.value })}
                  />
                </td>
                <td>
                  <textarea
                    className={styles.textarea}
                    style={{ minHeight: '2.4rem' }}
                    value={it.text || ''}
                    onChange={(e) => update(it.id, { text: e.target.value })}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className={styles.buttonDanger}
                    onClick={() => remove(it.id)}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {allowAdd ? (
        <div className={styles.row} style={{ marginTop: '0.65rem' }}>
          <button type="button" className={styles.buttonGhost} onClick={add}>
            + Добавить на ленту
          </button>
        </div>
      ) : null}
    </section>
  )
}

export default function RlTrial({ onNavigate }) {
  const [tab, setTab] = useState('objects') // objects | exchange | myTapes | help | talk
  const [pack, setPack] = useState(null)
  const [error, setError] = useState(null)
  const [state, setState] = useState(() => loadTrialState())
  const [draftMsg, setDraftMsg] = useState('')
  const [talkHtml, setTalkHtml] = useState('')
  const [talkError, setTalkError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetch(OBJECTS_URL, { cache: 'no-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`Не удалось загрузить ${OBJECTS_URL}`)
        return res.json()
      })
      .then((data) => {
        if (!cancelled) {
          setPack(data)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Ошибка загрузки')
          setPack(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    saveTrialState(state)
  }, [state])

  useEffect(() => {
    if (tab !== 'talk') return
    let cancelled = false
    const load = async () => {
      try {
        await new Promise((resolve) => {
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
        const res = await fetch(TALK_URL, { cache: 'no-cache' })
        if (!res.ok) throw new Error(`Не удалось загрузить ${TALK_URL}`)
        const text = await res.text()
        if (!cancelled) {
          setTalkHtml(renderMarkdown(text))
          setTalkError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setTalkError(err.message || 'Ошибка загрузки')
          setTalkHtml('')
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [tab])

  const objects = pack?.objects || []
  const active = useMemo(
    () => objects.find((o) => o.id === state.activeObjectId) || null,
    [objects, state.activeObjectId]
  )

  const startOn = (objectId) => {
    const obj = objects.find((o) => o.id === objectId)
    if (!obj) return
    const opening = {
      role: 'cursor',
      text: `Старт обмена на «${obj.title}». Я предлагаю узлы с order и IN как данность/работу. Отметьте совпадения, добавьте на ленту сессии то, что откликнулось; свои две ленты можете генерировать отдельно. Ваши отражения добавите позже.`,
    }
    setState((prev) => {
      let next = {
        ...prev,
        activeObjectId: objectId,
        sessionStarted: true,
      }
      next = addMessage(next, opening)
      return next
    })
    setTab('exchange')
  }

  const sendYou = () => {
    const text = draftMsg.trim()
    if (!text) return
    setState((prev) => addMessage(prev, { role: 'you', text }))
    setDraftMsg('')
    // Лёгкий авто-ответ Cursor (не подстройка — напоминание протокола)
    window.setTimeout(() => {
      setState((prev) =>
        addMessage(prev, {
          role: 'cursor',
          text: 'Принял. Можете взять узел объекта на ленту сессии (order / IN) или записать своё на лентах A/B. Я не подтверждаю неверное ради U — отметьте, где совпало с лучшим, что открывается.',
        })
      )
    }, 400)
  }

  const addNodeToSession = (node) => {
    setState((prev) => {
      const exists = prev.sessionTape.some((it) => it.fromNodeId === node.id)
      if (exists) return prev
      const item = emptyTapeItem({
        name: node.name,
        text: node.text,
        order: node.order,
        in: node.in,
        source: 'object',
        fromNodeId: node.id,
      })
      return { ...prev, sessionTape: [...prev.sessionTape, item] }
    })
  }

  const resetSession = () => {
    if (!window.confirm('Сбросить сообщения и ленту сессии? Ваши ленты A/B сохранятся.')) return
    setState((prev) => ({
      ...prev,
      activeObjectId: null,
      sessionStarted: false,
      messages: [],
      sessionTape: [],
    }))
  }

  return (
    <div className={styles.page}>
      <header>
        <p className={styles.kicker}>RL Trial · рычаг</p>
        <h1 className={styles.title}>Пробный процесс: два объекта → обмен → лента</h1>
        <p className={styles.lead}>
          Отдельная страница: два отпечатка от Cursor по Visual Model (данность / работа). Запуск
          общения на первом или втором; лента сессии с order и IN; ваши две ленты — и отражение, и
          собственная генерация. Существующие страницы не трогаем.
        </p>
        <nav className={styles.topLinks}>
          {onNavigate ? (
            <>
              <button
                type="button"
                className={styles.topLink}
                onClick={() => onNavigate('visualModel')}
              >
                ← Visual Model
              </button>
              <button
                type="button"
                className={styles.topLink}
                onClick={() => onNavigate('ringDemo')}
              >
                → Ring Demo
              </button>
              <button
                type="button"
                className={styles.topLink}
                onClick={() => onNavigate('exchangeField')}
              >
                → Exchange Field
              </button>
            </>
          ) : null}
        </nav>
      </header>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'objects' ? styles.tabActive : ''}`}
          onClick={() => setTab('objects')}
        >
          Два объекта
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'exchange' ? styles.tabActive : ''}`}
          onClick={() => setTab('exchange')}
        >
          Обмен
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'myTapes' ? styles.tabActive : ''}`}
          onClick={() => setTab('myTapes')}
        >
          Мои ленты A / B
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'help' ? styles.tabActive : ''}`}
          onClick={() => setTab('help')}
        >
          Справка
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'talk' ? styles.tabActive : ''}`}
          onClick={() => setTab('talk')}
        >
          Теория (what_could_be_new)
        </button>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      {tab === 'help' ? (
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Как устроен пробник</h2>
          <p className={styles.hint}>
            Данные объектов: <code>{OBJECTS_URL}</code>. Состояние сессии и ваших лент —
            localStorage (<code>rl_lever_trial_v1</code>).
          </p>
          <ul className={styles.hint} style={{ paddingLeft: '1.2rem' }}>
            <li>
              <strong>Объект 1</strong> — данность (вход), следствие Visual Model.
            </li>
            <li>
              <strong>Объект 2</strong> — работа (выход), акценты и трансляции после прохода.
            </li>
            <li>
              Кнопка запуска — старт обмена на выбранном объекте (ведущий = вы; Cursor —
              участник с узлами, без подстройки ради U).
            </li>
            <li>
              <strong>Лента сессии</strong> — одна общая на этот проход: order + IN; можно взять
              узел с объекта или добавить своё.
            </li>
            <li>
              <strong>Ленты A и B</strong> — ваши: генерируете сами (не только отражение в чате).
            </li>
            <li>Ваши развёрнутые отражения на объекты Cursor — позже, когда дадите текст.</li>
          </ul>
          <p className={styles.hint} style={{ marginTop: '0.75rem' }}>
            Сильная теория для развития (два отпечатка, ведущий/ведомый, U, HF, ВО/ОВ) — вкладка
            «Теория» или файл <code>{TALK_URL}</code>.
          </p>
        </section>
      ) : null}

      {tab === 'talk' ? (
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Беседа · магнит понимания</h2>
          <p className={styles.hint}>
            Живой текст развития слоёв. Файл: <code>{TALK_URL}</code>
          </p>
          {talkError ? <p className={styles.error}>{talkError}</p> : null}
          <article
            className={styles.markdown}
            dangerouslySetInnerHTML={{ __html: talkHtml }}
          />
        </section>
      ) : null}

      {tab === 'objects' ? (
        <>
          <p className={styles.hint}>
            Выберите, на каком отпечатке стартовать общение. Активный объект подсвечивается.
          </p>
          <div className={styles.grid2}>
            {objects.map((obj) => (
              <article
                key={obj.id}
                className={`${styles.card} ${
                  state.activeObjectId === obj.id ? styles.cardActive : ''
                }`}
              >
                <span className={styles.badge}>{obj.label}</span>
                <h2 className={styles.cardTitle}>{obj.title}</h2>
                <p className={styles.hint}>{obj.description}</p>
                <ul className={styles.nodeList}>
                  {sortTape(obj.nodes).map((n) => (
                    <li key={n.id} className={styles.nodeItem}>
                      <strong>{n.name}</strong>
                      <div>{n.text}</div>
                      <div className={styles.nodeMeta}>
                        <span>order {n.order}</span>
                        <span>IN {n.in}</span>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className={styles.row} style={{ marginTop: '0.75rem' }}>
                  <button type="button" className={styles.button} onClick={() => startOn(obj.id)}>
                    Запустить общение на этом объекте
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : null}

      {tab === 'exchange' ? (
        <>
          {!state.sessionStarted || !active ? (
            <p className={styles.hint}>
              Сначала на вкладке «Два объекта» нажмите «Запустить общение…».
            </p>
          ) : (
            <>
              <section className={styles.panel}>
                <h2 className={styles.panelTitle}>Активный объект: {active.title}</h2>
                <p className={styles.hint}>{active.label}</p>
                <div className={styles.row}>
                  <button
                    type="button"
                    className={styles.buttonGhost}
                    onClick={() => startOn('obj-given')}
                  >
                    Переключить на объект 1
                  </button>
                  <button
                    type="button"
                    className={styles.buttonGhost}
                    onClick={() => startOn('obj-work')}
                  >
                    Переключить на объект 2
                  </button>
                  <button type="button" className={styles.buttonDanger} onClick={resetSession}>
                    Сбросить сессию
                  </button>
                </div>
              </section>

              <div className={styles.grid2}>
                <section className={styles.panel}>
                  <h2 className={styles.panelTitle}>Узлы объекта → на ленту сессии</h2>
                  <p className={styles.hint}>Клик «на ленту» копирует order и IN.</p>
                  <ul className={styles.nodeList}>
                    {sortTape(active.nodes).map((n) => (
                      <li key={n.id} className={styles.nodeItem}>
                        <strong>{n.name}</strong>
                        <div>{n.text}</div>
                        <div className={styles.nodeMeta}>
                          <span>order {n.order}</span>
                          <span>IN {n.in}</span>
                          <button
                            type="button"
                            className={styles.buttonGhost}
                            onClick={() => addNodeToSession(n)}
                          >
                            → на ленту
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className={styles.panel}>
                  <h2 className={styles.panelTitle}>Общение</h2>
                  <div className={styles.chat}>
                    {(state.messages || []).map((m) => (
                      <div
                        key={m.id}
                        className={`${styles.bubble} ${
                          m.role === 'you' ? styles.bubbleYou : styles.bubbleCursor
                        }`}
                      >
                        <span className={styles.bubbleMeta}>
                          {m.role === 'you' ? 'Вы' : 'Cursor'} · {formatTime(m.at)}
                        </span>
                        {m.text}
                      </div>
                    ))}
                  </div>
                  <div className={styles.compose}>
                    <textarea
                      className={styles.textarea}
                      value={draftMsg}
                      placeholder="Ваше сообщение в обмене…"
                      onChange={(e) => setDraftMsg(e.target.value)}
                    />
                    <button type="button" className={styles.button} onClick={sendYou}>
                      Отправить
                    </button>
                  </div>
                </section>
              </div>

              <TapeEditor
                title="Лента сессии (одна, общая)"
                hint="Порядок прохода и важность IN на этом примере. Можно править и добавлять своё."
                items={state.sessionTape}
                onChange={(sessionTape) => setState((prev) => ({ ...prev, sessionTape }))}
                allowAdd
              />
            </>
          )}
        </>
      ) : null}

      {tab === 'myTapes' ? (
        <>
          <p className={styles.hint}>
            Две ваши ленты: генерируйте сами (как на Object Tape), не только отражение в чате.
            Позже сюда же лягут ваши отражения на объекты Cursor.
          </p>
          <TapeEditor
            title="Моя лента A"
            hint="Например — ваш взгляд на данность / вход."
            items={state.userTapeA}
            onChange={(userTapeA) => setState((prev) => ({ ...prev, userTapeA }))}
            allowAdd
          />
          <TapeEditor
            title="Моя лента B"
            hint="Например — ваша работа / выход, или вторая персона."
            items={state.userTapeB}
            onChange={(userTapeB) => setState((prev) => ({ ...prev, userTapeB }))}
            allowAdd
          />
        </>
      ) : null}
    </div>
  )
}
