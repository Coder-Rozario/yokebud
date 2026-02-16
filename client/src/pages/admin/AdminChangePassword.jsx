import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const AdminChangePassword = () => {
  const [activeTab, setActiveTab] = useState('changePassword');
  const [showPasswordForm, setShowPasswordForm] = useState(true);
  const [formData, setFormData] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (success) setSuccess(false);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.current) {
      newErrors.current = `Current ${showPasswordForm ? 'password' : 'username'} is required`;
    }
    
    if (!formData.new) {
      newErrors.new = `New ${showPasswordForm ? 'password' : 'username'} is required`;
    } else if (showPasswordForm && formData.new.length < 8) {
      newErrors.new = 'Password must be at least 8 characters';
    } else if (!showPasswordForm && formData.new.length < 4) {
      newErrors.new = 'Username must be at least 4 characters';
    }
    
    if (formData.new !== formData.confirm) {
      newErrors.confirm = `${showPasswordForm ? 'Passwords' : 'Usernames'} do not match`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
      const endpoint = showPasswordForm 
        ? '/api/admin/change-password' 
        : '/api/admin/change-username';
      
      const payload = showPasswordForm
        ? {
            currentPassword: formData.current,
            newPassword: formData.new
          }
        : {
            currentUsername: formData.current,
            newUsername: formData.new
          };

      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'https://api.yokebud.com'}${endpoint}`, payload, {
        withCredentials: true
      });

      setSuccess(true);
      setFormData({ current: '', new: '', confirm: '' });
      
      if (!showPasswordForm) {
        setTimeout(() => {
          navigate('/admin/login');
        }, 2000);
      }
      
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to update. Please try again.';
      setErrors({ submit: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleForm = () => {
    setShowPasswordForm(!showPasswordForm);
    setFormData({ current: '', new: '', confirm: '' });
    setErrors({});
    setSuccess(false);
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const styles = {
    container: {
      display: 'flex',
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#1a1a1a',
      color: '#e0e0e0',
      overflowX: 'hidden',
      margin: 0,
      padding: 0,
    },
    mainContent: {
      flex: 1,
      marginLeft: isMobile ? 0 : '230px',
      padding: isMobile ? '1rem' : '2rem',
      minHeight: '100vh',
      width: isMobile ? '100%' : 'calc(100% - 230px)',
      background: 'linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%)',
      boxSizing: 'border-box',
      transition: 'margin-left 0.3s ease, padding 0.3s ease',
    },
    header: {
      marginBottom: isMobile ? '1.5rem' : '2rem',
      width: '100%',
    },
    title: {
      fontSize: isMobile ? '1.5rem' : '1.8rem',
      textAlign: 'center',
      marginBottom: isMobile ? '2.5rem' : '3rem',
      fontWeight: '600',
      background: 'linear-gradient(90deg, #FFA500, #FFD700)',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
      margin: 0,
    },
    formContainer: {
      background: 'rgba(40, 40, 40, 0.7)',
      borderRadius: '12px',
      padding: isMobile ? '1.5rem' : '2rem',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      border: '1px solid rgba(255, 215, 0, 0.1)',
      maxWidth: '500px',
      margin: '0 auto',
      width: '100%',
    },
    formGroup: {
      marginBottom: isMobile ? '1.2rem' : '1.5rem',
      width: '100%',
      position: 'relative',
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      fontWeight: '500',
      color: '#aaa',
      fontSize: isMobile ? '0.9rem' : '1rem',
    },
    input: {
      width: '100%',
      padding: isMobile ? '0.7rem 2.5rem 0.7rem 0.7rem' : '0.75rem 2.5rem 0.75rem 0.75rem',
      borderRadius: '6px',
      border: '1px solid rgba(255, 215, 0, 0.3)',
      background: 'rgba(30, 30, 30, 0.8)',
      color: '#e0e0e0',
      fontSize: isMobile ? '0.9rem' : '0.95rem',
      outline: 'none',
      transition: 'all 0.3s ease',
    },
    inputFocus: {
      borderColor: '#FFA500',
      boxShadow: '0 0 0 2px rgba(255, 165, 0, 0.2)',
    },
    error: {
      color: '#F44336',
      fontSize: isMobile ? '0.75rem' : '0.8rem',
      marginTop: '0.25rem',
    },
    success: {
      color: '#4CAF50',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      padding: isMobile ? '0.8rem' : '1rem',
      borderRadius: '6px',
      marginBottom: '1.5rem',
      border: '1px solid rgba(76, 175, 80, 0.3)',
      width: '100%',
      fontSize: isMobile ? '0.9rem' : '1rem',
      textAlign: 'center',
    },
    submitButton: {
      width: '100%',
      padding: isMobile ? '0.7rem' : '0.75rem',
      borderRadius: '6px',
      border: 'none',
      background: 'linear-gradient(90deg, #FFA500, #FFD700)',
      color: '#1a1a1a',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: isMobile ? '0.9rem' : '1rem',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
      opacity: isLoading ? 0.8 : 1,
    },
    toggleLink: {
      display: 'block',
      textAlign: 'center',
      marginTop: '1rem',
      color: '#FFA500',
      cursor: 'pointer',
      textDecoration: 'none',
      fontSize: isMobile ? '0.9rem' : '1rem',
      ':hover': {
        textDecoration: 'underline',
      },
    },
    passwordRequirements: {
      fontSize: isMobile ? '0.75rem' : '0.8rem',
      color: '#aaa',
      marginTop: '0.5rem',
      lineHeight: '1.4',
    },
    loadingSpinner: {
      display: 'inline-block',
      width: '16px',
      height: '16px',
      border: '2px solid rgba(0,0,0,0.2)',
      borderTopColor: 'rgba(0,0,0,0.6)',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
      marginRight: '8px',
      verticalAlign: 'middle',
    },
    passwordToggle: {
      position: 'absolute',
      right: '10px',
      top: '50%',
      transform: 'translateY(-50%)',
      cursor: 'pointer',
      color: '#aaa',
      fontSize: isMobile ? '1rem' : '1.1rem',
      transition: 'color 0.2s ease',
      ':hover': {
        color: '#FFA500',
      },
    },
  };

  return (
    <div style={styles.container}>
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} isMobile={isMobile} />
      
      <main style={styles.mainContent}>
        <header style={styles.header}>
          <motion.h1 
            style={styles.title}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {showPasswordForm ? 'Change Password' : 'Change Username'}
          </motion.h1>
        </header>

        <motion.div 
          style={styles.formContainer}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {success && (
            <motion.div 
              style={styles.success}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {showPasswordForm ? 'Password' : 'Username'} changed successfully!
              {!showPasswordForm && ' Redirecting to login...'}
            </motion.div>
          )}

          {errors.submit && (
            <div style={{ ...styles.error, marginBottom: '1rem', textAlign: 'center' }}>
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Current {showPasswordForm ? 'Password' : 'Username'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPasswordForm ? (showCurrentPassword ? 'text' : 'password') : 'text'}
                  name="current"
                  value={formData.current}
                  onChange={handleChange}
                  style={{
                    ...styles.input,
                    ...(document.activeElement === document.querySelector('[name="current"]') && styles.inputFocus)
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#FFA500';
                    e.target.style.boxShadow = '0 0 0 2px rgba(255, 165, 0, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 215, 0, 0.3)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {showPasswordForm && (
                  <span 
                    style={styles.passwordToggle}
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                )}
              </div>
              {errors.current && <div style={styles.error}>{errors.current}</div>}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                New {showPasswordForm ? 'Password' : 'Username'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPasswordForm ? (showNewPassword ? 'text' : 'password') : 'text'}
                  name="new"
                  value={formData.new}
                  onChange={handleChange}
                  style={{
                    ...styles.input,
                    ...(document.activeElement === document.querySelector('[name="new"]') && styles.inputFocus)
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#FFA500';
                    e.target.style.boxShadow = '0 0 0 2px rgba(255, 165, 0, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 215, 0, 0.3)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {showPasswordForm && (
                  <span 
                    style={styles.passwordToggle}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                )}
              </div>
              {errors.new && <div style={styles.error}>{errors.new}</div>}
              {showPasswordForm && (
                <div style={styles.passwordRequirements}>
                  Password must be at least 8 characters long
                </div>
              )}
              {!showPasswordForm && (
                <div style={styles.passwordRequirements}>
                  Username must be at least 4 characters long
                </div>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Confirm New {showPasswordForm ? 'Password' : 'Username'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPasswordForm ? (showConfirmPassword ? 'text' : 'password') : 'text'}
                  name="confirm"
                  value={formData.confirm}
                  onChange={handleChange}
                  style={{
                    ...styles.input,
                    ...(document.activeElement === document.querySelector('[name="confirm"]') && styles.inputFocus)
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#FFA500';
                    e.target.style.boxShadow = '0 0 0 2px rgba(255, 165, 0, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 215, 0, 0.3)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {showPasswordForm && (
                  <span 
                    style={styles.passwordToggle}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                )}
              </div>
              {errors.confirm && <div style={styles.error}>{errors.confirm}</div>}
            </div>

            <motion.button
              type="submit"
              style={styles.submitButton}
              whileHover={!isLoading ? { scale: 1.02 } : {}}
              whileTap={!isLoading ? { scale: 0.98 } : {}}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span style={styles.loadingSpinner} />
                  Processing...
                </>
              ) : (
                `Change ${showPasswordForm ? 'Password' : 'Username'}`
              )}
            </motion.button>

            <a 
              style={styles.toggleLink} 
              onClick={toggleForm}
            >
              {showPasswordForm ? 'Change Username Instead' : 'Change Password Instead'}
            </a>
          </form>
        </motion.div>
      </main>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminChangePassword;