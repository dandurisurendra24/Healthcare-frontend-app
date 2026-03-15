// Mock data service for development when backend is not available
export const mockData = {
  users: [
    {
      _id: '1',
      name: 'Dr. John Smith',
      email: 'john@example.com',
      role: 'doctor',
      specialization: 'Cardiology',
      phone: '+1234567890'
    },
    {
      _id: '2',
      name: 'Dr. Sarah Johnson',
      email: 'sarah@example.com',
      role: 'doctor',
      specialization: 'Neurology',
      phone: '+1234567891'
    },
    {
      _id: '3',
      name: 'Alice Brown',
      email: 'alice@example.com',
      role: 'patient',
      age: 30,
      phone: '+1234567892',
      address: '123 Main St, City, State'
    }
  ],

  patients: [
    {
      _id: '3',
      name: 'Alice Brown',
      email: 'alice@example.com',
      age: 30,
      phone: '+1234567892',
      address: '123 Main St, City, State',
      doctor: { name: 'Dr. John Smith' }
    },
    {
      _id: '4',
      name: 'Bob Wilson',
      email: 'bob@example.com',
      age: 45,
      phone: '+1234567893',
      address: '456 Oak Ave, City, State',
      doctor: null
    }
  ],

  prescriptions: [
    {
      _id: '1',
      patient: { name: 'Alice Brown' },
      doctor: { name: 'Dr. John Smith' },
      medication: 'Aspirin',
      dosage: '100mg',
      frequency: 'Once daily',
      duration: '30 days',
      instructions: 'Take with food',
      created_at: new Date().toISOString()
    }
  ]
};

export const mockApiService = {
  // Simulate API delay
  delay: (ms = 500) => new Promise(resolve => setTimeout(resolve, ms)),

  // Mock successful response
  mockSuccess: (data) => ({
    data,
    status: 200,
    statusText: 'OK'
  }),

  // Mock error response
  mockError: (message = 'Backend not available', status = 503) => {
    const error = new Error(message);
    error.response = {
      status,
      data: { message }
    };
    throw error;
  },

  // Admin endpoints
  getUsers: async () => {
    await mockApiService.delay();
    return mockApiService.mockSuccess(mockData.users);
  },

  getPatients: async () => {
    await mockApiService.delay();
    return mockApiService.mockSuccess(mockData.patients);
  },

  createDoctor: async (doctorData) => {
    await mockApiService.delay();
    const newDoctor = {
      _id: Date.now().toString(),
      ...doctorData,
      role: 'doctor'
    };
    mockData.users.push(newDoctor);
    return mockApiService.mockSuccess(newDoctor);
  },

  createPatient: async (patientData) => {
    await mockApiService.delay();
    const newPatient = {
      _id: Date.now().toString(),
      ...patientData,
      role: 'patient',
      doctor: null
    };
    mockData.patients.push(newPatient);
    mockData.users.push(newPatient);
    return mockApiService.mockSuccess(newPatient);
  },

  assignDoctor: async (patientId, doctorId) => {
    await mockApiService.delay();
    const patient = mockData.patients.find(p => p._id === patientId);
    const doctor = mockData.users.find(u => u._id === doctorId && u.role === 'doctor');

    if (patient && doctor) {
      patient.doctor = { name: doctor.name };
      return mockApiService.mockSuccess({ message: 'Doctor assigned successfully' });
    }
    return mockApiService.mockError('Patient or doctor not found', 404);
  },

  // Doctor endpoints
  getDoctorProfile: async () => {
    await mockApiService.delay();
    const doctor = mockData.users.find(u => u.role === 'doctor');
    return mockApiService.mockSuccess(doctor);
  },

  getDoctorPatients: async () => {
    await mockApiService.delay();
    const assignedPatients = mockData.patients.filter(p => p.doctor);
    return mockApiService.mockSuccess(assignedPatients);
  },

  createPrescription: async (prescriptionData) => {
    await mockApiService.delay();
    const newPrescription = {
      _id: Date.now().toString(),
      ...prescriptionData,
      created_at: new Date().toISOString()
    };
    mockData.prescriptions.push(newPrescription);
    return mockApiService.mockSuccess(newPrescription);
  },

  getDoctorPrescriptions: async () => {
    await mockApiService.delay();
    return mockApiService.mockSuccess(mockData.prescriptions);
  },

  updatePrescription: async (prescriptionId, payload) => {
    await mockApiService.delay();
    const index = mockData.prescriptions.findIndex(p => p._id === prescriptionId);
    if (index === -1) {
      return mockApiService.mockError('Prescription not found', 404);
    }
    mockData.prescriptions[index] = { ...mockData.prescriptions[index], ...payload };
    return mockApiService.mockSuccess(mockData.prescriptions[index]);
  },

  getDoctorReports: async () => {
    await mockApiService.delay();
    return mockApiService.mockSuccess(mockData.doctorReports || []);
  },

  createDoctorReport: async (reportData) => {
    await mockApiService.delay();
    const report = {
      _id: Date.now().toString(),
      ...reportData,
      created_at: new Date().toISOString(),
    };
    mockData.doctorReports = mockData.doctorReports || [];
    mockData.doctorReports.push(report);
    return mockApiService.mockSuccess(report);
  },

  updateDoctorReport: async (reportId, reportData) => {
    await mockApiService.delay();
    mockData.doctorReports = mockData.doctorReports || [];
    const index = mockData.doctorReports.findIndex(r => r._id === reportId);
    if (index === -1) {
      return mockApiService.mockError('Report not found', 404);
    }
    mockData.doctorReports[index] = { ...mockData.doctorReports[index], ...reportData };
    return mockApiService.mockSuccess(mockData.doctorReports[index]);
  },

  // Patient endpoints
  getPatientProfile: async () => {
    await mockApiService.delay();
    const patient = mockData.users.find(u => u.role === 'patient');
    return mockApiService.mockSuccess(patient);
  },

  updatePatientProfile: async (profileData) => {
    await mockApiService.delay();
    const patientIndex = mockData.users.findIndex(u => u.role === 'patient');
    if (patientIndex === -1) {
      return mockApiService.mockError('Patient not found', 404);
    }
    mockData.users[patientIndex] = { ...mockData.users[patientIndex], ...profileData };
    const patientId = mockData.users[patientIndex]._id;
    const patientFromPatientList = mockData.patients.find(p => p._id === patientId);
    if (patientFromPatientList) {
      Object.assign(patientFromPatientList, profileData);
    }
    return mockApiService.mockSuccess(mockData.users[patientIndex]);
  },

  getPatientPrescriptions: async () => {
    await mockApiService.delay();
    return mockApiService.mockSuccess(mockData.prescriptions);
  },

  getPatientReports: async () => {
    await mockApiService.delay();
    return mockApiService.mockSuccess(mockData.patientReports || []);
  },

  createPatientReport: async (reportData) => {
    await mockApiService.delay();
    const report = {
      _id: Date.now().toString(),
      ...reportData,
      created_at: new Date().toISOString(),
    };
    mockData.patientReports = mockData.patientReports || [];
    mockData.patientReports.push(report);
    return mockApiService.mockSuccess(report);
  },

  updatePatientReport: async (reportId, reportData) => {
    await mockApiService.delay();
    mockData.patientReports = mockData.patientReports || [];
    const index = mockData.patientReports.findIndex(r => r._id === reportId);
    if (index === -1) {
      return mockApiService.mockError('Patient report not found', 404);
    }
    mockData.patientReports[index] = { ...mockData.patientReports[index], ...reportData };
    return mockApiService.mockSuccess(mockData.patientReports[index]);
  },

  updateUser: async (userId, payload) => {
    await mockApiService.delay();
    const userIndex = mockData.users.findIndex(u => u._id === userId);
    if (userIndex === -1) {
      return mockApiService.mockError('User not found', 404);
    }
    mockData.users[userIndex] = { ...mockData.users[userIndex], ...payload };

    // Keep patients list in sync when role patient
    if (mockData.users[userIndex].role === 'patient') {
      const patientIdx = mockData.patients.findIndex(p => p._id === userId);
      if (patientIdx > -1) {
        mockData.patients[patientIdx] = { ...mockData.patients[patientIdx], ...payload };
      }
    }

    return mockApiService.mockSuccess(mockData.users[userIndex]);
  },
};