const readPath = (item, path) => path.split('.').reduce((current, key) => current?.[key], item);

const uniqueValues = (values) => [...new Set(values.filter((value) => value !== undefined && value !== null && value !== ''))];

const pickFirst = (item, paths) => {
  for (const path of paths) {
    const value = readPath(item, path);
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return '';
};

export const getDisplayName = (item) =>
  item?.full_name ||
  item?.name ||
  item?.profile?.full_name ||
  item?.profile?.name ||
  item?.email ||
  item?.phone ||
  '-';

export const getDoctorRouteId = (item) =>
  pickFirst(item, ['doctor_id', 'doctor._id', 'doctor.id', '_id', 'id', 'user_id', 'doctor.user_id']);

export const getPatientRouteId = (item) =>
  pickFirst(item, ['patient_id', 'patient.patient_id', 'patient._id', 'patient.id', '_id', 'id', 'user_id', 'patient.user_id']);

export const getDoctorUserId = (item) =>
  pickFirst(item, ['user_id', 'doctor.user_id', 'user.id', 'doctor.user.id']);

export const getPatientUserId = (item) =>
  pickFirst(item, ['user_id', 'patient.user_id', 'user.id', 'patient.user.id']);

export const getPrescriptionId = (item) =>
  pickFirst(item, ['prescription_id', '_id', 'id']);

export const getReportId = (item) =>
  pickFirst(item, ['report_id', '_id', 'id']);

export const getComparablePatientIds = (item) =>
  uniqueValues([
    readPath(item, 'user_id'),
    readPath(item, 'patient.user_id'),
    readPath(item, 'patient_id'),
    readPath(item, '_id'),
    readPath(item, 'id'),
    readPath(item, 'patient.patient_id'),
    readPath(item, 'patient._id'),
    readPath(item, 'patient.id'),
  ]).map((value) => String(value));

export const getComparableDoctorIds = (item) =>
  uniqueValues([
    readPath(item, 'user_id'),
    readPath(item, 'doctor.user_id'),
    readPath(item, 'doctor_id'),
    readPath(item, '_id'),
    readPath(item, 'id'),
    readPath(item, 'doctor.doctor_id'),
    readPath(item, 'doctor._id'),
    readPath(item, 'doctor.id'),
  ]).map((value) => String(value));

export const findPatientByAnyId = (patients, selectedId) =>
  patients.find((patient) => getComparablePatientIds(patient).includes(String(selectedId)));

export const findDoctorByAnyId = (doctors, selectedId) =>
  doctors.find((doctor) => getComparableDoctorIds(doctor).includes(String(selectedId)));
