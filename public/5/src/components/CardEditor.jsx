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

const CardEditor = ({ card, onSave, onClose }) => {
  const [formData, setFormData] = useState(
    card || {
      name: '',
      description: '',
      type: 'generated',
      color: '#3498DB',
      metrics: { in: 0, out: 0, u: 0 }
    }
  );

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
            <select
              name="type"
              value={formData.type || 'generated'}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="generated">Generated</option>
              <option value="externalReflection">External Reflection</option>
              <option value="internalReflection">Internal Reflection</option>
            </select>
          </div>

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

