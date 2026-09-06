import { useEffect, useMemo, useState } from 'react'
import styles from './ExchangeField.module.css'
import ExchangeFieldViewer from './ExchangeFieldViewer'
import {
  LOCAL_PERSON_ID,
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
  isOwnCard,
  personLabel,
} from '../utils/playerCardStorage'
import {
  loadInterests,
  saveInterests,
  loadLinks,
  saveLinks,
  findInterest,
  removeInterest,
  outgoingInterests,
  incomingInterests,
  expressInterestAndMaybeLink,
  findLinkBetween,
  setLinkStatus,
  updateLinkCards,
  linkStatusLabel,
} from '../utils/interestStorage'

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

function cardTitle(card) {
  if (!card) return '—'
  const kind = projectionKindLabel(card.projectionKind)
  const label = card.projectionLabel ? ` · ${card.projectionLabel}` : ''
  return `${card.theme} — ${kind}${label}`
}

export default function ExchangeField() {
  const [tab, setTab] = useState('cards')
  const [cards, setCards] = useState(() => loadPlayerCards())
  const [interests, setInterests] = useState(() => loadInterests())
  const [links, setLinks] = useState(() => loadLinks())
  const [mode, setMode] = useState('list')
  const [selectedId, setSelectedId] = useState(null)
  const [draft, setDraft] = useState(null)
  const [errors, setErrors] = useState({})
  const [themeQuery, setThemeQuery] = useState('')
  const [selfQuery, setSelfQuery] = useState('')
  const [searchMode, setSearchMode] = useState('both')
  const [ownerFilter, setOwnerFilter] = useState('all')
  const [offerCardId, setOfferCardId] = useState('')
  const [flash, setFlash] = useState('')

  useEffect(() => {
    savePlayerCards(cards)
  }, [cards])

  useEffect(() => {
    saveInterests(interests)
  }, [interests])

  useEffect(() => {
    saveLinks(links)
  }, [links])

  const selected = cards.find((c) => c.id === selectedId) || null
  const myCards = useMemo(() => cards.filter((c) => isOwnCard(c)), [cards])

  const scopedCards = useMemo(() => {
    if (ownerFilter === 'mine') return myCards
    if (ownerFilter === 'others') return cards.filter((c) => !isOwnCard(c))
    return cards
  }, [cards, myCards, ownerFilter])

  const filteredCards = useMemo(
    () => filterPlayerCards(scopedCards, { themeQuery, selfQuery, mode: searchMode }),
    [scopedCards, themeQuery, selfQuery, searchMode]
  )

  const grouped = useMemo(() => groupCardsByTheme(filteredCards), [filteredCards])
  const selectedCount = myCards.filter((c) => c.selectedForExchange).length

  const outList = useMemo(() => outgoingInterests(interests), [interests])
  const inList = useMemo(() => incomingInterests(interests), [interests])
  const myLinks = useMemo(
    () =>
      links.filter(
        (l) => l.personAId === LOCAL_PERSON_ID || l.personBId === LOCAL_PERSON_ID
      ),
    [links]
  )

  const defaultOfferId = useMemo(() => {
    const starred = myCards.filter((c) => c.selectedForExchange)
    if (starred.length) return starred[0].id
    return myCards[0]?.id || ''
  }, [myCards])

  useEffect(() => {
    if (!offerCardId && defaultOfferId) setOfferCardId(defaultOfferId)
  }, [defaultOfferId, offerCardId])

  const showFlash = (msg) => {
    setFlash(msg)
    window.setTimeout(() => setFlash(''), 3200)
  }

  const openView = (id) => {
    setSelectedId(id)
    setMode('view')
    setErrors({})
    setTab('cards')
  }

  const openCreate = (overrides = {}) => {
    const blank = createEmptyPlayerCard(overrides)
    setDraft(blank)
    setSelectedId(blank.id)
    setMode('edit')
    setErrors({})
    setOwnerFilter('mine')
    setTab('cards')
  }

  const openEdit = (card) => {
    if (!isOwnCard(card)) return
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

    setCards((prev) =>
      upsertPlayerCard(prev, {
        ...draft,
        personId: LOCAL_PERSON_ID,
      })
    )
    setSelectedId(draft.id)
    setMode('view')
    setDraft(null)
    setErrors({})
  }

  const handleDelete = (id) => {
    const card = cards.find((c) => c.id === id)
    if (!card || !isOwnCard(card)) return
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
    const card = cards.find((c) => c.id === id)
    if (!card || !isOwnCard(card)) return
    setCards((prev) => toggleSelectedForExchange(prev, id))
  }

  const handleExpressInterest = (targetCard) => {
    if (!targetCard || isOwnCard(targetCard)) return
    if (!myCards.length) {
      showFlash('Сначала создайте свою карточку — ею вы предложите себя в обмен.')
      return
    }
    const offer = offerCardId || defaultOfferId
    const result = expressInterestAndMaybeLink(interests, links, {
      fromPersonId: LOCAL_PERSON_ID,
      toPersonId: targetCard.personId,
      toCardId: targetCard.id,
      offerCardId: offer,
    })
    setInterests(result.interests)
    setLinks(result.links)
    if (result.linked) {
      showFlash('Взаимный интерес — открыта связь.')
      setTab('links')
    } else {
      showFlash('Интерес отправлен. Ждём взаимности.')
    }
  }

  const handleWithdrawInterest = (interestId) => {
    setInterests((prev) => removeInterest(prev, interestId))
    showFlash('Интерес снят.')
  }

  const handleReciprocate = (incoming) => {
    if (!incoming) return
    const theirCard = cards.find((c) => c.id === incoming.offerCardId) ||
      cards.find((c) => c.personId === incoming.fromPersonId)
    if (!theirCard) {
      showFlash('Карточка отправителя не найдена.')
      return
    }
    const offer = offerCardId || defaultOfferId || incoming.toCardId
    const result = expressInterestAndMaybeLink(interests, links, {
      fromPersonId: LOCAL_PERSON_ID,
      toPersonId: theirCard.personId,
      toCardId: theirCard.id,
      offerCardId: offer,
    })
    setInterests(result.interests)
    setLinks(result.links)
    showFlash(result.linked ? 'Связь открыта.' : 'Ответный интерес отправлен.')
    if (result.linked) setTab('links')
  }

  const resolveCard = (id) => cards.find((c) => c.id === id)

  const otherPersonOnLink = (link) =>
    link.personAId === LOCAL_PERSON_ID ? link.personBId : link.personAId

  const myCardOnLink = (link) =>
    link.personAId === LOCAL_PERSON_ID ? link.cardAId : link.cardBId

  const theirCardOnLink = (link) =>
    link.personAId === LOCAL_PERSON_ID ? link.cardBId : link.cardAId

  const setMyProjectionOnLink = (link, cardId) => {
    if (link.personAId === LOCAL_PERSON_ID) {
      setLinks((prev) => updateLinkCards(prev, link.id, { cardAId: cardId }))
    } else {
      setLinks((prev) => updateLinkCards(prev, link.id, { cardBId: cardId }))
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.kicker}>Exchange field · фазы 1–4</p>
        <h1 className={styles.title}>Поле обмена</h1>
        <p className={styles.lead}>
          Карточки <strong>тема ↔ Я</strong>, поиск, интерес к чужой проекции и взаимная{' '}
          <strong>связь</strong>. Пока локально + демо-игроки в этом браузере.
        </p>
      </header>

      {flash ? <p className={styles.flash}>{flash}</p> : null}

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'cards' ? styles.tabActive : ''}`}
          onClick={() => {
            setTab('cards')
            setMode('list')
          }}
        >
          Карточки
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'links' ? styles.tabActive : ''}`}
          onClick={() => setTab('links')}
        >
          Связи
          {inList.length + myLinks.length > 0
            ? ` (${inList.length + myLinks.length})`
            : ''}
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
      ) : tab === 'links' ? (
        <div className={styles.linksLayout}>
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Входящие интересы</h2>
            <p className={styles.hint}>
              Кто отметил вашу карточку. Ответная взаимность открывает связь.
            </p>
            {inList.length === 0 ? (
              <div className={styles.empty}>Пока пусто. В демо уже есть интерес от Анны — если
                сбросили данные, обновите страницу после очистки localStorage.</div>
            ) : (
              <div className={styles.list}>
                {inList.map((item) => {
                  const toCard = resolveCard(item.toCardId)
                  const offer = resolveCard(item.offerCardId)
                  const already = findInterest(interests, {
                    fromPersonId: LOCAL_PERSON_ID,
                    toCardId: item.offerCardId,
                  })
                  const linked = findLinkBetween(links, LOCAL_PERSON_ID, item.fromPersonId)
                  return (
                    <div key={item.id} className={styles.linkItem}>
                      <p className={styles.cardTheme}>{personLabel(item.fromPersonId, cards)}</p>
                      <p className={styles.cardLabel}>
                        Интерес к вашей: {toCard ? cardTitle(toCard) : item.toCardId}
                      </p>
                      <p className={styles.cardSelf}>
                        Их проекция: {offer ? cardTitle(offer) : item.offerCardId || '—'}
                      </p>
                      <p className={styles.meta}>Получено: {formatDate(item.createdAt)}</p>
                      <div className={styles.actions}>
                        {offer ? (
                          <button
                            type="button"
                            className={styles.buttonGhost}
                            onClick={() => openView(offer.id)}
                          >
                            Смотреть их карточку
                          </button>
                        ) : null}
                        {linked ? (
                          <span className={styles.badgeOk}>Уже в связи</span>
                        ) : (
                          <button
                            type="button"
                            className={styles.button}
                            onClick={() => handleReciprocate(item)}
                            disabled={Boolean(already)}
                          >
                            {already ? 'Ответ уже есть' : 'Ответить взаимностью'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Исходящие интересы</h2>
            {outList.length === 0 ? (
              <div className={styles.empty}>Отметьте «Интересно» на чужой карточке.</div>
            ) : (
              <div className={styles.list}>
                {outList.map((item) => {
                  const target = resolveCard(item.toCardId)
                  const linked = findLinkBetween(links, LOCAL_PERSON_ID, item.toPersonId)
                  return (
                    <div key={item.id} className={styles.linkItem}>
                      <p className={styles.cardTheme}>{personLabel(item.toPersonId, cards)}</p>
                      <p className={styles.cardLabel}>
                        {target ? cardTitle(target) : item.toCardId}
                      </p>
                      <p className={styles.meta}>
                        {linked ? 'Статус: связь открыта' : 'Статус: ждём взаимности'} ·{' '}
                        {formatDate(item.createdAt)}
                      </p>
                      <div className={styles.actions}>
                        {target ? (
                          <button
                            type="button"
                            className={styles.buttonGhost}
                            onClick={() => openView(target.id)}
                          >
                            Открыть
                          </button>
                        ) : null}
                        {!linked ? (
                          <button
                            type="button"
                            className={styles.buttonDanger}
                            onClick={() => handleWithdrawInterest(item.id)}
                          >
                            Снять интерес
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Связи (взаимный интерес)</h2>
            <p className={styles.hint}>
              Минимальный статус пары. Можно выбрать, какая ваша проекция участвует, и пометить
              темп: с задержкой или готовы к живому обмену (пока только метка).
            </p>
            {myLinks.length === 0 ? (
              <div className={styles.empty}>
                Связей пока нет. Ответьте на входящий интерес или дождитесь взаимности.
              </div>
            ) : (
              <div className={styles.list}>
                {myLinks.map((link) => {
                  const otherId = otherPersonOnLink(link)
                  const mineId = myCardOnLink(link)
                  const theirsId = theirCardOnLink(link)
                  const mine = resolveCard(mineId)
                  const theirs = resolveCard(theirsId)
                  const otherCards = cards.filter((c) => c.personId === otherId)
                  return (
                    <div key={link.id} className={styles.linkItem}>
                      <p className={styles.cardTheme}>
                        Вы ↔ {personLabel(otherId, cards)}
                      </p>
                      <p className={styles.badge}>{linkStatusLabel(link.status)}</p>
                      <div className={styles.field}>
                        <label htmlFor={`link-mine-${link.id}`}>Ваша проекция в связи</label>
                        <select
                          id={`link-mine-${link.id}`}
                          value={mineId || ''}
                          onChange={(e) => setMyProjectionOnLink(link, e.target.value)}
                        >
                          <option value="">— не выбрана —</option>
                          {myCards.map((c) => (
                            <option key={c.id} value={c.id}>
                              {cardTitle(c)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className={styles.cardSelf}>
                        Их проекция:{' '}
                        {theirs ? (
                          <button
                            type="button"
                            className={styles.linkButton}
                            onClick={() => openView(theirs.id)}
                          >
                            {cardTitle(theirs)}
                          </button>
                        ) : (
                          theirsId || '—'
                        )}
                      </p>
                      {mine ? (
                        <p className={styles.meta}>Ваша сторона: {cardTitle(mine)}</p>
                      ) : null}
                      {otherCards.length > 1 ? (
                        <p className={styles.hint}>
                          У партнёра ещё проекций: {otherCards.length}. Точнее сцепление — выбрать
                          ближние с обеих сторон.
                        </p>
                      ) : null}
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={styles.buttonGhost}
                          onClick={() =>
                            setLinks((prev) =>
                              setLinkStatus(
                                prev,
                                link.id,
                                link.status === 'ready' ? 'delayed' : 'ready'
                              )
                            )
                          }
                        >
                          {link.status === 'ready'
                            ? 'Переключить: обмен с задержкой'
                            : 'Переключить: готовы к живому'}
                        </button>
                        {theirs ? (
                          <button
                            type="button"
                            className={styles.button}
                            onClick={() => openView(theirs.id)}
                          >
                            Их карточка
                          </button>
                        ) : null}
                      </div>
                      <p className={styles.meta}>Связь с: {formatDate(link.createdAt)}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      ) : mode === 'list' ? (
        <>
          <div className={styles.toolbar}>
            <button type="button" className={styles.button} onClick={() => openCreate()}>
              + Новая карточка
            </button>
            <span className={styles.hint} style={{ margin: 0 }}>
              {filteredCards.length} из {scopedCards.length}
              {selectedCount > 0 ? ` · ★ для обмена: ${selectedCount}` : ''}
            </span>
          </div>

          <div className={styles.searchModes} style={{ marginBottom: '0.75rem' }}>
            {[
              { id: 'all', label: 'Все' },
              { id: 'mine', label: 'Мои' },
              { id: 'others', label: 'Чужие (поле)' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                className={`${styles.tab} ${ownerFilter === m.id ? styles.tabActive : ''}`}
                onClick={() => setOwnerFilter(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className={styles.searchPanel}>
            <p className={styles.hint} style={{ marginTop: 0 }}>
              Поиск по теме и/или персональному. На чужой карточке — «Интересно»; взаимность →
              вкладка Связи.
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

            {myCards.length > 0 ? (
              <div className={styles.field} style={{ marginTop: '0.75rem', marginBottom: 0 }}>
                <label htmlFor="ef-offer">Моя проекция при интересе</label>
                <select
                  id="ef-offer"
                  value={offerCardId || defaultOfferId}
                  onChange={(e) => setOfferCardId(e.target.value)}
                >
                  {myCards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {cardTitle(c)}
                      {c.selectedForExchange ? ' ★' : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          {filteredCards.length === 0 ? (
            <div className={styles.empty}>
              {scopedCards.length === 0
                ? 'Нет карточек в этом фильтре.'
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
                    {ownerFilter !== 'others' ? (
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
                    ) : null}
                  </div>
                  <div className={styles.list}>
                    {group.items.map((card) => {
                      const own = isOwnCard(card)
                      const interest = findInterest(interests, {
                        fromPersonId: LOCAL_PERSON_ID,
                        toCardId: card.id,
                      })
                      const linked = !own
                        ? findLinkBetween(links, LOCAL_PERSON_ID, card.personId)
                        : null
                      return (
                        <div key={card.id} className={styles.cardRow}>
                          {own ? (
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
                          ) : (
                            <button
                              type="button"
                              className={`${styles.selectToggle} ${
                                interest || linked ? styles.interestOn : ''
                              }`}
                              title={
                                linked
                                  ? 'Уже в связи'
                                  : interest
                                    ? 'Интерес отправлен'
                                    : 'Интересно / хочу обменяться'
                              }
                              onClick={(e) => {
                                e.stopPropagation()
                                if (!interest && !linked) handleExpressInterest(card)
                              }}
                            >
                              {linked ? '↔' : interest ? '✓' : '♡'}
                            </button>
                          )}
                          <button
                            type="button"
                            className={styles.card}
                            onClick={() => openView(card.id)}
                          >
                            <p className={styles.cardTheme}>{personLabel(card)}</p>
                            <p className={styles.cardLabel}>
                              {projectionKindLabel(card.projectionKind)}
                              {card.projectionLabel ? ` · ${card.projectionLabel}` : ''}
                              {linked ? ' · связь' : ''}
                            </p>
                            <p className={styles.cardSelf}>{snippet(card.self)}</p>
                          </button>
                        </div>
                      )
                    })}
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
              {isOwnCard(selected) ? (
                <>
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
                </>
              ) : null}
            </div>
          </div>
          <p className={styles.meta}>
            {personLabel(selected)} · {projectionKindLabel(selected.projectionKind)}
            {selected.projectionLabel ? ` · ${selected.projectionLabel}` : ''}
            {' · '}
            Обновлено: {formatDate(selected.updatedAt)}
            {selected.selectedForExchange ? ' · ★ для обмена' : ''}
          </p>

          {isOwnCard(selected) ? (
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
          ) : (
            <div className={styles.interestBox}>
              {(() => {
                const interest = findInterest(interests, {
                  fromPersonId: LOCAL_PERSON_ID,
                  toCardId: selected.id,
                })
                const linked = findLinkBetween(links, LOCAL_PERSON_ID, selected.personId)
                return (
                  <>
                    <p className={styles.hint} style={{ marginTop: 0 }}>
                      Хотите обменяться с этой проекцией? Укажите, какую свою карточку предлагаете.
                    </p>
                    {myCards.length > 0 ? (
                      <div className={styles.field}>
                        <label htmlFor="ef-offer-view">Моя проекция</label>
                        <select
                          id="ef-offer-view"
                          value={offerCardId || defaultOfferId}
                          onChange={(e) => setOfferCardId(e.target.value)}
                        >
                          {myCards.map((c) => (
                            <option key={c.id} value={c.id}>
                              {cardTitle(c)}
                              {c.selectedForExchange ? ' ★' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                    <div className={styles.actions}>
                      {linked ? (
                        <button
                          type="button"
                          className={styles.button}
                          onClick={() => setTab('links')}
                        >
                          ↔ Открыть связь
                        </button>
                      ) : interest ? (
                        <button
                          type="button"
                          className={styles.buttonGhost}
                          onClick={() => handleWithdrawInterest(interest.id)}
                        >
                          Снять интерес
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={styles.button}
                          onClick={() => handleExpressInterest(selected)}
                        >
                          ♡ Интересно / хочу обменяться
                        </button>
                      )}
                    </div>
                  </>
                )
              })()}
            </div>
          )}

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

          {cards.filter(
            (c) =>
              c.theme === selected.theme &&
              c.id !== selected.id &&
              c.personId === selected.personId
          ).length > 0 ? (
            <div className={styles.viewBlock}>
              <h3>Другие проекции этого человека в теме</h3>
              <ul className={styles.relatedList}>
                {cards
                  .filter(
                    (c) =>
                      c.theme === selected.theme &&
                      c.id !== selected.id &&
                      c.personId === selected.personId
                  )
                  .map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className={styles.linkButton}
                        onClick={() => openView(c.id)}
                      >
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
