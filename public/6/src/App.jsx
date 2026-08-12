import { useState, useEffect } from 'react'
import './App.css'
import ObjectTape from './components/ObjectTape'
import VerticalTape from './components/VerticalTape'
import LeftVerticalTape from './components/LeftVerticalTape'
import BothVerticalTapes from './components/BothVerticalTapes'
import CircularTape from './components/CircularTape'
import Philosophy from './components/Philosophy'
import CardEditor from './components/CardEditor'
import { loadCards, saveCards, loadCardsPerson2, saveCardsPerson2, exportCardsToFile, importCardsFromFile, createCard, createVerticalTapeCards, createLeftVerticalTapeCards, createCircularTapeCards } from './utils/cardStorage'
import { createExternalReflection, findExternalReflection, syncCardWithReflection, removeCardWithReflection, ensurePersonIds } from './utils/reflectionSync'

function App() {
  const [currentPage, setCurrentPage] = useState('horizontal') // 'horizontal', 'horizontal2', 'vertical', 'leftVertical', 'bothVertical', 'circular', or 'philosophy'
  const [cards, setCards] = useState([])
  const [cardsPerson2, setCardsPerson2] = useState([]) // Cards for Person 2
  const [verticalCards, setVerticalCards] = useState([])
  const [leftVerticalCards, setLeftVerticalCards] = useState([])
  const [circularCards, setCircularCards] = useState([])
  const [editingCard, setEditingCard] = useState(null)
  const [isCreating, setIsCreating] = useState(null) // null, 'horizontal', 'horizontal2', 'vertical', 'leftVertical', 'circular', or 'philosophy'

  // Load cards on mount
  useEffect(() => {
    const loadedCards = ensurePersonIds(loadCards(), 1)
    setCards(loadedCards)
    
    // Load Person 2 cards
    const loadedCardsPerson2 = ensurePersonIds(loadCardsPerson2(), 2)
    setCardsPerson2(loadedCardsPerson2)
    
    // Load or create vertical tape cards from localStorage or defaults
    const verticalKey = 'verticalTapeCards'
    const stored = localStorage.getItem(verticalKey)
    if (stored) {
      try {
        setVerticalCards(JSON.parse(stored))
      } catch (e) {
        setVerticalCards(createVerticalTapeCards())
      }
    } else {
      setVerticalCards(createVerticalTapeCards())
    }

    // Load or create left vertical tape cards
    const leftVerticalKey = 'leftVerticalTapeCards'
    const storedLeft = localStorage.getItem(leftVerticalKey)
    if (storedLeft) {
      try {
        setLeftVerticalCards(JSON.parse(storedLeft))
      } catch (e) {
        setLeftVerticalCards(createLeftVerticalTapeCards())
      }
    } else {
      setLeftVerticalCards(createLeftVerticalTapeCards())
    }

    // Load or create circular tape cards
    const circularKey = 'circularTapeCards'
    const storedCircular = localStorage.getItem(circularKey)
    if (storedCircular) {
      try {
        setCircularCards(JSON.parse(storedCircular))
      } catch (e) {
        setCircularCards(createCircularTapeCards())
      }
    } else {
      setCircularCards(createCircularTapeCards())
    }
  }, [])

  // Save to localStorage whenever cards change
  useEffect(() => {
    if (cards.length > 0) {
      saveCards(cards)
    }
  }, [cards])

  // Save Person 2 cards to localStorage
  useEffect(() => {
    if (cardsPerson2.length > 0) {
      saveCardsPerson2(cardsPerson2)
    }
  }, [cardsPerson2])

  // Save vertical cards to localStorage
  useEffect(() => {
    if (verticalCards.length > 0) {
      try {
        localStorage.setItem('verticalTapeCards', JSON.stringify(verticalCards))
      } catch (e) {
        console.error('Failed to save vertical cards:', e)
      }
    }
  }, [verticalCards])

  // Save left vertical cards to localStorage
  useEffect(() => {
    if (leftVerticalCards.length > 0) {
      try {
        localStorage.setItem('leftVerticalTapeCards', JSON.stringify(leftVerticalCards))
      } catch (e) {
        console.error('Failed to save left vertical cards:', e)
      }
    }
  }, [leftVerticalCards])

  // Save circular cards to localStorage
  useEffect(() => {
    if (circularCards.length > 0) {
      try {
        localStorage.setItem('circularTapeCards', JSON.stringify(circularCards))
      } catch (e) {
        console.error('Failed to save circular cards:', e)
      }
    }
  }, [circularCards])

  const handleSaveCard = (formData) => {
    if (editingCard && editingCard.id) {
      // Update existing card
      const updatedCard = { ...editingCard, ...formData };
      
      if (isCreating === 'vertical') {
        setVerticalCards(verticalCards.map(c => c.id === editingCard.id ? updatedCard : c))
      } else if (isCreating === 'leftVertical') {
        setLeftVerticalCards(leftVerticalCards.map(c => c.id === editingCard.id ? updatedCard : c))
      } else if (isCreating === 'circular') {
        // Circular tape теперь использует те же карточки, что и horizontal tape
        const updatedCards = cards.map(c => c.id === editingCard.id ? updatedCard : c);
        setCards(updatedCards);
        // Sync description with external reflection if needed
        if (formData.description !== undefined) {
          syncCardWithReflection(updatedCard, formData.description, updatedCards, cardsPerson2, setCards, setCardsPerson2);
        }
      } else if (isCreating === 'horizontal2') {
        const updatedCardsPerson2 = cardsPerson2.map(c => c.id === editingCard.id ? updatedCard : c);
        setCardsPerson2(updatedCardsPerson2);
        // Sync description and name with external reflection if needed
        syncCardWithReflection(updatedCard, formData, updatedCardsPerson2, cards, setCardsPerson2, setCards);
      } else {
        const updatedCards = cards.map(c => c.id === editingCard.id ? updatedCard : c);
        setCards(updatedCards);
        // Sync description and name with external reflection if needed
        syncCardWithReflection(updatedCard, formData, updatedCards, cardsPerson2, setCards, setCardsPerson2);
      }
    } else {
      // Create new card
      const currentTime = Date.now();
      const personId = (isCreating === 'horizontal2') ? 2 : 1;
      const newCard = { 
        ...formData, 
        id: String(currentTime), 
        createdAt: currentTime,
        focusedAt: currentTime, // Новая карточка получает временную метку при создании
        personId: personId
      }
      
      if (isCreating === 'vertical') {
        setVerticalCards([...verticalCards, newCard])
      } else if (isCreating === 'leftVertical') {
        setLeftVerticalCards([...leftVerticalCards, newCard])
      } else if (isCreating === 'circular') {
        // Circular tape теперь использует те же карточки, что и horizontal tape
        // Create external reflection if this is generated or internal reflection
        if (newCard.type === 'generated' || newCard.type === 'internalReflection') {
          const reflection = createExternalReflection(newCard, 1);
          // Link the source card to its reflection
          const linkedCard = { ...newCard, reflectedAs: reflection.id };
          setCards([...cards, linkedCard]);
          setCardsPerson2([...cardsPerson2, reflection]);
        } else {
          setCards([...cards, newCard]);
        }
      } else if (isCreating === 'horizontal2') {
        // Create external reflection if this is generated or internal reflection
        if (newCard.type === 'generated' || newCard.type === 'internalReflection') {
          const reflection = createExternalReflection(newCard, 2);
          // Link the source card to its reflection
          const linkedCard = { ...newCard, reflectedAs: reflection.id };
          setCardsPerson2([...cardsPerson2, linkedCard]);
          setCards([...cards, reflection]);
        } else {
          setCardsPerson2([...cardsPerson2, newCard]);
        }
      } else {
        // Create external reflection if this is generated or internal reflection
        if (newCard.type === 'generated' || newCard.type === 'internalReflection') {
          const reflection = createExternalReflection(newCard, 1);
          // Link the source card to its reflection
          const linkedCard = { ...newCard, reflectedAs: reflection.id };
          setCards([...cards, linkedCard]);
          setCardsPerson2([...cardsPerson2, reflection]);
        } else {
          setCards([...cards, newCard]);
        }
      }
    }
    setEditingCard(null)
    setIsCreating(null)
  }

  const handleExport = () => {
    const cardsToExport = currentPage === 'vertical' ? verticalCards : 
                         currentPage === 'leftVertical' ? leftVerticalCards : 
                         currentPage === 'circular' ? circularCards :
                         currentPage === 'horizontal2' ? cardsPerson2 : cards
    exportCardsToFile(cardsToExport)
  }

  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    importCardsFromFile(file).then(importedCards => {
      // Устанавливаем временную метку для импортированных карточек, если её нет
      const importTime = Date.now();
      const cardsWithTimestamp = importedCards.map(card => ({
        ...card,
        focusedAt: card.focusedAt || importTime
      }));
      
      if (currentPage === 'vertical') {
        setVerticalCards(cardsWithTimestamp)
      } else if (currentPage === 'leftVertical') {
        setLeftVerticalCards(cardsWithTimestamp)
      } else if (currentPage === 'circular') {
        setCircularCards(cardsWithTimestamp)
      } else if (currentPage === 'horizontal2') {
        setCardsPerson2(cardsWithTimestamp)
      } else {
        setCards(cardsWithTimestamp)
      }
      alert(`Imported ${cardsWithTimestamp.length} cards successfully!`)
    }).catch(error => {
      alert(`Error importing file: ${error.message}`)
    })

    e.target.value = ''
  }

  const currentCards = currentPage === 'vertical' ? verticalCards : 
                       currentPage === 'leftVertical' ? leftVerticalCards : cards
  const setCurrentCards = currentPage === 'vertical' ? setVerticalCards : 
                          currentPage === 'leftVertical' ? setLeftVerticalCards : setCards

  return (
    <div className="app">
      <header className="app-header">
        <h1>Object Tape Calculator</h1>
        <div className="app-controls">
          <button 
            onClick={() => setCurrentPage('horizontal')}
            className={`btn ${currentPage === 'horizontal' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Person 1 Tape
          </button>
          <button 
            onClick={() => setCurrentPage('horizontal2')}
            className={`btn ${currentPage === 'horizontal2' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Person 2 Tape
          </button>
          <button 
            onClick={() => setCurrentPage('vertical')}
            className={`btn ${currentPage === 'vertical' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Right Vertical
          </button>
          <button 
            onClick={() => setCurrentPage('leftVertical')}
            className={`btn ${currentPage === 'leftVertical' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Left Vertical
          </button>
          <button 
            onClick={() => setCurrentPage('bothVertical')}
            className={`btn ${currentPage === 'bothVertical' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Both Vertical
          </button>
          <button 
            onClick={() => setCurrentPage('circular')}
            className={`btn ${currentPage === 'circular' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Circular Tape
          </button>
          <button 
            onClick={() => setCurrentPage('philosophy')}
            className={`btn ${currentPage === 'philosophy' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Philosophie
          </button>
          <button 
            onClick={() => setIsCreating(currentPage)} 
            className="btn btn-primary"
            disabled={currentPage === 'philosophy'}
          >
            + New Card
          </button>
          <button onClick={handleExport} className="btn btn-secondary">
            Export JSON
          </button>
          <label className="btn btn-secondary">
            Import JSON
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </header>

      <main className="app-main">
        {currentPage === 'horizontal' ? (
          <ObjectTape 
            cards={cards} 
            onCardSelect={(card) => setEditingCard(card)}
            onCardEdit={(card) => setEditingCard(card)}
            onCardsReorder={(reorderedCards) => setCards(reorderedCards)}
          />
        ) : currentPage === 'horizontal2' ? (
          <ObjectTape 
            cards={cardsPerson2} 
            onCardSelect={(card) => setEditingCard(card)}
            onCardEdit={(card) => {
              setEditingCard(card)
              setIsCreating('horizontal2')
            }}
            onCardsReorder={(reorderedCards) => {
              // Обновляем focusedAt для объектов, которые попали в особый фокус
              setCardsPerson2(reorderedCards)
            }}
          />
        ) : currentPage === 'vertical' ? (
          <VerticalTape 
            cards={verticalCards}
            onCardEdit={(card) => {
              setEditingCard(card)
              setIsCreating('vertical')
            }}
            onCardsReorder={(reorderedCards) => setVerticalCards(reorderedCards)}
          />
        ) : currentPage === 'leftVertical' ? (
          <LeftVerticalTape 
            cards={leftVerticalCards}
            onCardEdit={(card) => {
              setEditingCard(card)
              setIsCreating('leftVertical')
            }}
            onCardsReorder={(reorderedCards) => setLeftVerticalCards(reorderedCards)}
          />
        ) : currentPage === 'bothVertical' ? (
          <BothVerticalTapes
            leftCards={cards}
            rightCards={cardsPerson2}
            onLeftCardEdit={(card) => {
              setEditingCard(card)
              setIsCreating('horizontal')
            }}
            onRightCardEdit={(card) => {
              setEditingCard(card)
              setIsCreating('horizontal2')
            }}
            onLeftCardsReorder={(reorderedCards) => setCards(reorderedCards)}
            onRightCardsReorder={(reorderedCards) => setCardsPerson2(reorderedCards)}
          />
        ) : currentPage === 'philosophy' ? (
          <Philosophy />
        ) : (
          <CircularTape
            cards={cards}
            onCardEdit={(card) => {
              setEditingCard(card)
              setIsCreating('horizontal')
            }}
            onCardsReorder={(reorderedCards) => setCards(reorderedCards)}
          />
        )}
      </main>

      {(editingCard || isCreating) && (
        <CardEditor 
          card={editingCard}
          onSave={handleSaveCard}
          onClose={() => {
            setEditingCard(null)
            setIsCreating(null)
          }}
          allCardsPerson1={cards}
          allCardsPerson2={cardsPerson2}
        />
      )}
    </div>
  )
}

export default App
