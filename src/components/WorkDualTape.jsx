import styles from './WorkDualTape.module.css'
import ObjectTape from './ObjectTape'

/**
 * Рабочий отпечаток: верх — полный Person Tape; низ — фильтр соприкосновения (контакт / U).
 */
export default function WorkDualTape({
  personLabel,
  personSide, // 1 | 2
  upperCards,
  contactCards,
  onUpperEdit,
  onUpperReorder,
  onContactEdit,
  onContactReorder,
  onSendToContact,
  onRemoveFromContact,
  onOpenVertical,
  onOpenBothVertical,
  canOpenExchange,
  upperHint,
}) {
  const exchangeOk = canOpenExchange ?? contactCards.length > 0
  return (
    <div className={styles.wrap}>
      <section className={styles.band}>
        <header className={styles.head}>
          <p className={styles.kicker}>Рабочий отпечаток · {personLabel}</p>
          <h2 className={styles.title}>Полная лента</h2>
          <p className={styles.hint}>
            {upperHint ||
              'Всё своё (заметки, ещё не для обмена). Выделите → «↓ В соприкосновение».'}
          </p>
        </header>
        <ObjectTape
          cards={upperCards}
          onCardSelect={onUpperEdit}
          onCardEdit={onUpperEdit}
          onCardsReorder={onUpperReorder}
          onSendToContact={onSendToContact}
        />
      </section>

      <section className={`${styles.band} ${styles.bandContact}`}>
        <header className={styles.head}>
          <h2 className={styles.title}>Лента соприкосновения</h2>
          <p className={styles.hint}>
            Фильтр: что идёт в совместный контакт / U. Отсюда — в вертикальный обмен.
          </p>
          <div className={styles.navRow}>
            <button
              type="button"
              className={styles.navBtn}
              onClick={() => onOpenVertical?.(personSide)}
              disabled={!exchangeOk}
              title="Собрать пары Generated↔External и открыть свою вертикаль"
            >
              → Vertical Person {personSide}
            </button>
            <button
              type="button"
              className={styles.navBtn}
              onClick={() => onOpenBothVertical?.()}
              disabled={!exchangeOk}
              title="Обе вертикали из лент соприкосновения"
            >
              → Both Vertical
            </button>
          </div>
        </header>
        {!contactCards.length ? (
          <p className={styles.empty}>Пока пусто — пришлите с верхней ленты.</p>
        ) : null}
        <ObjectTape
          cards={contactCards}
          onCardSelect={onContactEdit}
          onCardEdit={onContactEdit}
          onCardsReorder={onContactReorder}
          onRemoveFromContact={onRemoveFromContact}
        />
      </section>
    </div>
  )
}
