import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { toast } from 'react-toastify';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import Input from '../components/common/Input.jsx';
import Loading from '../components/common/Loading.jsx';
import Table from '../components/common/Table.jsx';
import DashboardLayout from '../layouts/DashboardLayout';
import { apiService, getApiErrorMessage } from '../services/api';
import {
  findPatientByAnyId,
  getDisplayName,
  getPatientRouteId,
  getPatientUserId,
  getPrescriptionId,
  getReportId,
} from '../utils/entityIds';

const readPath = (item, path) => path.split('.').reduce((current, key) => current?.[key], item);

const unwrapList = (value) => {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.data)) return value.data;
  if (value && Array.isArray(value.items)) return value.items;
  if (value && Array.isArray(value.results)) return value.results;
  return null;
};

const extractList = (payload, keys = []) => {
  const directList = unwrapList(payload);
  if (directList) return directList;

  for (const key of keys) {
    const directValue = payload?.[key];
    const directValueList = unwrapList(directValue);
    if (directValueList) return directValueList;

    const nestedValue = readPath(payload, key);
    const nestedValueList = unwrapList(nestedValue);
    if (nestedValueList) return nestedValueList;
  }

  const candidates = [payload?.data, payload?.results, payload?.items, payload?.data?.data];
  for (const candidate of candidates) {
    const candidateList = unwrapList(candidate);
    if (candidateList) return candidateList;
  }

  return [];
};

const pickFirst = (item, paths, fallback = '') => {
  for (const path of paths) {
    const value = readPath(item, path);
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return fallback;
};

const normalizePatient = (patient) => {
  if (!patient) return null;

  return {
    ...patient,
    patient_id: getPatientRouteId(patient),
    user_id: getPatientUserId(patient) || patient.user_id || '',
    full_name: pickFirst(patient, ['full_name', 'name', 'profile.full_name', 'profile.name'], ''),
    name: pickFirst(patient, ['name', 'full_name', 'profile.name', 'profile.full_name'], ''),
    email: pickFirst(patient, ['email', 'user.email', 'profile.email'], ''),
    phone: pickFirst(patient, ['phone', 'user.phone', 'profile.phone'], ''),
    age: pickFirst(patient, ['age', 'user.age', 'profile.age'], ''),
  };
};

const extractDiagnosisFromDetails = (details) => {
  if (typeof details !== 'string') return '';
  const match = details.match(/Diagnosis:\s*(.+)/i);
  return match?.[1]?.trim() || '';
};

const normalizeReport = (report) => {
  const details = pickFirst(report, ['details', 'summary'], '');
  const patient = normalizePatient(
    report?.patient || {
      patient_id: pickFirst(report, ['patient_id'], ''),
      user_id: pickFirst(report, ['patient_user_id', 'user_id'], ''),
      full_name: pickFirst(report, ['patient_name', 'patient_full_name'], ''),
      name: pickFirst(report, ['patient_name', 'patient_full_name'], ''),
    }
  );

  return {
    ...report,
    report_id: getReportId(report),
    patient,
    patient_id: getPatientRouteId(patient) || pickFirst(report, ['patient_id'], ''),
    patient_user_id: getPatientUserId(patient) || pickFirst(report, ['patient_user_id', 'user_id'], ''),
    title: pickFirst(report, ['title', 'report_title'], ''),
    diagnosis: pickFirst(report, ['diagnosis'], extractDiagnosisFromDetails(details)),
    report_date: pickFirst(report, ['report_date', 'date', 'created_at'], ''),
    notes: pickFirst(report, ['notes'], details),
    details,
    report_type: pickFirst(report, ['report_type'], ''),
    created_by_role: pickFirst(report, ['created_by_role'], ''),
    created_at: pickFirst(report, ['created_at'], ''),
    vitals: report?.vitals || {},
  };
};

const normalizePrescription = (prescription) => {
  const medicines = Array.isArray(prescription?.medicines) ? prescription.medicines : [];
  const firstMedicine = medicines[0] || null;
  const patient = normalizePatient(
    prescription?.patient || {
      patient_id: pickFirst(prescription, ['patient_id'], ''),
      user_id: pickFirst(prescription, ['patient_user_id', 'user_id'], ''),
      full_name: pickFirst(prescription, ['patient_name', 'patient_full_name', 'patient.full_name', 'patient.name'], ''),
      name: pickFirst(prescription, ['patient_name', 'patient_full_name', 'patient.name', 'patient.full_name'], ''),
      email: pickFirst(prescription, ['patient_email', 'patient.email'], ''),
      phone: pickFirst(prescription, ['patient_phone', 'patient.phone'], ''),
      age: pickFirst(prescription, ['patient_age', 'patient.age'], ''),
    }
  );

  return {
    ...prescription,
    prescription_id: getPrescriptionId(prescription),
    patient,
    patient_id: getPatientRouteId(patient) || pickFirst(prescription, ['patient_id'], ''),
    patient_user_id: getPatientUserId(patient) || pickFirst(prescription, ['patient_user_id', 'user_id'], ''),
    diagnosis: pickFirst(prescription, ['diagnosis'], ''),
    medicines,
    medication: pickFirst(prescription, ['medication', 'medicine_name'], firstMedicine?.name || ''),
    dosage: pickFirst(prescription, ['dosage'], firstMedicine?.dosage || ''),
    frequency: pickFirst(prescription, ['frequency'], firstMedicine?.frequency || ''),
    duration: pickFirst(prescription, ['duration'], firstMedicine?.duration || ''),
    instructions: pickFirst(prescription, ['instructions', 'advice', 'notes'], ''),
    next_visit_date: pickFirst(prescription, ['next_visit_date'], ''),
  };
};

const buildReportDetails = (formData) =>
  [
    formData.diagnosis ? `Diagnosis: ${formData.diagnosis}` : '',
    formData.notes ? `Notes: ${formData.notes}` : '',
    formData.report_date ? `Report Date: ${formData.report_date}` : '',
  ]
    .filter(Boolean)
    .join('\n');

const normalizeDateInput = (value) => (typeof value === 'string' ? value.slice(0, 10) : '');
const normalizeHealthEntry = (entry) => {
  const vitals = entry?.vitals || {};
  return {
    ...entry,
    blood_pressure: entry?.blood_pressure || vitals.blood_pressure || '-',
    diabetes: entry?.diabetes || vitals.diabetes || '-',
    symptoms: entry?.symptoms || vitals.symptoms || '-',
    measured_at: entry?.measured_at || vitals.measured_at || entry?.created_at || '-',
    notes: entry?.notes || '',
  };
};

const emptyPrescriptionForm = {
  patient_id: '',
  diagnosis: '',
  medicines: [{ name: '', dosage: '', frequency: '', duration: '' }],
  advice: '',
  next_visit_date: '',
};

const emptyReportForm = {
  patient_id: '',
  title: '',
  diagnosis: '',
  report_date: '',
  notes: '',
  file: null,
};

const DoctorOverview = ({ patients, prescriptions, reports }) => (
  <div className="dashboard-grid">
    <Card title="Work Summary">
      <div className="stats">
        <div className="stat-item"><h3>{patients.length}</h3><p>Assigned Patients</p></div>
        <div className="stat-item"><h3>{prescriptions.length}</h3><p>Prescriptions</p></div>
        <div className="stat-item"><h3>{reports.length}</h3><p>Reports</p></div>
      </div>
    </Card>
    <Card title="Available Actions">
      <div className="stack-sm">
        <p>Review assigned patients.</p>
        <p>Create or update prescriptions.</p>
        <p>Create or update patient reports.</p>
      </div>
    </Card>
  </div>
);

const DoctorPatients = ({ patients, loading }) => (
  <Card title="Assigned Patients">
    {loading ? <Loading message="Loading assigned patients..." /> : (
      <Table
          columns={[
          { header: 'Name', accessor: getDisplayName },
          { header: 'Email', accessor: (row) => row.email || '-' },
          { header: 'Phone', accessor: (row) => row.phone || '-' },
          { header: 'Age', accessor: (row) => row.age || '-' },
        ]}
        data={patients}
        emptyMessage="No assigned patients yet"
      />
    )}
  </Card>
);

const DoctorPrescriptions = ({ patients, prescriptions, loading, formData, setFormData, editingItem, onSubmit, onEdit, onDownload, onCancel, saving }) => (
  <div className="content-grid two-column">
    <Card title={editingItem ? 'Update Prescription' : 'Create Prescription'}>
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label>Patient</label>
          <select className="form-select" value={formData.patient_id} onChange={(e) => setFormData((c) => ({ ...c, patient_id: e.target.value }))} required>
            <option value="">Select patient</option>
            {patients.map((patient) => <option key={getPatientRouteId(patient)} value={getPatientRouteId(patient)}>{getDisplayName(patient)}</option>)}
          </select>
        </div>
        <Input label="Diagnosis" value={formData.diagnosis} onChange={(e) => setFormData((c) => ({ ...c, diagnosis: e.target.value }))} required />
        <div className="form-group">
          <label>Medicines</label>
          {(Array.isArray(formData.medicines) ? formData.medicines : []).map((medicine, index) => (
            <div key={`medicine-${index}`} className="content-grid two-column" style={{ marginBottom: '0.75rem' }}>
              <Input label={`Medicine #${index + 1}`} value={medicine.name || ''} onChange={(e) => setFormData((current) => ({ ...current, medicines: current.medicines.map((item, i) => (i === index ? { ...item, name: e.target.value } : item)) }))} required />
              <Input label="Dosage" value={medicine.dosage || ''} onChange={(e) => setFormData((current) => ({ ...current, medicines: current.medicines.map((item, i) => (i === index ? { ...item, dosage: e.target.value } : item)) }))} />
              <Input label="Frequency" value={medicine.frequency || ''} onChange={(e) => setFormData((current) => ({ ...current, medicines: current.medicines.map((item, i) => (i === index ? { ...item, frequency: e.target.value } : item)) }))} />
              <Input label="Duration" value={medicine.duration || ''} onChange={(e) => setFormData((current) => ({ ...current, medicines: current.medicines.map((item, i) => (i === index ? { ...item, duration: e.target.value } : item)) }))} />
              <div className="form-actions" style={{ gridColumn: '1 / -1', marginTop: '0' }}>
                <Button type="button" variant="secondary" onClick={() => setFormData((current) => ({ ...current, medicines: current.medicines.filter((_, i) => i !== index) }))} disabled={(formData.medicines || []).length === 1}>
                  Remove
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={() => setFormData((current) => ({ ...current, medicines: [...(current.medicines || []), { name: '', dosage: '', frequency: '', duration: '' }] }))}>
            Add Medicine
          </Button>
        </div>
        <Input label="Next Visit Date" type="date" value={formData.next_visit_date} onChange={(e) => setFormData((c) => ({ ...c, next_visit_date: e.target.value }))} />
        <div className="form-group">
          <label>Advice</label>
          <textarea className="form-textarea" value={formData.advice} onChange={(e) => setFormData((c) => ({ ...c, advice: e.target.value }))} rows="4" />
        </div>
        <div className="form-actions">
          {editingItem && <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>}
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editingItem ? 'Update Prescription' : 'Create Prescription'}</Button>
        </div>
      </form>
    </Card>
    <Card title="Prescription List">
      {loading ? <Loading message="Loading prescriptions..." /> : (
        <Table
          columns={[
            { header: 'Patient', accessor: (row) => getDisplayName(row.patient) },
            { header: 'Diagnosis', accessor: (row) => row.diagnosis || '-' },
            { header: 'Medicines', accessor: (row) => (Array.isArray(row.medicines) && row.medicines.length ? row.medicines.map((m) => m.name).filter(Boolean).join(', ') : (row.medication || '-')) },
          ]}
          data={prescriptions}
          emptyMessage="No prescriptions found"
          actions={[
            { label: 'Edit', onClick: onEdit },
            { label: 'Download', type: 'secondary', onClick: onDownload },
          ]}
        />
      )}
    </Card>
  </div>
);

const DoctorReports = ({
  patients,
  reports,
  loading,
  formData,
  setFormData,
  editingItem,
  onSubmit,
  onEdit,
  onView,
  onPreview,
  onDownload,
  onCancel,
  saving,
  uploading,
}) => (
  <div className="content-grid two-column">
    <Card title={editingItem ? 'Update Report' : 'Create Report'}>
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label>Patient</label>
          <select className="form-select" value={formData.patient_id} onChange={(e) => setFormData((c) => ({ ...c, patient_id: e.target.value }))} required>
            <option value="">Select patient</option>
            {patients.map((patient) => <option key={getPatientRouteId(patient)} value={getPatientRouteId(patient)}>{getDisplayName(patient)}</option>)}
          </select>
        </div>
        <Input label="Title" value={formData.title} onChange={(e) => setFormData((c) => ({ ...c, title: e.target.value }))} required />
        <Input label="Diagnosis" value={formData.diagnosis} onChange={(e) => setFormData((c) => ({ ...c, diagnosis: e.target.value }))} required />
        <Input label="Report Date" type="date" value={formData.report_date} onChange={(e) => setFormData((c) => ({ ...c, report_date: e.target.value }))} />
        <div className="form-group">
          <label>Notes</label>
          <textarea className="form-textarea" value={formData.notes} onChange={(e) => setFormData((c) => ({ ...c, notes: e.target.value }))} rows="5" />
        </div>
        <div className="form-group">
          <label>Report PDF (optional)</label>
          <div
            className="dropzone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const droppedFile = event.dataTransfer.files?.[0];
              if (droppedFile) setFormData((c) => ({ ...c, file: droppedFile }));
            }}
            role="button"
            tabIndex={0}
          >
            <input
              type="file"
              accept="application/pdf"
              onChange={(event) => {
                const selectedFile = event.target.files?.[0];
                if (selectedFile) setFormData((c) => ({ ...c, file: selectedFile }));
              }}
            />
            <p>{formData.file ? formData.file.name : 'Drag & drop a PDF here or click to upload'}</p>
          </div>
        </div>
        <div className="form-actions">
          {editingItem && <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>}
          <Button type="submit" disabled={saving || uploading}>
            {uploading ? 'Uploading...' : saving ? 'Saving...' : editingItem ? 'Update Report' : 'Create Report'}
          </Button>
        </div>
      </form>
    </Card>
    <Card title="Report List">
      {loading ? <Loading message="Loading reports..." /> : (
        <Table
          columns={[
            { header: 'Patient', accessor: (row) => getDisplayName(row.patient) },
            { header: 'Title', accessor: (row) => row.title || '-' },
            { header: 'Diagnosis', accessor: (row) => row.diagnosis || '-' },
            { header: 'Date', accessor: (row) => row.report_date || row.created_at || '-' },
          ]}
          data={reports}
          emptyMessage="No reports found"
          actions={[
            { label: 'View', type: 'secondary', onClick: onView },
            { label: 'Edit', onClick: onEdit },
            { label: 'Preview PDF', type: 'secondary', onClick: onPreview },
            { label: 'Download', type: 'secondary', onClick: onDownload },
          ]}
        />
      )}
    </Card>
  </div>
);

const DoctorHealthLogs = ({
  patients,
  selectedPatientId,
  setSelectedPatientId,
  healthEntries,
  loading,
  onLoad,
}) => (
  <div className="content-grid two-column">
    <Card title="Patient Health Logs">
      <form onSubmit={onLoad} className="narrow-form">
        <div className="form-group">
          <label>Patient</label>
          <select className="form-select" value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)} required>
            <option value="">Select patient</option>
            {patients.map((patient) => <option key={getPatientRouteId(patient)} value={getPatientRouteId(patient)}>{getDisplayName(patient)}</option>)}
          </select>
        </div>
        <div className="form-actions">
          <Button type="submit" variant="secondary">Load Health Logs</Button>
        </div>
      </form>
    </Card>
    <Card title="Health History">
      {loading ? <Loading message="Loading health logs..." /> : (
        <Table
          columns={[
            { header: 'Blood Pressure', accessor: (row) => row.blood_pressure || '-' },
            { header: 'Diabetes', accessor: (row) => row.diabetes || '-' },
            { header: 'Symptoms', accessor: (row) => row.symptoms || '-' },
            { header: 'Date', accessor: (row) => row.measured_at || row.created_at || '-' },
          ]}
          data={healthEntries}
          emptyMessage="Select a patient to view health logs"
        />
      )}
    </Card>
  </div>
);

const ReportDetailModal = ({ report, loading, onClose }) => {
  if (!report && !loading) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>Report Details</h3>
          <button type="button" className="action-btn action-secondary" onClick={onClose}>Close</button>
        </div>
        {loading ? <Loading message="Loading report..." /> : (
          <div className="stack-sm">
            <p><strong>Title:</strong> {report?.title || '-'}</p>
            <p><strong>Details:</strong> {report?.details || '-'}</p>
            <p><strong>Type:</strong> {report?.report_type || '-'}</p>
            <p><strong>Created At:</strong> {report?.created_at || '-'}</p>
            <p><strong>Created By:</strong> {report?.created_by_role || '-'}</p>
            <p><strong>Vitals:</strong> {report?.vitals && Object.keys(report.vitals).length ? JSON.stringify(report.vitals) : '-'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

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

const DoctorDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [reports, setReports] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prescriptionForm, setPrescriptionForm] = useState(emptyPrescriptionForm);
  const [reportForm, setReportForm] = useState(emptyReportForm);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [editingReport, setEditingReport] = useState(null);
  const [selectedReportDetail, setSelectedReportDetail] = useState(null);
  const [loadingReportDetail, setLoadingReportDetail] = useState(false);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [selectedReportPdf, setSelectedReportPdf] = useState(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
  const [loadingPdfPreview, setLoadingPdfPreview] = useState(false);
  const [selectedHealthPatientId, setSelectedHealthPatientId] = useState('');
  const [healthEntries, setHealthEntries] = useState([]);
  const [loadingHealthEntries, setLoadingHealthEntries] = useState(false);

  const refreshPatients = async () => {
    setLoadingPatients(true);
    try {
      const response = await apiService.getDoctorPatients();
      const extractedPatients = extractList(response, [
        'patients',
        'patients.data',
        'patients.items',
        'data.patients',
        'data.patients.data',
        'data.patients.items',
        'data.data.patients',
        'data',
        'items',
      ]).map(normalizePatient);
      if (process.env.NODE_ENV === 'development') {
        console.info('[DoctorDashboard] patients response', response);
        console.info('[DoctorDashboard] extracted patients', extractedPatients);
      }
      setPatients(extractedPatients);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load patients'));
    } finally {
      setLoadingPatients(false);
    }
  };

  const refreshPrescriptions = async () => {
    setLoadingPrescriptions(true);
    try {
      const response = await apiService.listDoctorPrescriptions();
      setPrescriptions(extractList(response, ['prescriptions', 'data.prescriptions', 'data', 'items']).map(normalizePrescription));
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load prescriptions'));
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  const refreshReports = async () => {
    setLoadingReports(true);
    try {
      const response = await apiService.listDoctorReports();
      setReports(extractList(response, ['reports', 'doctor_reports', 'data.reports', 'data.doctor_reports', 'data', 'items']).map(normalizeReport));
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load reports'));
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    refreshPatients();
    refreshPrescriptions();
    refreshReports();
  }, []);

  const resolvePatientId = (selectedId) => {
    const selectedPatient = findPatientByAnyId(patients, selectedId);
    return getPatientRouteId(selectedPatient) || selectedId;
  };

  const submitPrescription = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const selectedPatient = findPatientByAnyId(patients, prescriptionForm.patient_id);
      const medicines = (Array.isArray(prescriptionForm.medicines) ? prescriptionForm.medicines : [])
        .map((item) => ({
          name: (item?.name || '').trim(),
          dosage: (item?.dosage || '').trim(),
          frequency: (item?.frequency || '').trim(),
          duration: (item?.duration || '').trim(),
        }))
        .filter((item) => item.name);
      if (!medicines.length) {
        toast.error('Add at least one medicine');
        setSaving(false);
        return;
      }
      const payload = {
        ...prescriptionForm,
        medicines,
        patient_id: resolvePatientId(prescriptionForm.patient_id),
        ...(getPatientUserId(selectedPatient) ? { patient_user_id: getPatientUserId(selectedPatient) } : {}),
        patient_name: getDisplayName(selectedPatient),
      };
      if (editingPrescription) {
        await apiService.updatePrescription(getPrescriptionId(editingPrescription), payload);
        toast.success('Prescription updated successfully');
      } else {
        await apiService.createPrescription(payload);
        toast.success('Prescription created successfully');
      }
      setEditingPrescription(null);
      setPrescriptionForm(emptyPrescriptionForm);
      refreshPrescriptions();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to save prescription'));
    } finally {
      setSaving(false);
    }
  };

  const loadPatientHealthLogs = async (event) => {
    event?.preventDefault?.();
    if (!selectedHealthPatientId) {
      toast.error('Select a patient first');
      return;
    }
    setLoadingHealthEntries(true);
    try {
      const selectedPatient = findPatientByAnyId(patients, selectedHealthPatientId);
      const resolvedPatientId = getPatientRouteId(selectedPatient) || selectedHealthPatientId;
      const response = await apiService.getDoctorPatientHealth(resolvedPatientId);
      const entries = extractList(response, ['health_records', 'health', 'entries', 'data', 'items']);
      setHealthEntries(entries.map(normalizeHealthEntry));
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load health logs'));
    } finally {
      setLoadingHealthEntries(false);
    }
  };

  const submitReport = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const selectedPatient = findPatientByAnyId(patients, reportForm.patient_id);
      if (reportForm.file && !editingReport) {
        setUploadingReport(true);
        const formData = new FormData();
        formData.append('patient_id', resolvePatientId(reportForm.patient_id));
        const patientUserId = getPatientUserId(selectedPatient);
        if (patientUserId) formData.append('patient_user_id', patientUserId);
        formData.append('patient_name', getDisplayName(selectedPatient));
        formData.append('title', reportForm.title);
        formData.append('diagnosis', reportForm.diagnosis || '');
        formData.append('report_date', reportForm.report_date || '');
        formData.append('notes', reportForm.notes || '');
        formData.append('details', buildReportDetails(reportForm));
        formData.append('file', reportForm.file);
        await apiService.uploadDoctorReport(formData);
        toast.success('Report uploaded successfully');
      } else {
        const payload = {
          ...reportForm,
          patient_id: resolvePatientId(reportForm.patient_id),
          ...(getPatientUserId(selectedPatient) ? { patient_user_id: getPatientUserId(selectedPatient) } : {}),
          patient_name: getDisplayName(selectedPatient),
          details: buildReportDetails(reportForm),
          report_type: 'doctor_note',
        };
        if (editingReport) {
          await apiService.updateDoctorReport(getReportId(editingReport), payload);
          toast.success('Report updated successfully');
        } else {
          await apiService.createDoctorReport(payload);
          toast.success('Report created successfully');
        }
      }
      setEditingReport(null);
      setReportForm(emptyReportForm);
      refreshReports();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to save report'));
    } finally {
      setSaving(false);
      setUploadingReport(false);
    }
  };

  const handleEditPrescription = (item) => {
    const normalizedItem = normalizePrescription(item);
    setEditingPrescription(item);
    const medicines = Array.isArray(normalizedItem.medicines) && normalizedItem.medicines.length
      ? normalizedItem.medicines
      : [{
          name: normalizedItem.medication || '',
          dosage: normalizedItem.dosage || '',
          frequency: normalizedItem.frequency || '',
          duration: normalizedItem.duration || '',
        }];
    setPrescriptionForm({
      patient_id: normalizedItem.patient_id || '',
      diagnosis: normalizedItem.diagnosis || '',
      medicines,
      advice: normalizedItem.instructions || '',
      next_visit_date: normalizeDateInput(normalizedItem.next_visit_date),
    });
  };

  const handleEditReport = (item) => {
    const normalizedItem = normalizeReport(item);
    setEditingReport(item);
    setReportForm({
      patient_id: normalizedItem.patient_id || '',
      title: normalizedItem.title || '',
      diagnosis: normalizedItem.diagnosis || '',
      report_date: normalizeDateInput(normalizedItem.report_date),
      notes: normalizedItem.notes || '',
      file: null,
    });
  };

  const handleViewReport = async (item) => {
    setLoadingReportDetail(true);
    try {
      const response = await apiService.getDoctorReportById(getReportId(item));
      const report = normalizeReport(response?.report || response?.data || response);
      setSelectedReportDetail(report);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to load report details'));
    } finally {
      setLoadingReportDetail(false);
    }
  };

  const handleDownloadPrescription = async (item) => {
    try {
      const response = await apiService.downloadPrescription(getPrescriptionId(item));
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `prescription-${getPrescriptionId(item)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Prescription downloaded successfully');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to download prescription'));
    }
  };

  const handleDownloadReport = async (item) => {
    try {
      const response = await apiService.downloadDoctorReport(getReportId(item));
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${getReportId(item)}.pdf`;
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
      const response = await apiService.downloadDoctorReport(getReportId(item));
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
      <Button type="button" variant="secondary" onClick={refreshPatients}>Refresh Patients</Button>
      <Button type="button" variant="secondary" onClick={refreshPrescriptions}>Refresh Prescriptions</Button>
      <Button type="button" variant="secondary" onClick={refreshReports}>Refresh Reports</Button>
    </div>
  ), []);

  if (loadingPatients && loadingPrescriptions && loadingReports) return <Loading message="Loading doctor workspace..." />;

  return (
    <DashboardLayout title="Doctor Panel" description="Manage your assigned patients, prescriptions, and reports." actions={pageActions}>
      <Routes>
        <Route index element={<DoctorOverview patients={patients} prescriptions={prescriptions} reports={reports} />} />
        <Route path="patients" element={<DoctorPatients patients={patients} loading={loadingPatients} />} />
        <Route path="prescriptions" element={<DoctorPrescriptions patients={patients} prescriptions={prescriptions} loading={loadingPrescriptions} formData={prescriptionForm} setFormData={setPrescriptionForm} editingItem={editingPrescription} onSubmit={submitPrescription} onEdit={handleEditPrescription} onDownload={handleDownloadPrescription} onCancel={() => { setEditingPrescription(null); setPrescriptionForm(emptyPrescriptionForm); }} saving={saving} />} />
        <Route
          path="reports"
          element={<DoctorReports patients={patients} reports={reports} loading={loadingReports} formData={reportForm} setFormData={setReportForm} editingItem={editingReport} onSubmit={submitReport} onEdit={handleEditReport} onView={handleViewReport} onPreview={handlePreviewReport} onDownload={handleDownloadReport} onCancel={() => { setEditingReport(null); setReportForm(emptyReportForm); }} saving={saving} uploading={uploadingReport} />}
        />
        <Route
          path="health"
          element={<DoctorHealthLogs patients={patients} selectedPatientId={selectedHealthPatientId} setSelectedPatientId={setSelectedHealthPatientId} healthEntries={healthEntries} loading={loadingHealthEntries} onLoad={loadPatientHealthLogs} />}
        />
        <Route path="*" element={<Navigate to="/doctor" replace />} />
      </Routes>
      <ReportDetailModal report={selectedReportDetail} loading={loadingReportDetail} onClose={() => setSelectedReportDetail(null)} />
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
    </DashboardLayout>
  );
};

export default DoctorDashboard;
