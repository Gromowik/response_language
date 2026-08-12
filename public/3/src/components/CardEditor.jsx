/**
 * Card Editor Modal for editing/creating cards
 */

import { useState } from 'react';
import styles from './CardEditor.module.css';

const CardEditor = ({ card, onSave, onClose }) => {
  const [formData, setFormData] = useState(
    card || {
      name: '',
      description: '',
      color: '#4ECDC4',
      metrics: { in: 0, out: 0, u: 0 }
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('metrics.')) {
      const metricKey = name.split('.')[1];
      setFormData({
        ...formData,
        metrics: {
          ...formData.metrics,
          [metricKey]: parseInt(value) || 0
        }
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
              />
            </div>
            <div className={styles.metricRow}>
              <label>OUT</label>
              <input
                type="number"
                name="metrics.out"
                value={formData.metrics.out}
                onChange={handleChange}
              />
            </div>
            <div className={styles.metricRow}>
              <label>U</label>
              <input
                type="number"
                name="metrics.u"
                value={formData.metrics.u}
                onChange={handleChange}
              />
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
