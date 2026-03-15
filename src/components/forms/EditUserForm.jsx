import React, { useState, useEffect } from 'react';
import Card from '../common/Card.jsx';
import Input from '../common/Input.jsx';
import Button from '../common/Button.jsx';

const EditUserForm = ({ user, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'patient',
    specialization: '',
    age: '',
    address: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'patient',
        specialization: user.specialization || '',
        age: user.age || '',
        address: user.address || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSubmit({ ...formData, age: formData.age ? Number(formData.age) : undefined });
  };

  if (!user) return <Card title="Edit User"><p>No user selected.</p></Card>;

  return (
    <Card title={`Edit ${user.name}`}>
      <form onSubmit={handleSubmit}>
        <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} error={errors.name} required />
        <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} required />
        <Input label="Phone" name="phone" value={formData.phone} onChange={handleChange} error={errors.phone} required />
        {formData.role === 'doctor' && (
          <Input
            label="Specialization"
            name="specialization"
            value={formData.specialization}
            onChange={handleChange}
            placeholder="e.g., Cardiology"
          />
        )}
        {formData.role === 'patient' && (
          <>
            <Input label="Age" name="age" type="number" value={formData.age} onChange={handleChange} />
            <Input label="Address" name="address" value={formData.address} onChange={handleChange} />
          </>
        )}
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="primary">Save</Button>
        </div>
      </form>
    </Card>
  );
};

export default EditUserForm;
