import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import Input from '../components/common/Input.jsx';
import Loading from '../components/common/Loading.jsx';
import Table from '../components/common/Table.jsx';
import DashboardLayout from '../layouts/DashboardLayout';
import { apiService, getApiErrorMessage } from '../services/api';
import {
  findDoctorByAnyId,
  findPatientByAnyId,
  getDisplayName,
  getDoctorRouteId,
  getDoctorUserId,
  getPatientRouteId,
  getPatientUserId,
} from '../utils/entityIds';

const extractList = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
};

const getDoctorLabel = (doctor) => `${getDisplayName(doctor)}${doctor?.specialization ? ` (${doctor.specialization})` : ''}`;

const emptyDoctorForm = {
  full_name: '',
  email: '',
  password: '',
  specialization: '',
  phone: '',
  license_number: '',
  experience_years: '',
  department: '',
};

const emptyPatientForm = {
  full_name: '',
  email: '',
  password: '',
  phone: '',
  gender: '',
  date_of_birth: '',
  blood_group: '',
  address: '',
  emergency_contact: '',
  medical_history: '',
  assigned_doctor_id: '',
};

const emptyReportForm = {
  title: '',
  details: '',
  report_type: 'admin_note',
  bp: '',
  pulse: '',
  file: null,
};

const emptyHealthForm = {
  blood_pressure: '',
  diabetes: '',
  symptoms: '',
  notes: '',
  measured_at: '',
};

const AdminOverview = ({ doctors, patients }) => (
  <div className="dashboard-grid">
    <Card title="Platform Snapshot">
      <div className="stats">
        <div className="stat-item">
          <h3>{doctors.length}</h3>
          <p>Doctors</p>
        </div>
        <div className="stat-item">
          <h3>{patients.length}</h3>
          <p>Patients</p>
        </div>
      </div>
    </Card>
    <Card title="What Admin Can Do">
      <div className="stack-sm">
        <p>Create, update, and remove doctors.</p>
        <p>Create, update, and remove patients.</p>
        <p>Assign doctors, file admin reports, and add patient health entries.</p>
      </div>
    </Card>
  </div>
);

const DoctorManager = ({
  doctors,
  loading,
  formData,
  setFormData,
  editingDoctor,
  onSubmit,
  onEdit,
  onDelete,
  onCancel,
  saving,
}) => (
  <div className="content-grid two-column">
    <Card title={editingDoctor ? 'Update Doctor' : 'Create Doctor'}>
      <form onSubmit={onSubmit}>
        <Input label="Full Name" value={formData.full_name} onChange={(e) => setFormData((c) => ({ ...c, full_name: e.target.value }))} required />
        <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData((c) => ({ ...c, email: e.target.value }))} required />
        <Input label={editingDoctor ? 'Password (optional)' : 'Password'} type="password" value={formData.password} onChange={(e) => setFormData((c) => ({ ...c, password: e.target.value }))} required={!editingDoctor} />
        <Input label="Specialization" value={formData.specialization} onChange={(e) => setFormData((c) => ({ ...c, specialization: e.target.value }))} required />
        <Input label="Phone" value={formData.phone} onChange={(e) => setFormData((c) => ({ ...c, phone: e.target.value }))} required />
        <Input label="License Number" value={formData.license_number} onChange={(e) => setFormData((c) => ({ ...c, license_number: e.target.value }))} required />
        <Input label="Experience (Years)" type="number" value={formData.experience_years} onChange={(e) => setFormData((c) => ({ ...c, experience_years: e.target.value }))} />
        <Input label="Department" value={formData.department} onChange={(e) => setFormData((c) => ({ ...c, department: e.target.value }))} />
        <div className="form-actions">
          {editingDoctor && <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>}
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editingDoctor ? 'Update Doctor' : 'Create Doctor'}</Button>
        </div>
      </form>
    </Card>
    <Card title="Doctor Directory">
      {loading ? <Loading message="Loading doctors..." /> : (
        <Table
          columns={[
            { header: 'Name', accessor: getDisplayName },
            { header: 'Email', accessor: (row) => row.email || '-' },
            { header: 'Specialization', accessor: (row) => row.specialization || '-' },
            { header: 'Phone', accessor: (row) => row.phone || '-' },
          ]}
          data={doctors}
          emptyMessage="No doctors found"
          actions={[
            { label: 'Edit', onClick: onEdit },
            { label: 'Delete', type: 'danger', onClick: onDelete },
          ]}
        />
      )}
    </Card>
  </div>
);

const PatientManager = ({
  doctors,
  patients,
  loading,
  formData,
  setFormData,
  editingPatient,
  onSubmit,
  onEdit,
  onDelete,
  onCancel,
  saving,
}) => (
  <div className="content-grid two-column">
    <Card title={editingPatient ? 'Update Patient' : 'Create Patient'}>
      <form onSubmit={onSubmit}>
        <Input label="Full Name" value={formData.full_name} onChange={(e) => setFormData((c) => ({ ...c, full_name: e.target.value }))} required />
        <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData((c) => ({ ...c, email: e.target.value }))} required />
        <Input label={editingPatient ? 'Password (optional)' : 'Password'} type="password" value={formData.password} onChange={(e) => setFormData((c) => ({ ...c, password: e.target.value }))} required={!editingPatient} />
        <Input label="Phone" value={formData.phone} onChange={(e) => setFormData((c) => ({ ...c, phone: e.target.value }))} required />
        <Input label="Gender" value={formData.gender} onChange={(e) => setFormData((c) => ({ ...c, gender: e.target.value }))} placeholder="Male / Female / Other" />
        <Input label="Date of Birth" type="date" value={formData.date_of_birth} onChange={(e) => setFormData((c) => ({ ...c, date_of_birth: e.target.value }))} />
        <Input label="Blood Group" value={formData.blood_group} onChange={(e) => setFormData((c) => ({ ...c, blood_group: e.target.value }))} placeholder="A+ / O- / AB+" />
        <Input label="Address" value={formData.address} onChange={(e) => setFormData((c) => ({ ...c, address: e.target.value }))} required />
        <Input label="Emergency Contact" value={formData.emergency_contact} onChange={(e) => setFormData((c) => ({ ...c, emergency_contact: e.target.value }))} />
        <div className="form-group">
          <label>Medical History (comma separated)</label>
          <textarea className="form-textarea" value={formData.medical_history} onChange={(e) => setFormData((c) => ({ ...c, medical_history: e.target.value }))} rows="3" placeholder="Diabetes, Hypertension" />
        </div>
        <div className="form-group">
          <label>Assigned Doctor</label>
          <select className="form-select" value={formData.assigned_doctor_id} onChange={(e) => setFormData((c) => ({ ...c, assigned_doctor_id: e.target.value }))}>
            <option value="">No doctor assignment</option>
            {doctors.map((doctor) => <option key={getDoctorRouteId(doctor)} value={getDoctorRouteId(doctor)}>{getDoctorLabel(doctor)}</option>)}
          </select>
        </div>
        <div className="form-actions">
          {editingPatient && <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>}
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editingPatient ? 'Update Patient' : 'Create Patient'}</Button>
        </div>
      </form>
    </Card>
    <Card title="Patient Directory">
      {loading ? <Loading message="Loading patients..." /> : (
        <Table
          columns={[
            { header: 'Name', accessor: getDisplayName },
            { header: 'Email', accessor: (row) => row.email || '-' },
            {
              header: 'Doctor',
              accessor: (row) =>
                getDisplayName(
                  doctors.find((doctor) => String(getDoctorRouteId(doctor)) === String(row.assigned_doctor_id)) ||
                  row.assigned_doctor ||
                  row.doctor
                ),
            },
            { header: 'Gender', accessor: (row) => row.gender || '-' },
          ]}
          data={patients}
          emptyMessage="No patients found"
          actions={[
            { label: 'Edit', onClick: onEdit },
            { label: 'Delete', type: 'danger', onClick: onDelete },
          ]}
        />
      )}
    </Card>
  </div>
);

const AssignDoctorManager = ({ doctors, patients, assignment, setAssignment, onSubmit, saving }) => (
  <Card title="Assign Doctor to Patient">
    <form onSubmit={onSubmit} className="narrow-form">
      <div className="form-group">
        <label>Patient</label>
        <select className="form-select" value={assignment.patient_id} onChange={(e) => setAssignment((c) => ({ ...c, patient_id: e.target.value }))} required>
          <option value="">Select patient</option>
          {patients.map((patient) => <option key={getPatientRouteId(patient)} value={getPatientRouteId(patient)}>{getDisplayName(patient)}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label>Doctor</label>
        <select className="form-select" value={assignment.doctor_id} onChange={(e) => setAssignment((c) => ({ ...c, doctor_id: e.target.value }))} required>
          <option value="">Select doctor</option>
          {doctors.map((doctor) => <option key={getDoctorRouteId(doctor)} value={getDoctorRouteId(doctor)}>{getDoctorLabel(doctor)}</option>)}
        </select>
      </div>
      <Button type="submit" disabled={saving}>{saving ? 'Assigning...' : 'Assign Doctor'}</Button>
    </form>
  </Card>
);

const PatientReportsManager = ({
  patients,
  selectedPatientId,
  setSelectedPatientId,
  reportForm,
  setReportForm,
  reports,
  loading,
  onLoadReports,
  onSubmit,
  onPreview,
  onDownload,
  saving,
  uploading,
}) => (
  <div className="content-grid two-column">
    <Card title="Create Patient Report">
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label>Patient</label>
          <select className="form-select" value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)} required>
            <option value="">Select patient</option>
            {patients.map((patient) => <option key={getPatientRouteId(patient)} value={getPatientRouteId(patient)}>{getDisplayName(patient)}</option>)}
          </select>
        </div>
        <Input label="Title" value={reportForm.title} onChange={(e) => setReportForm((c) => ({ ...c, title: e.target.value }))} required />
        <div className="form-group">
          <label>Details</label>
          <textarea className="form-textarea" value={reportForm.details} onChange={(e) => setReportForm((c) => ({ ...c, details: e.target.value }))} rows="4" required />
        </div>
        <div className="form-group">
          <label>Report Type</label>
          <select className="form-select" value={reportForm.report_type} onChange={(e) => setReportForm((c) => ({ ...c, report_type: e.target.value }))}>
            <option value="admin_note">admin_note</option>
            <option value="clinical">clinical</option>
            <option value="follow_up">follow_up</option>
          </select>
        </div>
        <Input label="BP (optional)" value={reportForm.bp} onChange={(e) => setReportForm((c) => ({ ...c, bp: e.target.value }))} placeholder="140/90" />
        <Input label="Pulse (optional)" type="number" value={reportForm.pulse} onChange={(e) => setReportForm((c) => ({ ...c, pulse: e.target.value }))} placeholder="82" />
        <div className="form-group">
          <label>Report PDF (optional)</label>
          <div
            className="dropzone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const droppedFile = event.dataTransfer.files?.[0];
              if (droppedFile) setReportForm((c) => ({ ...c, file: droppedFile }));
            }}
            role="button"
            tabIndex={0}
          >
            <input
              type="file"
              accept="application/pdf"
              onChange={(event) => {
                const selectedFile = event.target.files?.[0];
                if (selectedFile) setReportForm((c) => ({ ...c, file: selectedFile }));
              }}
            />
            <p>{reportForm.file ? reportForm.file.name : 'Drag & drop a PDF here or click to upload'}</p>
          </div>
        </div>
        <div className="form-group full-span">
          <small>Admin-created reports will be visible to the assigned doctor and patient via their report APIs.</small>
        </div>
        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={onLoadReports}>Load Reports</Button>
          <Button type="submit" disabled={saving || uploading}>
            {uploading ? 'Uploading...' : saving ? 'Saving...' : 'Create Report'}
          </Button>
        </div>
      </form>
    </Card>
    <Card title="Patient Reports">
      {loading ? <Loading message="Loading reports..." /> : (
        <Table
          columns={[
            { header: 'Title', accessor: (row) => row.title || '-' },
            { header: 'Type', accessor: (row) => row.report_type || '-' },
            { header: 'Date', accessor: (row) => row.report_date || row.created_at || '-' },
          ]}
          data={reports}
          emptyMessage="Select a patient and load reports"
          actions={[
            { label: 'Preview PDF', type: 'secondary', onClick: onPreview },
            { label: 'Download', type: 'secondary', onClick: onDownload },
          ]}
        />
      )}
    </Card>
  </div>
);

const ReportPdfModal = ({ report, pdfUrl, loading, onClose, onDownload }) => {
  if (!report && !loading) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>Report PDF</h3>
          <button type="button" className="action-btn action-secondary" onClick={onClose}>Close</button>
        </div>
        {loading ? <Loading message="Loading PDF..." /> : (
          <div className="stack-sm">
            <p><strong>Title:</strong> {report?.title || '-'}</p>
            {pdfUrl ? (
              <iframe title="Report PDF" src={pdfUrl} style={{ width: '100%', height: '70vh', border: 'none', borderRadius: '0.75rem' }} />
            ) : (
              <p>PDF not available for this report.</p>
            )}
            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => onDownload(report)}>Download PDF</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PatientHealthManager = ({ patients, formData, setFormData, onSubmit, saving }) => (
  <Card title="Add Admin Health Entry">
    <form onSubmit={onSubmit} className="content-grid two-column">
      <div className="form-group">
        <label>Patient</label>
        <select className="form-select" value={formData.patient_id} onChange={(e) => setFormData((c) => ({ ...c, patient_id: e.target.value }))} required>
          <option value="">Select patient</option>
          {patients.map((patient) => <option key={getPatientRouteId(patient)} value={getPatientRouteId(patient)}>{getDisplayName(patient)}</option>)}
        </select>
      </div>
      <Input label="Blood Pressure" value={formData.blood_pressure} onChange={(e) => setFormData((c) => ({ ...c, blood_pressure: e.target.value }))} placeholder="120/80" required />
      <Input label="Diabetes" value={formData.diabetes} onChange={(e) => setFormData((c) => ({ ...c, diabetes: e.target.value }))} placeholder="Normal / Pre-diabetic / Type 2" />
      <Input label="Measured At" type="date" value={formData.measured_at} onChange={(e) => setFormData((c) => ({ ...c, measured_at: e.target.value }))} />
      <div className="form-group full-span">
        <label>Symptoms</label>
        <textarea className="form-textarea" value={formData.symptoms} onChange={(e) => setFormData((c) => ({ ...c, symptoms: e.target.value }))} rows="3" />
      </div>
      <div className="form-group full-span">
        <label>Notes</label>
        <textarea className="form-textarea" value={formData.notes} onChange={(e) => setFormData((c) => ({ ...c, notes: e.target.value }))} rows="4" />
      </div>
      <div className="full-span">
        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Create Health Entry'}</Button>
      </div>
    </form>
  </Card>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctorForm, setDoctorForm] = useState(emptyDoctorForm);
  const [patientForm, setPatientForm] = useState(emptyPatientForm);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);
  const [assignment, setAssignment] = useState({ patient_id: '', doctor_id: '' });
  const [reportForm, setReportForm] = useState(emptyReportForm);
  const [healthForm, setHealthForm] = useState({ patient_id: '', ...emptyHealthForm });
  const [selectedReportPatientId, setSelectedReportPatientId] = useState('');
  const [patientReports, setPatientReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [selectedReportPdf, setSelectedReportPdf] = useState(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
  const [loadingPdfPreview, setLoadingPdfPreview] = useState(false);

  const refreshDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const response = await apiService.listDoctors();
      setDoctors(extractList(response, ['doctors', 'data', 'items']));
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load doctors'));
    } finally {
      setLoadingDoctors(false);
    }
  };

  const refreshPatients = async () => {
    setLoadingPatients(true);
    try {
      const response = await apiService.listPatients();
      setPatients(extractList(response, ['patients', 'data', 'items']));
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load patients'));
    } finally {
      setLoadingPatients(false);
    }
  };

  useEffect(() => {
    refreshDoctors();
    refreshPatients();
  }, []);

  const submitDoctor = async (event) => {
    event.preventDefault();
    setSaving(true);
    const payload = { ...doctorForm };
    if (payload.experience_years !== '') {
      payload.experience_years = Number(payload.experience_years);
    }
    if (!payload.password) delete payload.password;
    try {
      if (editingDoctor) {
        await apiService.updateDoctor(getDoctorRouteId(editingDoctor), payload);
        toast.success('Doctor updated successfully');
      } else {
        await apiService.createDoctor(payload);
        toast.success('Doctor created successfully');
      }
      setDoctorForm(emptyDoctorForm);
      setEditingDoctor(null);
      refreshDoctors();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to save doctor'));
    } finally {
      setSaving(false);
    }
  };

  const submitPatient = async (event) => {
    event.preventDefault();
    setSaving(true);
    const { assigned_doctor_id: _ignoredAssignedDoctorId, ...basePatientPayload } = patientForm;
    const selectedDoctor = findDoctorByAnyId(doctors, patientForm.assigned_doctor_id);
    const resolvedDoctorId = getDoctorRouteId(selectedDoctor) || patientForm.assigned_doctor_id;
    const resolvedDoctorUserId = getDoctorUserId(selectedDoctor) || '';
    if (patientForm.assigned_doctor_id && !resolvedDoctorId) {
      toast.error('Selected doctor has no valid doctor ID. Please reselect doctor.');
      setSaving(false);
      return;
    }
    const payload = {
      ...basePatientPayload,
      ...(resolvedDoctorId ? { assigned_doctor_id: resolvedDoctorId } : {}),
      ...(resolvedDoctorId ? { doctor_id: resolvedDoctorId } : {}),
      ...(resolvedDoctorUserId ? { doctor_user_id: resolvedDoctorUserId } : {}),
    };
    if (!payload.password) delete payload.password;
    try {
      if (editingPatient) {
        await apiService.updatePatient(getPatientRouteId(editingPatient), payload);
        toast.success('Patient updated successfully');
      } else {
        await apiService.createPatient(payload);
        toast.success('Patient created successfully');
      }
      setPatientForm(emptyPatientForm);
      setEditingPatient(null);
      refreshPatients();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to save patient'));
    } finally {
      setSaving(false);
    }
  };

  const handleEditDoctor = (doctor) => {
    setEditingDoctor(doctor);
    setDoctorForm({
      full_name: doctor.full_name || doctor.name || '',
      email: doctor.email || '',
      password: '',
      specialization: doctor.specialization || '',
      phone: doctor.phone || '',
      license_number: doctor.license_number || '',
      experience_years: doctor.experience_years ?? '',
      department: doctor.department || '',
    });
    navigate('/admin/doctors');
  };

  const handleDeleteDoctor = async (doctor) => {
    setSaving(true);
    try {
      await apiService.deleteDoctor(getDoctorRouteId(doctor));
      toast.success('Doctor deleted successfully');
      if (editingDoctor && String(getDoctorRouteId(editingDoctor)) === String(getDoctorRouteId(doctor))) {
        setEditingDoctor(null);
        setDoctorForm(emptyDoctorForm);
      }
      refreshDoctors();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to delete doctor'));
    } finally {
      setSaving(false);
    }
  };

  const handleEditPatient = (patient) => {
    setEditingPatient(patient);
    setPatientForm({
      full_name: patient.full_name || patient.name || '',
      email: patient.email || '',
      password: '',
      phone: patient.phone || '',
      gender: patient.gender || '',
      date_of_birth: patient.date_of_birth || '',
      blood_group: patient.blood_group || '',
      address: patient.address || '',
      emergency_contact: patient.emergency_contact || '',
      medical_history: Array.isArray(patient.medical_history) ? patient.medical_history.join(', ') : (patient.medical_history || ''),
      assigned_doctor_id: patient.assigned_doctor_id || getDoctorRouteId(patient.assigned_doctor || patient.doctor) || '',
    });
    navigate('/admin/patients');
  };

  const handleDeletePatient = async (patient) => {
    setSaving(true);
    try {
      await apiService.deletePatient(getPatientRouteId(patient));
      toast.success('Patient deleted successfully');
      if (editingPatient && String(getPatientRouteId(editingPatient)) === String(getPatientRouteId(patient))) {
        setEditingPatient(null);
        setPatientForm(emptyPatientForm);
      }
      refreshPatients();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to delete patient'));
    } finally {
      setSaving(false);
    }
  };

  const submitAssignment = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const selectedPatient = findPatientByAnyId(patients, assignment.patient_id);
      const selectedDoctor = findDoctorByAnyId(doctors, assignment.doctor_id);
      const resolvedPatientId = getPatientRouteId(selectedPatient) || assignment.patient_id;
      const resolvedDoctorId = getDoctorRouteId(selectedDoctor) || assignment.doctor_id;
      await apiService.assignDoctor(resolvedPatientId, resolvedDoctorId);
      toast.success('Doctor assigned successfully');
      setAssignment({ patient_id: '', doctor_id: '' });
      refreshPatients();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to assign doctor'));
    } finally {
      setSaving(false);
    }
  };

  const loadPatientReports = async () => {
    if (!selectedReportPatientId) {
      toast.error('Select a patient first');
      return;
    }
    setReportsLoading(true);
    try {
      const selectedPatient = findPatientByAnyId(patients, selectedReportPatientId);
      const resolvedPatientId = getPatientRouteId(selectedPatient) || selectedReportPatientId;
      const response = await apiService.getAdminPatientReports(resolvedPatientId);
      setPatientReports(extractList(response, ['reports', 'data', 'items']));
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load patient reports'));
    } finally {
      setReportsLoading(false);
    }
  };

  const submitPatientReport = async (event) => {
    event.preventDefault();
    if (!selectedReportPatientId) {
      toast.error('Select a patient first');
      return;
    }
    setSaving(true);
    try {
      const selectedPatient = findPatientByAnyId(patients, selectedReportPatientId);
      const resolvedPatientId = getPatientRouteId(selectedPatient) || selectedReportPatientId;
      const vitals = {};
      if (reportForm.bp.trim()) vitals.bp = reportForm.bp.trim();
      if (reportForm.pulse !== '') vitals.pulse = Number(reportForm.pulse);
      if (reportForm.file) {
        setUploadingReport(true);
        const formData = new FormData();
        formData.append('title', reportForm.title);
        formData.append('details', reportForm.details);
        formData.append('report_type', reportForm.report_type || 'admin_note');
        const patientUserId = getPatientUserId(selectedPatient);
        if (patientUserId) formData.append('patient_user_id', patientUserId);
        formData.append('patient_name', getDisplayName(selectedPatient));
        formData.append('vitals', JSON.stringify(vitals));
        formData.append('file', reportForm.file);
        await apiService.uploadAdminPatientReport(resolvedPatientId, formData);
        toast.success('Patient report uploaded successfully');
      } else {
        await apiService.createAdminPatientReport(resolvedPatientId, {
          title: reportForm.title,
          details: reportForm.details,
          report_type: reportForm.report_type || 'admin_note',
          ...(getPatientUserId(selectedPatient) ? { patient_user_id: getPatientUserId(selectedPatient) } : {}),
          patient_name: getDisplayName(selectedPatient),
          vitals,
        });
        toast.success('Patient report created successfully');
      }
      setReportForm(emptyReportForm);
      loadPatientReports();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to create report'));
    } finally {
      setSaving(false);
      setUploadingReport(false);
    }
  };

  const submitHealthEntry = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { patient_id: patientId, blood_pressure, diabetes, symptoms, measured_at, notes } = healthForm;
      const selectedPatient = findPatientByAnyId(patients, patientId);
      const resolvedPatientId = getPatientRouteId(selectedPatient) || patientId;
      await apiService.createAdminHealthEntry(resolvedPatientId, {
        vitals: {
          blood_pressure,
          diabetes,
          symptoms,
          measured_at,
        },
        notes,
      });
      toast.success('Health entry added successfully');
      setHealthForm({ patient_id: '', ...emptyHealthForm });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to add health entry'));
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadReport = async (item) => {
    try {
      const response = await apiService.downloadAdminReport(item.report_id || item._id || item.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${item.report_id || item._id || item.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to download report'));
    }
  };

  const handlePreviewReport = async (item) => {
    setLoadingPdfPreview(true);
    try {
      const response = await apiService.downloadAdminReport(item.report_id || item._id || item.id);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      setSelectedReportPdf(item);
      setPdfPreviewUrl(url);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to load report PDF'));
    } finally {
      setLoadingPdfPreview(false);
    }
  };

  const pageActions = useMemo(() => (
    <div className="inline-actions">
      <Button type="button" variant="secondary" onClick={refreshDoctors}>Refresh Doctors</Button>
      <Button type="button" variant="secondary" onClick={refreshPatients}>Refresh Patients</Button>
    </div>
  ), []);

  if (loadingDoctors && loadingPatients) return <Loading message="Loading admin workspace..." />;

  return (
    <React.Fragment>
      <DashboardLayout title="Admin Panel" description="Manage doctors, patients, assignments, reports, and health entries from one place." actions={pageActions}>
        <Routes>
        <Route index element={<AdminOverview doctors={doctors} patients={patients} />} />
        <Route path="doctors" element={<DoctorManager doctors={doctors} loading={loadingDoctors} formData={doctorForm} setFormData={setDoctorForm} editingDoctor={editingDoctor} onSubmit={submitDoctor} onEdit={handleEditDoctor} onDelete={handleDeleteDoctor} onCancel={() => { setEditingDoctor(null); setDoctorForm(emptyDoctorForm); }} saving={saving} />} />
        <Route path="patients" element={<PatientManager doctors={doctors} patients={patients} loading={loadingPatients} formData={patientForm} setFormData={setPatientForm} editingPatient={editingPatient} onSubmit={submitPatient} onEdit={handleEditPatient} onDelete={handleDeletePatient} onCancel={() => { setEditingPatient(null); setPatientForm(emptyPatientForm); }} saving={saving} />} />
        <Route path="assign-doctor" element={<AssignDoctorManager doctors={doctors} patients={patients} assignment={assignment} setAssignment={setAssignment} onSubmit={submitAssignment} saving={saving} />} />
        <Route
          path="reports"
          element={<PatientReportsManager patients={patients} selectedPatientId={selectedReportPatientId} setSelectedPatientId={setSelectedReportPatientId} reportForm={reportForm} setReportForm={setReportForm} reports={patientReports} loading={reportsLoading} onLoadReports={loadPatientReports} onSubmit={submitPatientReport} onPreview={handlePreviewReport} onDownload={handleDownloadReport} saving={saving} uploading={uploadingReport} />}
        />
        <Route path="health" element={<PatientHealthManager patients={patients} formData={healthForm} setFormData={setHealthForm} onSubmit={submitHealthEntry} saving={saving} />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
      </DashboardLayout>
      <ReportPdfModal
        report={selectedReportPdf}
        pdfUrl={pdfPreviewUrl}
        loading={loadingPdfPreview}
        onDownload={handleDownloadReport}
        onClose={() => {
          setSelectedReportPdf(null);
          if (pdfPreviewUrl) window.URL.revokeObjectURL(pdfPreviewUrl);
          setPdfPreviewUrl('');
        }}
      />
    </React.Fragment>
  );
};

export default AdminDashboard;
