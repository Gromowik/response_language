import VisualModel from './VisualModel'
import styles from './WorkImprint.module.css'

/**
 * Рабочий отпечаток · случай 1 — среда отдельно от витрины сида.
 * В шапке App: только Visual Model + «← К лицевому Сиду».
 */
export default function WorkImprint({ onNavigate }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.banner}>
        <strong>Случай 1 · рычаг</strong>
        <span className={styles.bannerHint}>
          Новая среда по примеру лицевого Сида. Пока одна возможность — Visual Model; дальше
          добавим по одной, когда скажете.
        </span>
      </div>
      <VisualModel onNavigate={onNavigate} workImprint />
    </div>
  )
}
