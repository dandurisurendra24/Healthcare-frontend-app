import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './components/common/Button.css';
import './components/common/Input.css';
import './components/common/Loading.css';
import './components/common/Card.css';
import './components/common/Table.css';
import './components/common/Sidebar.css';
import './layouts/DashboardLayout.css';
import './pages/Login.css';
import './components/forms/forms.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
