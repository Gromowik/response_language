/**
 * Card storage utilities for localStorage and file operations
 */

const STORAGE_KEY = 'objectTapeCards';

// Default sample cards
export const createDefaultCards = () => [
  {
    id: '1',
    name: 'Card One',
    description: 'First sample card',
    color: '#FF6B6B',
    metrics: { in: 10, out: 5, u: 3 },
    createdAt: Date.now() - 13000
  },
  {
    id: '2',
    name: 'Card Two',
    description: 'Second sample card',
    color: '#4ECDC4',
    metrics: { in: 20, out: 15, u: 7 },
    createdAt: Date.now() - 12000
  },
  {
    id: '3',
    name: 'Card Three',
    description: 'Third sample card',
    color: '#45B7D1',
    metrics: { in: 8, out: 12, u: 4 },
    createdAt: Date.now() - 11000
  },
  {
    id: '4',
    name: 'Card Four',
    description: 'Fourth sample card',
    color: '#FFA07A',
    metrics: { in: 15, out: 9, u: 6 },
    createdAt: Date.now() - 10000
  },
  {
    id: '5',
    name: 'Card Five',
    description: 'Fifth sample card',
    color: '#98D8C8',
    metrics: { in: 25, out: 18, u: 9 },
    createdAt: Date.now() - 9000
  },
  {
    id: '6',
    name: 'Card Six',
    description: 'Sixth sample card',
    color: '#F7DC6F',
    metrics: { in: 12, out: 8, u: 5 },
    createdAt: Date.now() - 8000
  },
  {
    id: '7',
    name: 'Card Seven',
    description: 'Seventh sample card',
    color: '#BB8FCE',
    metrics: { in: 18, out: 14, u: 8 },
    createdAt: Date.now() - 7000
  },
  {
    id: '8',
    name: 'Card Eight',
    description: 'Eighth sample card',
    color: '#85C1E2',
    metrics: { in: 22, out: 11, u: 6 },
    createdAt: Date.now() - 6000
  },
  {
    id: '9',
    name: 'Card Nine',
    description: 'Ninth sample card',
    color: '#F8B739',
    metrics: { in: 30, out: 20, u: 10 },
    createdAt: Date.now() - 5000
  },
  {
    id: '10',
    name: 'Card Ten',
    description: 'Tenth sample card',
    color: '#EC7063',
    metrics: { in: 16, out: 13, u: 7 },
    createdAt: Date.now() - 4000
  },
  {
    id: '11',
    name: 'Card Eleven',
    description: 'Eleventh sample card',
    color: '#52BE80',
    metrics: { in: 14, out: 10, u: 4 },
    createdAt: Date.now() - 3000
  },
  {
    id: '12',
    name: 'Card Twelve',
    description: 'Twelfth sample card',
    color: '#AF7AC5',
    metrics: { in: 19, out: 16, u: 9 },
    createdAt: Date.now() - 2000
  },
  {
    id: '13',
    name: 'Card Thirteen',
    description: 'Thirteenth sample card',
    color: '#5DADE2',
    metrics: { in: 28, out: 22, u: 11 },
    createdAt: Date.now() - 1000
  },
  {
    id: '14',
    name: 'Card Fourteen',
    description: 'Fourteenth sample card',
    color: '#F39C12',
    metrics: { in: 35, out: 25, u: 12 },
    createdAt: Date.now()
  }
];

/**
 * Load cards from localStorage, or create defaults if empty
 */
export const loadCards = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored cards:', e);
      return createDefaultCards();
    }
  }
  return createDefaultCards();
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
  const baseColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B6D4', '#A3E4D7',
    '#F9E79F'
  ];

  return createDefaultCards().map((card, idx) => ({
    ...card,
    id: `c${idx + 1}`,
    name: `Circular ${idx + 1}`,
    color: baseColors[idx % baseColors.length]
  }));
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
export const createCard = (name, description, color) => {
  return {
    id: String(Date.now()),
    name,
    description,
    color,
    metrics: { in: 0, out: 0, u: 0 },
    createdAt: Date.now()
  };
};

/**
 * Generate 15 vertical tape sample cards
 */
export const createVerticalTapeCards = () => [
  {
    id: '101',
    name: 'Vertical One',
    description: 'First vertical card',
    color: '#FF6B6B',
    metrics: { in: 10, out: 5, u: 3 },
    createdAt: Date.now() - 14000
  },
  {
    id: '102',
    name: 'Vertical Two',
    description: 'Second vertical card',
    color: '#4ECDC4',
    metrics: { in: 20, out: 15, u: 7 },
    createdAt: Date.now() - 13000
  },
  {
    id: '103',
    name: 'Vertical Three',
    description: 'Third vertical card',
    color: '#45B7D1',
    metrics: { in: 8, out: 12, u: 4 },
    createdAt: Date.now() - 12000
  },
  {
    id: '104',
    name: 'Vertical Four',
    description: 'Fourth vertical card',
    color: '#FFA07A',
    metrics: { in: 15, out: 9, u: 6 },
    createdAt: Date.now() - 11000
  },
  {
    id: '105',
    name: 'Vertical Five',
    description: 'Fifth vertical card',
    color: '#98D8C8',
    metrics: { in: 25, out: 18, u: 9 },
    createdAt: Date.now() - 10000
  },
  {
    id: '106',
    name: 'Vertical Six',
    description: 'Sixth vertical card',
    color: '#F7DC6F',
    metrics: { in: 12, out: 8, u: 5 },
    createdAt: Date.now() - 9000
  },
  {
    id: '107',
    name: 'Vertical Seven',
    description: 'Seventh vertical card',
    color: '#BB8FCE',
    metrics: { in: 18, out: 14, u: 8 },
    createdAt: Date.now() - 8000
  },
  {
    id: '108',
    name: 'Vertical Eight',
    description: 'Eighth vertical card',
    color: '#85C1E2',
    metrics: { in: 22, out: 11, u: 6 },
    createdAt: Date.now() - 7000
  },
  {
    id: '109',
    name: 'Vertical Nine',
    description: 'Ninth vertical card',
    color: '#F8B739',
    metrics: { in: 30, out: 20, u: 10 },
    createdAt: Date.now() - 6000
  },
  {
    id: '110',
    name: 'Vertical Ten',
    description: 'Tenth vertical card',
    color: '#EC7063',
    metrics: { in: 16, out: 13, u: 7 },
    createdAt: Date.now() - 5000
  },
  {
    id: '111',
    name: 'Vertical Eleven',
    description: 'Eleventh vertical card',
    color: '#52BE80',
    metrics: { in: 14, out: 10, u: 4 },
    createdAt: Date.now() - 4000
  },
  {
    id: '112',
    name: 'Vertical Twelve',
    description: 'Twelfth vertical card',
    color: '#AF7AC5',
    metrics: { in: 19, out: 16, u: 9 },
    createdAt: Date.now() - 3000
  },
  {
    id: '113',
    name: 'Vertical Thirteen',
    description: 'Thirteenth vertical card',
    color: '#5DADE2',
    metrics: { in: 28, out: 22, u: 11 },
    createdAt: Date.now() - 2000
  },
  {
    id: '114',
    name: 'Vertical Fourteen',
    description: 'Fourteenth vertical card',
    color: '#F39C12',
    metrics: { in: 35, out: 25, u: 12 },
    createdAt: Date.now() - 1000
  },
  {
    id: '115',
    name: 'Vertical Fifteen',
    description: 'Fifteenth vertical card',
    color: '#E74C3C',
    metrics: { in: 40, out: 30, u: 15 },
    createdAt: Date.now()
  }
];

/**
 * Generate 15 left vertical tape sample cards
 */
export const createLeftVerticalTapeCards = () => [
  {
    id: '201',
    name: 'Left One',
    description: 'First left vertical card',
    color: '#E74C3C',
    metrics: { in: 12, out: 7, u: 4 },
    createdAt: Date.now() - 14000
  },
  {
    id: '202',
    name: 'Left Two',
    description: 'Second left vertical card',
    color: '#3498DB',
    metrics: { in: 18, out: 12, u: 6 },
    createdAt: Date.now() - 13000
  },
  {
    id: '203',
    name: 'Left Three',
    description: 'Third left vertical card',
    color: '#2ECC71',
    metrics: { in: 22, out: 16, u: 8 },
    createdAt: Date.now() - 12000
  },
  {
    id: '204',
    name: 'Left Four',
    description: 'Fourth left vertical card',
    color: '#F39C12',
    metrics: { in: 14, out: 10, u: 5 },
    createdAt: Date.now() - 11000
  },
  {
    id: '205',
    name: 'Left Five',
    description: 'Fifth left vertical card',
    color: '#9B59B6',
    metrics: { in: 20, out: 14, u: 7 },
    createdAt: Date.now() - 10000
  },
  {
    id: '206',
    name: 'Left Six',
    description: 'Sixth left vertical card',
    color: '#1ABC9C',
    metrics: { in: 16, out: 11, u: 6 },
    createdAt: Date.now() - 9000
  },
  {
    id: '207',
    name: 'Left Seven',
    description: 'Seventh left vertical card',
    color: '#E67E22',
    metrics: { in: 24, out: 18, u: 9 },
    createdAt: Date.now() - 8000
  },
  {
    id: '208',
    name: 'Left Eight',
    description: 'Eighth left vertical card',
    color: '#34495E',
    metrics: { in: 19, out: 13, u: 7 },
    createdAt: Date.now() - 7000
  },
  {
    id: '209',
    name: 'Left Nine',
    description: 'Ninth left vertical card',
    color: '#16A085',
    metrics: { in: 26, out: 20, u: 10 },
    createdAt: Date.now() - 6000
  },
  {
    id: '210',
    name: 'Left Ten',
    description: 'Tenth left vertical card',
    color: '#C0392B',
    metrics: { in: 15, out: 9, u: 5 },
    createdAt: Date.now() - 5000
  },
  {
    id: '211',
    name: 'Left Eleven',
    description: 'Eleventh left vertical card',
    color: '#8E44AD',
    metrics: { in: 21, out: 15, u: 8 },
    createdAt: Date.now() - 4000
  },
  {
    id: '212',
    name: 'Left Twelve',
    description: 'Twelfth left vertical card',
    color: '#27AE60',
    metrics: { in: 17, out: 12, u: 6 },
    createdAt: Date.now() - 3000
  },
  {
    id: '213',
    name: 'Left Thirteen',
    description: 'Thirteenth left vertical card',
    color: '#2980B9',
    metrics: { in: 23, out: 17, u: 9 },
    createdAt: Date.now() - 2000
  },
  {
    id: '214',
    name: 'Left Fourteen',
    description: 'Fourteenth left vertical card',
    color: '#D35400',
    metrics: { in: 28, out: 21, u: 11 },
    createdAt: Date.now() - 1000
  },
  {
    id: '215',
    name: 'Left Fifteen',
    description: 'Fifteenth left vertical card',
    color: '#7F8C8D',
    metrics: { in: 32, out: 24, u: 12 },
    createdAt: Date.now()
  }
];
