import { useState, useEffect } from 'react'
import './App.css'
import ObjectTape from './components/ObjectTape'
import VerticalTape from './components/VerticalTape'
import LeftVerticalTape from './components/LeftVerticalTape'
import BothVerticalTapes from './components/BothVerticalTapes'
import CircularTape from './components/CircularTape'
import BothCircularTapes from './components/BothCircularTapes'
import PairedCircularTapes from './components/PairedCircularTapes'
import Philosophy from './components/Philosophy'
import ReadmeViewer from './components/ReadmeViewer'
import QuickRecallViewer from './components/QuickRecallViewer'
import CardEditor from './components/CardEditor'
import { loadCards, saveCards, loadCardsPerson2, saveCardsPerson2, exportCardsToFile, importCardsFromFile, createCard, createVerticalTapeCards, createLeftVerticalTapeCards, createCircularTapeCards } from './utils/cardStorage'
import { createExternalReflection, findExternalReflection, syncCardWithReflection, removeCardWithReflection, ensurePersonIds } from './utils/reflectionSync'

function App() {
  const [currentPage, setCurrentPage] = useState('horizontal') // 'horizontal', 'horizontal2', 'vertical', 'leftVertical', 'bothVertical', 'circular', 'bothCircular', 'pairedCircular', 'philosophy', 'readme', or 'quickRecall'
  const [cards, setCards] = useState([])
  const [cardsPerson2, setCardsPerson2] = useState([]) // Cards for Person 2
  const [verticalCards, setVerticalCards] = useState([])
  const [leftVerticalCards, setLeftVerticalCards] = useState([])
  const [circularCards, setCircularCards] = useState([])
  const [circularDisplayCards, setCircularDisplayCards] = useState([]) // Cards to display on Circular Tape
  const [circularStartIndex, setCircularStartIndex] = useState(0) // Start index for Circular Tape to position focus at top
  const [editingCard, setEditingCard] = useState(null)
  const [isCreating, setIsCreating] = useState(null) // null, 'horizontal', 'horizontal2', 'vertical', 'leftVertical', 'circular', or 'philosophy'
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const goToPage = (page) => {
    setCurrentPage(page)
    setMobileNavOpen(false)
  }

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

  // Function to send objects from horizontal tape to Circular Tape
  const handleSendToCircular = (sourceCards, focusIndex) => {
    // focusIndex is the index of the object in focus (rightmost visible on horizontal tape)
    // On horizontal tape: focus is at rightmost position (highest index)
    // On circle: focus should be at top (position 0), objects to the left of focus go clockwise
    
    // Ensure focusIndex is valid
    const validFocusIndex = Math.min(focusIndex, sourceCards.length - 1)
    
    // Take visible objects (up to MAX_VISIBLE objects ending at focusIndex)
    const MAX_VISIBLE = 10
    const visibleStartIndex = Math.max(0, validFocusIndex - MAX_VISIBLE + 1)
    const visibleObjects = sourceCards.slice(visibleStartIndex, validFocusIndex + 1)
    
    // Reorder: focus object first, then objects to the left in reverse order (so they go clockwise from focus)
    // This creates a mapping: [focus, left1, left2, ...] -> goes clockwise on circle
    const reordered = [
      visibleObjects[visibleObjects.length - 1], // Focus object (rightmost on horizontal tape)
      ...visibleObjects.slice(0, -1).reverse()   // Objects to the left in reverse order (to go clockwise)
    ]
    
    // Set the display cards and start index
    setCircularDisplayCards(reordered)
    setCircularStartIndex(0) // Focus is always at top (index 0) on circle
    setCurrentPage('circular')
  }

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
        <div className="app-header-top">
          <h1>Object Tape Calculator</h1>
          <button
            type="button"
            className="btn btn-primary mobile-nav-toggle"
            aria-expanded={mobileNavOpen}
            aria-controls="app-nav"
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            {mobileNavOpen ? 'Close menu' : 'Menu'}
          </button>
        </div>
        <div
          id="app-nav"
          className={`app-controls ${mobileNavOpen ? 'app-controls-open' : ''}`}
        >
          <button 
            onClick={() => goToPage('horizontal')}
            className={`btn ${currentPage === 'horizontal' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Person 1 Tape
          </button>
          <button 
            onClick={() => goToPage('horizontal2')}
            className={`btn ${currentPage === 'horizontal2' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Person 2 Tape
          </button>
          <button 
            onClick={() => goToPage('leftVertical')}
            className={`btn ${currentPage === 'leftVertical' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Vertical Person 1
          </button>
          <button 
            onClick={() => goToPage('vertical')}
            className={`btn ${currentPage === 'vertical' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Vertical Person 2
          </button>
          <button 
            onClick={() => goToPage('bothVertical')}
            className={`btn ${currentPage === 'bothVertical' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Both Vertical
          </button>
          <button 
            onClick={() => goToPage('circular')}
            className={`btn ${currentPage === 'circular' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Circular Tape
          </button>
          <button 
            onClick={() => goToPage('bothCircular')}
            className={`btn ${currentPage === 'bothCircular' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Both Circular
          </button>
          <button 
            onClick={() => goToPage('pairedCircular')}
            className={`btn ${currentPage === 'pairedCircular' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Paired Circular
          </button>
          <button 
            onClick={() => goToPage('philosophy')}
            className={`btn ${currentPage === 'philosophy' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Philosophie
          </button>
          <button 
            onClick={() => goToPage('readme')}
            className={`btn ${currentPage === 'readme' ? 'btn-primary' : 'btn-secondary'}`}
          >
            README
          </button>
          <button 
            onClick={() => goToPage('quickRecall')}
            className={`btn ${currentPage === 'quickRecall' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Quick Recall
          </button>
          <button 
            onClick={() => {
              setIsCreating(currentPage)
              setMobileNavOpen(false)
            }} 
            className="btn btn-primary"
            disabled={currentPage === 'philosophy' || currentPage === 'readme' || currentPage === 'quickRecall'}
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
            onSendToCircular={(sourceCards, focusIndex) => handleSendToCircular(sourceCards, focusIndex)}
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
            onSendToCircular={(sourceCards, focusIndex) => handleSendToCircular(sourceCards, focusIndex)}
          />
        ) : currentPage === 'vertical' ? (
          <VerticalTape 
            cards={cardsPerson2}
            otherCards={cards}
            onCardEdit={(card) => {
              setEditingCard(card)
              setIsCreating('horizontal2')
            }}
            onCardsReorder={(reorderedCards) => setCardsPerson2(reorderedCards)}
          />
        ) : currentPage === 'leftVertical' ? (
          <LeftVerticalTape 
            cards={cards}
            otherCards={cardsPerson2}
            onCardEdit={(card) => {
              setEditingCard(card)
              setIsCreating('horizontal')
            }}
            onCardsReorder={(reorderedCards) => setCards(reorderedCards)}
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
        ) : currentPage === 'bothCircular' ? (
          <BothCircularTapes
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
          />
        ) : currentPage === 'pairedCircular' ? (
          <PairedCircularTapes
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
          />
        ) : currentPage === 'philosophy' ? (
          <Philosophy />
        ) : currentPage === 'readme' ? (
          <ReadmeViewer />
        ) : currentPage === 'quickRecall' ? (
          <QuickRecallViewer />
        ) : (
          <CircularTape
            cards={circularDisplayCards.length > 0 ? circularDisplayCards : cards}
            initialStartIndex={circularStartIndex}
            onCardEdit={(card) => {
              setEditingCard(card)
              // Determine which person's card this is based on source
              if (circularDisplayCards.length > 0) {
                // Check if it's from Person 1 or Person 2
                if (cards.find(c => c.id === card.id)) {
                  setIsCreating('horizontal')
                } else {
                  setIsCreating('horizontal2')
                }
              } else {
                setIsCreating('horizontal')
              }
            }}
            onCardsReorder={(reorderedCircularCards) => {
              // When reordering on Circular Tape, update the source cards (Person 1 or Person 2)
              if (circularDisplayCards.length > 0) {
                // Find which source these cards came from (Person 1 or Person 2)
                const sourceIsPerson1 = reorderedCircularCards.length > 0 && cards.find(c => c.id === reorderedCircularCards[0].id)
                const sourceCards = sourceIsPerson1 ? cards : cardsPerson2
                const setSourceCards = sourceIsPerson1 ? setCards : setCardsPerson2
                
                // Create a map of card ID to new position in reordered array
                const newPositions = new Map()
                reorderedCircularCards.forEach((card, newIndex) => {
                  newPositions.set(card.id, newIndex)
                })
                
                // Update source cards: maintain original order but update positions based on circular reordering
                // Since we reordered for display, we need to restore the original order but apply the changes
                // For now, just update the source cards in the order they appear in circular display
                // (This preserves any changes made during editing on circular tape)
                const updatedSourceCards = [...sourceCards]
                reorderedCircularCards.forEach((circularCard, circularIndex) => {
                  const sourceIndex = updatedSourceCards.findIndex(c => c.id === circularCard.id)
                  if (sourceIndex !== -1) {
                    // Update the card with any changes
                    updatedSourceCards[sourceIndex] = circularCard
                  }
                })
                
                setSourceCards(updatedSourceCards)
                // Update circular display cards as well
                setCircularDisplayCards(reorderedCircularCards)
              } else {
                setCards(reorderedCircularCards)
              }
            }}
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

      <footer className="app-footer">
        <p className="app-footer-note">
          Мобильная версия в разработке. На телефоне интерфейс пока упрощённый; удобнее смотреть с компьютера.
        </p>
        <p>Автор: Serge Gromowik</p>
        <p>
          Кто желает участвовать в проекте, может обращаться на почту{' '}
          <a href="mailto:serge.gromowik@gmail.com">serge.gromowik@gmail.com</a>
        </p>
        <p>
          Связанный проект:{' '}
          <a
            href="https://models-for-psychology.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
          >
            models-for-psychology.vercel.app
          </a>
        </p>
      </footer>
    </div>
  )
}

export default App
