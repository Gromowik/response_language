/**
 * Card storage utilities for localStorage and file operations
 */

const STORAGE_KEY = 'objectTapeCards';
const STORAGE_KEY_PERSON2 = 'objectTapeCardsPerson2';

// Default sample cards with types
export const createDefaultCards = () => [
  {
    id: '1',
    name: 'Generated One',
    description: 'First generated card',
    type: 'generated',
    color: '#3498DB',
    metrics: { in: 10, out: 5, u: 3 },
    createdAt: Date.now() - 13000
  },
  {
    id: '2',
    name: 'Generated Two',
    description: 'Second generated card',
    type: 'generated',
    color: '#5DADE2',
    metrics: { in: 8, out: 6, u: 7 },
    createdAt: Date.now() - 12000
  },
  {
    id: '3',
    name: 'External Reflection One',
    description: 'First external reflection card',
    type: 'externalReflection',
    color: '#2ECC71',
    metrics: { in: 8, out: 12, u: 4 },
    createdAt: Date.now() - 11000
  },
  {
    id: '4',
    name: 'External Reflection Two',
    description: 'Second external reflection card',
    type: 'externalReflection',
    color: '#52BE80',
    metrics: { in: 9, out: 7, u: 6 },
    createdAt: Date.now() - 10000
  },
  {
    id: '5',
    name: 'Internal Reflection One',
    description: 'First internal reflection card',
    type: 'internalReflection',
    color: '#8B4513',
    metrics: { in: 7, out: 5, u: 9 },
    createdAt: Date.now() - 9000
  },
  {
    id: '6',
    name: 'Internal Reflection Two',
    description: 'Second internal reflection card',
    type: 'internalReflection',
    color: '#A0522D',
    metrics: { in: 6, out: 4, u: 5 },
    createdAt: Date.now() - 8000
  },
  {
    id: '7',
    name: 'Generated Three',
    description: 'Third generated card',
    type: 'generated',
    color: '#85C1E2',
    metrics: { in: 7, out: 5, u: 8 },
    createdAt: Date.now() - 7000
  },
  {
    id: '8',
    name: 'External Reflection Three',
    description: 'Third external reflection card',
    type: 'externalReflection',
    color: '#27AE60',
    metrics: { in: 5, out: 8, u: 6 },
    createdAt: Date.now() - 6000
  },
  {
    id: '9',
    name: 'Internal Reflection Three',
    description: 'Third internal reflection card',
    type: 'internalReflection',
    color: '#CD853F',
    metrics: { in: 10, out: 8, u: 10 },
    createdAt: Date.now() - 5000
  },
  {
    id: '10',
    name: 'Generated Four',
    description: 'Fourth generated card',
    type: 'generated',
    color: '#2980B9',
    metrics: { in: 6, out: 4, u: 7 },
    createdAt: Date.now() - 4000
  },
  {
    id: '11',
    name: 'External Reflection Four',
    description: 'Fourth external reflection card',
    type: 'externalReflection',
    color: '#1ABC9C',
    metrics: { in: 4, out: 6, u: 4 },
    createdAt: Date.now() - 3000
  },
  {
    id: '12',
    name: 'Internal Reflection Four',
    description: 'Fourth internal reflection card',
    type: 'internalReflection',
    color: '#D2691E',
    metrics: { in: 3, out: 2, u: 9 },
    createdAt: Date.now() - 2000
  },
  {
    id: '13',
    name: 'Generated Five',
    description: 'Fifth generated card',
    type: 'generated',
    color: '#1E90FF',
    metrics: { in: 9, out: 7, u: 11 },
    createdAt: Date.now() - 1000
  },
  {
    id: '14',
    name: 'External Reflection Five',
    description: 'Fifth external reflection card',
    type: 'externalReflection',
    color: '#16A085',
    metrics: { in: 10, out: 9, u: 12 },
    createdAt: Date.now()
  }
];

/**
 * Default sample cards for Person 2 (different from Person 1 for simulation)
 */
export const createDefaultCardsPerson2 = () => [
  {
    id: 'p2-1',
    name: 'Person2 Generated One',
    description: 'First generated card for Person 2',
    type: 'generated',
    color: '#3498DB',
    metrics: { in: 6, out: 4, u: 5 },
    createdAt: Date.now() - 13000
  },
  {
    id: 'p2-2',
    name: 'Person2 Generated Two',
    description: 'Second generated card for Person 2',
    type: 'generated',
    color: '#5DADE2',
    metrics: { in: 7, out: 5, u: 6 },
    createdAt: Date.now() - 12000
  },
  {
    id: 'p2-3',
    name: 'Person2 External Reflection One',
    description: 'First external reflection card for Person 2',
    type: 'externalReflection',
    color: '#2ECC71',
    metrics: { in: 5, out: 8, u: 7 },
    createdAt: Date.now() - 11000
  },
  {
    id: 'p2-4',
    name: 'Person2 External Reflection Two',
    description: 'Second external reflection card for Person 2',
    type: 'externalReflection',
    color: '#52BE80',
    metrics: { in: 4, out: 6, u: 5 },
    createdAt: Date.now() - 10000
  },
  {
    id: 'p2-5',
    name: 'Person2 Internal Reflection One',
    description: 'First internal reflection card for Person 2',
    type: 'internalReflection',
    color: '#8B4513',
    metrics: { in: 8, out: 3, u: 6 },
    createdAt: Date.now() - 9000
  },
  {
    id: 'p2-6',
    name: 'Person2 Internal Reflection Two',
    description: 'Second internal reflection card for Person 2',
    type: 'internalReflection',
    color: '#A0522D',
    metrics: { in: 3, out: 2, u: 4 },
    createdAt: Date.now() - 8000
  },
  {
    id: 'p2-7',
    name: 'Person2 Generated Three',
    description: 'Third generated card for Person 2',
    type: 'generated',
    color: '#85C1E2',
    metrics: { in: 9, out: 7, u: 8 },
    createdAt: Date.now() - 7000
  },
  {
    id: 'p2-8',
    name: 'Person2 External Reflection Three',
    description: 'Third external reflection card for Person 2',
    type: 'externalReflection',
    color: '#27AE60',
    metrics: { in: 6, out: 9, u: 7 },
    createdAt: Date.now() - 6000
  },
  {
    id: 'p2-9',
    name: 'Person2 Internal Reflection Three',
    description: 'Third internal reflection card for Person 2',
    type: 'internalReflection',
    color: '#CD853F',
    metrics: { in: 5, out: 4, u: 5 },
    createdAt: Date.now() - 5000
  },
  {
    id: 'p2-10',
    name: 'Person2 Generated Four',
    description: 'Fourth generated card for Person 2',
    type: 'generated',
    color: '#2980B9',
    metrics: { in: 7, out: 6, u: 6 },
    createdAt: Date.now() - 4000
  },
  {
    id: 'p2-11',
    name: 'Person2 External Reflection Four',
    description: 'Fourth external reflection card for Person 2',
    type: 'externalReflection',
    color: '#1ABC9C',
    metrics: { in: 8, out: 10, u: 9 },
    createdAt: Date.now() - 3000
  },
  {
    id: 'p2-12',
    name: 'Person2 Internal Reflection Four',
    description: 'Fourth internal reflection card for Person 2',
    type: 'internalReflection',
    color: '#D2691E',
    metrics: { in: 4, out: 3, u: 4 },
    createdAt: Date.now() - 2000
  },
  {
    id: 'p2-13',
    name: 'Person2 Generated Five',
    description: 'Fifth generated card for Person 2',
    type: 'generated',
    color: '#1E90FF',
    metrics: { in: 10, out: 8, u: 9 },
    createdAt: Date.now() - 1000
  },
  {
    id: 'p2-14',
    name: 'Person2 External Reflection Five',
    description: 'Fifth external reflection card for Person 2',
    type: 'externalReflection',
    color: '#16A085',
    metrics: { in: 9, out: 7, u: 8 },
    createdAt: Date.now()
  }
];

/**
 * Load cards from localStorage, or create defaults if empty
 * Sets initial focusedAt timestamp for all cards if not present
 */
export const loadCards = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  let cards;
  
  if (stored) {
    try {
      cards = JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored cards:', e);
      cards = createDefaultCards();
    }
  } else {
    cards = createDefaultCards();
  }
  
  // Устанавливаем одинаковую временную метку для всех объектов при загрузке
  // если у них нет focusedAt или если это первая загрузка
  const loadTime = Date.now();
  const hasAnyFocusedAt = cards.some(card => card.focusedAt !== undefined);
  
  // Если ни у одного объекта нет focusedAt, устанавливаем всем одинаковое время
  if (!hasAnyFocusedAt) {
    cards = cards.map(card => ({
      ...card,
      focusedAt: loadTime
    }));
    // Сохраняем обновленные карточки
    saveCards(cards);
  }
  
  return cards;
};

/**
 * Load cards for Person 2 from localStorage, or create defaults if empty
 * Sets initial focusedAt timestamp for all cards if not present
 */
export const loadCardsPerson2 = () => {
  const stored = localStorage.getItem(STORAGE_KEY_PERSON2);
  let cards;
  
  if (stored) {
    try {
      cards = JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored cards for Person 2:', e);
      cards = createDefaultCardsPerson2();
    }
  } else {
    cards = createDefaultCardsPerson2();
  }
  
  // Устанавливаем одинаковую временную метку для всех объектов при загрузке
  // если у них нет focusedAt или если это первая загрузка
  const loadTime = Date.now();
  const hasAnyFocusedAt = cards.some(card => card.focusedAt !== undefined);
  
  // Если ни у одного объекта нет focusedAt, устанавливаем всем одинаковое время
  if (!hasAnyFocusedAt) {
    cards = cards.map(card => ({
      ...card,
      focusedAt: loadTime
    }));
    // Сохраняем обновленные карточки
    saveCardsPerson2(cards);
  }
  
  return cards;
};

/**
 * Save cards for Person 2 to localStorage
 */
export const saveCardsPerson2 = (cards) => {
  try {
    localStorage.setItem(STORAGE_KEY_PERSON2, JSON.stringify(cards));
  } catch (e) {
    console.error('Failed to save Person 2 cards to localStorage:', e);
  }
};

/**
 * Save cards to localStorage
 */
export const saveCards = (cards) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch (e) {
    console.error('Failed to save cards to localStorage:', e);
  }
};

/**
 * Create default cards for circular tape
 */
export const createCircularTapeCards = () => {
  const types = ['generated', 'externalReflection', 'internalReflection'];
  const typeColors = {
    generated: ['#3498DB', '#5DADE2', '#85C1E2', '#2980B9', '#1E90FF'],
    externalReflection: ['#2ECC71', '#52BE80', '#27AE60', '#1ABC9C', '#16A085'],
    internalReflection: ['#8B4513', '#A0522D', '#CD853F', '#D2691E', '#DEB887']
  };

  return createDefaultCards().map((card, idx) => {
    const type = types[idx % types.length];
    const colors = typeColors[type];
    return {
      ...card,
      id: `c${idx + 1}`,
      name: `Circular ${idx + 1}`,
      type: type,
      color: colors[idx % colors.length]
    };
  });
};

/**
 * Export cards as JSON file with timestamp
 */
export const exportCardsToFile = (cards) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `object-tape-${timestamp}.json`;
  const data = JSON.stringify(cards, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Import cards from JSON file
 */
export const importCardsFromFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const cards = JSON.parse(e.target.result);
        if (Array.isArray(cards)) {
          resolve(cards);
        } else {
          reject(new Error('Invalid file format: expected array of cards'));
        }
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

/**
 * Create a new card
 */
export const createCard = (name, description, color, type = 'generated') => {
  return {
    id: String(Date.now()),
    name,
    description,
    type,
    color,
    metrics: { in: 0, out: 0, u: 0 },
    createdAt: Date.now()
  };
};

/**
 * Generate 15 vertical tape sample cards
 */
export const createVerticalTapeCards = () => {
  const types = ['generated', 'externalReflection', 'internalReflection'];
  const typeColors = {
    generated: ['#3498DB', '#5DADE2', '#85C1E2', '#2980B9', '#1E90FF'],
    externalReflection: ['#2ECC71', '#52BE80', '#27AE60', '#1ABC9C', '#16A085'],
    internalReflection: ['#8B4513', '#A0522D', '#CD853F', '#D2691E', '#DEB887']
  };

  return Array.from({ length: 15 }, (_, idx) => {
    const type = types[idx % types.length];
    const colors = typeColors[type];
    // Ограничиваем IN и OUT диапазоном 0-10
    const inValue = Math.min(10, Math.max(0, 3 + idx));
    const outValue = Math.min(10, Math.max(0, 2 + idx));
    return {
      id: `101${idx}`,
      name: `Vertical ${idx + 1}`,
      description: `${idx + 1 === 1 ? 'First' : idx + 1 === 2 ? 'Second' : idx + 1 === 3 ? 'Third' : `${idx + 1}th`} vertical card`,
      type: type,
      color: colors[idx % colors.length],
      metrics: { in: inValue, out: outValue, u: 3 + idx },
      createdAt: Date.now() - (15 - idx) * 1000
    };
  });
};

/**
 * Generate 15 left vertical tape sample cards
 */
export const createLeftVerticalTapeCards = () => {
  const types = ['generated', 'externalReflection', 'internalReflection'];
  const typeColors = {
    generated: ['#3498DB', '#5DADE2', '#85C1E2', '#2980B9', '#1E90FF'],
    externalReflection: ['#2ECC71', '#52BE80', '#27AE60', '#1ABC9C', '#16A085'],
    internalReflection: ['#8B4513', '#A0522D', '#CD853F', '#D2691E', '#DEB887']
  };

  return Array.from({ length: 15 }, (_, idx) => {
    const type = types[idx % types.length];
    const colors = typeColors[type];
    // Ограничиваем IN и OUT диапазоном 0-10
    const inValue = Math.min(10, Math.max(0, 4 + idx));
    const outValue = Math.min(10, Math.max(0, 3 + idx));
    return {
      id: `201${idx}`,
      name: `Left ${idx + 1}`,
      description: `${idx + 1 === 1 ? 'First' : idx + 1 === 2 ? 'Second' : idx + 1 === 3 ? 'Third' : `${idx + 1}th`} left vertical card`,
      type: type,
      color: colors[idx % colors.length],
      metrics: { in: inValue, out: outValue, u: 4 + idx },
      createdAt: Date.now() - (15 - idx) * 1000
    };
  });
};

