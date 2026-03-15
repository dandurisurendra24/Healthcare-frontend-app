import React, { useState, useEffect } from 'react';
import Card from '../common/Card.jsx';
import Input from '../common/Input.jsx';
import Button from '../common/Button.jsx';
import { apiService } from '../../services/api';

const CreatePatientForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    age: '',
    phone: '',
    address: '',
    assigned_doctor_id: '',
  });

  const [errors, setErrors] = useState({});
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await apiService.listUsers();
        const userList = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
        setDoctors(userList.filter((user) => user.role === 'doctor'));
      } catch (error) {
        console.warn('Could not fetch doctors for assignment');
      }
    };
    fetchDoctors();
  }, []);

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

    if (!formData.full_name.trim()) newErrors.full_name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    if (!formData.age.trim()) newErrors.age = 'Age is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Age validation
    if (formData.age && (isNaN(formData.age) || formData.age < 0 || formData.age > 150)) {
      newErrors.age = 'Please enter a valid age';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const payload = {
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        age: parseInt(formData.age),
        phone: formData.phone,
        address: formData.address,
      };

      if (formData.assigned_doctor_id) {
        payload.assigned_doctor_id = formData.assigned_doctor_id;
      }

      onSubmit(payload);
    }
  };

  return (
    <Card title="Create New Patient">
      <form onSubmit={handleSubmit}>
        <Input
          label="Full Name"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          placeholder="Enter patient's full name"
          error={errors.full_name}
          required
        />

        <Input
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter email address"
          error={errors.email}
          required
        />

        <Input
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter password"
          error={errors.password}
          required
        />

        <Input
          label="Age"
          type="number"
          name="age"
          value={formData.age}
          onChange={handleChange}
          placeholder="Enter age"
          error={errors.age}
          required
        />

        <Input
          label="Phone Number"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Enter phone number"
          error={errors.phone}
          required
        />

        <Input
          label="Address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Enter address"
          error={errors.address}
          required
        />

        <div className="form-group">
          <label>Assigned Doctor (Optional)</label>
          <select name="assigned_doctor_id" value={formData.assigned_doctor_id} onChange={handleChange} className="form-select">
            <option value="">Create without assigning a doctor</option>
            {(Array.isArray(doctors) ? doctors : []).length === 0 ? (
              <option value="" disabled>No doctors available</option>
            ) : (
              (Array.isArray(doctors) ? doctors : []).map((doc) => (
                <option key={doc._id} value={doc._id}>{doc.name} ({doc.specialization || 'General'})</option>
              ))
            )}
          </select>
        </div>

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Create Patient
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default CreatePatientForm;
