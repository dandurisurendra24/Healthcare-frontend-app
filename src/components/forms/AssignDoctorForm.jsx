import React, { useState, useEffect } from 'react';
import Card from '../common/Card.jsx';
import Button from '../common/Button.jsx';
import { apiService } from '../../services/api';
import { toast } from 'react-toastify';

const AssignDoctorForm = ({ onSubmit, onCancel }) => {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [patientsRes, doctorsRes] = await Promise.all([
        apiService.getPatients(),
        apiService.listUsers(),
      ]);

      setPatients(Array.isArray(patientsRes?.data) ? patientsRes.data : Array.isArray(patientsRes) ? patientsRes : []);
      const allUsers = Array.isArray(doctorsRes?.data) ? doctorsRes.data : Array.isArray(doctorsRes) ? doctorsRes : [];
      setDoctors(allUsers.filter((user) => user.role === 'doctor'));
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPatient || !selectedDoctor) {
      toast.error('Please select both patient and doctor');
      return;
    }

    onSubmit({
      patientId: selectedPatient,
      doctorId: selectedDoctor,
    });
  };

  if (loading) {
    return <Card title="Assign Doctor to Patient"><div>Loading...</div></Card>;
  }

  return (
    <Card title="Assign Doctor to Patient">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Select Patient:</label>
          <select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="form-select"
            required
          >
            <option value="">Choose a patient...</option>
            {(Array.isArray(patients) ? patients : []).map((patient) => (
              <option key={patient._id} value={patient._id}>
                {patient.name} ({patient.email})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Select Doctor:</label>
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="form-select"
            required
          >
            <option value="">Choose a doctor...</option>
            {doctors.map((doctor) => (
              <option key={doctor._id} value={doctor._id}>
                {doctor.name} - {doctor.specialization || 'General'}
              </option>
            ))}
          </select>
        </div>

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Assign Doctor
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default AssignDoctorForm;
