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

const extractList = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
};

const readPath = (item, path) => path.split('.').reduce((current, key) => current?.[key], item);
const pickFirst = (item, paths, fallback = '') => {
  for (const path of paths) {
    const value = readPath(item, path);
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return fallback;
};

const getId = (item) => item?.report_id || item?.user_id || item?._id || item?.id;
const getPrescriptionId = (item) => item?.prescription_id || item?._id || item?.id;
const getDoctorDisplayName = (row) =>
  pickFirst(row, ['doctor.full_name', 'doctor.name', 'doctor_name', 'doctor_full_name', 'doctor'], '-');
const normalizeDateInput = (value) => (typeof value === 'string' ? value.slice(0, 10) : '');
const normalizeReport = (report) => ({
  ...report,
  report_id: report?.report_id || report?._id || report?.id,
  details: report?.details || report?.summary || report?.notes || '',
  report_type: report?.report_type || '-',
  vitals: report?.vitals || {},
  created_at: report?.created_at || '-',
  created_by_role: report?.created_by_role || '-',
});
const normalizePrescription = (prescription) => {
  const source = prescription?.prescription || prescription;
  const firstMedicine = Array.isArray(source?.medicines) ? source.medicines[0] : null;
  const doctorName = pickFirst(source, ['doctor.full_name', 'doctor.name', 'doctor_name', 'doctor_full_name', 'doctor'], '');

  return {
    ...source,
    prescription_id: source?.prescription_id || source?._id || source?.id,
    medication: pickFirst(source, ['medication', 'medicine_name'], firstMedicine?.name || firstMedicine?.medicine_name || '-'),
    dosage: pickFirst(source, ['dosage'], firstMedicine?.dosage || '-'),
    frequency: pickFirst(source, ['frequency'], firstMedicine?.frequency || '-'),
    duration: pickFirst(source, ['duration'], firstMedicine?.duration || '-'),
    advice: pickFirst(source, ['advice', 'instructions'], '-'),
    next_visit_date: pickFirst(source, ['next_visit_date'], '-'),
    doctor: source?.doctor || (doctorName ? { name: doctorName } : null),
    doctor_name: doctorName || '-',
  };
};

const emptyProfile = {
  full_name: '',
  email: '',
  age: '',
  phone: '',
  address: '',
};

const emptyReportForm = {
  title: '',
  diagnosis: '',
  report_date: '',
  notes: '',
  file: null,
};

const emptyHealthForm = {
  blood_pressure: '',
  diabetes: '',
  symptoms: '',
  notes: '',
  measured_at: '',
};

const PatientOverview = ({ reports, healthEntries, prescriptions }) => (
  <div className="dashboard-grid">
    <Card title="My Activity">
      <div className="stats">
        <div className="stat-item"><h3>{reports.length}</h3><p>Reports</p></div>
        <div className="stat-item"><h3>{healthEntries.length}</h3><p>Health Logs</p></div>
        <div className="stat-item"><h3>{prescriptions.length}</h3><p>Prescriptions</p></div>
      </div>
    </Card>
    <Card title="Available Actions">
      <div className="stack-sm">
        <p>Update your profile details.</p>
        <p>Add or edit your reports.</p>
        <p>Track blood pressure, diabetes, and symptoms.</p>
      </div>
    </Card>
  </div>
);

const PatientProfile = ({ profile, setProfile, onSubmit, loading, saving }) => (
  <Card title="My Profile">
    {loading ? <Loading message="Loading profile..." /> : (
      <form onSubmit={onSubmit} className="content-grid two-column">
        <Input label="Full Name" value={profile.full_name} onChange={(e) => setProfile((c) => ({ ...c, full_name: e.target.value }))} required />
        <Input label="Email" type="email" value={profile.email} onChange={(e) => setProfile((c) => ({ ...c, email: e.target.value }))} required />
        <Input label="Age" type="number" value={profile.age} onChange={(e) => setProfile((c) => ({ ...c, age: e.target.value }))} required />
        <Input label="Phone" value={profile.phone} onChange={(e) => setProfile((c) => ({ ...c, phone: e.target.value }))} required />
        <div className="form-group full-span">
          <label>Address</label>
          <textarea className="form-textarea" value={profile.address} onChange={(e) => setProfile((c) => ({ ...c, address: e.target.value }))} rows="3" />
        </div>
        <div className="full-span">
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Update Profile'}</Button>
        </div>
      </form>
    )}
  </Card>
);

const PatientReports = ({
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
    <Card title={editingItem ? 'Edit My Report' : 'Add My Report'}>
      <form onSubmit={onSubmit}>
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
            {uploading ? 'Uploading...' : saving ? 'Saving...' : editingItem ? 'Update Report' : 'Add Report'}
          </Button>
        </div>
      </form>
    </Card>
    <Card title="My Reports">
      {loading ? <Loading message="Loading reports..." /> : (
        <Table
          columns={[
            { header: 'Title', accessor: (row) => row.title || '-' },
            { header: 'Type', accessor: (row) => row.report_type || '-' },
            { header: 'Date', accessor: (row) => row.report_date || row.created_at || '-' },
          ]}
          data={reports}
          emptyMessage="No reports yet"
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

const PrescriptionDetailModal = ({ prescription, loading, onClose, onDownload, downloading }) => {
  if (!prescription && !loading) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>Prescription Details</h3>
          <button type="button" className="action-btn action-secondary" onClick={onClose}>Close</button>
        </div>
        {loading ? <Loading message="Loading prescription..." /> : (
          <div className="stack-sm">
            <p><strong>Doctor:</strong> {getDoctorDisplayName(prescription)}</p>
            <p><strong>Diagnosis:</strong> {prescription?.diagnosis || '-'}</p>
            <p><strong>Medication:</strong> {prescription?.medication || '-'}</p>
            <p><strong>Dosage:</strong> {prescription?.dosage || '-'}</p>
            <p><strong>Frequency:</strong> {prescription?.frequency || '-'}</p>
            <p><strong>Duration:</strong> {prescription?.duration || '-'}</p>
            <p><strong>Advice:</strong> {prescription?.advice || '-'}</p>
            <p><strong>Next Visit:</strong> {prescription?.next_visit_date || '-'}</p>
            <p><strong>Created At:</strong> {prescription?.created_at || '-'}</p>
            <div className="form-actions">
              <Button type="button" variant="primary" onClick={() => onDownload(prescription)} disabled={downloading}>
                {downloading ? 'Downloading...' : 'Download PDF'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PatientHealth = ({ healthEntries, loading, formData, setFormData, onSubmit, saving }) => (
  <div className="content-grid two-column">
    <Card title="Log Current Health">
      <form onSubmit={onSubmit}>
        <Input label="Blood Pressure" value={formData.blood_pressure} onChange={(e) => setFormData((c) => ({ ...c, blood_pressure: e.target.value }))} placeholder="120/80" required />
        <Input label="Diabetes" value={formData.diabetes} onChange={(e) => setFormData((c) => ({ ...c, diabetes: e.target.value }))} placeholder="Normal / Type 1 / Type 2" />
        <Input label="Measured At" type="date" value={formData.measured_at} onChange={(e) => setFormData((c) => ({ ...c, measured_at: e.target.value }))} />
        <div className="form-group">
          <label>Symptoms</label>
          <textarea className="form-textarea" value={formData.symptoms} onChange={(e) => setFormData((c) => ({ ...c, symptoms: e.target.value }))} rows="3" />
        </div>
        <div className="form-group">
          <label>Notes</label>
          <textarea className="form-textarea" value={formData.notes} onChange={(e) => setFormData((c) => ({ ...c, notes: e.target.value }))} rows="4" />
        </div>
        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add Health Entry'}</Button>
      </form>
    </Card>
    <Card title="Health History">
      {loading ? <Loading message="Loading health history..." /> : (
        <Table
          columns={[
            { header: 'Blood Pressure', accessor: (row) => row.blood_pressure || '-' },
            { header: 'Diabetes', accessor: (row) => row.diabetes || '-' },
            { header: 'Symptoms', accessor: (row) => row.symptoms || '-' },
            { header: 'Date', accessor: (row) => row.measured_at || row.created_at || '-' },
          ]}
          data={healthEntries}
          emptyMessage="No health entries yet"
        />
      )}
    </Card>
  </div>
);

const PatientPrescriptions = ({ prescriptions, loading, onRowClick }) => (
  <Card title="My Prescriptions">
    {loading ? <Loading message="Loading prescriptions..." /> : (
      <Table
        columns={[
          { header: 'Doctor', accessor: getDoctorDisplayName },
          { header: 'Medication', accessor: (row) => row.medication || '-' },
          { header: 'Dosage', accessor: (row) => row.dosage || '-' },
          { header: 'Frequency', accessor: (row) => row.frequency || '-' },
        ]}
        data={prescriptions}
        emptyMessage="No prescriptions found"
        onRowClick={onRowClick}
      />
    )}
  </Card>
);

const PatientDashboard = () => {
  const [profile, setProfile] = useState(emptyProfile);
  const [reports, setReports] = useState([]);
  const [healthEntries, setHealthEntries] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reportForm, setReportForm] = useState(emptyReportForm);
  const [healthForm, setHealthForm] = useState(emptyHealthForm);
  const [editingReport, setEditingReport] = useState(null);
  const [selectedReportDetail, setSelectedReportDetail] = useState(null);
  const [loadingReportDetail, setLoadingReportDetail] = useState(false);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [selectedReportPdf, setSelectedReportPdf] = useState(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
  const [loadingPdfPreview, setLoadingPdfPreview] = useState(false);
  const [selectedPrescriptionDetail, setSelectedPrescriptionDetail] = useState(null);
  const [loadingPrescriptionDetail] = useState(false);
  const [downloadingPrescription, setDownloadingPrescription] = useState(false);

  const refreshProfile = async () => {
    setLoadingProfile(true);
    try {
      const response = await apiService.getPatientProfile();
      const nextProfile = response.profile || response.data || response;
      setProfile({
        full_name: nextProfile.full_name || nextProfile.name || '',
        email: nextProfile.email || '',
        age: nextProfile.age || '',
        phone: nextProfile.phone || '',
        address: nextProfile.address || '',
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load profile'));
    } finally {
      setLoadingProfile(false);
    }
  };

  const refreshReports = async () => {
    setLoadingReports(true);
    try {
      const response = await apiService.listPatientReports();
      setReports(extractList(response, ['reports', 'data', 'items']).map(normalizeReport));
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load reports'));
    } finally {
      setLoadingReports(false);
    }
  };

  const refreshHealthEntries = async () => {
    setLoadingHealth(true);
    try {
      const response = await apiService.listPatientHealth();
      setHealthEntries(extractList(response, ['health', 'entries', 'data', 'items']));
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load health entries'));
    } finally {
      setLoadingHealth(false);
    }
  };

  const refreshPrescriptions = async () => {
    setLoadingPrescriptions(true);
    try {
      const response = await apiService.listPatientPrescriptions();
      setPrescriptions(extractList(response, ['prescriptions', 'data', 'items']).map(normalizePrescription));
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load prescriptions'));
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  useEffect(() => {
    refreshProfile();
    refreshReports();
    refreshHealthEntries();
    refreshPrescriptions();
  }, []);

  const submitProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await apiService.updatePatientProfile({ ...profile, age: profile.age ? Number(profile.age) : '' });
      toast.success('Profile updated successfully');
      refreshProfile();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to update profile'));
    } finally {
      setSaving(false);
    }
  };

  const submitReport = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (reportForm.file && !editingReport) {
        setUploadingReport(true);
        const formData = new FormData();
        formData.append('title', reportForm.title);
        formData.append('diagnosis', reportForm.diagnosis || '');
        formData.append('report_date', reportForm.report_date || '');
        formData.append('notes', reportForm.notes || '');
        formData.append('details', `Diagnosis: ${reportForm.diagnosis}\nNotes: ${reportForm.notes}\nReport Date: ${reportForm.report_date}`.trim());
        formData.append('file', reportForm.file);
        await apiService.uploadPatientReport(formData);
        toast.success('Report uploaded successfully');
      } else if (editingReport) {
        await apiService.updatePatientReport(getId(editingReport), reportForm);
        toast.success('Report updated successfully');
      } else {
        await apiService.createPatientReport(reportForm);
        toast.success('Report added successfully');
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

  const submitHealthEntry = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await apiService.createPatientHealth(healthForm);
      toast.success('Health entry added successfully');
      setHealthForm(emptyHealthForm);
      refreshHealthEntries();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to save health entry'));
    } finally {
      setSaving(false);
    }
  };

  const handleEditReport = (item) => {
    setEditingReport(item);
    setReportForm({
      title: item.title || '',
      diagnosis: item.diagnosis || '',
      report_date: normalizeDateInput(item.report_date || item.created_at),
      notes: item.notes || '',
      file: null,
    });
  };

  const handleViewReport = async (item) => {
    setLoadingReportDetail(true);
    try {
      const response = await apiService.getPatientReportById(getId(item));
      const report = normalizeReport(response?.report || response?.data || response);
      setSelectedReportDetail(report);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to load report details'));
    } finally {
      setLoadingReportDetail(false);
    }
  };

  const handleDownloadReport = async (item) => {
    try {
      const response = await apiService.downloadPatientReport(getId(item));
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${getId(item)}.pdf`;
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
      const response = await apiService.downloadPatientReport(getId(item));
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      setSelectedReportPdf(item);
      setPdfPreviewUrl(url);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to load report PDF'));
    } finally {
      setLoadingPdfPreview(false);
    }
  };

  const handleViewPrescription = (item) => {
    setSelectedPrescriptionDetail(item);
  };

  const handleDownloadPrescription = async (item) => {
    setDownloadingPrescription(true);
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
    } finally {
      setDownloadingPrescription(false);
    }
  };

  const pageActions = useMemo(() => (
    <div className="inline-actions">
      <Button type="button" variant="secondary" onClick={refreshProfile}>Refresh Profile</Button>
      <Button type="button" variant="secondary" onClick={refreshReports}>Refresh Reports</Button>
      <Button type="button" variant="secondary" onClick={refreshHealthEntries}>Refresh Health</Button>
      <Button type="button" variant="secondary" onClick={refreshPrescriptions}>Refresh Prescriptions</Button>
    </div>
  ), []);

  if (loadingProfile && loadingReports && loadingHealth && loadingPrescriptions) return <Loading message="Loading patient workspace..." />;

  return (
    <DashboardLayout title="Patient Panel" description="Manage your profile, self-reported health data, reports, and prescriptions." actions={pageActions}>
      <Routes>
        <Route index element={<PatientOverview reports={reports} healthEntries={healthEntries} prescriptions={prescriptions} />} />
        <Route path="profile" element={<PatientProfile profile={profile} setProfile={setProfile} onSubmit={submitProfile} loading={loadingProfile} saving={saving} />} />
        <Route
          path="reports"
          element={<PatientReports reports={reports} loading={loadingReports} formData={reportForm} setFormData={setReportForm} editingItem={editingReport} onSubmit={submitReport} onEdit={handleEditReport} onView={handleViewReport} onPreview={handlePreviewReport} onDownload={handleDownloadReport} onCancel={() => { setEditingReport(null); setReportForm(emptyReportForm); }} saving={saving} uploading={uploadingReport} />}
        />
        <Route path="health" element={<PatientHealth healthEntries={healthEntries} loading={loadingHealth} formData={healthForm} setFormData={setHealthForm} onSubmit={submitHealthEntry} saving={saving} />} />
        <Route path="prescriptions" element={<PatientPrescriptions prescriptions={prescriptions} loading={loadingPrescriptions} onRowClick={handleViewPrescription} />} />
        <Route path="*" element={<Navigate to="/patient" replace />} />
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
      <PrescriptionDetailModal
        prescription={selectedPrescriptionDetail}
        loading={loadingPrescriptionDetail}
        onClose={() => setSelectedPrescriptionDetail(null)}
        onDownload={handleDownloadPrescription}
        downloading={downloadingPrescription}
      />
    </DashboardLayout>
  );
};

export default PatientDashboard;
