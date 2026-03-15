import React, { useState, useEffect } from 'react';
import Card from '../common/Card.jsx';
import Input from '../common/Input.jsx';
import Button from '../common/Button.jsx';

const PrescriptionForm = ({ initialData = {}, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    patient_id: initialData.patient_id || '',
    medication: initialData.medication || '',
    dosage: initialData.dosage || '',
    frequency: initialData.frequency || '',
    duration: initialData.duration || '',
    instructions: initialData.instructions || '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData.patient_id) {
      setFormData((prev) => ({ ...prev, patient_id: initialData.patient_id }));
      return;
    }

    // Get selected patient from localStorage if available
    const selectedPatient = localStorage.getItem('selectedPatient');
    if (selectedPatient) {
      const patient = JSON.parse(selectedPatient);
      setFormData((prev) => ({
        ...prev,
        patient_id: patient._id,
      }));
    }
  }, [initialData]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: '',
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.patient_id) newErrors.patient_id = 'Patient is required';
    if (!formData.medication.trim()) newErrors.medication = 'Medication is required';
    if (!formData.dosage.trim()) newErrors.dosage = 'Dosage is required';
    if (!formData.frequency.trim()) newErrors.frequency = 'Frequency is required';
    if (!formData.duration.trim()) newErrors.duration = 'Duration is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      localStorage.removeItem('selectedPatient'); // Clean up
    }
  };

  return (
    <Card title="Create Prescription">
      <form onSubmit={handleSubmit}>
        <Input
          label="Medication"
          name="medication"
          value={formData.medication}
          onChange={handleChange}
          placeholder="Enter medication name"
          error={errors.medication}
          required
        />

        <Input
          label="Dosage"
          name="dosage"
          value={formData.dosage}
          onChange={handleChange}
          placeholder="e.g., 500mg, 10ml"
          error={errors.dosage}
          required
        />

        <Input
          label="Frequency"
          name="frequency"
          value={formData.frequency}
          onChange={handleChange}
          placeholder="e.g., Twice daily, Every 8 hours"
          error={errors.frequency}
          required
        />

        <Input
          label="Duration"
          name="duration"
          value={formData.duration}
          onChange={handleChange}
          placeholder="e.g., 7 days, 2 weeks"
          error={errors.duration}
          required
        />

        <div className="form-group">
          <label>Instructions (Optional)</label>
          <textarea
            name="instructions"
            value={formData.instructions}
            onChange={handleChange}
            placeholder="Additional instructions for the patient"
            className="form-textarea"
            rows="3"
          />
        </div>

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Create Prescription
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default PrescriptionForm;