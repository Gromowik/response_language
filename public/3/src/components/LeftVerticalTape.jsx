/**
 * Left Vertical Tape Component
 * Similar to VerticalTape but on the left side of screen
 * with semicircles pointing right (inward)
 */

import { useEffect, useRef, useState } from 'react';
import styles from './LeftVerticalTape.module.css';

const LeftVerticalTape = ({ cards, onCardEdit, onCardsReorder }) => {
  const canvasRef = useRef(null);
  const [startIndex, setStartIndex] = useState(Math.max(0, cards.length - 10));
  const [canvasHeight, setCanvasHeight] = useState(window.innerHeight);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [dragging, setDragging] = useState(null);

  const CARD_WIDTH = 80;
  const CARD_SPACING = 20;
  const MAX_VISIBLE = 10;

  // Focus is always on the topmost (first visible) card
  const focusIndex = startIndex;

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setCanvasHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Draw the vertical tape and cards
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size to full screen height and width
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, width, height);

    // Draw tape line (vertical) on the left side
    const tapeX = 150;
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(tapeX, 0);
    ctx.lineTo(tapeX, height);
    ctx.stroke();

    // Calculate visible cards based on startIndex
    const visibleCards = cards.slice(startIndex, startIndex + MAX_VISIBLE);
    const cardOffsetY = (height - MAX_VISIBLE * (CARD_WIDTH + CARD_SPACING)) / 2;

    // Draw cards (semicircles pointing right from the tape)
    visibleCards.forEach((card, idx) => {
      const actualIdx = startIndex + idx;

      // Skip drawing if this card is being dragged
      if (dragging && actualIdx === dragging.cardIndex) {
        return;
      }

      const x = tapeX;
      const y = cardOffsetY + idx * (CARD_WIDTH + CARD_SPACING);

      // Draw semicircle pointing right (perpendicular to tape, base on tape)
      ctx.fillStyle = card.color;
      ctx.beginPath();
      ctx.arc(x, y + CARD_WIDTH / 2, CARD_WIDTH / 2, -Math.PI / 2, Math.PI / 2);
      ctx.fill();

      // Draw border
      let borderColor = '#333';
      let borderWidth = 2;

      if (actualIdx === selectedIndex) {
        borderColor = '#3498db';
        borderWidth = 4;
      }
      if (actualIdx === focusIndex) {
        borderColor = '#FFD700';
        borderWidth = 3;
      }

      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.beginPath();
      ctx.arc(x, y + CARD_WIDTH / 2, CARD_WIDTH / 2, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();

      // Draw text
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(card.name, x + 70, y + CARD_WIDTH / 2 + 5);

      // Store card position for mouse interaction
      card._canvasX = x;
      card._canvasY = y;
      card._canvasRadius = CARD_WIDTH / 2;
      card._actualIdx = actualIdx;
    });

    // Draw focus indicator (triangle pointing left at the top card)
    const focusY = cardOffsetY + CARD_WIDTH / 2;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(tapeX + 70, focusY);
    ctx.lineTo(tapeX + 50, focusY - 12);
    ctx.lineTo(tapeX + 50, focusY + 12);
    ctx.closePath();
    ctx.fill();

    // Draw dragged card at mouse position
    if (dragging) {
      const draggedCard = cards[dragging.cardIndex];
      const dragX = dragging.currentX;
      const dragY = dragging.currentY - CARD_WIDTH / 2;

      ctx.globalAlpha = 0.7;

      // Draw semicircle
      ctx.fillStyle = draggedCard.color;
      ctx.beginPath();
      ctx.arc(dragX, dragY + CARD_WIDTH / 2, CARD_WIDTH / 2, -Math.PI / 2, Math.PI / 2);
      ctx.fill();

      // Draw border
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(dragX, dragY + CARD_WIDTH / 2, CARD_WIDTH / 2, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();

      // Draw text
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(draggedCard.name, dragX + 70, dragY + CARD_WIDTH / 2 + 5);

      ctx.globalAlpha = 1.0;
    }
  }, [cards, startIndex, canvasHeight, selectedIndex, dragging]);

  // Mouse handlers for dragging
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const visibleCards = cards.slice(startIndex, startIndex + MAX_VISIBLE);
    for (let i = 0; i < visibleCards.length; i++) {
      const card = visibleCards[i];
      const dist = Math.sqrt(
        Math.pow(x - card._canvasX, 2) +
        Math.pow(y - (card._canvasY + CARD_WIDTH / 2), 2)
      );

      if (dist < CARD_WIDTH / 2 + 5) {
        setDragging({
          cardIndex: card._actualIdx,
          offsetX: x - card._canvasX,
          offsetY: y - (card._canvasY + CARD_WIDTH / 2),
          currentX: x,
          currentY: y,
          startTime: Date.now()
        });
        setSelectedIndex(card._actualIdx);
        break;
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDragging({
      ...dragging,
      currentX: x,
      currentY: y
    });
  };

  const handleMouseUp = (e) => {
    if (!dragging) return;

    const timeDiff = Date.now() - dragging.startTime;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;

    const distMoved = Math.sqrt(
      Math.pow((e.clientX - rect.left) - dragging.currentX, 2) +
      Math.pow(y - dragging.currentY, 2)
    );

    if (timeDiff < 200 && distMoved < 5) {
      const clickedCard = cards[dragging.cardIndex];
      if (e.detail === 2) {
        onCardEdit(clickedCard);
      }
      setDragging(null);
      return;
    }

    // Calculate drop position based on y coordinate
    const height = canvasHeight;
    const cardOffsetY = (height - MAX_VISIBLE * (CARD_WIDTH + CARD_SPACING)) / 2;
    const relativeY = y - cardOffsetY;
    const dropSlot = Math.round(relativeY / (CARD_WIDTH + CARD_SPACING));
    const newPosition = startIndex + Math.max(0, Math.min(dropSlot, MAX_VISIBLE - 1));

    if (newPosition !== dragging.cardIndex && onCardsReorder) {
      const newCards = [...cards];
      const [draggedCard] = newCards.splice(dragging.cardIndex, 1);
      newCards.splice(newPosition, 0, draggedCard);
      onCardsReorder(newCards);
    }

    setDragging(null);
  };

  // Scroll controls
  const canScrollUp = startIndex > 0;
  const canScrollDown = startIndex < cards.length - MAX_VISIBLE;

  const scrollUp = () => {
    if (canScrollUp) {
      setStartIndex(Math.max(0, startIndex - 1));
    }
  };

  const scrollDown = () => {
    if (canScrollDown) {
      setStartIndex(Math.min(cards.length - MAX_VISIBLE, startIndex + 1));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <button onClick={scrollUp} disabled={!canScrollUp}>↑ Up</button>
        <button onClick={scrollDown} disabled={!canScrollDown}>Down ↓</button>
        <span className={styles.info}>
          {cards.length} cards | Focus: #{focusIndex + 1}
          {selectedIndex !== null && ` | Sel: #${selectedIndex + 1}`}
        </span>
      </div>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: dragging ? 'grabbing' : 'pointer' }}
      />
    </div>
  );
};

export default LeftVerticalTape;
