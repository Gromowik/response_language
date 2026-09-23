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
import ExchangeField from './components/ExchangeField'
import DirectionsViewer from './components/DirectionsViewer'
import TranslationReflection from './components/TranslationReflection'
import WorkSeeds from './components/WorkSeeds'
import CloudModels from './components/CloudModels'
import Repeater from './components/Repeater'
import VisualModel from './components/VisualModel'
import RingDemo from './components/RingDemo'
import HfCenters from './components/HfCenters'
import RlTrial from './components/RlTrial'
import WorkImprint from './components/WorkImprint'
import WorkRingDemo from './components/WorkRingDemo'
import WorkTodoViewer from './components/WorkTodoViewer'
import WorkDualTape from './components/WorkDualTape'
import WorkVerticalShell from './components/WorkVerticalShell'
import CardEditor from './components/CardEditor'
import { loadCards, saveCards, loadCardsPerson2, saveCardsPerson2, exportCardsToFile, importCardsFromFile, createCard, createVerticalTapeCards, createLeftVerticalTapeCards, createCircularTapeCards } from './utils/cardStorage'
import { createExternalReflection, findExternalReflection, syncCardWithReflection, removeCardWithReflection, ensurePersonIds } from './utils/reflectionSync'
import {
  loadWorkPerson1Cards,
  saveWorkPerson1Cards,
  loadWorkPerson2Cards,
  saveWorkPerson2Cards,
  ensureWorkPerson2Cards,
  loadWorkContactP1,
  saveWorkContactP1,
  loadWorkContactP2,
  saveWorkContactP2,
  appendContactCard,
  removeContactCard,
  prepareWorkVerticalFromContacts,
  loadWorkVerticalP1,
  saveWorkVerticalP1,
  loadWorkVerticalP2,
  saveWorkVerticalP2,
  normalizeCardsColorsByType,
} from './utils/workAttentionStorage'

function App() {
  const [currentPage, setCurrentPage] = useState('horizontal') // ..., 'readme', 'quickRecall', or 'exchangeField'
  const [cards, setCards] = useState([])
  const [cardsPerson2, setCardsPerson2] = useState([]) // Cards for Person 2
  const [workCardsPerson1, setWorkCardsPerson1] = useState(() =>
    ensurePersonIds(loadWorkPerson1Cards(), 1)
  ) // Рабочий отпечаток · Person 1 (не Сид)
  const [workCardsPerson2, setWorkCardsPerson2] = useState(() =>
    ensurePersonIds(loadWorkPerson2Cards(), 2)
  ) // Рабочий отпечаток · Person 2 · Cursor
  const [workContactP1, setWorkContactP1] = useState(() => loadWorkContactP1())
  const [workContactP2, setWorkContactP2] = useState(() => loadWorkContactP2())
  const [workVertP1, setWorkVertP1] = useState(() => loadWorkVerticalP1())
  const [workVertP2, setWorkVertP2] = useState(() => loadWorkVerticalP2())
  const [verticalCards, setVerticalCards] = useState([])
  const [leftVerticalCards, setLeftVerticalCards] = useState([])
  const [circularCards, setCircularCards] = useState([])
  const [circularDisplayCards, setCircularDisplayCards] = useState([]) // Cards to display on Circular Tape
  const [circularStartIndex, setCircularStartIndex] = useState(0) // Start index for Circular Tape to position focus at top
  const [editingCard, setEditingCard] = useState(null)
  const [isCreating, setIsCreating] = useState(null) // null, 'horizontal', 'horizontal2', 'vertical', 'leftVertical', 'circular', or 'philosophy'
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [seedReturnPage, setSeedReturnPage] = useState('horizontal')

  const WORK_PAGES = [
    'workImprint',
    'workRingDemo',
    'workPerson1',
    'workPerson2',
    'workVertical1',
    'workVertical2',
    'workBothVertical',
    'workTodo',
  ]
  const inWorkEnv = WORK_PAGES.includes(currentPage)

  const goToPage = (page) => {
    if (WORK_PAGES.includes(page) && !WORK_PAGES.includes(currentPage)) {
      setSeedReturnPage(currentPage)
    }
    setCurrentPage(page)
    setMobileNavOpen(false)
  }

  const enterWorkEnv = () => {
    goToPage('workImprint')
  }

  const leaveWorkEnv = () => {
    goToPage(seedReturnPage || 'horizontal')
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

  // Рабочий Person 1 — можно и пустой массив (после очистки)
  useEffect(() => {
    saveWorkPerson1Cards(workCardsPerson1)
  }, [workCardsPerson1])

  useEffect(() => {
    saveWorkPerson2Cards(workCardsPerson2)
  }, [workCardsPerson2])

  useEffect(() => {
    saveWorkContactP1(workContactP1)
  }, [workContactP1])

  useEffect(() => {
    saveWorkContactP2(workContactP2)
  }, [workContactP2])

  useEffect(() => {
    saveWorkVerticalP1(workVertP1)
  }, [workVertP1])

  useEffect(() => {
    saveWorkVerticalP2(workVertP2)
  }, [workVertP2])

  const rebuildWorkVertical = (leader = 1) => {
    const { p1, p2 } = prepareWorkVerticalFromContacts(workContactP1, workContactP2, {
      leader,
    })
    setWorkVertP1(ensurePersonIds(p1, 1))
    setWorkVertP2(ensurePersonIds(p2, 2))
    return { p1, p2 }
  }

  const openWorkVertical = (side) => {
    if (!workContactP1.length && !workContactP2.length) {
      alert('Сначала наполните ленты соприкосновения у Person 1 и/или Person 2.')
      return
    }
    rebuildWorkVertical(1)
    goToPage(side === 2 ? 'workVertical2' : 'workVertical1')
  }

  const openWorkBothVertical = () => {
    if (!workContactP1.length && !workContactP2.length) {
      alert('Сначала наполните ленты соприкосновения у Person 1 и/или Person 2.')
      return
    }
    rebuildWorkVertical(1)
    goToPage('workBothVertical')
  }

  // Person 2 Tape: при открытии сразу сид Cursor (актуальный JSON)
  useEffect(() => {
    if (currentPage !== 'workPerson2') return undefined
    let cancelled = false
    ensureWorkPerson2Cards(true)
      .then((cards) => {
        if (!cancelled && cards.length) {
          setWorkCardsPerson2(ensurePersonIds(cards, 2))
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [currentPage])

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
      } else if (isCreating === 'workPerson1') {
        setWorkCardsPerson1(
          workCardsPerson1.map((c) => (c.id === editingCard.id ? updatedCard : c))
        )
      } else if (isCreating === 'workPerson2') {
        setWorkCardsPerson2(
          workCardsPerson2.map((c) => (c.id === editingCard.id ? updatedCard : c))
        )
      } else if (isCreating === 'workContactP1') {
        setWorkContactP1(
          workContactP1.map((c) => (c.id === editingCard.id ? updatedCard : c))
        )
      } else if (isCreating === 'workContactP2') {
        setWorkContactP2(
          workContactP2.map((c) => (c.id === editingCard.id ? updatedCard : c))
        )
      } else if (isCreating === 'workVertP1') {
        setWorkVertP1(workVertP1.map((c) => (c.id === editingCard.id ? updatedCard : c)))
      } else if (isCreating === 'workVertP2') {
        setWorkVertP2(workVertP2.map((c) => (c.id === editingCard.id ? updatedCard : c)))
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
      } else if (isCreating === 'workPerson1') {
        setWorkCardsPerson1([...workCardsPerson1, newCard])
      } else if (isCreating === 'workPerson2') {
        setWorkCardsPerson2([...workCardsPerson2, { ...newCard, personId: 2 }])
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
          <h1>{inWorkEnv ? 'Рабочий отпечаток' : 'Object Tape Calculator'}</h1>
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
          {inWorkEnv ? (
            <>
              <button
                type="button"
                onClick={() => goToPage('workImprint')}
                className={`btn ${currentPage === 'workImprint' ? 'btn-work-active' : 'btn-work'}`}
              >
                Visual Model
              </button>
              <button
                type="button"
                onClick={() => goToPage('workRingDemo')}
                className={`btn ${currentPage === 'workRingDemo' ? 'btn-work-active' : 'btn-work'}`}
              >
                Ring Demo
              </button>
              <button
                type="button"
                onClick={() => goToPage('workPerson1')}
                className={`btn ${currentPage === 'workPerson1' ? 'btn-work-active' : 'btn-work'}`}
              >
                Person 1 Tape
              </button>
              <button
                type="button"
                onClick={() => goToPage('workPerson2')}
                className={`btn ${currentPage === 'workPerson2' ? 'btn-work-active' : 'btn-work'}`}
              >
                Person 2 Tape
              </button>
              <button
                type="button"
                onClick={() => openWorkVertical(1)}
                className={`btn ${currentPage === 'workVertical1' ? 'btn-work-active' : 'btn-work'}`}
              >
                Vertical Person 1
              </button>
              <button
                type="button"
                onClick={() => openWorkVertical(2)}
                className={`btn ${currentPage === 'workVertical2' ? 'btn-work-active' : 'btn-work'}`}
              >
                Vertical Person 2
              </button>
              <button
                type="button"
                onClick={openWorkBothVertical}
                className={`btn ${currentPage === 'workBothVertical' ? 'btn-work-active' : 'btn-work'}`}
              >
                Both Vertical
              </button>
              <button
                type="button"
                onClick={() => goToPage('workTodo')}
                className={`btn ${currentPage === 'workTodo' ? 'btn-work-active' : 'btn-work'}`}
              >
                TODO
              </button>
              {currentPage === 'workPerson1' || currentPage === 'workPerson2' ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setIsCreating(currentPage)
                    setMobileNavOpen(false)
                  }}
                >
                  + New Card
                </button>
              ) : null}
              {currentPage === 'workPerson2' ? (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      if (
                        !window.confirm(
                          'Заново загрузить сид Cursor Person 2 из cursor_person2_tape.json? Текущие правки этой ленты будут заменены.'
                        )
                      ) {
                        return
                      }
                      ensureWorkPerson2Cards(true)
                        .then((cards) => setWorkCardsPerson2(ensurePersonIds(cards, 2)))
                        .catch((err) => alert(err.message || 'Ошибка загрузки'))
                    }}
                  >
                    ↺ Сид Cursor
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setWorkCardsPerson2((prev) =>
                        ensurePersonIds(normalizeCardsColorsByType(prev), 2)
                      )
                    }}
                    title="Generated→синий, External→зелёный, Internal→коричневый (README)"
                  >
                    Цвета по типу
                  </button>
                </>
              ) : null}
              <button type="button" onClick={leaveWorkEnv} className="btn btn-secondary">
                ← К лицевому Сиду
              </button>
            </>
          ) : (
            <>
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
            onClick={() => goToPage('exchangeField')}
            className={`btn ${currentPage === 'exchangeField' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Exchange Field
          </button>
          <button 
            onClick={() => goToPage('directions')}
            className={`btn ${currentPage === 'directions' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Directions
          </button>
          <button
            onClick={() => goToPage('reflection')}
            className={`btn ${currentPage === 'reflection' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Reflection
          </button>
          <button
            onClick={() => goToPage('seeds')}
            className={`btn ${currentPage === 'seeds' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Seeds
          </button>
          <button
            onClick={() => goToPage('cloudModels')}
            className={`btn ${currentPage === 'cloudModels' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Cloud Models
          </button>
          <button
            onClick={() => goToPage('repeater')}
            className={`btn ${currentPage === 'repeater' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Repeater
          </button>
          <button
            onClick={() => goToPage('visualModel')}
            className={`btn ${currentPage === 'visualModel' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Visual Model
          </button>
          <button
            onClick={enterWorkEnv}
            className="btn btn-work"
          >
            Рабочий отпечаток
          </button>
          <button
            onClick={() => goToPage('ringDemo')}
            className={`btn ${currentPage === 'ringDemo' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Ring Demo
          </button>
          <button
            onClick={() => goToPage('hfCenters')}
            className={`btn ${currentPage === 'hfCenters' ? 'btn-primary' : 'btn-secondary'}`}
          >
            HF Centers
          </button>
          <button
            onClick={() => goToPage('rlTrial')}
            className={`btn ${currentPage === 'rlTrial' ? 'btn-primary' : 'btn-secondary'}`}
          >
            RL Trial
          </button>
          <button 
            onClick={() => {
              setIsCreating(currentPage)
              setMobileNavOpen(false)
            }} 
            className="btn btn-primary"
            disabled={
              currentPage === 'philosophy' ||
              currentPage === 'readme' ||
              currentPage === 'quickRecall' ||
              currentPage === 'exchangeField' ||
              currentPage === 'directions' ||
              currentPage === 'reflection' ||
              currentPage === 'seeds' ||
              currentPage === 'cloudModels' ||
              currentPage === 'repeater' ||
              currentPage === 'visualModel' ||
              currentPage === 'workImprint' ||
              currentPage === 'workRingDemo' ||
              currentPage === 'ringDemo' ||
              currentPage === 'hfCenters' ||
              currentPage === 'rlTrial'
            }
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
            </>
          )}
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
        ) : currentPage === 'exchangeField' ? (
          <ExchangeField />
        ) : currentPage === 'directions' ? (
          <DirectionsViewer />
        ) : currentPage === 'reflection' ? (
          <TranslationReflection onNavigate={goToPage} />
        ) : currentPage === 'seeds' ? (
          <WorkSeeds />
        ) : currentPage === 'cloudModels' ? (
          <CloudModels />
        ) : currentPage === 'repeater' ? (
          <Repeater />
        ) : currentPage === 'visualModel' ? (
          <VisualModel onNavigate={goToPage} />
        ) : currentPage === 'workImprint' ? (
          <WorkImprint onNavigate={goToPage} />
        ) : currentPage === 'workRingDemo' ? (
          <WorkRingDemo
            onPushToWorkPerson1={(nextCards) => {
              setWorkCardsPerson1(ensurePersonIds(nextCards, 1))
              goToPage('workPerson1')
            }}
          />
        ) : currentPage === 'workPerson1' ? (
          <WorkDualTape
            personLabel="Person 1"
            personSide={1}
            upperCards={workCardsPerson1}
            contactCards={workContactP1}
            onUpperEdit={(card) => {
              setEditingCard(card)
              setIsCreating('workPerson1')
            }}
            onUpperReorder={(reordered) => setWorkCardsPerson1(reordered)}
            onContactEdit={(card) => {
              setEditingCard(card)
              setIsCreating('workContactP1')
            }}
            onContactReorder={(reordered) => setWorkContactP1(reordered)}
            onSendToContact={(card) =>
              setWorkContactP1((prev) => appendContactCard(prev, card))
            }
            onRemoveFromContact={(card) =>
              setWorkContactP1((prev) => removeContactCard(prev, card))
            }
            onOpenVertical={openWorkVertical}
            onOpenBothVertical={openWorkBothVertical}
            canOpenExchange={workContactP1.length > 0 || workContactP2.length > 0}
          />
        ) : currentPage === 'workPerson2' ? (
          <WorkDualTape
            personLabel="Person 2 · Cursor"
            personSide={2}
            upperCards={workCardsPerson2}
            contactCards={workContactP2}
            onUpperEdit={(card) => {
              setEditingCard(card)
              setIsCreating('workPerson2')
            }}
            onUpperReorder={(reordered) => setWorkCardsPerson2(reordered)}
            onContactEdit={(card) => {
              setEditingCard(card)
              setIsCreating('workContactP2')
            }}
            onContactReorder={(reordered) => setWorkContactP2(reordered)}
            onSendToContact={(card) =>
              setWorkContactP2((prev) => appendContactCard(prev, card))
            }
            onRemoveFromContact={(card) =>
              setWorkContactP2((prev) => removeContactCard(prev, card))
            }
            onOpenVertical={openWorkVertical}
            onOpenBothVertical={openWorkBothVertical}
            canOpenExchange={workContactP1.length > 0 || workContactP2.length > 0}
            upperHint="Сид Cursor подгружается при открытии (все Generated, синий/голубой). Нижняя лента — ваш фильтр соприкосновения, её открытие не сбрасывает."
          />
        ) : currentPage === 'workVertical1' ? (
          <WorkVerticalShell
            kicker="Рабочий отпечаток · обмен"
            title="Vertical Person 1"
            purpose="Вертикаль ведущего (Person 1): слева — ваш порядок из ленты соприкосновения (уже с парами); справа — тот же набор, отсортированный как во взаимодействии (IN+OUT / Focus Time). Сюда попадает не вся полная лента, а только фильтр соприкосновения."
            how="Generated Person 1 получают у Person 2 парный External Reflection (IN↔OUT). Generated Person 2 (немного своего) — зеркало у Person 1. Internal Reflection каждый может добавить позже в ходе. Сид не меняется."
            actions={
              <>
                <button type="button" onClick={() => openWorkVertical(1)}>
                  ↺ Пересобрать из соприкосновения
                </button>
                <button type="button" onClick={openWorkBothVertical}>
                  Both Vertical
                </button>
                <button type="button" onClick={() => goToPage('workPerson1')}>
                  ← Person 1 Tape
                </button>
              </>
            }
          >
            <LeftVerticalTape
              cards={workVertP1}
              otherCards={workVertP2}
              onCardEdit={(card) => {
                setEditingCard(card)
                setIsCreating('workVertP1')
              }}
              onCardsReorder={(reordered) => setWorkVertP1(reordered)}
            />
          </WorkVerticalShell>
        ) : currentPage === 'workVertical2' ? (
          <WorkVerticalShell
            kicker="Рабочий отпечаток · обмен"
            title="Vertical Person 2"
            purpose="Вертикаль Person 2 (Cursor): слева — порядок из ленты соприкосновения Person 2; справа — сортировка как во взаимодействии с учётом пар. Видно отражения ведущего и свои Generated, отданные в контакт."
            how="Пары те же, что собраны из нижних лент: External Reflection ↔ Generated, метрики IN↔OUT примерные (можно править). Internal — в ходе. Пересборка — кнопка ниже или снова с Person Tape."
            actions={
              <>
                <button type="button" onClick={() => openWorkVertical(2)}>
                  ↺ Пересобрать из соприкосновения
                </button>
                <button type="button" onClick={openWorkBothVertical}>
                  Both Vertical
                </button>
                <button type="button" onClick={() => goToPage('workPerson2')}>
                  ← Person 2 Tape
                </button>
              </>
            }
          >
            <VerticalTape
              cards={workVertP2}
              otherCards={workVertP1}
              onCardEdit={(card) => {
                setEditingCard(card)
                setIsCreating('workVertP2')
              }}
              onCardsReorder={(reordered) => setWorkVertP2(reordered)}
            />
          </WorkVerticalShell>
        ) : currentPage === 'workBothVertical' ? (
          <WorkVerticalShell
            kicker="Рабочий отпечаток · обмен"
            title="Both Vertical"
            purpose="Обе вертикали сразу: слева Person 1, справа Person 2 — то, что приготовлено в лентах соприкосновения, уже с парами Generated ↔ External Reflection. Экран совместного контакта / резонанса U."
            how="Сортировка IN+OUT или Focus Time; линии пар как на витринном Both Vertical. Правки метрик и текста — в ходе. Полные верхние ленты Person Tape здесь не видны — только фильтр обмена."
            actions={
              <>
                <button type="button" onClick={openWorkBothVertical}>
                  ↺ Пересобрать из соприкосновения
                </button>
                <button type="button" onClick={() => goToPage('workPerson1')}>
                  Person 1 Tape
                </button>
                <button type="button" onClick={() => goToPage('workPerson2')}>
                  Person 2 Tape
                </button>
              </>
            }
          >
            <BothVerticalTapes
              leftCards={workVertP1}
              rightCards={workVertP2}
              onLeftCardEdit={(card) => {
                setEditingCard(card)
                setIsCreating('workVertP1')
              }}
              onRightCardEdit={(card) => {
                setEditingCard(card)
                setIsCreating('workVertP2')
              }}
              onLeftCardsReorder={(reordered) => setWorkVertP1(reordered)}
              onRightCardsReorder={(reordered) => setWorkVertP2(reordered)}
            />
          </WorkVerticalShell>
        ) : currentPage === 'workTodo' ? (
          <WorkTodoViewer />
        ) : currentPage === 'ringDemo' ? (
          <RingDemo onNavigate={goToPage} />
        ) : currentPage === 'hfCenters' ? (
          <HfCenters onNavigate={goToPage} />
        ) : currentPage === 'rlTrial' ? (
          <RlTrial onNavigate={goToPage} />
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

      {!inWorkEnv ? (
        <footer className="app-footer">
          <p className="app-footer-note">
            Мобильная версия в разработке. На телефоне интерфейс пока упрощённый; удобнее смотреть с компьютера.
          </p>
          <p>Автор: Serge Gromowik · © 2026 · All Rights Reserved</p>
          <p>
            Некоммерческое использование — бесплатно (личное / учебное). Коммерческое — по согласованию.
            Подробнее: <code>LICENSE</code>, <code>TERMS.md</code>.
          </p>
          <p>
            По вопросам коммерческого использования, приобретения лицензии или заказной доработки
            обращайтесь:{' '}
            <a href="mailto:serge.gromowik@gmail.com?subject=Commercial%20license%20%2F%20Object%20Tape%20%2F%20Response%20Language">
              serge.gromowik@gmail.com
            </a>
          </p>
          <p>
            Участие в проекте (идеи, тесты):{' '}
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
      ) : null}
    </div>
  )
}

export default App
