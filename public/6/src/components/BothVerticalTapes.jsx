/**
 * Both Vertical Tapes Component
 * Displays left and right vertical tapes simultaneously
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import styles from './BothVerticalTapes.module.css';

const BothVerticalTapes = ({ leftCards, rightCards, onLeftCardEdit, onRightCardEdit, onLeftCardsReorder, onRightCardsReorder }) => {
  const leftCanvasRef = useRef(null);
  const rightCanvasRef = useRef(null);
  const connectionsCanvasRef = useRef(null);
  
  // Helper function to calculate sum of IN + OUT for sorting
  const getMetricSum = (card) => {
    return (card.metrics?.in || 0) + (card.metrics?.out || 0);
  };

  // Build paired structure: use left cards as base, match pairs on right
  const { left: sortedLeftCards, right: sortedRightCards } = useMemo(() => {
    // Sort left cards by sum of IN + OUT (descending)
    const sortedLeft = [...leftCards].sort((a, b) => getMetricSum(b) - getMetricSum(a));
    
    // Build paired arrays
    const pairedLeft = [];
    const pairedRight = [];
    const usedRightIds = new Set();
    
    // First, add all left cards with their pairs
    sortedLeft.forEach(leftCard => {
      pairedLeft.push(leftCard);
      
      // Find its pair on right
      let pair = null;
      if (leftCard.type === 'generated' || leftCard.type === 'internalReflection') {
        // Find external reflection on right
        pair = rightCards.find(rc => rc.reflectionOf === leftCard.id);
      } else if (leftCard.type === 'externalReflection' && leftCard.reflectionOf) {
        // Find source on right
        pair = rightCards.find(rc => rc.id === leftCard.reflectionOf);
      }
      
      if (pair) {
        pairedRight.push(pair);
        usedRightIds.add(pair.id);
      } else {
        // No pair found, add placeholder
        pairedRight.push(null);
      }
    });
    
    // Add remaining right cards that don't have pairs (shouldn't happen, but just in case)
    rightCards.forEach(rightCard => {
      if (!usedRightIds.has(rightCard.id)) {
        pairedLeft.push(null);
        pairedRight.push(rightCard);
      }
    });
    
    return { left: pairedLeft, right: pairedRight };
  }, [leftCards, rightCards]);
  
  const maxCards = Math.max(sortedLeftCards.length, sortedRightCards.length);
  const [startIndex, setStartIndex] = useState(Math.max(0, maxCards - 10));
  
  const [canvasHeight, setCanvasHeight] = useState(window.innerHeight);
  
  const [leftSelectedIndex, setLeftSelectedIndex] = useState(null);
  const [rightSelectedIndex, setRightSelectedIndex] = useState(null);

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

    const tapeX = width - 300;
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(tapeX, 0);
    ctx.lineTo(tapeX, height);
    ctx.stroke();

    const visibleCards = sortedLeftCards.slice(startIndex, startIndex + MAX_VISIBLE);
    const cardOffsetY = (height - MAX_VISIBLE * (CARD_WIDTH + CARD_SPACING)) / 2;

    visibleCards.forEach((card, idx) => {
      if (!card) return; // Skip null placeholders
      const actualIdx = startIndex + idx;

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
      if (actualIdx === startIndex) {
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

      // Draw IN vector (to the left)
      const inValue = card.metrics?.in || 0;
      const maxVectorLength = 300; // Half the distance between planes (600 / 2)
      const vectorLength = (inValue / 10) * maxVectorLength;
      
      if (vectorLength > 0) {
        const cardCenterY = y + CARD_WIDTH / 2;
        const vectorStartX = x - CARD_WIDTH / 2; // Left edge of the card
        const vectorEndX = vectorStartX - vectorLength;
        
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(vectorStartX, cardCenterY);
        ctx.lineTo(vectorEndX, cardCenterY);
        ctx.stroke();
        
        // Draw arrowhead
        ctx.beginPath();
        ctx.moveTo(vectorEndX, cardCenterY);
        ctx.lineTo(vectorEndX + 8, cardCenterY - 4);
        ctx.lineTo(vectorEndX + 8, cardCenterY + 4);
        ctx.closePath();
        ctx.fillStyle = '#666';
        ctx.fill();
      }

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
  }, [sortedLeftCards, startIndex, canvasHeight, leftSelectedIndex]);

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

    const tapeX = 300;
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(tapeX, 0);
    ctx.lineTo(tapeX, height);
    ctx.stroke();

    const visibleCards = sortedRightCards.slice(startIndex, startIndex + MAX_VISIBLE);
    const cardOffsetY = (height - MAX_VISIBLE * (CARD_WIDTH + CARD_SPACING)) / 2;

    visibleCards.forEach((card, idx) => {
      if (!card) return; // Skip null placeholders
      const actualIdx = startIndex + idx;

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
      if (actualIdx === startIndex) {
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

      // Draw IN vector (to the right)
      const inValue = card.metrics?.in || 0;
      const maxVectorLength = 300; // Half the distance between planes (600 / 2)
      const vectorLength = (inValue / 10) * maxVectorLength;
      
      if (vectorLength > 0) {
        const cardCenterY = y + CARD_WIDTH / 2;
        const vectorStartX = x + CARD_WIDTH / 2; // Right edge of the card
        const vectorEndX = vectorStartX + vectorLength;
        
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(vectorStartX, cardCenterY);
        ctx.lineTo(vectorEndX, cardCenterY);
        ctx.stroke();
        
        // Draw arrowhead
        ctx.beginPath();
        ctx.moveTo(vectorEndX, cardCenterY);
        ctx.lineTo(vectorEndX - 8, cardCenterY - 4);
        ctx.lineTo(vectorEndX - 8, cardCenterY + 4);
        ctx.closePath();
        ctx.fillStyle = '#666';
        ctx.fill();
      }

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
  }, [sortedRightCards, startIndex, canvasHeight, rightSelectedIndex]);

  // Draw connection lines between paired objects
  useEffect(() => {
    const canvas = connectionsCanvasRef.current;
    if (!canvas) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    // Draw lines for pairs (they are already aligned by index)
    const pairs = [];
    sortedLeftCards.forEach((leftCard, index) => {
      const rightCard = sortedRightCards[index];
      if (leftCard && rightCard) {
        // Check if they are actually a pair
        const isPair = 
          (leftCard.type === 'generated' || leftCard.type === 'internalReflection') && rightCard.reflectionOf === leftCard.id ||
          (leftCard.type === 'externalReflection' && leftCard.reflectionOf === rightCard.id) ||
          (rightCard.type === 'generated' || rightCard.type === 'internalReflection') && leftCard.reflectionOf === rightCard.id ||
          (rightCard.type === 'externalReflection' && rightCard.reflectionOf === leftCard.id);
        
        if (isPair) {
          pairs.push({ leftIndex: index, rightIndex: index });
        }
      }
    });

    // Draw lines for visible pairs
    const leftWidth = width / 2;
    const rightWidth = width / 2;
    const leftTapeX = leftWidth - 300;
    const rightTapeX = 300;
    const cardOffsetY = (height - MAX_VISIBLE * (CARD_WIDTH + CARD_SPACING)) / 2;

    pairs.forEach(pair => {
      // Both cards are at the same index (already aligned)
      const cardIndex = pair.leftIndex;
      
      // Check if both are visible
      const isVisible = cardIndex >= startIndex && cardIndex < startIndex + MAX_VISIBLE;

      if (isVisible) {
        const y = cardOffsetY + (cardIndex - startIndex) * (CARD_WIDTH + CARD_SPACING) + CARD_WIDTH / 2;

        // Draw line (horizontal since both are at same Y)
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(leftTapeX + CARD_WIDTH / 2, y);
        ctx.lineTo(leftWidth + rightTapeX - CARD_WIDTH / 2, y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
  }, [sortedLeftCards, sortedRightCards, startIndex, canvasHeight]);

  // Mouse handlers for both tapes (only for double-click editing)
  const handleLeftDoubleClick = (e) => {
    const canvas = leftCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const visibleCards = sortedLeftCards.slice(startIndex, startIndex + MAX_VISIBLE);
    for (let i = 0; i < visibleCards.length; i++) {
      const card = visibleCards[i];
      const dist = Math.sqrt(
        Math.pow(x - card._canvasX, 2) +
        Math.pow(y - (card._canvasY + CARD_WIDTH / 2), 2)
      );

      if (dist < CARD_WIDTH / 2 + 5) {
        onLeftCardEdit(card);
        break;
      }
    }
  };

  const handleRightDoubleClick = (e) => {
    const canvas = rightCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const visibleCards = sortedRightCards.slice(startIndex, startIndex + MAX_VISIBLE);
    for (let i = 0; i < visibleCards.length; i++) {
      const card = visibleCards[i];
      const dist = Math.sqrt(
        Math.pow(x - card._canvasX, 2) +
        Math.pow(y - (card._canvasY + CARD_WIDTH / 2), 2)
      );

      if (dist < CARD_WIDTH / 2 + 5) {
        onRightCardEdit(card);
        break;
      }
    }
  };

  // Common scroll controls (both tapes scroll together)
  const canScrollUp = startIndex > 0;
  const canScrollDown = startIndex < maxCards - MAX_VISIBLE;

  return (
    <div className={styles.container}>
      {/* Common controls for both tapes */}
      <div className={styles.commonControls}>
        <button onClick={() => setStartIndex(Math.max(0, startIndex - 1))} disabled={!canScrollUp}>↑ Up</button>
        <span className={styles.info}>
          Left: {sortedLeftCards.length} cards | Right: {sortedRightCards.length} cards | Sorted by IN+OUT
        </span>
        <button onClick={() => setStartIndex(Math.min(maxCards - MAX_VISIBLE, startIndex + 1))} disabled={!canScrollDown}>Down ↓</button>
      </div>

      <div className={styles.tapeContainer}>
        <div className={styles.leftSide}>
          <canvas
            ref={leftCanvasRef}
            className={styles.canvas}
            onDoubleClick={handleLeftDoubleClick}
            style={{ cursor: 'pointer' }}
          />
        </div>

        <div className={styles.rightSide}>
          <canvas
            ref={rightCanvasRef}
            className={styles.canvas}
            onDoubleClick={handleRightDoubleClick}
            style={{ cursor: 'pointer' }}
          />
        </div>
        
        {/* Connection lines canvas */}
        <canvas
          ref={connectionsCanvasRef}
          className={styles.connectionsCanvas}
          style={{ pointerEvents: 'none' }}
        />
      </div>
    </div>
  );
};

export default BothVerticalTapes;

