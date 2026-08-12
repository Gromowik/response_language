/**
 * Both Vertical Tapes Component
 * Displays left and right vertical tapes simultaneously
 */

import { useEffect, useRef, useState } from 'react';
import styles from './BothVerticalTapes.module.css';

const BothVerticalTapes = ({ leftCards, rightCards, onLeftCardEdit, onRightCardEdit, onLeftCardsReorder, onRightCardsReorder }) => {
  const leftCanvasRef = useRef(null);
  const rightCanvasRef = useRef(null);
  
  const [leftStartIndex, setLeftStartIndex] = useState(Math.max(0, leftCards.length - 10));
  const [rightStartIndex, setRightStartIndex] = useState(Math.max(0, rightCards.length - 10));
  
  const [canvasHeight, setCanvasHeight] = useState(window.innerHeight);
  
  const [leftSelectedIndex, setLeftSelectedIndex] = useState(null);
  const [rightSelectedIndex, setRightSelectedIndex] = useState(null);
  
  const [leftDragging, setLeftDragging] = useState(null);
  const [rightDragging, setRightDragging] = useState(null);

  const CARD_WIDTH = 80;
  const CARD_SPACING = 20;
  const MAX_VISIBLE = 10;

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setCanvasHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Draw left tape
  useEffect(() => {
    const canvas = leftCanvasRef.current;
    if (!canvas) return;

    const width = window.innerWidth / 2;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, width, height);

    const tapeX = width - 200;
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(tapeX, 0);
    ctx.lineTo(tapeX, height);
    ctx.stroke();

    const visibleCards = leftCards.slice(leftStartIndex, leftStartIndex + MAX_VISIBLE);
    const cardOffsetY = (height - MAX_VISIBLE * (CARD_WIDTH + CARD_SPACING)) / 2;
    const leftFocusIndex = leftStartIndex;

    visibleCards.forEach((card, idx) => {
      const actualIdx = leftStartIndex + idx;
      if (leftDragging && actualIdx === leftDragging.cardIndex) return;

      const x = tapeX;
      const y = cardOffsetY + idx * (CARD_WIDTH + CARD_SPACING);

      ctx.fillStyle = card.color;
      ctx.beginPath();
      ctx.arc(x, y + CARD_WIDTH / 2, CARD_WIDTH / 2, -Math.PI / 2, Math.PI / 2);
      ctx.fill();

      let borderColor = '#333';
      let borderWidth = 2;
      if (actualIdx === leftSelectedIndex) {
        borderColor = '#3498db';
        borderWidth = 4;
      }
      if (actualIdx === leftFocusIndex) {
        borderColor = '#FFD700';
        borderWidth = 3;
      }

      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.beginPath();
      ctx.arc(x, y + CARD_WIDTH / 2, CARD_WIDTH / 2, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();

      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(card.name, x + 70, y + CARD_WIDTH / 2 + 5);

      card._canvasX = x;
      card._canvasY = y;
      card._actualIdx = actualIdx;
    });

    const focusY = cardOffsetY + CARD_WIDTH / 2;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(tapeX + 70, focusY);
    ctx.lineTo(tapeX + 50, focusY - 12);
    ctx.lineTo(tapeX + 50, focusY + 12);
    ctx.closePath();
    ctx.fill();

    if (leftDragging) {
      const draggedCard = leftCards[leftDragging.cardIndex];
      const dragX = leftDragging.currentX;
      const dragY = leftDragging.currentY - CARD_WIDTH / 2;

      ctx.globalAlpha = 0.7;
      ctx.fillStyle = draggedCard.color;
      ctx.beginPath();
      ctx.arc(dragX, dragY + CARD_WIDTH / 2, CARD_WIDTH / 2, -Math.PI / 2, Math.PI / 2);
      ctx.fill();

      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(dragX, dragY + CARD_WIDTH / 2, CARD_WIDTH / 2, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();

      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(draggedCard.name, dragX + 70, dragY + CARD_WIDTH / 2 + 5);
      ctx.globalAlpha = 1.0;
    }
  }, [leftCards, leftStartIndex, canvasHeight, leftSelectedIndex, leftDragging]);

  // Draw right tape
  useEffect(() => {
    const canvas = rightCanvasRef.current;
    if (!canvas) return;

    const width = window.innerWidth / 2;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, width, height);

    const tapeX = 200;
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(tapeX, 0);
    ctx.lineTo(tapeX, height);
    ctx.stroke();

    const visibleCards = rightCards.slice(rightStartIndex, rightStartIndex + MAX_VISIBLE);
    const cardOffsetY = (height - MAX_VISIBLE * (CARD_WIDTH + CARD_SPACING)) / 2;
    const rightFocusIndex = rightStartIndex;

    visibleCards.forEach((card, idx) => {
      const actualIdx = rightStartIndex + idx;
      if (rightDragging && actualIdx === rightDragging.cardIndex) return;

      const x = tapeX;
      const y = cardOffsetY + idx * (CARD_WIDTH + CARD_SPACING);

      ctx.fillStyle = card.color;
      ctx.beginPath();
      ctx.arc(x, y + CARD_WIDTH / 2, CARD_WIDTH / 2, Math.PI / 2, 3 * Math.PI / 2);
      ctx.fill();

      let borderColor = '#333';
      let borderWidth = 2;
      if (actualIdx === rightSelectedIndex) {
        borderColor = '#3498db';
        borderWidth = 4;
      }
      if (actualIdx === rightFocusIndex) {
        borderColor = '#FFD700';
        borderWidth = 3;
      }

      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.beginPath();
      ctx.arc(x, y + CARD_WIDTH / 2, CARD_WIDTH / 2, Math.PI / 2, 3 * Math.PI / 2);
      ctx.stroke();

      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(card.name, x - 70, y + CARD_WIDTH / 2 + 5);

      card._canvasX = x;
      card._canvasY = y;
      card._actualIdx = actualIdx;
    });

    const focusY = cardOffsetY + CARD_WIDTH / 2;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(tapeX - 70, focusY);
    ctx.lineTo(tapeX - 50, focusY - 12);
    ctx.lineTo(tapeX - 50, focusY + 12);
    ctx.closePath();
    ctx.fill();

    if (rightDragging) {
      const draggedCard = rightCards[rightDragging.cardIndex];
      const dragX = rightDragging.currentX;
      const dragY = rightDragging.currentY - CARD_WIDTH / 2;

      ctx.globalAlpha = 0.7;
      ctx.fillStyle = draggedCard.color;
      ctx.beginPath();
      ctx.arc(dragX, dragY + CARD_WIDTH / 2, CARD_WIDTH / 2, Math.PI / 2, 3 * Math.PI / 2);
      ctx.fill();

      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(dragX, dragY + CARD_WIDTH / 2, CARD_WIDTH / 2, Math.PI / 2, 3 * Math.PI / 2);
      ctx.stroke();

      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(draggedCard.name, dragX - 70, dragY + CARD_WIDTH / 2 + 5);
      ctx.globalAlpha = 1.0;
    }
  }, [rightCards, rightStartIndex, canvasHeight, rightSelectedIndex, rightDragging]);

  // Mouse handlers for left tape
  const handleLeftMouseDown = (e) => {
    const canvas = leftCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const visibleCards = leftCards.slice(leftStartIndex, leftStartIndex + MAX_VISIBLE);
    for (let i = 0; i < visibleCards.length; i++) {
      const card = visibleCards[i];
      const dist = Math.sqrt(
        Math.pow(x - card._canvasX, 2) +
        Math.pow(y - (card._canvasY + CARD_WIDTH / 2), 2)
      );

      if (dist < CARD_WIDTH / 2 + 5) {
        setLeftDragging({
          cardIndex: card._actualIdx,
          currentX: x,
          currentY: y,
          startTime: Date.now()
        });
        setLeftSelectedIndex(card._actualIdx);
        break;
      }
    }
  };

  const handleLeftMouseMove = (e) => {
    if (!leftDragging) return;
    const canvas = leftCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    setLeftDragging({
      ...leftDragging,
      currentX: e.clientX - rect.left,
      currentY: e.clientY - rect.top
    });
  };

  const handleLeftMouseUp = (e) => {
    if (!leftDragging) return;

    const timeDiff = Date.now() - leftDragging.startTime;
    if (timeDiff < 200) {
      if (e.detail === 2) {
        onLeftCardEdit(leftCards[leftDragging.cardIndex]);
      }
      setLeftDragging(null);
      return;
    }

    const canvas = leftCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = canvasHeight;
    const cardOffsetY = (height - MAX_VISIBLE * (CARD_WIDTH + CARD_SPACING)) / 2;
    const relativeY = y - cardOffsetY;
    const dropSlot = Math.round(relativeY / (CARD_WIDTH + CARD_SPACING));
    const newPosition = leftStartIndex + Math.max(0, Math.min(dropSlot, MAX_VISIBLE - 1));

    if (newPosition !== leftDragging.cardIndex && onLeftCardsReorder) {
      const newCards = [...leftCards];
      const [draggedCard] = newCards.splice(leftDragging.cardIndex, 1);
      newCards.splice(newPosition, 0, draggedCard);
      onLeftCardsReorder(newCards);
    }

    setLeftDragging(null);
  };

  // Mouse handlers for right tape
  const handleRightMouseDown = (e) => {
    const canvas = rightCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const visibleCards = rightCards.slice(rightStartIndex, rightStartIndex + MAX_VISIBLE);
    for (let i = 0; i < visibleCards.length; i++) {
      const card = visibleCards[i];
      const dist = Math.sqrt(
        Math.pow(x - card._canvasX, 2) +
        Math.pow(y - (card._canvasY + CARD_WIDTH / 2), 2)
      );

      if (dist < CARD_WIDTH / 2 + 5) {
        setRightDragging({
          cardIndex: card._actualIdx,
          currentX: x,
          currentY: y,
          startTime: Date.now()
        });
        setRightSelectedIndex(card._actualIdx);
        break;
      }
    }
  };

  const handleRightMouseMove = (e) => {
    if (!rightDragging) return;
    const canvas = rightCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    setRightDragging({
      ...rightDragging,
      currentX: e.clientX - rect.left,
      currentY: e.clientY - rect.top
    });
  };

  const handleRightMouseUp = (e) => {
    if (!rightDragging) return;

    const timeDiff = Date.now() - rightDragging.startTime;
    if (timeDiff < 200) {
      if (e.detail === 2) {
        onRightCardEdit(rightCards[rightDragging.cardIndex]);
      }
      setRightDragging(null);
      return;
    }

    const canvas = rightCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = canvasHeight;
    const cardOffsetY = (height - MAX_VISIBLE * (CARD_WIDTH + CARD_SPACING)) / 2;
    const relativeY = y - cardOffsetY;
    const dropSlot = Math.round(relativeY / (CARD_WIDTH + CARD_SPACING));
    const newPosition = rightStartIndex + Math.max(0, Math.min(dropSlot, MAX_VISIBLE - 1));

    if (newPosition !== rightDragging.cardIndex && onRightCardsReorder) {
      const newCards = [...rightCards];
      const [draggedCard] = newCards.splice(rightDragging.cardIndex, 1);
      newCards.splice(newPosition, 0, draggedCard);
      onRightCardsReorder(newCards);
    }

    setRightDragging(null);
  };

  // Scroll controls
  const canLeftScrollUp = leftStartIndex > 0;
  const canLeftScrollDown = leftStartIndex < leftCards.length - MAX_VISIBLE;
  const canRightScrollUp = rightStartIndex > 0;
  const canRightScrollDown = rightStartIndex < rightCards.length - MAX_VISIBLE;

  return (
    <div className={styles.container}>
      <div className={styles.leftSide}>
        <div className={styles.leftControls}>
          <button onClick={() => setLeftStartIndex(Math.max(0, leftStartIndex - 1))} disabled={!canLeftScrollUp}>↑ Up</button>
          <button onClick={() => setLeftStartIndex(Math.min(leftCards.length - MAX_VISIBLE, leftStartIndex + 1))} disabled={!canLeftScrollDown}>Down ↓</button>
          <span className={styles.info}>Left: {leftCards.length} cards</span>
        </div>
        <canvas
          ref={leftCanvasRef}
          className={styles.canvas}
          onMouseDown={handleLeftMouseDown}
          onMouseMove={handleLeftMouseMove}
          onMouseUp={handleLeftMouseUp}
          onMouseLeave={handleLeftMouseUp}
          style={{ cursor: leftDragging ? 'grabbing' : 'pointer' }}
        />
      </div>

      <div className={styles.rightSide}>
        <div className={styles.rightControls}>
          <button onClick={() => setRightStartIndex(Math.max(0, rightStartIndex - 1))} disabled={!canRightScrollUp}>↑ Up</button>
          <button onClick={() => setRightStartIndex(Math.min(rightCards.length - MAX_VISIBLE, rightStartIndex + 1))} disabled={!canRightScrollDown}>Down ↓</button>
          <span className={styles.info}>Right: {rightCards.length} cards</span>
        </div>
        <canvas
          ref={rightCanvasRef}
          className={styles.canvas}
          onMouseDown={handleRightMouseDown}
          onMouseMove={handleRightMouseMove}
          onMouseUp={handleRightMouseUp}
          onMouseLeave={handleRightMouseUp}
          style={{ cursor: rightDragging ? 'grabbing' : 'pointer' }}
        />
      </div>
    </div>
  );
};

export default BothVerticalTapes;

