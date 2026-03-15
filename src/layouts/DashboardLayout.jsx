import React from 'react';
import Sidebar from '../components/common/Sidebar.jsx';

const DashboardLayout = ({ title, description, actions, children }) => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="dashboard-content">
          {(title || description || actions) && (
            <header className="dashboard-page-header">
              <div>
                {title && <h1>{title}</h1>}
                {description && <p>{description}</p>}
              </div>
              {actions && <div className="dashboard-page-actions">{actions}</div>}
            </header>
          )}
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
