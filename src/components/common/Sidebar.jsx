import React, { useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const menuByRole = {
  admin: [
    { path: '/admin', label: 'Overview' },
    { path: '/admin/doctors', label: 'Doctors' },
    { path: '/admin/patients', label: 'Patients' },
    { path: '/admin/assign-doctor', label: 'Assign Doctor' },
    { path: '/admin/reports', label: 'Patient Reports' },
    { path: '/admin/health', label: 'Health Entries' },
  ],
  doctor: [
    { path: '/doctor', label: 'Overview' },
    { path: '/doctor/patients', label: 'Assigned Patients' },
    { path: '/doctor/prescriptions', label: 'Prescriptions' },
    { path: '/doctor/reports', label: 'Reports' },
    { path: '/doctor/health', label: 'Health Logs' },
  ],
  patient: [
    { path: '/patient', label: 'Overview' },
    { path: '/patient/profile', label: 'Profile' },
    { path: '/patient/reports', label: 'Reports' },
    { path: '/patient/health', label: 'Health Log' },
    { path: '/patient/prescriptions', label: 'Prescriptions' },
  ],
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const menuItems = useMemo(() => menuByRole[user?.role] || [], [user?.role]);

  const handleLogout = async () => {
    setSubmitting(true);
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error('Logout failed, but your session was cleared');
      navigate('/login', { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <p className="sidebar-eyebrow">{user?.role || 'health app'}</p>
        <h2>CareFlow</h2>
        <p>{user?.name || user?.full_name || 'Signed in user'}</p>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === `/${user?.role}`}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <span className="sidebar-text">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button type="button" onClick={handleLogout} className="sidebar-logout" disabled={submitting}>
          {submitting ? 'Signing out...' : 'Logout'}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
