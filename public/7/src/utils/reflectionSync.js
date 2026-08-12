/**
 * Reflection synchronization utilities
 * Handles creation and synchronization of external reflections between two persons
 */

/**
 * Create an external reflection for a given card
 * @param {Object} sourceCard - The card to create reflection for
 * @param {number} sourcePersonId - Person ID of the source card (1 or 2)
 * @returns {Object} The external reflection card
 */
export const createExternalReflection = (sourceCard, sourcePersonId) => {
  const targetPersonId = sourcePersonId === 1 ? 2 : 1;
  const currentTime = Date.now();
  
  // Metrics are synchronized: IN ↔ OUT (swapped), U remains individual
  return {
    id: String(currentTime + 1), // Ensure unique ID
    name: sourceCard.name + ' (Reflection)',
    description: sourceCard.description || '', // Shared description
    type: 'externalReflection',
    color: getDefaultExternalReflectionColor(),
    metrics: { 
      in: sourceCard.metrics?.out || 0,  // IN of reflection = OUT of source
      out: sourceCard.metrics?.in || 0,  // OUT of reflection = IN of source
      u: sourceCard.metrics?.u || 0      // U remains the same (individual resonance)
    },
    createdAt: currentTime,
    focusedAt: currentTime,
    personId: targetPersonId,
    reflectionOf: sourceCard.id, // Link to source card
    pairName: sourceCard.name, // Name of the paired object on the other person's tape
  };
};

/**
 * Get default color for external reflection
 */
const getDefaultExternalReflectionColor = () => {
  const colors = ['#2ECC71', '#52BE80', '#27AE60', '#1ABC9C', '#16A085'];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Find external reflection for a given card
 * @param {string} sourceCardId - ID of the source card
 * @param {Array} targetCards - Cards array to search in
 * @returns {Object|null} The reflection card or null
 */
export const findExternalReflection = (sourceCardId, targetCards) => {
  return targetCards.find(card => card.reflectionOf === sourceCardId) || null;
};

/**
 * Find source card for an external reflection
 * @param {string} reflectionCardId - ID of the reflection card
 * @param {Array} sourceCards - Cards array to search in
 * @returns {Object|null} The source card or null
 */
export const findSourceCard = (reflectionCardId, sourceCards) => {
  const reflection = sourceCards.find(card => card.id === reflectionCardId);
  if (reflection && reflection.reflectionOf) {
    return sourceCards.find(card => card.id === reflection.reflectionOf) || null;
  }
  return null;
};

/**
 * Sync description and name between a card and its external reflection
 * @param {Object} updatedCard - Updated card
 * @param {Object} formData - Form data with changes
 * @param {Array} sourceCards - Source cards array (where the card is)
 * @param {Array} targetCards - Target cards array (where reflection is)
 * @param {Function} updateSourceCards - Function to update source cards
 * @param {Function} updateTargetCards - Function to update target cards
 */
export const syncCardWithReflection = (
  updatedCard, 
  formData, 
  sourceCards, 
  targetCards, 
  updateSourceCards, 
  updateTargetCards
) => {
  // If this is an external reflection, sync with source
  if (updatedCard.type === 'externalReflection' && updatedCard.reflectionOf) {
    const sourceCard = sourceCards.find(c => c.id === updatedCard.reflectionOf);
    if (sourceCard) {
      const updates = {};
      if (formData.description !== undefined) {
        updates.description = formData.description;
      }
      if (formData.name !== undefined) {
        updates.name = formData.name;
      }
      // Sync metrics: IN ↔ OUT (swapped), U remains individual
      if (formData.metrics !== undefined) {
        updates.metrics = {
          ...sourceCard.metrics,
          in: formData.metrics.out || sourceCard.metrics?.in || 0,  // Source IN = Reflection OUT
          out: formData.metrics.in || sourceCard.metrics?.out || 0, // Source OUT = Reflection IN
          u: sourceCard.metrics?.u || 0  // U remains individual for source
        };
      }
      if (Object.keys(updates).length > 0) {
        const updatedSource = { ...sourceCard, ...updates };
        updateSourceCards(sourceCards.map(c => c.id === sourceCard.id ? updatedSource : c));
      }
    }
  }
  // If this is a source card (generated or internal reflection), sync with its reflection
  else if (updatedCard.type === 'generated' || updatedCard.type === 'internalReflection') {
    const reflection = findExternalReflection(updatedCard.id, targetCards);
    if (reflection) {
      const updates = {};
      if (formData.description !== undefined) {
        updates.description = formData.description;
      }
      if (formData.name !== undefined) {
        updates.name = formData.name + ' (Reflection)';
        updates.pairName = formData.name; // Update pair name
      }
      // Sync metrics: IN ↔ OUT (swapped), U remains individual
      if (formData.metrics !== undefined) {
        updates.metrics = {
          ...reflection.metrics,
          in: formData.metrics.out || reflection.metrics?.in || 0,  // Reflection IN = Source OUT
          out: formData.metrics.in || reflection.metrics?.out || 0, // Reflection OUT = Source IN
          u: reflection.metrics?.u || 0  // U remains individual for reflection
        };
      }
      if (Object.keys(updates).length > 0) {
        const updatedReflection = { ...reflection, ...updates };
        updateTargetCards(targetCards.map(c => c.id === reflection.id ? updatedReflection : c));
      }
    }
  }
};

/**
 * Remove card and its external reflection
 * @param {Object} card - Card to remove
 * @param {Array} sourceCards - Source cards array
 * @param {Array} targetCards - Target cards array
 * @param {Function} updateSourceCards - Function to update source cards
 * @param {Function} updateTargetCards - Function to update target cards
 * @returns {Object} Updated arrays { sourceCards, targetCards }
 */
export const removeCardWithReflection = (
  card,
  sourceCards,
  targetCards,
  updateSourceCards,
  updateTargetCards
) => {
  let updatedSource = [...sourceCards];
  let updatedTarget = [...targetCards];
  
  // If removing an external reflection, just remove it
  if (card.type === 'externalReflection') {
    updatedTarget = updatedTarget.filter(c => c.id !== card.id);
    updateTargetCards(updatedTarget);
  }
  // If removing a source card, remove it and its reflection
  else if (card.type === 'generated' || card.type === 'internalReflection') {
    // Remove source card
    updatedSource = updatedSource.filter(c => c.id !== card.id);
    updateSourceCards(updatedSource);
    
    // Remove its reflection if exists
    const reflection = findExternalReflection(card.id, updatedTarget);
    if (reflection) {
      updatedTarget = updatedTarget.filter(c => c.id !== reflection.id);
      updateTargetCards(updatedTarget);
    }
  }
  
  return { sourceCards: updatedSource, targetCards: updatedTarget };
};

/**
 * Ensure all cards have personId set
 * @param {Array} cards - Cards array
 * @param {number} personId - Person ID to assign
 */
export const ensurePersonIds = (cards, personId) => {
  return cards.map(card => ({
    ...card,
    personId: card.personId || personId
  }));
};

