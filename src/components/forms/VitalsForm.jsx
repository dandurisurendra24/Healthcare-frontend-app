import React, { useState } from 'react';
import Card from '../common/Card.jsx';
import Input from '../common/Input.jsx';
import Button from '../common/Button.jsx';

const VitalsForm = ({ onSubmit, onCancel }) => {
  const [vitals, setVitals] = useState({
    bp: '',
    diabetes: '',
    symptoms: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVitals((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!vitals.bp.trim()) newErrors.bp = 'Blood pressure is required';
    if (!vitals.diabetes.trim()) newErrors.diabetes = 'Diabetes reading is required';
    if (!vitals.symptoms.trim()) newErrors.symptoms = 'Symptoms are required';
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    onSubmit({
      title: 'Vitals Update',
      details: `BP: ${vitals.bp}, Diabetes: ${vitals.diabetes}, Symptoms: ${vitals.symptoms}`,
      type: 'vitals',
    });
  };

  return (
    <Card title="Log Current Vitals">
      <form onSubmit={handleSubmit}>
        <Input label="Blood Pressure" name="bp" value={vitals.bp} onChange={handleChange} error={errors.bp} required />
        <Input label="Diabetes Reading" name="diabetes" value={vitals.diabetes} onChange={handleChange} error={errors.diabetes} required />
        <div className="form-group">
          <label>Symptoms</label>
          <textarea
            name="symptoms"
            className="form-textarea"
            rows={3}
            value={vitals.symptoms}
            onChange={handleChange}
            placeholder="List current symptoms"
          />
          {errors.symptoms && <p className="input-error">{errors.symptoms}</p>}
        </div>

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="primary">Save Vitals</Button>
        </div>
      </form>
    </Card>
  );
};

export default VitalsForm;
