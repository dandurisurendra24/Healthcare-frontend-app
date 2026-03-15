import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Button from '../components/common/Button.jsx';
import Input from '../components/common/Input.jsx';
import Loading from '../components/common/Loading.jsx';
import { useAuth } from '../contexts/AuthContext';
import { getApiErrorMessage } from '../services/api';
import { getRoleHomePath } from '../utils/constants';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const user = await login(formData.email, formData.password);
      toast.success('Login successful');
      navigate(getRoleHomePath(user.role), { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Login failed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitting) {
    return <Loading message="Signing you in..." />;
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <p className="login-kicker">Role-based health app</p>
          <h1>Sign in to CareFlow</h1>
          <p>Use your email and password to open the correct admin, doctor, or patient workspace.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="name@example.com"
            required
          />
          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
          />
          <Button type="submit" className="login-btn">
            Login
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
