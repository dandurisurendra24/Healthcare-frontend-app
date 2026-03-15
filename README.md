# Health Monitoring System - Frontend

A comprehensive React-based frontend for a Health Monitoring System with role-based dashboards for Admin, Doctor, and Patient users.

## Features

### Authentication
- JWT-based authentication
- Role-based access control (Admin, Doctor, Patient)
- Protected routes with automatic redirects

### Admin Dashboard
- Create and manage doctors
- Create and manage patients
- View all users and patients
- Assign doctors to patients
- User statistics and overview

### Doctor Dashboard
- View and update profile
- Manage assigned patients
- Create prescriptions
- View prescription history
- Download prescriptions as PDF

### Patient Dashboard
- View personal profile
- View assigned prescriptions
- Download prescriptions as PDF

### UI/UX Features
- Responsive design for desktop and mobile
- Clean healthcare-themed interface
- Loading states and error handling
- Toast notifications
- Form validation
- Reusable components

## Tech Stack

- **React 19** - Frontend framework
- **React Router** - Client-side routing
- **Axios** - HTTP client with interceptors
- **React Toastify** - Notifications
- **CSS3** - Styling with modern design
- **JWT** - Authentication tokens

## Project Structure

```
src/
├── components/
│   ├── common/          # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Card.jsx
│   │   ├── Table.jsx
│   │   ├── Loading.jsx
│   │   └── Sidebar.jsx
│   └── forms/           # Form components
│       ├── CreateDoctorForm.jsx
│       ├── CreatePatientForm.jsx
│       ├── AssignDoctorForm.jsx
│       └── PrescriptionForm.jsx
├── contexts/
│   └── AuthContext.js   # Authentication context
├── layouts/
│   └── DashboardLayout.jsx  # Main dashboard layout
├── pages/               # Page components
│   ├── Login.jsx
│   ├── AdminDashboard.jsx
│   ├── DoctorDashboard.jsx
│   └── PatientDashboard.jsx
├── services/
│   ├── api.js          # Axios configuration
│   └── auth.js         # Authentication service
├── utils/
│   └── constants.js    # API endpoints and constants
├── App.js              # Main app component
└── index.js            # App entry point
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Backend API running on `http://127.0.0.1:5000`

## Installation

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
```

## Running the Application

1. Start the development server:

```bash
npm start
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

## Backend API Requirements

The frontend expects a Flask + MongoDB backend running on `http://127.0.0.1:5000` with the following endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Admin Endpoints
- `POST /api/admin/doctors` - Create doctor
- `POST /api/admin/patients` - Create patient
- `GET /api/admin/users` - Get all users
- `GET /api/admin/patients` - Get all patients
- `PATCH /api/admin/patients/:id/assign-doctor` - Assign doctor to patient

### Doctor Endpoints
- `GET /api/doctor/profile` - Get doctor profile
- `GET /api/doctor/patients` - Get assigned patients
- `POST /api/doctor/prescriptions` - Create prescription
- `GET /api/doctor/prescriptions` - Get prescriptions
- `GET /api/doctor/prescriptions/:id/download` - Download prescription PDF

### Patient Endpoints
- `GET /api/patient/profile` - Get patient profile
- `GET /api/patient/prescriptions` - Get prescriptions

## User Roles and Navigation

### Admin
- Can access all admin functions
- Redirects to `/admin/dashboard`

### Doctor
- Can manage patients and prescriptions
- Redirects to `/doctor/dashboard`

### Patient
- Can view profile and prescriptions
- Redirects to `/patient/dashboard`

## Building for Production

```bash
npm run build
```

This creates a `build` folder with optimized production files.

## Available Scripts

- `npm start` - Run development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Follow the existing code structure
2. Use JSX for React components
3. Maintain consistent styling
4. Add proper error handling
5. Test on multiple screen sizes

## License

This project is part of the Health Monitoring System.

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
