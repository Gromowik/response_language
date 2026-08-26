/**
 * Paired Circular Tapes Component
 * Displays two circular tapes (gears) with paired objects, synchronized like gears
 * Left circle: counter-clockwise from top (upward = counter-clockwise)
 * Right circle: clockwise from top (upward = clockwise)
 * Point of engagement: rightmost of left circle (angle 0) pairs with leftmost of right circle (angle PI)
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import styles from './PairedCircularTapes.module.css'
import { getFitCanvasSize, getFitCircleRadius } from '../utils/viewport'

const CARD_WIDTH = 70
const MAX_VISIBLE = 10
const CIRCLE_RADIUS = 200

const radiusFor = (width, height) => getFitCircleRadius(CIRCLE_RADIUS, width, height, CARD_WIDTH)

export default function PairedCircularTapes({ leftCards, rightCards, onLeftCardEdit, onRightCardEdit }) {
  const leftCanvasRef = useRef(null)
  const rightCanvasRef = useRef(null)
  const connectionsCanvasRef = useRef(null)
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 600 })
  const [sortMode, setSortMode] = useState('metrics') // 'metrics' or 'focusedAt'

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

  // Helper function to calculate sum of IN + OUT for sorting
  const getMetricSum = (card) => {
    return (card?.metrics?.in || 0) + (card?.metrics?.out || 0)
  }

  // Helper function to get focusedAt timestamp
  const getFocusedAtTimestamp = (card) => {
    return card?.focusedAt || 0
  }

  // Helper function to find pair for a card
  const findPair = (leftCard, rightCardsList) => {
    if (leftCard.type === 'generated' || leftCard.type === 'internalReflection') {
      return rightCardsList.find(rc => rc.reflectionOf === leftCard.id)
    } else if (leftCard.type === 'externalReflection' && leftCard.reflectionOf) {
      return rightCardsList.find(rc => rc.id === leftCard.reflectionOf)
    }
    return null
  }

  // Build paired structure and sort based on selected mode (same logic as BothVerticalTapes)
  const pairs = useMemo(() => {
    // First, build all pairs
    const pairsList = []
    const usedRightIds = new Set()
    
    // Create pairs from left cards
    leftCards.forEach(leftCard => {
      const pair = findPair(leftCard, rightCards)
      if (pair) {
        pairsList.push({ left: leftCard, right: pair })
        usedRightIds.add(pair.id)
      } else {
        pairsList.push({ left: leftCard, right: null })
      }
    })
    
    // Add remaining right cards that don't have pairs
    rightCards.forEach(rightCard => {
      if (!usedRightIds.has(rightCard.id)) {
        pairsList.push({ left: null, right: rightCard })
      }
    })
    
    // Sort pairs based on selected mode
    if (sortMode === 'metrics') {
      // Sort by sum of IN + OUT (descending - higher sum first)
      pairsList.sort((a, b) => {
        const sumA = (a.left ? getMetricSum(a.left) : 0)
        const sumB = (b.left ? getMetricSum(b.left) : 0)
        return sumB - sumA
      })
    } else if (sortMode === 'focusedAt') {
      // Sort by sum of "focus ages" (ascending - smaller sum first, meaning more recent)
      const currentTime = Date.now()
      const maxAge = currentTime
      
      pairsList.sort((a, b) => {
        const leftAgeA = a.left ? (currentTime - getFocusedAtTimestamp(a.left)) : maxAge
        const leftAgeB = b.left ? (currentTime - getFocusedAtTimestamp(b.left)) : maxAge
        const rightAgeA = a.right ? (currentTime - getFocusedAtTimestamp(a.right)) : maxAge
        const rightAgeB = b.right ? (currentTime - getFocusedAtTimestamp(b.right)) : maxAge
        
        const sumA = leftAgeA + rightAgeA
        const sumB = leftAgeB + rightAgeB
        
        return sumA - sumB
      })
    }
    
    return pairsList
  }, [leftCards, rightCards, sortMode])

  const [startIndex, setStartIndex] = useState(0)

  // Reset startIndex when sort mode changes (same as BothVerticalTapes)
  useEffect(() => {
    setStartIndex(0)
  }, [sortMode])

  // Get visible pairs
  const visiblePairs = pairs.slice(startIndex, startIndex + MAX_VISIBLE)
  const totalVisible = visiblePairs.length

  // Draw left circular tape (counter-clockwise from top)
  const drawLeftCircle = (canvas) => {
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvasSize.width / 2
    const height = canvasSize.height

    canvas.width = width
    canvas.height = height

    // Center of circle relative to this canvas
    const centerX = width / 2
    const centerY = height / 2
    const circleRadius = radiusFor(width, height)

    // Background
    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(0, 0, width, height)

    if (totalVisible === 0) {
      ctx.fillStyle = '#666'
      ctx.font = '16px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Person 1', centerX, centerY)
      return
    }

    // Draw circle (guide)
    ctx.strokeStyle = '#ddd'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(centerX, centerY, circleRadius, 0, 2 * Math.PI)
    ctx.stroke()

    // Draw pairs - counter-clockwise from engagement point (rightmost point, angle = 0)
    const angleStep = (2 * Math.PI) / totalVisible
    const offsetRadius = circleRadius + (CARD_WIDTH / 2) * 3/4

    visiblePairs.forEach((pair, idx) => {
      if (!pair.left) return

      // Engagement point is at angle 0 (rightmost point, closest to right circle)
      // Counter-clockwise from engagement point: angle = 0 - idx * angleStep
      const angle = 0 - idx * angleStep
      const cardCenterX = centerX + offsetRadius * Math.cos(angle)
      const cardCenterY = centerY + offsetRadius * Math.sin(angle)

      // Draw full circle
      ctx.fillStyle = pair.left.color || '#85C1E2'
      ctx.beginPath()
      ctx.arc(cardCenterX, cardCenterY, CARD_WIDTH / 2, 0, 2 * Math.PI)
      ctx.fill()

      // Draw border
      let borderColor = '#333'
      let borderWidth = 2
      if (idx === 0) {
        // Engagement point (rightmost point, closest to right circle)
        borderColor = '#FFD700'
        borderWidth = 3
      }

      ctx.strokeStyle = borderColor
      ctx.lineWidth = borderWidth
      ctx.beginPath()
      ctx.arc(cardCenterX, cardCenterY, CARD_WIDTH / 2, 0, 2 * Math.PI)
      ctx.stroke()

      // Draw text
      ctx.fillStyle = '#000'
      ctx.font = '11px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const textRadius = offsetRadius + CARD_WIDTH / 2 + 15
      const textX = centerX + textRadius * Math.cos(angle)
      const textY = centerY + textRadius * Math.sin(angle)
      ctx.fillText(pair.left.name || 'Card', textX, textY)

      // Store position for interaction
      pair.left._canvasX = cardCenterX
      pair.left._canvasY = cardCenterY
      pair.left._angle = angle
      pair.left._pairIdx = idx
    })

    // Draw engagement point indicator at rightmost point (angle = 0)
    ctx.fillStyle = '#FFD700'
    ctx.beginPath()
    ctx.moveTo(centerX + circleRadius + 20, centerY)
    ctx.lineTo(centerX + circleRadius, centerY - 10)
    ctx.lineTo(centerX + circleRadius, centerY + 10)
    ctx.closePath()
    ctx.fill()
  }

  // Draw right circular tape (clockwise from top)
  const drawRightCircle = (canvas) => {
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvasSize.width / 2
    const height = canvasSize.height

    canvas.width = width
    canvas.height = height

    // Center of circle relative to this canvas
    const centerX = width / 2
    const centerY = height / 2
    const circleRadius = radiusFor(width, height)

    // Background
    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(0, 0, width, height)

    if (totalVisible === 0) {
      ctx.fillStyle = '#666'
      ctx.font = '16px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Person 2', centerX, centerY)
      return
    }

    // Draw circle (guide)
    ctx.strokeStyle = '#ddd'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(centerX, centerY, circleRadius, 0, 2 * Math.PI)
    ctx.stroke()

    // Draw pairs - clockwise from engagement point (leftmost point, angle = PI)
    const angleStep = (2 * Math.PI) / totalVisible
    const offsetRadius = circleRadius + (CARD_WIDTH / 2) * 3/4

    visiblePairs.forEach((pair, idx) => {
      if (!pair.right) return

      // Engagement point is at angle PI (leftmost point, closest to left circle)
      // Clockwise from engagement point: angle = PI + idx * angleStep
      const angle = Math.PI + idx * angleStep
      const cardCenterX = centerX + offsetRadius * Math.cos(angle)
      const cardCenterY = centerY + offsetRadius * Math.sin(angle)

      // Draw full circle
      ctx.fillStyle = pair.right.color || '#85C1E2'
      ctx.beginPath()
      ctx.arc(cardCenterX, cardCenterY, CARD_WIDTH / 2, 0, 2 * Math.PI)
      ctx.fill()

      // Draw border
      let borderColor = '#333'
      let borderWidth = 2
      if (idx === 0) {
        // Engagement point (leftmost point, closest to left circle)
        borderColor = '#FFD700'
        borderWidth = 3
      }

      ctx.strokeStyle = borderColor
      ctx.lineWidth = borderWidth
      ctx.beginPath()
      ctx.arc(cardCenterX, cardCenterY, CARD_WIDTH / 2, 0, 2 * Math.PI)
      ctx.stroke()

      // Draw text
      ctx.fillStyle = '#000'
      ctx.font = '11px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const textRadius = offsetRadius + CARD_WIDTH / 2 + 15
      const textX = centerX + textRadius * Math.cos(angle)
      const textY = centerY + textRadius * Math.sin(angle)
      ctx.fillText(pair.right.name || 'Card', textX, textY)

      // Store position for interaction
      pair.right._canvasX = cardCenterX
      pair.right._canvasY = cardCenterY
      pair.right._angle = angle
      pair.right._pairIdx = idx
    })

    // Draw engagement point indicator at leftmost point (angle = PI)
    ctx.fillStyle = '#FFD700'
    ctx.beginPath()
    ctx.moveTo(centerX - circleRadius - 20, centerY)
    ctx.lineTo(centerX - circleRadius, centerY - 10)
    ctx.lineTo(centerX - circleRadius, centerY + 10)
    ctx.closePath()
    ctx.fill()
  }

  // Draw connection lines for pairs
  const drawConnections = (canvas) => {
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvasSize.width
    const height = canvasSize.height

    canvas.width = width
    canvas.height = height

    ctx.clearRect(0, 0, width, height)

    if (totalVisible === 0) return

    const leftCenterX = canvasSize.width / 4
    const rightCenterX = (3 * canvasSize.width) / 4
    const centerY = canvasSize.height / 2
    const circleRadius = radiusFor(canvasSize.width / 2, canvasSize.height)

    const angleStep = (2 * Math.PI) / totalVisible
    const offsetRadius = circleRadius + (CARD_WIDTH / 2) * 3/4

    // Draw lines connecting pairs (only for actual pairs, not null placeholders)
    visiblePairs.forEach((pair, idx) => {
      if (!pair.left || !pair.right) return

      // Left circle: counter-clockwise from engagement point (angle = 0)
      const leftAngle = 0 - idx * angleStep
      const leftX = leftCenterX + offsetRadius * Math.cos(leftAngle)
      const leftY = centerY + offsetRadius * Math.sin(leftAngle)

      // Right circle: clockwise from engagement point (angle = PI)
      const rightAngle = Math.PI + idx * angleStep
      const rightX = rightCenterX + offsetRadius * Math.cos(rightAngle)
      const rightY = centerY + offsetRadius * Math.sin(rightAngle)

      // Draw connection line
      // Highlight engagement point pair (idx === 0) with solid line
      if (idx === 0) {
        // Engagement point pair - solid line (much darker and thicker for better visibility)
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 3
        ctx.setLineDash([])
      } else {
        // Other pairs - dashed line
        ctx.strokeStyle = '#999'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
      }
      ctx.beginPath()
      ctx.moveTo(leftX, leftY)
      ctx.lineTo(rightX, rightY)
      ctx.stroke()
      ctx.setLineDash([])
    })
  }

  // Draw all canvases
  useEffect(() => {
    const leftCanvas = leftCanvasRef.current
    const rightCanvas = rightCanvasRef.current
    const connectionsCanvas = connectionsCanvasRef.current

    if (!leftCanvas || !rightCanvas || !connectionsCanvas) return

    drawLeftCircle(leftCanvas)
    drawRightCircle(rightCanvas)
    drawConnections(connectionsCanvas)
  }, [pairs, visiblePairs, canvasSize, sortMode, startIndex])

  const handleCanvasClick = (canvas, isLeft, e) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    const width = canvasSize.width / 2
    const height = canvasSize.height
    const centerX = width / 2
    const centerY = height / 2
    const circleRadius = radiusFor(width, height)
    const offsetRadius = circleRadius + (CARD_WIDTH / 2) * 3/4
    const angleStep = (2 * Math.PI) / totalVisible

    for (let i = 0; i < visiblePairs.length; i++) {
      const pair = visiblePairs[i]
      const card = isLeft ? pair.left : pair.right
      if (!card) continue

      const angle = isLeft 
        ? (0 - i * angleStep)  // Counter-clockwise from engagement point (angle = 0)
        : (Math.PI + i * angleStep)  // Clockwise from engagement point (angle = PI)

      const cardCenterX = centerX + offsetRadius * Math.cos(angle)
      const cardCenterY = centerY + offsetRadius * Math.sin(angle)

      const dist = Math.sqrt(Math.pow(x - cardCenterX, 2) + Math.pow(y - cardCenterY, 2))
      if (dist < CARD_WIDTH / 2 + 5) {
        // Single click - can be used for selection in the future
        return
      }
    }
  }

  const canPrev = startIndex > 0
  const canNext = startIndex < pairs.length - MAX_VISIBLE

  const handlePrev = () => {
    if (canPrev) {
      setStartIndex(Math.max(0, startIndex - 1))
    }
  }

  const handleNext = () => {
    if (canNext) {
      setStartIndex(Math.min(pairs.length - MAX_VISIBLE, startIndex + 1))
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <button 
          onClick={() => setSortMode('metrics')}
          className={`${styles.button} ${sortMode === 'metrics' ? styles.active : ''}`}
        >
          Sort by Metrics
        </button>
        <button 
          onClick={() => setSortMode('focusedAt')}
          className={`${styles.button} ${sortMode === 'focusedAt' ? styles.active : ''}`}
        >
          Sort by Focus Age
        </button>
        <button onClick={handlePrev} disabled={!canPrev} className={styles.button}>
          ← Previous
        </button>
        <span className={styles.info}>
          Pairs: {pairs.length} | Visible: {totalVisible} | Start: {startIndex}
        </span>
        <button onClick={handleNext} disabled={!canNext} className={styles.button}>
          Next →
        </button>
      </div>
      <div className={styles.canvasContainer}>
        <canvas
          ref={leftCanvasRef}
          className={styles.canvas}
          onClick={(e) => handleCanvasClick(leftCanvasRef.current, true, e)}
          onDoubleClick={(e) => {
            if (visiblePairs.length > 0 && visiblePairs[0].left && onLeftCardEdit) {
              onLeftCardEdit(visiblePairs[0].left)
            }
          }}
          style={{ zIndex: 2 }}
        />
        <canvas
          ref={connectionsCanvasRef}
          className={styles.connectionsCanvas}
          style={{ zIndex: 1 }}
        />
        <canvas
          ref={rightCanvasRef}
          className={styles.canvas}
          onClick={(e) => handleCanvasClick(rightCanvasRef.current, false, e)}
          onDoubleClick={(e) => {
            if (visiblePairs.length > 0 && visiblePairs[0].right && onRightCardEdit) {
              onRightCardEdit(visiblePairs[0].right)
            }
          }}
          style={{ zIndex: 2 }}
        />
      </div>
    </div>
  )
}
