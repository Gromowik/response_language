/**
 * Canvas-based Object Tape component
 * Renders cards as semicircles on a horizontal tape
 */

import { useEffect, useRef, useState } from 'react';
import styles from './ObjectTape.module.css';

const ObjectTape = ({ cards, onCardSelect, onCardEdit, onCardsReorder }) => {
  const canvasRef = useRef(null);
  const [startIndex, setStartIndex] = useState(Math.max(0, cards.length - 10));
  const [canvasWidth, setCanvasWidth] = useState(window.innerWidth);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [specialFocusCardId, setSpecialFocusCardId] = useState(null); // Особый фокус для отдельного рассмотрения (по ID карточки)
  const [dragging, setDragging] = useState(null); // { cardIndex, offsetX, offsetY, currentX, currentY }

  const CARD_WIDTH = 80;
  const CARD_SPACING = 40; // Увеличили расстояние между объектами еще больше
  const TAPE_Y = 150; // Сдвинули ленту вниз, чтобы освободить место для особого фокуса
  const SPECIAL_FOCUS_Y = 50; // Y позиция особого фокуса (круг над лентой)
  const MAX_VISIBLE = 10;

  // Focus is always on the rightmost (last visible) card
  const focusIndex = startIndex + MAX_VISIBLE - 1;

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setCanvasWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Draw the tape and cards
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size to full window width
    const width = canvasWidth;
    const height = 270; // Увеличили высоту для особого фокуса и текста
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, width, height);

    // Draw tape line
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, TAPE_Y);
    ctx.lineTo(width, TAPE_Y);
    ctx.stroke();

    // Calculate visible cards based on startIndex
    const visibleCards = cards.slice(startIndex, startIndex + MAX_VISIBLE);
    const cardOffsetX = (width - MAX_VISIBLE * (CARD_WIDTH + CARD_SPACING)) / 2;

    // Draw cards
    visibleCards.forEach((card, idx) => {
      const actualIdx = startIndex + idx;
      
      // Skip drawing if this card is being dragged
      if (dragging && actualIdx === dragging.cardIndex) {
        return;
      }
      
      const x = cardOffsetX + idx * (CARD_WIDTH + CARD_SPACING);
      const y = TAPE_Y;

      // Draw semicircle
      ctx.fillStyle = card.color;
      ctx.beginPath();
      ctx.arc(x + CARD_WIDTH / 2, y, CARD_WIDTH / 2, Math.PI, 0);
      ctx.fill();

      // Draw border
      let borderColor = '#333';
      let borderWidth = 2;
      
      // Selected card - blue thick border
      if (actualIdx === selectedIndex) {
        borderColor = '#3498db';
        borderWidth = 4;
      }
      // Focus card - gold border
      if (actualIdx === focusIndex) {
        borderColor = '#FFD700';
        borderWidth = 3;
      }
      
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.beginPath();
      ctx.arc(x + CARD_WIDTH / 2, y, CARD_WIDTH / 2, Math.PI, 0);
      ctx.stroke();

      // Draw text (сдвинули ниже и ограничили ширину, чтобы не налипал на соседние)
      ctx.fillStyle = '#000';
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      // Ограничиваем ширину текста и обрезаем длинные названия
      const maxTextWidth = CARD_WIDTH + 10;
      let displayText = card.name;
      const metrics = ctx.measureText(displayText);
      
      if (metrics.width > maxTextWidth) {
        // Обрезаем текст и добавляем ...
        while (ctx.measureText(displayText + '...').width > maxTextWidth && displayText.length > 0) {
          displayText = displayText.slice(0, -1);
        }
        displayText += '...';
      }
      
      ctx.fillText(displayText, x + CARD_WIDTH / 2, TAPE_Y + 45);

      // Store card position for mouse interaction
      card._canvasX = x;
      card._canvasY = y;
      card._canvasRadius = CARD_WIDTH / 2;
      card._actualIdx = actualIdx;
    });

    // Draw special focus (circle above the tape in center)
    // Находим карточку по ID, так как индексы могут меняться при переупорядочивании
    const specialCard = specialFocusCardId ? cards.find(c => c.id === specialFocusCardId) : null;
    if (specialCard) {
      const centerX = width / 2;
      
      // Draw full circle (not semicircle)
      ctx.fillStyle = specialCard.color;
      ctx.beginPath();
      ctx.arc(centerX, SPECIAL_FOCUS_Y, CARD_WIDTH / 2, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw border for special focus
      ctx.strokeStyle = '#9B59B6'; // Purple border for special focus
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(centerX, SPECIAL_FOCUS_Y, CARD_WIDTH / 2, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Draw text
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(specialCard.name, centerX, SPECIAL_FOCUS_Y + 5);
      
      // Store position for mouse interaction
      specialCard._specialFocusX = centerX;
      specialCard._specialFocusY = SPECIAL_FOCUS_Y;
      specialCard._specialFocusRadius = CARD_WIDTH / 2;
    }

    // Draw focus indicator (triangle pointing down to the rightmost card)
    const focusX = cardOffsetX + (MAX_VISIBLE - 1) * (CARD_WIDTH + CARD_SPACING) + CARD_WIDTH / 2;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(focusX, TAPE_Y - 30);
    ctx.lineTo(focusX - 12, TAPE_Y - 50);
    ctx.lineTo(focusX + 12, TAPE_Y - 50);
    ctx.closePath();
    ctx.fill();

    // Draw dragged card at mouse position
    if (dragging) {
      const draggedCard = cards[dragging.cardIndex];
      const dragX = dragging.currentX - CARD_WIDTH / 2;
      const dragY = dragging.currentY;
      
      ctx.globalAlpha = 0.7;
      
      // Draw semicircle
      ctx.fillStyle = draggedCard.color;
      ctx.beginPath();
      ctx.arc(dragX + CARD_WIDTH / 2, dragY, CARD_WIDTH / 2, Math.PI, 0);
      ctx.fill();
      
      // Draw border
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(dragX + CARD_WIDTH / 2, dragY, CARD_WIDTH / 2, Math.PI, 0);
      ctx.stroke();
      
      // Draw text (с ограничением ширины)
      ctx.fillStyle = '#000';
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      const maxTextWidth = CARD_WIDTH + 10;
      let displayText = draggedCard.name;
      const metrics = ctx.measureText(displayText);
      
      if (metrics.width > maxTextWidth) {
        while (ctx.measureText(displayText + '...').width > maxTextWidth && displayText.length > 0) {
          displayText = displayText.slice(0, -1);
        }
        displayText += '...';
      }
      
      ctx.fillText(displayText, dragX + CARD_WIDTH / 2, dragY + 45);
      
      ctx.globalAlpha = 1.0;
    }
  }, [cards, startIndex, canvasWidth, selectedIndex, dragging, specialFocusCardId]);

  // Handle double-click on special focus
  const handleDoubleClick = (e) => {
    if (specialFocusCardId) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const specialCard = cards.find(c => c.id === specialFocusCardId);
      if (specialCard && specialCard._specialFocusX !== undefined) {
        const dist = Math.sqrt(
          Math.pow(x - specialCard._specialFocusX, 2) +
          Math.pow(y - specialCard._specialFocusY, 2)
        );

        if (dist < specialCard._specialFocusRadius + 5) {
          onCardEdit(specialCard);
        }
      }
    }
  };

  // Mouse handlers for dragging
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on special focus circle
    if (specialFocusCardId) {
      const specialCard = cards.find(c => c.id === specialFocusCardId);
      if (specialCard && specialCard._specialFocusX !== undefined) {
        const dist = Math.sqrt(
          Math.pow(x - specialCard._specialFocusX, 2) +
          Math.pow(y - specialCard._specialFocusY, 2)
        );

        if (dist < specialCard._specialFocusRadius + 5) {
          // Don't process further if clicking on special focus (double-click handled separately)
          return;
        }
      }
    }

    const visibleCards = cards.slice(startIndex, startIndex + MAX_VISIBLE);
    for (let i = 0; i < visibleCards.length; i++) {
      const card = visibleCards[i];
      const dist = Math.sqrt(
        Math.pow(x - (card._canvasX + CARD_WIDTH / 2), 2) +
        Math.pow(y - card._canvasY, 2)
      );

      if (dist < CARD_WIDTH / 2 + 5) {
        // Start dragging
        setDragging({
          cardIndex: card._actualIdx,
          offsetX: x - (card._canvasX + CARD_WIDTH / 2),
          offsetY: y - card._canvasY,
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
    const x = e.clientX - rect.left;

    // Check if it was a quick click (< 200ms and small movement)
    const distMoved = Math.sqrt(
      Math.pow(x - dragging.currentX, 2) + 
      Math.pow((e.clientY - rect.top) - dragging.currentY, 2)
    );

    if (timeDiff < 200 && distMoved < 5) {
      // It was a click, check for double-click
      const clickedCard = cards[dragging.cardIndex];
      if (e.detail === 2) {
        onCardEdit(clickedCard);
      }
      setDragging(null);
      return;
    }

    // Calculate drop position based on x coordinate
    const cardOffsetX = (canvasWidth - MAX_VISIBLE * (CARD_WIDTH + CARD_SPACING)) / 2;
    const relativeX = x - cardOffsetX;
    const dropSlot = Math.round(relativeX / (CARD_WIDTH + CARD_SPACING));
    const newPosition = startIndex + Math.max(0, Math.min(dropSlot, MAX_VISIBLE - 1));

    // Reorder cards
    if (newPosition !== dragging.cardIndex && onCardsReorder) {
      const newCards = [...cards];
      const [draggedCard] = newCards.splice(dragging.cardIndex, 1);
      newCards.splice(newPosition, 0, draggedCard);
      onCardsReorder(newCards);
    }

    setDragging(null);
  };

  // Scroll controls - navigate through cards
  const canScrollLeft = startIndex > 0;
  const canScrollRight = startIndex < cards.length - MAX_VISIBLE;
  const canMoveToFocus = selectedIndex !== null && selectedIndex !== focusIndex;
  const selectedCard = selectedIndex !== null ? cards[selectedIndex] : null;
  const canMoveToSpecialFocus = selectedCard !== null && selectedCard.id !== specialFocusCardId;

  const moveSelectedToFocus = () => {
    if (selectedIndex !== null && onCardsReorder) {
      // Create a copy of cards array
      const newCards = [...cards];
      // Remove the selected card from its current position
      const [selectedCard] = newCards.splice(selectedIndex, 1);
      
      // Calculate where to insert to make it the focus (rightmost visible)
      // If we removed a card before focus, all indices shift left by 1
      let insertPosition = focusIndex;
      if (selectedIndex < focusIndex) {
        // After removal, focusIndex shifted left, so we insert at focusIndex (not focusIndex-1)
        insertPosition = focusIndex;
      } else if (selectedIndex > focusIndex) {
        // focusIndex unchanged, insert after current focus to make selected card the new rightmost
        insertPosition = focusIndex + 1;
      } else {
        // selectedIndex === focusIndex, just put it back at same position
        insertPosition = focusIndex;
      }
      
      // Insert at the focus position
      newCards.splice(insertPosition, 0, selectedCard);
      
      // Update parent component with reordered cards
      onCardsReorder(newCards);
      // Clear selection
      setSelectedIndex(null);
      // Special focus остается на той же карточке (по ID), даже если она переместилась
    }
  };

  const moveSelectedToSpecialFocus = () => {
    if (selectedCard) {
      // Устанавливаем особый фокус на выделенный объект по ID
      // Объект остается на своем месте в ленте
      setSpecialFocusCardId(selectedCard.id);
    }
  };

  const clearSpecialFocus = () => {
    setSpecialFocusCardId(null);
  };

  const scrollLeft = () => {
    if (canScrollLeft) {
      setStartIndex(Math.max(0, startIndex - 1));
    }
  };

  const scrollRight = () => {
    if (canScrollRight) {
      setStartIndex(Math.min(cards.length - MAX_VISIBLE, startIndex + 1));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <button onClick={scrollLeft} disabled={!canScrollLeft}>← Previous</button>
        <button onClick={moveSelectedToFocus} disabled={!canMoveToFocus} title="Move selected card to focus position">→ To Focus</button>
        <button onClick={moveSelectedToSpecialFocus} disabled={!canMoveToSpecialFocus} title="Move selected card to special focus (above tape)">⬆ Special Focus</button>
        {specialFocusCardId !== null && (
          <button onClick={clearSpecialFocus} title="Clear special focus">✕ Clear Special</button>
        )}
        <span className={styles.info}>
          {cards.length} cards | Focus: Rightmost (#{focusIndex + 1})
          {selectedIndex !== null && ` | Selected: #${selectedIndex + 1}`}
          {specialFocusCardId && (() => {
            const specialIdx = cards.findIndex(c => c.id === specialFocusCardId);
            return specialIdx !== -1 ? ` | Special: #${specialIdx + 1}` : '';
          })()}
        </span>
        <button onClick={scrollRight} disabled={!canScrollRight}>Next →</button>
      </div>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        style={{ cursor: dragging ? 'grabbing' : 'pointer' }}
      />
    </div>
  );
};

export default ObjectTape;

