import styles from './WorkVerticalShell.module.css'

/**
 * Общая оболочка вертикалей рабочего отпечатка: зачем страница и как работает.
 */
export default function WorkVerticalShell({ title, kicker, purpose, how, children, actions }) {
  return (
    <div className={styles.wrap}>
      <header className={styles.head}>
        <p className={styles.kicker}>{kicker}</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.purpose}>{purpose}</p>
        <p className={styles.how}>{how}</p>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </header>
      <div className={styles.body}>{children}</div>
    </div>
  )
}
