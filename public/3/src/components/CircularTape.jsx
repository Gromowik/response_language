import { useState, useEffect, useRef } from 'react'
import { loadCards, saveCards } from '../utils/cardStorage'
import CardEditor from './CardEditor'
import styles from './CircularTape.module.css'

const CARD_WIDTH = 40
const CARD_SPACING = 5
const MAX_VISIBLE = 11
const CIRCLE_RADIUS = 250

export default function CircularTape({ cards, onCardEdit, onCardsReorder }) {
  const canvasRef = useRef(null)
  const [startIndex, setStartIndex] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 800 })
  const [dragging, setDragging] = useState(null)

  // Update canvas size on window resize
  useEffect(() => {
    const updateSize = () => {
      const canvas = canvasRef.current
      if (canvas && canvas.parentElement) {
        const width = Math.max(800, window.innerWidth - 40)
        const height = Math.max(800, window.innerHeight - 140)
        setCanvasSize({ width, height })
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Draw circular tape
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = canvasSize.width
    canvas.height = canvasSize.height

    const ctx = canvas.getContext('2d')
    const centerX = canvasSize.width / 2
    const centerY = canvasSize.height / 2

    // Background
    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height)

    // Draw circle (guide)
    ctx.strokeStyle = '#ddd'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(centerX, centerY, CIRCLE_RADIUS, 0, 2 * Math.PI)
    ctx.stroke()

    const visibleCards = cards.slice(startIndex, startIndex + MAX_VISIBLE)
    const focusIndex = startIndex

    visibleCards.forEach((card, idx) => {
      const actualIdx = startIndex + idx
      if (dragging && actualIdx === dragging.cardIndex) return

      // Position on circle: idx-th visible card
      // Focus is at top (angle = 0), then clockwise
      const angleStep = (2 * Math.PI) / MAX_VISIBLE
      const angle = idx * angleStep - Math.PI / 2 // Start from top

      // Base position on circle, offset outward so base lies on arc and curved part extends outward
      const cardCenterX = centerX + (CIRCLE_RADIUS + CARD_WIDTH / 2) * Math.cos(angle)
      const cardCenterY = centerY + (CIRCLE_RADIUS + CARD_WIDTH / 2) * Math.sin(angle)

      // Draw semicircle pointing outward
      const normalAngle = angle
      ctx.save()
      ctx.translate(cardCenterX, cardCenterY)
      ctx.rotate(normalAngle + Math.PI / 2 + Math.PI / 2 + Math.PI)

      ctx.fillStyle = card.color
      ctx.beginPath()
      ctx.arc(0, 0, CARD_WIDTH / 2, -Math.PI / 2, Math.PI / 2)
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
      ctx.arc(0, 0, CARD_WIDTH / 2, -Math.PI / 2, Math.PI / 2)
      ctx.stroke()

      ctx.fillStyle = '#000'
      ctx.font = '11px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(card.name, 0, CARD_WIDTH / 2 + 15)

      ctx.restore()

      card._canvasX = cardCenterX
      card._canvasY = cardCenterY
      card._angle = normalAngle
      card._actualIdx = actualIdx
    })

    // Draw focus indicator at top
    ctx.fillStyle = '#FFD700'
    ctx.beginPath()
    ctx.moveTo(centerX, centerY - CIRCLE_RADIUS - 20)
    ctx.lineTo(centerX - 12, centerY - CIRCLE_RADIUS)
    ctx.lineTo(centerX + 12, centerY - CIRCLE_RADIUS)
    ctx.closePath()
    ctx.fill()

    // Draw dragging card
    if (dragging) {
      const draggedCard = cards[dragging.cardIndex]
      const dragAngle = dragging.angle
      const dragCenterX = centerX + (CIRCLE_RADIUS + CARD_WIDTH / 2) * Math.cos(dragAngle)
      const dragCenterY = centerY + (CIRCLE_RADIUS + CARD_WIDTH / 2) * Math.sin(dragAngle)

      ctx.save()
      ctx.translate(dragCenterX, dragCenterY)
      ctx.rotate(dragAngle + Math.PI / 2 + Math.PI / 2 + Math.PI)

      ctx.globalAlpha = 0.7
      ctx.fillStyle = draggedCard.color
      ctx.beginPath()
      ctx.arc(0, 0, CARD_WIDTH / 2, -Math.PI / 2, Math.PI / 2)
      ctx.fill()

      ctx.strokeStyle = '#3498db'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(0, 0, CARD_WIDTH / 2, -Math.PI / 2, Math.PI / 2)
      ctx.stroke()

      ctx.fillStyle = '#000'
      ctx.font = '11px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(draggedCard.name, 0, CARD_WIDTH / 2 + 15)

      ctx.globalAlpha = 1.0
      ctx.restore()
    }
  }, [cards, startIndex, canvasSize, selectedIndex, dragging])

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const visibleCards = cards.slice(startIndex, startIndex + MAX_VISIBLE)
    for (let i = 0; i < visibleCards.length; i++) {
      const card = visibleCards[i]
      const dist = Math.sqrt(Math.pow(x - card._canvasX, 2) + Math.pow(y - card._canvasY, 2))

      if (dist < CARD_WIDTH / 2 + 5) {
        const startTime = Date.now()
        const startX = x
        const startY = y
        const angleStep = (2 * Math.PI) / MAX_VISIBLE
        const initialAngle = i * angleStep - Math.PI / 2

        setDragging({
          cardIndex: startIndex + i,
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
    const visibleCards2 = cards.slice(startIndex, startIndex + MAX_VISIBLE)
    for (let i = 0; i < visibleCards2.length; i++) {
      const card = visibleCards2[i]
      const dist = Math.sqrt(Math.pow(x - card._canvasX, 2) + Math.pow(y - card._canvasY, 2))
      if (dist < CARD_WIDTH + 20) {
        setSelectedIndex(startIndex + i)
        return
      }
    }
  }

  const handleMouseMove = (e) => {
    if (!dragging) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

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
    const endX = e.clientX - rect.left
    const endY = e.clientY - rect.top

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

      const angleStep = (2 * Math.PI) / MAX_VISIBLE

      // Which position was the card dragged to?
      const dragAngle = Math.atan2(endY - centerY, endX - centerX)
      const normalizedDragAngle = ((dragAngle + Math.PI / 2) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)

      let targetVisibleIdx = Math.round(normalizedDragAngle / angleStep) % MAX_VISIBLE
      if (targetVisibleIdx < 0) targetVisibleIdx += MAX_VISIBLE

      const oldIdx = dragging.cardIndex
      const oldVisibleIdx = oldIdx - startIndex

      if (targetVisibleIdx !== oldVisibleIdx && targetVisibleIdx >= 0 && targetVisibleIdx < MAX_VISIBLE) {
        const newCards = [...cards]
        const [movedCard] = newCards.splice(oldIdx, 1)
        const newIdx = startIndex + targetVisibleIdx
        newCards.splice(newIdx, 0, movedCard)
        onCardsReorder(newCards)
      }
    }

    setDragging(null)
  }

  const handleNext = () => {
    const newIndex = (startIndex + 1) % cards.length
    setStartIndex(newIndex)
  }

  const handlePrev = () => {
    const newIndex = (startIndex - 1 + cards.length) % cards.length
    setStartIndex(newIndex)
  }

  const handleDoubleClick = () => {
    if (selectedIndex !== null) {
      onCardEdit(cards[selectedIndex])
    }
  }

  const canPrev = cards.length > MAX_VISIBLE
  const canNext = cards.length > MAX_VISIBLE

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <button onClick={handlePrev} disabled={!canPrev} className={styles.button}>
          ← Previous
        </button>
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
