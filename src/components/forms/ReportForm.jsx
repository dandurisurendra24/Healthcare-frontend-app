import React, { useState, useEffect } from 'react';
import Card from '../common/Card.jsx';
import Input from '../common/Input.jsx';
import Button from '../common/Button.jsx';

const ReportForm = ({ initialData = {}, onSubmit, onCancel, title = 'Create Report' }) => {
  const [formData, setFormData] = useState({
    patient_id: initialData.patient_id || '',
    title: initialData.title || '',
    details: initialData.details || '',
    type: initialData.type || 'general',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData({
      patient_id: initialData.patient_id || '',
      title: initialData.title || '',
      details: initialData.details || '',
      type: initialData.type || 'general',
    });
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.details.trim()) newErrors.details = 'Details are required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSubmit(formData);
  };

  return (
    <Card title={title}>
      <form onSubmit={handleSubmit}>
        <Input label="Title" name="title" value={formData.title} onChange={handleChange} error={errors.title} required />
        <div className="form-group">
          <label>Type</label>
          <select name="type" value={formData.type} onChange={handleChange} className="form-select">
            <option value="general">General</option>
            <option value="vitals">Vitals</option>
            <option value="report">Report</option>
          </select>
        </div>
        <div className="form-group">
          <label>Details</label>
          <textarea name="details" value={formData.details} onChange={handleChange} className="form-textarea" rows={4} />
          {errors.details && <p className="input-error">{errors.details}</p>}
        </div>
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="primary">Save</Button>
        </div>
      </form>
    </Card>
  );
};

export default ReportForm;
