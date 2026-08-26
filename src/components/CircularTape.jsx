import { useState, useEffect, useRef } from 'react'
import styles from './CircularTape.module.css'
import { getFitCanvasSize, getFitCircleRadius } from '../utils/viewport'

const CARD_WIDTH = 70 // Увеличили размер объектов
const CARD_SPACING = 5
const MAX_VISIBLE = 11
const CIRCLE_RADIUS = 250

export default function CircularTape({ cards, onCardEdit, onCardsReorder, initialStartIndex = 0 }) {
  const canvasRef = useRef(null)
  const scrollControlRef = useRef(null)
  const [startIndex, setStartIndex] = useState(initialStartIndex)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 800 })
  const [dragging, setDragging] = useState(null)

  // Update canvas size on window resize
  useEffect(() => {
    const updateSize = () => {
      const { width, height } = getFitCanvasSize({
        minDesktopWidth: 800,
        minDesktopHeight: 800,
        chrome: 180,
      })
      setCanvasSize({ width, height })
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Update startIndex when initialStartIndex changes
  useEffect(() => {
    setStartIndex(initialStartIndex)
  }, [initialStartIndex])

  // Handle mouse wheel scroll on scroll control
  useEffect(() => {
    const scrollControl = scrollControlRef.current
    if (!scrollControl) return

    const handleWheelScroll = (e) => {
      e.preventDefault()
      const delta = e.deltaY
      
      if (delta > 0) {
        // Scroll down/forward - move to next
        if (cards.length > MAX_VISIBLE) {
          setStartIndex((prev) => (prev + 1) % cards.length)
        }
      } else {
        // Scroll up/backward - move to previous
        if (cards.length > MAX_VISIBLE) {
          setStartIndex((prev) => (prev - 1 + cards.length) % cards.length)
        }
      }
    }

    scrollControl.addEventListener('wheel', handleWheelScroll, { passive: false })
    return () => {
      scrollControl.removeEventListener('wheel', handleWheelScroll)
    }
  }, [cards.length])

  // Draw circular tape
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = canvasSize.width
    canvas.height = canvasSize.height

    const ctx = canvas.getContext('2d')
    const centerX = canvasSize.width / 2
    const centerY = canvasSize.height / 2
    const circleRadius = getFitCircleRadius(
      CIRCLE_RADIUS,
      canvasSize.width,
      canvasSize.height,
      CARD_WIDTH
    )

    // Background
    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height)

    // Draw circle (guide)
    ctx.strokeStyle = '#ddd'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(centerX, centerY, circleRadius, 0, 2 * Math.PI)
    ctx.stroke()

    // Get visible cards (handle case when cards.length < MAX_VISIBLE or wrapping around)
    const visibleCards = []
    const totalVisible = Math.min(MAX_VISIBLE, cards.length)
    for (let i = 0; i < totalVisible; i++) {
      const idx = (startIndex + i) % cards.length
      visibleCards.push(cards[idx])
    }
    const focusIndex = startIndex

    visibleCards.forEach((card, idx) => {
      if (!card) return
      
      // Calculate actual index in original cards array (with wrapping)
      const actualIdx = (startIndex + idx) % cards.length
      if (dragging && actualIdx === dragging.cardIndex) return

      // Position on circle: idx-th visible card
      // Focus is at top (angle = 0), then clockwise
      const angleStep = (2 * Math.PI) / totalVisible
      const angle = idx * angleStep - Math.PI / 2 // Start from top

      // Позиционируем центр полного круга на 3/4 радиуса объекта во внешнюю сторону от окружности
      // Это выносит объекты дальше от центра общего круга
      const offsetRadius = circleRadius + (CARD_WIDTH / 2) * 3/4 // 3/4 радиуса объекта
      const cardCenterX = centerX + offsetRadius * Math.cos(angle)
      const cardCenterY = centerY + offsetRadius * Math.sin(angle)

      // Draw full circle (not semicircle)
      ctx.fillStyle = card.color
      ctx.beginPath()
      ctx.arc(cardCenterX, cardCenterY, CARD_WIDTH / 2, 0, 2 * Math.PI)
      ctx.fill()

      let borderColor = '#333'
      let borderWidth = 2
      if (actualIdx === selectedIndex) {
        borderColor = '#3498db'
        borderWidth = 4
      }
      if (actualIdx === focusIndex) {
        borderColor = '#FFD700'
        borderWidth = 3
      }

      ctx.strokeStyle = borderColor
      ctx.lineWidth = borderWidth
      ctx.beginPath()
      ctx.arc(cardCenterX, cardCenterY, CARD_WIDTH / 2, 0, 2 * Math.PI)
      ctx.stroke()

      // Рисуем текст снаружи от круга
      ctx.fillStyle = '#000'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      // Вычисляем позицию текста снаружи от круга (с учетом смещения объекта)
      const textRadius = offsetRadius + CARD_WIDTH / 2 + 20
      const textX = centerX + textRadius * Math.cos(angle)
      const textY = centerY + textRadius * Math.sin(angle)
      ctx.fillText(card.name, textX, textY)

      // Store position for mouse interaction
      card._canvasX = cardCenterX
      card._canvasY = cardCenterY
      card._angle = angle
      card._actualIdx = actualIdx
      card._visibleIdx = idx
    })

    // Draw focus indicator at top
    ctx.fillStyle = '#FFD700'
    ctx.beginPath()
    ctx.moveTo(centerX, centerY - circleRadius - 20)
    ctx.lineTo(centerX - 12, centerY - circleRadius)
    ctx.lineTo(centerX + 12, centerY - circleRadius)
    ctx.closePath()
    ctx.fill()

    // Draw dragging card
    if (dragging && dragging.cardIndex >= 0 && dragging.cardIndex < cards.length) {
      const draggedCard = cards[dragging.cardIndex]
      if (!draggedCard) return
      
      const dragAngle = dragging.angle
      // Центр круга с тем же смещением при перетаскивании
      const dragOffsetRadius = circleRadius + (CARD_WIDTH / 2) * 3/4
      const dragCenterX = centerX + dragOffsetRadius * Math.cos(dragAngle)
      const dragCenterY = centerY + dragOffsetRadius * Math.sin(dragAngle)

      ctx.globalAlpha = 0.7
      ctx.fillStyle = draggedCard.color
      ctx.beginPath()
      ctx.arc(dragCenterX, dragCenterY, CARD_WIDTH / 2, 0, 2 * Math.PI)
      ctx.fill()

      ctx.strokeStyle = '#3498db'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(dragCenterX, dragCenterY, CARD_WIDTH / 2, 0, 2 * Math.PI)
      ctx.stroke()

      ctx.globalAlpha = 1.0

      // Рисуем текст снаружи от круга
      ctx.fillStyle = '#000'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      // Вычисляем позицию текста снаружи от круга (с учетом смещения объекта)
      const dragTextRadius = dragOffsetRadius + CARD_WIDTH / 2 + 20
      const dragTextX = centerX + dragTextRadius * Math.cos(dragAngle)
      const dragTextY = centerY + dragTextRadius * Math.sin(dragAngle)
      ctx.fillText(draggedCard.name, dragTextX, dragTextY)
    }
  }, [cards, startIndex, canvasSize, selectedIndex, dragging])

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    // Get visible cards with cyclic wrapping (same logic as drawing)
    const totalVisible = Math.min(MAX_VISIBLE, cards.length)
    const visibleCards = []
    for (let i = 0; i < totalVisible; i++) {
      const idx = (startIndex + i) % cards.length
      visibleCards.push({ card: cards[idx], actualIdx: idx, visibleIdx: i })
    }

    for (let i = 0; i < visibleCards.length; i++) {
      const { card, actualIdx } = visibleCards[i]
      if (!card || !card._canvasX) continue
      
      const dist = Math.sqrt(Math.pow(x - card._canvasX, 2) + Math.pow(y - card._canvasY, 2))

      if (dist < CARD_WIDTH / 2 + 5) {
        const startTime = Date.now()
        const startX = x
        const startY = y
        const angleStep = (2 * Math.PI) / totalVisible
        const initialAngle = i * angleStep - Math.PI / 2

        setDragging({
          cardIndex: actualIdx, // Use actual index in original array
          startTime,
          startX,
          startY,
          currentX: x,
          currentY: y,
          angle: initialAngle,
          startAngle: initialAngle,
        })

        return
      }
    }

    // Click without card - select if double-click area
    for (let i = 0; i < visibleCards.length; i++) {
      const { card, actualIdx } = visibleCards[i]
      if (!card || !card._canvasX) continue
      
      const dist = Math.sqrt(Math.pow(x - card._canvasX, 2) + Math.pow(y - card._canvasY, 2))
      if (dist < CARD_WIDTH + 20) {
        setSelectedIndex(actualIdx)
        return
      }
    }
  }

  const handleMouseMove = (e) => {
    if (!dragging) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    const centerX = canvasSize.width / 2
    const centerY = canvasSize.height / 2

    // Calculate angle from center to current mouse position
    const angle = Math.atan2(y - centerY, x - centerX)

    setDragging({
      ...dragging,
      currentX: x,
      currentY: y,
      angle: angle,
    })
  }

  const handleMouseUp = (e) => {
    if (!dragging) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const endX = (e.clientX - rect.left) * scaleX
    const endY = (e.clientY - rect.top) * scaleY

    const timeDiff = Date.now() - dragging.startTime
    const distMoved = Math.sqrt(
      Math.pow(endX - dragging.startX, 2) + Math.pow(endY - dragging.startY, 2)
    )

    if (timeDiff < 200 && distMoved < 5) {
      // Click
      setSelectedIndex(dragging.cardIndex)
      setDragging(null)
      return
    }

    // Drag - reorder
    if (distMoved > 10) {
      const centerX = canvasSize.width / 2
      const centerY = canvasSize.height / 2

      const totalVisible = Math.min(MAX_VISIBLE, cards.length)
      const angleStep = (2 * Math.PI) / totalVisible

      // Which position was the card dragged to?
      const dragAngle = Math.atan2(endY - centerY, endX - centerX)
      const normalizedDragAngle = ((dragAngle + Math.PI / 2) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)

      let targetVisibleIdx = Math.round(normalizedDragAngle / angleStep) % totalVisible
      if (targetVisibleIdx < 0) targetVisibleIdx += totalVisible

      const oldIdx = dragging.cardIndex
      // Find the visible index of the dragged card (considering cyclic wrapping)
      const oldVisibleIdx = ((oldIdx - startIndex + cards.length) % cards.length)

      if (targetVisibleIdx !== oldVisibleIdx && targetVisibleIdx >= 0 && targetVisibleIdx < totalVisible) {
        const newCards = [...cards]
        const [movedCard] = newCards.splice(oldIdx, 1)
        // Calculate the target index in the original array (with wrapping)
        const targetActualIdx = (startIndex + targetVisibleIdx) % cards.length
        // Calculate correct insertion index (accounting for removal)
        let insertIdx = targetActualIdx
        if (oldIdx < targetActualIdx) {
          insertIdx = targetActualIdx - 1 // Adjust for removed item
        }
        // Ensure valid index
        insertIdx = Math.max(0, Math.min(insertIdx, newCards.length))
        newCards.splice(insertIdx, 0, movedCard)
        onCardsReorder(newCards)
      }
    }

    setDragging(null)
  }

  const handleNext = () => {
    if (cards.length === 0) return
    // Move forward (clockwise) on the circle
    const newIndex = (startIndex + 1) % cards.length
    setStartIndex(newIndex)
  }

  const handlePrev = () => {
    if (cards.length === 0) return
    // Move backward (counter-clockwise) on the circle
    const newIndex = (startIndex - 1 + cards.length) % cards.length
    setStartIndex(newIndex)
  }

  const handleDoubleClick = () => {
    if (selectedIndex !== null) {
      onCardEdit(cards[selectedIndex])
    }
  }

  // Can scroll if there are objects (circular scrolling - always enabled if cards exist)
  // Even with fewer cards than MAX_VISIBLE, we can still rotate the circle
  const canPrev = cards.length > 0
  const canNext = cards.length > 0

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <button onClick={handlePrev} disabled={!canPrev} className={styles.button}>
          ← Previous
        </button>
        <div
          ref={scrollControlRef}
          className={styles.scrollControl}
          title="Rotate circle with mouse wheel"
        >
          <div className={styles.scrollIcon}>⟲</div>
        </div>
        <span className={styles.info}>
          Cards: {cards.length} | Visible: {MAX_VISIBLE} | Start Index: {startIndex}
        </span>
        <button onClick={handleNext} disabled={!canNext} className={styles.button}>
          Next →
        </button>
        <button
          onClick={handleDoubleClick}
          disabled={selectedIndex === null}
          className={styles.button}
        >
          ✏️ Edit Selected
        </button>
      </div>

      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      />
    </div>
  )
}

