import axios from 'axios';
import { API_ENDPOINTS, STORAGE_KEYS } from '../utils/constants';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:5000';
const DEBUG_API = process.env.REACT_APP_DEBUG_API === 'true';

const api = axios.create({
  baseURL: API_BASE_URL,
});

let isRedirectingToLogin = false;

const clearStoredAuth = () => {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (DEBUG_API && process.env.NODE_ENV === 'development') {
    const isAbsolute = /^https?:\/\//i.test(config.url || '');
    const fullUrl = isAbsolute
      ? config.url
      : `${config.baseURL || ''}${config.url || ''}`;
    // Avoid logging secrets while still proving auth header is present.
    console.info('[API REQUEST]', config.method?.toUpperCase(), fullUrl, {
      hasAuthHeader: Boolean(config.headers?.Authorization),
      origin: window.location.origin,
    });
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredAuth();

      if (!isRedirectingToLogin && window.location.pathname !== '/login') {
        isRedirectingToLogin = true;
        window.location.assign('/login');
        window.setTimeout(() => {
          isRedirectingToLogin = false;
        }, 500);
      }
    }

    return Promise.reject(error);
  }
);

const unwrap = (response) => response.data;

const pickDefined = (source, keys) =>
  keys.reduce((acc, key) => {
    if (source?.[key] !== undefined) acc[key] = source[key];
    return acc;
  }, {});

const normalizeStringArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const normalizeAdminPatientPayload = (payload, { isCreate = false } = {}) => {
  const base = pickDefined(payload, [
    'full_name',
    'email',
    'phone',
    'assigned_doctor_id',
    'gender',
    'date_of_birth',
    'blood_group',
    'address',
    'emergency_contact',
  ]);

  const normalized = { ...base };

  if (isCreate || Object.prototype.hasOwnProperty.call(payload || {}, 'medical_history')) {
    normalized.medical_history = normalizeStringArray(payload?.medical_history);
  }

  if (isCreate || payload?.password) {
    normalized.password = payload?.password || '';
  }

  return normalized;
};

const normalizeDoctorPayload = (payload, { isCreate = false } = {}) => {
  const normalized = pickDefined(payload, [
    'full_name',
    'email',
    'phone',
    'specialization',
    'license_number',
    'experience_years',
    'department',
    'is_active',
  ]);

  if (isCreate || payload?.password) {
    normalized.password = payload?.password || '';
  }

  return normalized;
};

const normalizeReportPayload = (payload, defaultType, { partial = false } = {}) => {
  const normalized = pickDefined(payload, ['patient_user_id', 'title', 'details', 'report_type', 'vitals']);
  const derivedDetails = [
    payload?.diagnosis ? `Diagnosis: ${payload.diagnosis}` : '',
    payload?.notes ? `Notes: ${payload.notes}` : '',
    payload?.report_date ? `Report Date: ${payload.report_date}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  if (!normalized.details && derivedDetails) {
    normalized.details = derivedDetails;
  }

  if (!partial && !normalized.report_type && defaultType) {
    normalized.report_type = defaultType;
  }

  if (!partial && normalized.vitals === undefined) {
    normalized.vitals = {};
  }

  return normalized;
};

const normalizePrescriptionPayload = (payload, { partial = false } = {}) => {
  const medicines = Array.isArray(payload?.medicines)
    ? payload.medicines
    : payload?.medication
      ? [
          {
            name: payload.medication,
            dosage: payload?.dosage || '',
            frequency: payload?.frequency || '',
            duration: payload?.duration || '',
          },
        ]
      : [];

  if (!partial) {
    return {
      patient_user_id: payload?.patient_user_id || payload?.patient_id || '',
      diagnosis: payload?.diagnosis || '',
      medicines,
      advice: payload?.advice || payload?.instructions || '',
      next_visit_date: payload?.next_visit_date || '',
    };
  }

  const normalized = {};
  if (payload?.patient_user_id || payload?.patient_id) {
    normalized.patient_user_id = payload.patient_user_id || payload.patient_id;
  }
  if (payload?.diagnosis !== undefined) normalized.diagnosis = payload.diagnosis;
  if (payload?.medicines !== undefined || payload?.medication !== undefined) normalized.medicines = medicines;
  if (payload?.advice !== undefined || payload?.instructions !== undefined) {
    normalized.advice = payload.advice || payload.instructions || '';
  }
  if (payload?.next_visit_date !== undefined) normalized.next_visit_date = payload.next_visit_date;
  return normalized;
};

const normalizeHealthPayload = (payload) => ({
  vitals: payload?.vitals || {
    blood_pressure: payload?.blood_pressure || '',
    diabetes: payload?.diabetes || '',
    symptoms: payload?.symptoms || '',
    measured_at: payload?.measured_at || '',
  },
  notes: payload?.notes || '',
});

export const getApiErrorMessage = (error, fallback = 'Something went wrong') =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  error.message ||
  fallback;

export const apiService = {
  login: (payload) => api.post(API_ENDPOINTS.auth.login, payload).then(unwrap),
  logout: () => api.get(API_ENDPOINTS.auth.logout).then(unwrap),
  getMe: () => api.get(API_ENDPOINTS.auth.me).then(unwrap),
  changePassword: (payload) => api.post(API_ENDPOINTS.auth.changePassword, payload).then(unwrap),

  listUsers: (role) =>
    api.get(API_ENDPOINTS.admin.users, { params: role ? { role } : {} }).then(unwrap),
  updateUser: (userId, payload) => api.patch(API_ENDPOINTS.admin.userById(userId), payload).then(unwrap),
  listDoctors: () => api.get(API_ENDPOINTS.admin.doctors).then(unwrap),
  createDoctor: (payload) =>
    api.post(API_ENDPOINTS.admin.doctors, normalizeDoctorPayload(payload, { isCreate: true })).then(unwrap),
  updateDoctor: (doctorId, payload) =>
    api.patch(API_ENDPOINTS.admin.doctorById(doctorId), normalizeDoctorPayload(payload)).then(unwrap),
  deleteDoctor: (doctorId) => api.delete(API_ENDPOINTS.admin.doctorById(doctorId)).then(unwrap),

  createPatient: (payload) =>
    api.post(API_ENDPOINTS.admin.patients, normalizeAdminPatientPayload(payload, { isCreate: true })).then(unwrap),
  listPatients: () => api.get(API_ENDPOINTS.admin.patientsList).then(unwrap),
  getPatients: () => api.get(API_ENDPOINTS.admin.patients).then(unwrap),
  updatePatient: (patientId, payload) =>
    api.patch(API_ENDPOINTS.admin.patientById(patientId), normalizeAdminPatientPayload(payload)).then(unwrap),
  deletePatient: (patientId) => api.delete(API_ENDPOINTS.admin.patientById(patientId)).then(unwrap),
  updateAdminPatientProfile: (patientId, payload) => api.patch(API_ENDPOINTS.admin.patientProfile(patientId), payload).then(unwrap),
  updateAdminPrescription: (prescriptionId, payload) => api.patch(API_ENDPOINTS.admin.prescriptionById(prescriptionId), payload).then(unwrap),
  assignDoctor: (patientId, doctorId) => api.patch(API_ENDPOINTS.admin.assignDoctor(patientId), { doctor_id: doctorId }).then(unwrap),
  createAdminPatientReport: (patientId, payload) =>
    api.post(API_ENDPOINTS.admin.reports(patientId), payload).then(unwrap),
  getAdminPatientReports: (patientId) => api.get(API_ENDPOINTS.admin.reports(patientId)).then(unwrap),
  uploadAdminPatientReport: (patientId, formData) =>
    api.post(API_ENDPOINTS.admin.reportUpload(patientId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(unwrap),
  downloadAdminReport: (reportId) =>
    api.get(API_ENDPOINTS.admin.reportDownload(reportId), { responseType: 'blob' }),
  createAdminHealthEntry: (patientId, payload) =>
    api.post(API_ENDPOINTS.admin.health(patientId), payload).then(unwrap),

  getDoctorProfile: () => api.get(API_ENDPOINTS.doctor.profile).then(unwrap),
  getDoctorPatients: () => api.get(API_ENDPOINTS.doctor.patients).then(unwrap),
  getDoctorPatientHealth: (patientId) =>
    api.get(API_ENDPOINTS.doctor.patientHealth(patientId)).then(unwrap),
  listDoctorPrescriptions: () => api.get(API_ENDPOINTS.doctor.prescriptions).then(unwrap),
  createPrescription: (payload) =>
    api.post(API_ENDPOINTS.doctor.prescriptions, normalizePrescriptionPayload(payload, { partial: false })).then(unwrap),
  updatePrescription: (id, payload) =>
    api.patch(API_ENDPOINTS.doctor.prescriptionById(id), normalizePrescriptionPayload(payload, { partial: true })).then(unwrap),
  downloadPrescription: (id) =>
    api.get(API_ENDPOINTS.doctor.prescriptionDownload(id), { responseType: 'blob' }),
  listDoctorReports: () => api.get(API_ENDPOINTS.doctor.reports).then(unwrap),
  getDoctorReportById: (id) => api.get(API_ENDPOINTS.doctor.reportById(id)).then(unwrap),
  uploadDoctorReport: (formData) =>
    api.post(API_ENDPOINTS.doctor.reportUpload, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(unwrap),
  downloadDoctorReport: (id) =>
    api.get(API_ENDPOINTS.doctor.reportDownload(id), { responseType: 'blob' }),
  createDoctorReport: (payload) =>
    api.post(API_ENDPOINTS.doctor.reports, normalizeReportPayload(payload, 'clinical', { partial: false })).then(unwrap),
  updateDoctorReport: (id, payload) =>
    api.patch(API_ENDPOINTS.doctor.reportById(id), normalizeReportPayload(payload, '', { partial: true })).then(unwrap),

  getPatientProfile: () => api.get(API_ENDPOINTS.patient.profile).then(unwrap),
  updatePatientProfile: (payload) =>
    api.patch(
      API_ENDPOINTS.patient.profile,
      pickDefined(payload, ['gender', 'date_of_birth', 'blood_group', 'address', 'emergency_contact', 'medical_history'])
    ).then(unwrap),
  listPatientReports: () => api.get(API_ENDPOINTS.patient.reports).then(unwrap),
  getPatientReportById: (id) => api.get(API_ENDPOINTS.patient.reportById(id)).then(unwrap),
  uploadPatientReport: (formData) =>
    api.post(API_ENDPOINTS.patient.reportUpload, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(unwrap),
  downloadPatientReport: (id) =>
    api.get(API_ENDPOINTS.patient.reportDownload(id), { responseType: 'blob' }),
  createPatientReport: (payload) =>
    api.post(API_ENDPOINTS.patient.reports, normalizeReportPayload(payload, 'self_report', { partial: false })).then(unwrap),
  updatePatientReport: (id, payload) =>
    api.patch(API_ENDPOINTS.patient.reportById(id), normalizeReportPayload(payload, '', { partial: true })).then(unwrap),
  listPatientHealth: () => api.get(API_ENDPOINTS.patient.health).then(unwrap),
  createPatientHealth: (payload) => api.post(API_ENDPOINTS.patient.health, normalizeHealthPayload(payload)).then(unwrap),
  listPatientPrescriptions: () => api.get(API_ENDPOINTS.patient.prescriptions).then(unwrap),

  getCommonHealth: () => api.get(API_ENDPOINTS.common.health).then(unwrap),
  getCommonDashboard: () => api.get(API_ENDPOINTS.common.dashboard).then(unwrap),
};

export default api;
