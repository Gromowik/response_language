/**
 * Vertical Tape Component (Right Vertical - Person 2)
 * Shows two vertical tapes: left (own order from horizontal tape) and right (sorted as in Both Vertical)
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import styles from './VerticalTape.module.css';

const VerticalTape = ({ cards, otherCards, onCardEdit, onCardsReorder }) => {
  const leftCanvasRef = useRef(null);
  const rightCanvasRef = useRef(null);
  const specialFocusCanvasRef = useRef(null);
  
  // Sort mode: 'metrics' (by IN+OUT) or 'focusedAt' (by sum of focusedAt timestamps)
  const [sortMode, setSortMode] = useState('metrics');
  
  // Vector mode: 'in' (shows own satisfaction) or 'out' (shows partner's response)
  const [vectorMode, setVectorMode] = useState('in');

  // Helper function to calculate sum of IN + OUT for sorting
  const getMetricSum = (card) => {
    return (card.metrics?.in || 0) + (card.metrics?.out || 0);
  };

  // Helper function to get focusedAt timestamp
  const getFocusedAtTimestamp = (card) => {
    return card.focusedAt || 0;
  };

  // Helper function to find pair for a card (Person 2 card -> Person 1 card)
  const findPair = (card, otherCardsList) => {
    if (card.type === 'generated' || card.type === 'internalReflection') {
      return otherCardsList.find(oc => oc.reflectionOf === card.id);
    } else if (card.type === 'externalReflection' && card.reflectionOf) {
      return otherCardsList.find(oc => oc.id === card.reflectionOf);
    }
    return null;
  };

  // Left tape: own order (as in horizontal tape) - no sorting
  const leftTapeCards = useMemo(() => [...cards], [cards]);

  // Right tape: sorted as in Both Vertical (using pairs for sorting, but no pair connections)
  const rightTapeCards = useMemo(() => {
    if (!otherCards || otherCards.length === 0) {
      // If no other cards, just return original order
      return [...cards];
    }

    // Build pairs for sorting (similar to BothVerticalTapes)
    const pairs = [];
    const usedOtherIds = new Set();

    cards.forEach(card => {
      const pair = findPair(card, otherCards);
      if (pair) {
        pairs.push({ current: card, pair });
        usedOtherIds.add(pair.id);
      } else {
        pairs.push({ current: card, pair: null });
      }
    });

    // Sort pairs based on selected mode
    if (sortMode === 'metrics') {
      pairs.sort((a, b) => {
        const sumA = getMetricSum(a.current);
        const sumB = getMetricSum(b.current);
        return sumB - sumA; // Descending
      });
    } else if (sortMode === 'focusedAt') {
      const currentTime = Date.now();
      const maxAge = currentTime;
      
      pairs.sort((a, b) => {
        const currentAgeA = currentTime - getFocusedAtTimestamp(a.current);
        const currentAgeB = currentTime - getFocusedAtTimestamp(b.current);
        const pairAgeA = a.pair ? (currentTime - getFocusedAtTimestamp(a.pair)) : maxAge;
        const pairAgeB = b.pair ? (currentTime - getFocusedAtTimestamp(b.pair)) : maxAge;
        
        const sumA = currentAgeA + pairAgeA;
        const sumB = currentAgeB + pairAgeB;
        return sumA - sumB; // Ascending
      });
    }

    // Extract sorted cards
    return pairs.map(p => p.current);
  }, [cards, otherCards, sortMode]);

  const maxCards = Math.max(leftTapeCards.length, rightTapeCards.length);
  const [startIndex, setStartIndex] = useState(Math.max(0, maxCards - 10));
  const [canvasHeight, setCanvasHeight] = useState(window.innerHeight);
  const [leftSelectedIndex, setLeftSelectedIndex] = useState(null);
  const [rightSelectedIndex, setRightSelectedIndex] = useState(null);
  const [leftDragging, setLeftDragging] = useState(null);
  const [specialFocusCardId, setSpecialFocusCardId] = useState(null);

  // Reset scroll index when sort mode changes
  useEffect(() => {
    setStartIndex(0);
  }, [sortMode]);

  const CARD_WIDTH = 80;
  const CARD_SPACING = 20;
  const MAX_VISIBLE = 10;

  // Focus is always on the topmost (first visible) card on left tape
  const focusIndex = startIndex;

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setCanvasHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Draw left tape (own order)
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

    const visibleCards = leftTapeCards.slice(startIndex, startIndex + MAX_VISIBLE);
    const cardOffsetY = (height - MAX_VISIBLE * (CARD_WIDTH + CARD_SPACING)) / 2;

    visibleCards.forEach((card, idx) => {
      if (!card) return;
      const actualIdx = startIndex + idx;

      // Skip drawing if this card is being dragged
      if (leftDragging && actualIdx === leftDragging.cardIndex) {
        return;
      }

      const x = tapeX;
      const y = cardOffsetY + idx * (CARD_WIDTH + CARD_SPACING);

      // Draw semicircle pointing left
      ctx.fillStyle = card.color;
      ctx.beginPath();
      ctx.arc(x, y + CARD_WIDTH / 2, CARD_WIDTH / 2, Math.PI / 2, 3 * Math.PI / 2);
      ctx.fill();

      // Draw border
      let borderColor = '#333';
      let borderWidth = 2;

      if (actualIdx === leftSelectedIndex) {
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
      ctx.arc(x, y + CARD_WIDTH / 2, CARD_WIDTH / 2, Math.PI / 2, 3 * Math.PI / 2);
      ctx.stroke();

      // Draw text
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(card.name, x - 70, y + CARD_WIDTH / 2 + 5);

      // Store card position for mouse interaction
      card._canvasX = x;
      card._canvasY = y;
      card._actualIdx = actualIdx;
    });

    // Draw focus indicator (triangle pointing down at the top card)
    const focusY = cardOffsetY + CARD_WIDTH / 2;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(tapeX - 70, focusY);
    ctx.lineTo(tapeX - 50, focusY - 12);
    ctx.lineTo(tapeX - 50, focusY + 12);
    ctx.closePath();
    ctx.fill();

    // Draw dragged card at mouse position
    if (leftDragging) {
      const draggedCard = leftTapeCards[leftDragging.cardIndex];
      const dragX = leftDragging.currentX;
      const dragY = leftDragging.currentY - CARD_WIDTH / 2;

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
  }, [leftTapeCards, startIndex, canvasHeight, leftSelectedIndex, leftDragging]);

  // Draw right tape (sorted as in Both Vertical)
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

    const visibleCards = rightTapeCards.slice(startIndex, startIndex + MAX_VISIBLE);
    const cardOffsetY = (height - MAX_VISIBLE * (CARD_WIDTH + CARD_SPACING)) / 2;

    visibleCards.forEach((card, idx) => {
      if (!card) return;
      const actualIdx = startIndex + idx;

      const x = tapeX;
      const y = cardOffsetY + idx * (CARD_WIDTH + CARD_SPACING);

      // Draw semicircle pointing right (objects on the right side of the line, like Both Vertical right tape)
      ctx.fillStyle = card.color;
      ctx.beginPath();
      ctx.arc(x, y + CARD_WIDTH / 2, CARD_WIDTH / 2, Math.PI / 2, 3 * Math.PI / 2);
      ctx.fill();

      // Draw border
      let borderColor = '#333';
      let borderWidth = 2;

      if (actualIdx === rightSelectedIndex) {
        borderColor = '#3498db';
        borderWidth = 4;
      }

      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.beginPath();
      ctx.arc(x, y + CARD_WIDTH / 2, CARD_WIDTH / 2, Math.PI / 2, 3 * Math.PI / 2);
      ctx.stroke();

      // Draw text (to the right of the tape, where semicircle is open)
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(card.name, x - 70, y + CARD_WIDTH / 2 + 5);

      // Draw vector (IN or OUT) to the right, outward from the object
      // Object is on the left side of the line, vector goes right (outward) for right tape
      const metricValue = vectorMode === 'out' ? (card.metrics?.out || 0) : (card.metrics?.in || 0);
      const maxVectorLength = 300;
      const vectorLength = (metricValue / 10) * maxVectorLength;
      
      if (vectorLength > 0) {
        const cardCenterY = y + CARD_WIDTH / 2;
        // Vector starts from the right edge of the object (where it touches the line) and goes right (outward)
        const vectorStartX = x; // Right edge of the semicircle (touches the line at tapeX)
        const vectorEndX = vectorStartX + vectorLength; // Goes right (outward)
        
        // Different color for OUT vectors to distinguish them
        ctx.strokeStyle = vectorMode === 'out' ? '#9b59b6' : '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(vectorStartX, cardCenterY);
        ctx.lineTo(vectorEndX, cardCenterY);
        ctx.stroke();
        
        // Draw arrowhead (pointing right)
        ctx.beginPath();
        ctx.moveTo(vectorEndX, cardCenterY);
        ctx.lineTo(vectorEndX - 8, cardCenterY - 4);
        ctx.lineTo(vectorEndX - 8, cardCenterY + 4);
        ctx.closePath();
        ctx.fillStyle = vectorMode === 'out' ? '#9b59b6' : '#666';
        ctx.fill();
      }

      // Store card position for mouse interaction
      card._canvasX = x;
      card._canvasY = y;
      card._actualIdx = actualIdx;
    });

  }, [rightTapeCards, startIndex, canvasHeight, rightSelectedIndex, vectorMode]);

  // Draw special focus on overlay canvas (centered between planes)
  useEffect(() => {
    const canvas = specialFocusCanvasRef.current;
    if (!canvas) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    // Draw special focus (circle at center between planes)
    const specialCard = specialFocusCardId ? rightTapeCards.find(c => c.id === specialFocusCardId) : null;
    if (specialCard) {
      // Center between planes = window.innerWidth / 2
      const centerX = width / 2;
      const specialY = 50;
      
      ctx.fillStyle = specialCard.color;
      ctx.beginPath();
      ctx.arc(centerX, specialY, CARD_WIDTH / 2, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.strokeStyle = '#9B59B6';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(centerX, specialY, CARD_WIDTH / 2, 0, 2 * Math.PI);
      ctx.stroke();
      
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(specialCard.name, centerX, specialY + 5);
      
      // Store absolute position for mouse interaction
      specialCard._specialFocusXAbsolute = centerX;
      specialCard._specialFocusY = specialY;
      specialCard._specialFocusRadius = CARD_WIDTH / 2;
    }
  }, [specialFocusCardId, rightTapeCards]);

  // Mouse handlers for left tape (drag & drop)
  const handleLeftMouseDown = (e) => {
    // Stop event propagation to prevent overlay canvas from intercepting
    e.stopPropagation();
    
    const canvas = leftCanvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const visibleCards = leftTapeCards.slice(startIndex, startIndex + MAX_VISIBLE);
    for (let i = 0; i < visibleCards.length; i++) {
      const card = visibleCards[i];
      if (!card || !card._canvasX) continue;
      
      const dist = Math.sqrt(
        Math.pow(x - card._canvasX, 2) +
        Math.pow(y - (card._canvasY + CARD_WIDTH / 2), 2)
      );

      if (dist < CARD_WIDTH / 2 + 5) {
        setLeftDragging({
          cardIndex: card._actualIdx,
          offsetX: x - card._canvasX,
          offsetY: y - (card._canvasY + CARD_WIDTH / 2),
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
    
    e.stopPropagation();

    const canvas = leftCanvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setLeftDragging({
      ...leftDragging,
      currentX: x,
      currentY: y
    });
  };

  const handleLeftMouseUp = (e) => {
    if (!leftDragging) return;

    const timeDiff = Date.now() - leftDragging.startTime;
    const canvas = leftCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;

    const distMoved = Math.sqrt(
      Math.pow((e.clientX - rect.left) - leftDragging.currentX, 2) +
      Math.pow(y - leftDragging.currentY, 2)
    );

    if (timeDiff < 200 && distMoved < 5) {
      const clickedCard = leftTapeCards[leftDragging.cardIndex];
      if (e.detail === 2) {
        onCardEdit(clickedCard);
      }
      setLeftDragging(null);
      return;
    }

    // Calculate drop position
    const height = canvasHeight;
    const cardOffsetY = (height - MAX_VISIBLE * (CARD_WIDTH + CARD_SPACING)) / 2;
    const relativeY = y - cardOffsetY;
    const dropSlot = Math.round(relativeY / (CARD_WIDTH + CARD_SPACING));
    const newPosition = startIndex + Math.max(0, Math.min(dropSlot, MAX_VISIBLE - 1));

    if (newPosition !== leftDragging.cardIndex && onCardsReorder) {
      const newCards = [...leftTapeCards];
      const [draggedCard] = newCards.splice(leftDragging.cardIndex, 1);
      newCards.splice(newPosition, 0, draggedCard);
      onCardsReorder(newCards);
    }

    setLeftDragging(null);
  };

  const handleLeftDoubleClick = (e) => {
    e.stopPropagation();
    
    const canvas = leftCanvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const visibleCards = leftTapeCards.slice(startIndex, startIndex + MAX_VISIBLE);
    for (let i = 0; i < visibleCards.length; i++) {
      const card = visibleCards[i];
      if (!card || !card._canvasX) continue;
      
      const dist = Math.sqrt(
        Math.pow(x - card._canvasX, 2) +
        Math.pow(y - (card._canvasY + CARD_WIDTH / 2), 2)
      );

      if (dist < CARD_WIDTH / 2 + 5) {
        onCardEdit(card);
        break;
      }
    }
  };

  // Mouse handlers for special focus and right tape (double-click only)
  const handleSpecialFocusClick = (e) => {
    // Check special focus first (using absolute position)
    if (specialFocusCardId) {
      const specialCard = rightTapeCards.find(c => c.id === specialFocusCardId);
      if (specialCard && specialCard._specialFocusXAbsolute !== undefined) {
        const absoluteX = e.clientX;
        const absoluteY = e.clientY;
        const dist = Math.sqrt(
          Math.pow(absoluteX - specialCard._specialFocusXAbsolute, 2) +
          Math.pow(absoluteY - specialCard._specialFocusY, 2)
        );
        if (dist < specialCard._specialFocusRadius + 5) {
          if (e.detail === 2) {
            onCardEdit(specialCard);
          }
          return true;
        }
      }
    }
    return false;
  };

  const handleRightDoubleClick = (e) => {
    // Check special focus first
    if (handleSpecialFocusClick(e)) {
      return;
    }

    const canvas = rightCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const visibleCards = rightTapeCards.slice(startIndex, startIndex + MAX_VISIBLE);
    for (let i = 0; i < visibleCards.length; i++) {
      const card = visibleCards[i];
      const dist = Math.sqrt(
        Math.pow(x - card._canvasX, 2) +
        Math.pow(y - (card._canvasY + CARD_WIDTH / 2), 2)
      );

      if (dist < CARD_WIDTH / 2 + 5) {
        onCardEdit(card);
        break;
      }
    }
  };

  const selectedCard = leftSelectedIndex !== null ? leftTapeCards[leftSelectedIndex] : null;
  const canMoveToFocus = selectedCard && leftSelectedIndex !== focusIndex;
  const canMoveToSpecialFocus = selectedCard && selectedCard.id !== specialFocusCardId;

  const moveSelectedToFocus = () => {
    if (selectedCard && leftSelectedIndex !== focusIndex) {
      const newCards = [...leftTapeCards];
      const [selectedCardOriginal] = newCards.splice(leftSelectedIndex, 1);
      newCards.splice(focusIndex, 0, selectedCardOriginal);
      onCardsReorder(newCards);
      setLeftSelectedIndex(focusIndex);
    }
  };

  const moveSelectedToSpecialFocus = () => {
    if (selectedCard) {
      // Update focusedAt in the card
      if (onCardsReorder) {
        const newCards = leftTapeCards.map(card => 
          card.id === selectedCard.id 
            ? { ...card, focusedAt: Date.now() }
            : card
        );
        onCardsReorder(newCards);
      }
      // Set special focus (card will be shown on right tape if found there)
      setSpecialFocusCardId(selectedCard.id);
    }
  };

  const clearSpecialFocus = () => {
    setSpecialFocusCardId(null);
  };

  // Scroll controls (both tapes scroll together)
  const canScrollUp = startIndex > 0;
  const canScrollDown = startIndex < maxCards - MAX_VISIBLE;

  return (
    <div className={styles.container}>
      <div className={styles.commonControls}>
        <button onClick={() => setStartIndex(Math.max(0, startIndex - 1))} disabled={!canScrollUp}>↑ Up</button>
        <button onClick={moveSelectedToFocus} disabled={!canMoveToFocus} title="Move selected card to focus position">↑ To Focus</button>
        <button onClick={moveSelectedToSpecialFocus} disabled={!canMoveToSpecialFocus} title="Move selected card to special focus">⬆ Special Focus</button>
        {specialFocusCardId !== null && (
          <button onClick={clearSpecialFocus} title="Clear special focus">✕ Clear Special</button>
        )}
        <div className={styles.sortControls}>
          <span className={styles.sortLabel}>Right Sort:</span>
          <button 
            className={sortMode === 'metrics' ? styles.activeSortButton : ''}
            onClick={() => setSortMode('metrics')}
          >
            IN+OUT
          </button>
          <button 
            className={sortMode === 'focusedAt' ? styles.activeSortButton : ''}
            onClick={() => setSortMode('focusedAt')}
          >
            Focus Time
          </button>
        </div>
        <div className={styles.sortControls}>
          <span className={styles.sortLabel}>Right Vector:</span>
          <button 
            className={vectorMode === 'in' ? styles.activeSortButton : ''}
            onClick={() => setVectorMode('in')}
            title="Show IN metric (own satisfaction)"
          >
            IN
          </button>
          <button 
            className={vectorMode === 'out' ? styles.activeSortButton : ''}
            onClick={() => setVectorMode('out')}
            title="Show OUT metric (partner's response)"
          >
            OUT
          </button>
        </div>
        <span className={styles.info}>
          Left: {leftTapeCards.length} cards (own order) | Right: {rightTapeCards.length} cards (sorted) | Focus: Top (#{focusIndex + 1})
          {leftSelectedIndex !== null && ` | Sel: #${leftSelectedIndex + 1}`}
          {specialFocusCardId && (() => {
            const specialIdx = rightTapeCards.findIndex(c => c.id === specialFocusCardId);
            return specialIdx !== -1 ? ` | Special: #${specialIdx + 1}` : '';
          })()}
        </span>
        <button onClick={() => setStartIndex(Math.min(maxCards - MAX_VISIBLE, startIndex + 1))} disabled={!canScrollDown}>Down ↓</button>
      </div>

      <div 
        className={styles.tapeContainer}
        onDoubleClick={(e) => {
          // Handle double-click on special focus circle (checks coordinates)
          if (specialFocusCardId && handleSpecialFocusClick(e)) {
            e.stopPropagation();
          }
        }}
      >
        <div className={styles.leftSide}>
          <canvas
            ref={leftCanvasRef}
            className={styles.canvas}
            onMouseDown={handleLeftMouseDown}
            onMouseMove={handleLeftMouseMove}
            onMouseUp={handleLeftMouseUp}
            onMouseLeave={handleLeftMouseUp}
            onDoubleClick={handleLeftDoubleClick}
            style={{ cursor: leftDragging ? 'grabbing' : 'pointer', position: 'relative', zIndex: 10 }}
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
        
        {/* Special focus overlay canvas - only for drawing, doesn't capture clicks */}
        <canvas
          ref={specialFocusCanvasRef}
          className={styles.specialFocusCanvas}
          style={{ 
            cursor: specialFocusCardId ? 'pointer' : 'default',
            pointerEvents: 'none' // Don't capture clicks - let them pass through to left/right canvas
          }}
        />
      </div>
    </div>
  );
};

export default VerticalTape;
