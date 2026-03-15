export const ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  PATIENT: 'patient',
};

export const STORAGE_KEYS = {
  TOKEN: 'token',
};

export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
    changePassword: '/api/auth/change-password',
  },
  admin: {
    users: '/api/admin/users',
    userById: (userId) => `/api/admin/users/${userId}`,
    doctors: '/api/admin/doctors',
    doctorById: (doctorId) => `/api/admin/doctors/${doctorId}`,
    patients: '/api/admin/patients',
    patientsList: '/api/admin/patients/list',
    patientById: (patientId) => `/api/admin/patients/${patientId}`,
    patientProfile: (patientId) => `/api/admin/patients/${patientId}/profile`,
    assignDoctor: (patientId) => `/api/admin/patients/${patientId}/assign-doctor`,
    prescriptionById: (prescriptionId) => `/api/admin/prescriptions/${prescriptionId}`,
    reports: (patientId) => `/api/admin/patients/${patientId}/reports`,
    reportUpload: (patientId) => `/api/admin/patients/${patientId}/reports/upload`,
    reportDownload: (reportId) => `/api/admin/reports/${reportId}/download`,
    health: (patientId) => `/api/admin/patients/${patientId}/health`,
  },
  doctor: {
    profile: '/api/doctor/profile',
    patients: '/api/doctor/patients',
    patientHealth: (patientId) => `/api/doctor/patients/${patientId}/health`,
    prescriptions: '/api/doctor/prescriptions',
    prescriptionById: (id) => `/api/doctor/prescriptions/${id}`,
    prescriptionDownload: (id) => `/api/doctor/prescriptions/${id}/download`,
    reports: '/api/doctor/reports',
    reportById: (id) => `/api/doctor/reports/${id}`,
    reportUpload: '/api/doctor/reports/upload',
    reportDownload: (id) => `/api/doctor/reports/${id}/download`,
  },
  patient: {
    profile: '/api/patient/profile',
    reports: '/api/patient/reports',
    reportById: (id) => `/api/patient/reports/${id}`,
    reportUpload: '/api/patient/reports/upload',
    reportDownload: (id) => `/api/patient/reports/${id}/download`,
    health: '/api/patient/health',
    prescriptions: '/api/patient/prescriptions',
  },
  common: {
    health: '/api/common/health',
    dashboard: '/api/common/dashboard',
  },
};

export const getRoleHomePath = (role) => {
  switch (role) {
    case ROLES.ADMIN:
      return '/admin';
    case ROLES.DOCTOR:
      return '/doctor';
    case ROLES.PATIENT:
      return '/patient';
    default:
      return '/login';
  }
};
