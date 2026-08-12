/**
 * Card Editor Modal for editing/creating cards
 */

import { useState } from 'react';
import styles from './CardEditor.module.css';

// Default colors for each object type
const getDefaultColorForType = (type) => {
  const colors = {
    generated: ['#3498DB', '#5DADE2', '#85C1E2', '#2980B9', '#1E90FF'],
    externalReflection: ['#2ECC71', '#52BE80', '#27AE60', '#1ABC9C', '#16A085'],
    internalReflection: ['#8B4513', '#A0522D', '#CD853F', '#D2691E', '#DEB887']
  };
  const typeColors = colors[type] || colors.generated;
  return typeColors[Math.floor(Math.random() * typeColors.length)];
};

const CardEditor = ({ card, onSave, onClose, allCardsPerson1, allCardsPerson2 }) => {
  const [formData, setFormData] = useState(
    card || {
      name: '',
      description: '',
      type: 'generated',
      color: '#3498DB',
      metrics: { in: 0, out: 0, u: 0 }
    }
  );

  // Find the reflection pair for this card
  const findReflectionPair = () => {
    if (!card) return null;
    
    // Determine which person this card belongs to
    // Check if card exists in Person 1's cards
    const isPerson1 = allCardsPerson1?.some(c => c.id === card.id);
    const personId = card.personId || (isPerson1 ? 1 : 2);
    
    // If this is an external reflection, find the source
    if (card.type === 'externalReflection' && card.reflectionOf) {
      const sourceCards = personId === 1 ? allCardsPerson2 : allCardsPerson1;
      const source = sourceCards?.find(c => c.id === card.reflectionOf);
      return source ? { name: source.name, isReflection: true } : null;
    }
    
    // If this is a generated or internal reflection, find its reflection
    if (card.type === 'generated' || card.type === 'internalReflection') {
      const targetCards = personId === 1 ? allCardsPerson2 : allCardsPerson1;
      const reflection = targetCards?.find(c => c.reflectionOf === card.id);
      return reflection ? { name: reflection.name, isReflection: false } : null;
    }
    
    return null;
  };

  const pairInfo = findReflectionPair();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('metrics.')) {
      const metricKey = name.split('.')[1];
      let newValue = parseInt(value) || 0;
      
      // Ограничиваем IN и OUT диапазоном 0-10
      if (metricKey === 'in' || metricKey === 'out') {
        newValue = Math.max(0, Math.min(10, newValue));
      }
      // U может быть любым положительным числом
      else if (metricKey === 'u') {
        newValue = Math.max(0, newValue);
      }
      
      setFormData({
        ...formData,
        metrics: {
          ...formData.metrics,
          [metricKey]: newValue
        }
      });
    } else if (name === 'type') {
      // When type changes, update color to default for that type
      const newColor = getDefaultColorForType(value);
      setFormData({
        ...formData,
        type: value,
        color: newColor
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>{card ? 'Edit Card' : 'Create New Card'}</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Card name"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Card description"
              rows="3"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Object Type</label>
            {card ? (
              // Type cannot be changed for existing cards
              <input
                type="text"
                value={formData.type === 'generated' ? 'Generated' : 
                       formData.type === 'externalReflection' ? 'External Reflection' : 
                       formData.type === 'internalReflection' ? 'Internal Reflection' : formData.type}
                disabled
                className={styles.disabledInput}
              />
            ) : (
              // Only allow creating Generated or Internal Reflection (not External Reflection)
              <select
                name="type"
                value={formData.type || 'generated'}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="generated">Generated</option>
                <option value="internalReflection">Internal Reflection</option>
              </select>
            )}
            {!card && (
              <small className={styles.hint}>
                External Reflection is created automatically when you create Generated or Internal Reflection on the other person's tape
              </small>
            )}
          </div>

          {/* Show pair information */}
          {pairInfo && (
            <div className={styles.formGroup}>
              <label>{pairInfo.isReflection ? 'Source Object' : 'External Reflection'}</label>
              <input
                type="text"
                value={pairInfo.name}
                disabled
                className={styles.disabledInput}
              />
              <small className={styles.hint}>
                {pairInfo.isReflection 
                  ? `This is the reflection of "${pairInfo.name}" from the other person's tape`
                  : `This object has an external reflection named "${pairInfo.name}" on the other person's tape`}
              </small>
            </div>
          )}

          {/* Show focusedAt time */}
          {card && card.focusedAt && (
            <div className={styles.formGroup}>
              <label>Last Focused At</label>
              <input
                type="text"
                value={new Date(card.focusedAt).toLocaleString()}
                disabled
                className={styles.disabledInput}
              />
              <small className={styles.hint}>
                Time when this object was last in special focus
              </small>
            </div>
          )}

          <div className={styles.formGroup}>
            <label>Color</label>
            <div className={styles.colorPicker}>
              <input
                type="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
              />
              <span>{formData.color}</span>
            </div>
            <small className={styles.hint}>
              {formData.type === 'generated' && 'Default colors: blue/cyan shades'}
              {formData.type === 'externalReflection' && 'Default colors: green shades'}
              {formData.type === 'internalReflection' && 'Default colors: brown shades'}
            </small>
          </div>

          <div className={styles.metricsGroup}>
            <h3>Metrics</h3>
            <div className={styles.metricRow}>
              <label>IN</label>
              <input
                type="number"
                name="metrics.in"
                value={formData.metrics.in}
                onChange={handleChange}
                min="0"
                max="10"
                step="1"
              />
              <span className={styles.rangeHint}>(0-10)</span>
            </div>
            <div className={styles.metricRow}>
              <label>OUT</label>
              <input
                type="number"
                name="metrics.out"
                value={formData.metrics.out}
                onChange={handleChange}
                min="0"
                max="10"
                step="1"
              />
              <span className={styles.rangeHint}>(0-10)</span>
            </div>
            <div className={styles.metricRow}>
              <label>U</label>
              <input
                type="number"
                name="metrics.u"
                value={formData.metrics.u}
                onChange={handleChange}
                min="0"
                step="1"
              />
              <span className={styles.rangeHint}>(resonance)</span>
            </div>
          </div>

          <div className={styles.buttons}>
            <button type="submit" className={styles.saveBtn}>Save</button>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CardEditor;

