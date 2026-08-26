/**
 * Both Circular Tapes Component
 * Displays two circular tapes (gears) side by side, showing visible objects from horizontal tapes
 */

import { useState, useEffect, useRef } from 'react'
import styles from './BothCircularTapes.module.css'
import { getFitCanvasSize, getFitCircleRadius } from '../utils/viewport'

const CARD_WIDTH = 70
const MAX_VISIBLE = 10
const CIRCLE_RADIUS = 200 // Smaller radius for side-by-side layout

export default function BothCircularTapes({ leftCards, rightCards, onLeftCardEdit, onRightCardEdit }) {
  const leftCanvasRef = useRef(null)
  const rightCanvasRef = useRef(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })

  // Update canvas size on window resize
  useEffect(() => {
    const updateSize = () => {
      const { width, height } = getFitCanvasSize({
        minDesktopWidth: 1200,
        minDesktopHeight: 600,
        chrome: 180,
      })
      setCanvasSize({ width, height })
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Get visible cards for a tape (last 10, or all if less than 10)
  const getVisibleCards = (cards) => {
    if (cards.length === 0) return []
    const startIdx = Math.max(0, cards.length - MAX_VISIBLE)
    return cards.slice(startIdx)
  }

  // Reorder visible cards: focus (last) at top, then others clockwise
  const reorderForCircle = (visibleCards) => {
    if (visibleCards.length === 0) return []
    // Focus is the last element (rightmost on horizontal tape)
    const focus = visibleCards[visibleCards.length - 1]
    // Others go in reverse order (from second-to-last to first)
    const others = visibleCards.slice(0, -1).reverse()
    return [focus, ...others]
  }

  // Draw a single circular tape
  const drawCircularTape = (canvas, cards, label) => {
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvasSize.width / 2
    const height = canvasSize.height

    canvas.width = width
    canvas.height = height

    // Center of circle relative to this canvas (at center of canvas)
    const centerX = width / 2
    const centerY = height / 2
    const circleRadius = getFitCircleRadius(CIRCLE_RADIUS, width, height, CARD_WIDTH)

    // Background
    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(0, 0, width, height)

    // Get visible cards and reorder for circle
    const visibleCards = getVisibleCards(cards)
    const reorderedCards = reorderForCircle(visibleCards)
    const totalVisible = reorderedCards.length

    if (totalVisible === 0) {
      // Draw label
      ctx.fillStyle = '#666'
      ctx.font = '16px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, centerX, centerY)
      return
    }

    // Draw circle (guide)
    ctx.strokeStyle = '#ddd'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(centerX, centerY, circleRadius, 0, 2 * Math.PI)
    ctx.stroke()

    // Draw cards
    reorderedCards.forEach((card, idx) => {
      if (!card) return

      // Position on circle: idx-th card
      // Focus is at top (idx = 0, angle = -PI/2), then clockwise
      const angleStep = (2 * Math.PI) / totalVisible
      const angle = idx * angleStep - Math.PI / 2 // Start from top

      // Position center of circle at 3/4 radius outward from base circle
      const offsetRadius = circleRadius + (CARD_WIDTH / 2) * 3/4
      const cardCenterX = centerX + offsetRadius * Math.cos(angle)
      const cardCenterY = centerY + offsetRadius * Math.sin(angle)

      // Draw full circle
      ctx.fillStyle = card.color || '#85C1E2'
      ctx.beginPath()
      ctx.arc(cardCenterX, cardCenterY, CARD_WIDTH / 2, 0, 2 * Math.PI)
      ctx.fill()

      // Draw border (focus gets golden border)
      let borderColor = '#333'
      let borderWidth = 2
      if (idx === 0) {
        // Focus (top position)
        borderColor = '#FFD700'
        borderWidth = 3
      }

      ctx.strokeStyle = borderColor
      ctx.lineWidth = borderWidth
      ctx.beginPath()
      ctx.arc(cardCenterX, cardCenterY, CARD_WIDTH / 2, 0, 2 * Math.PI)
      ctx.stroke()

      // Draw text outside circle
      ctx.fillStyle = '#000'
      ctx.font = '11px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const textRadius = offsetRadius + CARD_WIDTH / 2 + 15
      const textX = centerX + textRadius * Math.cos(angle)
      const textY = centerY + textRadius * Math.sin(angle)
      ctx.fillText(card.name || 'Card', textX, textY)

      // Store position for mouse interaction
      card._canvasX = cardCenterX
      card._canvasY = cardCenterY
      card._angle = angle
      card._circleIdx = idx
    })

    // Draw focus indicator at top
    ctx.fillStyle = '#FFD700'
    ctx.beginPath()
    ctx.moveTo(centerX, centerY - circleRadius - 20)
    ctx.lineTo(centerX - 10, centerY - circleRadius)
    ctx.lineTo(centerX + 10, centerY - circleRadius)
    ctx.closePath()
    ctx.fill()

    // Draw label below circle
    ctx.fillStyle = '#333'
    ctx.font = '14px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(label, centerX, centerY + circleRadius + 60)
  }

  // Draw both tapes
  useEffect(() => {
    const leftCanvas = leftCanvasRef.current
    const rightCanvas = rightCanvasRef.current

    if (!leftCanvas || !rightCanvas) return

    drawCircularTape(leftCanvas, leftCards, 'Person 1')
    drawCircularTape(rightCanvas, rightCards, 'Person 2')
  }, [leftCards, rightCards, canvasSize])

  const handleCanvasClick = (canvas, cards, onCardEdit, e) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    // Get canvas dimensions
    const width = canvasSize.width / 2
    const height = canvasSize.height
    const centerX = width / 2
    const circleRadius = getFitCircleRadius(CIRCLE_RADIUS, width, height, CARD_WIDTH)
    const centerY = height / 2

    // Get visible cards and reorder for circle
    const visibleCards = getVisibleCards(cards)
    const reorderedCards = reorderForCircle(visibleCards)
    const totalVisible = reorderedCards.length

    if (totalVisible === 0) return

    // Calculate positions and find clicked card
    const angleStep = (2 * Math.PI) / totalVisible
    const offsetRadius = circleRadius + (CARD_WIDTH / 2) * 3/4

    for (let i = 0; i < reorderedCards.length; i++) {
      const card = reorderedCards[i]
      if (!card) continue

      const angle = i * angleStep - Math.PI / 2
      const cardCenterX = centerX + offsetRadius * Math.cos(angle)
      const cardCenterY = centerY + offsetRadius * Math.sin(angle)

      const dist = Math.sqrt(Math.pow(x - cardCenterX, 2) + Math.pow(y - cardCenterY, 2))
      if (dist < CARD_WIDTH / 2 + 5) {
        // Single click - can be used for selection in the future
        return
      }
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.info}>
        <span>Person 1: {leftCards.length} cards | Visible: {Math.min(MAX_VISIBLE, leftCards.length)}</span>
        <span>Person 2: {rightCards.length} cards | Visible: {Math.min(MAX_VISIBLE, rightCards.length)}</span>
      </div>
      <div className={styles.canvasContainer}>
        <canvas
          ref={leftCanvasRef}
          className={styles.canvas}
          onClick={(e) => handleCanvasClick(leftCanvasRef.current, leftCards, onLeftCardEdit, e)}
          onDoubleClick={(e) => {
            const visibleCards = getVisibleCards(leftCards)
            const reorderedCards = reorderForCircle(visibleCards)
            if (reorderedCards.length > 0 && onLeftCardEdit) {
              onLeftCardEdit(reorderedCards[0]) // Focus card (first in reordered)
            }
          }}
        />
        <canvas
          ref={rightCanvasRef}
          className={styles.canvas}
          onClick={(e) => handleCanvasClick(rightCanvasRef.current, rightCards, onRightCardEdit, e)}
          onDoubleClick={(e) => {
            const visibleCards = getVisibleCards(rightCards)
            const reorderedCards = reorderForCircle(visibleCards)
            if (reorderedCards.length > 0 && onRightCardEdit) {
              onRightCardEdit(reorderedCards[0]) // Focus card (first in reordered)
            }
          }}
        />
      </div>
    </div>
  )
}
