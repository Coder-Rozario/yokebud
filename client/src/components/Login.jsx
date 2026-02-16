import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaGoogle, FaPhone, FaEnvelope, FaLock } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { 
  auth,
  googleProvider,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signInWithEmailAndPassword
} from '../firebase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState('');
  const [activeMethod, setActiveMethod] = useState('email');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      navigate('/profile');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved, allow signInWithPhoneNumber
          }
        });
      }
      
      const formattedPhone = `+${phone.replace(/\D/g, '')}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await confirmationResult.confirm(otp);
      navigate('/profile');
    } catch (err) {
      setError("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/profile');
    } catch (err) {
      let errorMessage = err.message;
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No user found with this email.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    authPage: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '20px',
      background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)'
    },
    authContainer: {
      background: 'rgba(0, 0, 0, 0.7)',
      borderRadius: '15px',
      padding: '40px',
      width: '100%',
      maxWidth: '500px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
      border: '1px solid rgba(255, 215, 0, 0.2)',
      textAlign: 'center'
    },
    heading: {
      color: '#FFD700',
      marginBottom: '25px',
      fontWeight: '500',
      fontSize: '2rem'
    },
    errorMessage: {
      color: '#ff6b6b',
      background: 'rgba(255, 0, 0, 0.1)',
      padding: '12px',
      borderRadius: '5px',
      marginBottom: '20px',
      fontSize: '0.9rem'
    },
    authMethods: {
      display: 'flex',
      marginBottom: '25px',
      borderBottom: '1px solid rgba(255, 215, 0, 0.2)'
    },
    methodTab: {
      flex: 1,
      padding: '12px',
      background: 'transparent',
      border: 'none',
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: '1rem',
      fontWeight: '500',
      cursor: 'pointer',
      position: 'relative',
      transition: 'all 0.3s ease'
    },
    activeTab: {
      color: '#FFD700'
    },
    activeTabIndicator: {
      position: 'absolute',
      bottom: '-1px',
      left: 0,
      width: '100%',
      height: '2px',
      background: '#FFD700'
    },
    socialAuth: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      marginBottom: '20px'
    },
    socialBtn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      padding: '12px',
      borderRadius: '30px',
      border: 'none',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontSize: '1rem'
    },
    googleBtn: {
      background: '#4285F4',
      color: 'white',
      '&:hover': {
        background: '#357ABD'
      }
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      margin: '20px 0',
      color: 'rgba(255, 255, 255, 0.5)'
    },
    dividerLine: {
      flex: 1,
      height: '1px',
      background: 'rgba(255, 255, 255, 0.1)'
    },
    dividerText: {
      padding: '0 15px'
    },
    authForm: {
      width: '100%'
    },
    inputGroup: {
      position: 'relative',
      marginBottom: '15px'
    },
    inputIcon: {
      position: 'absolute',
      left: '15px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: 'rgba(255, 215, 0, 0.7)'
    },
    input: {
      width: '100%',
      padding: '12px 15px 12px 45px',
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 215, 0, 0.2)',
      borderRadius: '30px',
      color: 'white',
      fontSize: '0.95rem',
      transition: 'all 0.3s ease',
      '&:focus': {
        outline: 'none',
        borderColor: '#FFD700',
        boxShadow: '0 0 10px rgba(255, 215, 0, 0.2)'
      },
      '&::placeholder': {
        color: 'rgba(255, 255, 255, 0.5)'
      }
    },
    submitBtn: {
      width: '100%',
      padding: '12px',
      background: 'linear-gradient(45deg, #FFD700, #FFA500)',
      border: 'none',
      borderRadius: '30px',
      color: '#111',
      fontWeight: '600',
      fontSize: '1rem',
      cursor: 'pointer',
      marginTop: '10px',
      transition: 'all 0.3s ease',
      '&:hover': {
        background: 'linear-gradient(45deg, #FFA500, #FFD700)',
        boxShadow: '0 5px 15px rgba(255, 215, 0, 0.3)'
      },
      '&:disabled': {
        opacity: 0.7,
        cursor: 'not-allowed'
      }
    },
    recaptchaContainer: {
      margin: '10px 0'
    },
    authFooter: {
      marginTop: '20px',
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: '0.9rem'
    },
    link: {
      color: '#FFD700',
      textDecoration: 'none',
      transition: 'all 0.3s ease',
      '&:hover': {
        textDecoration: 'underline'
      }
    },
    loadingText: {
      color: '#FFD700',
      marginTop: '10px'
    }
  };

  return (
    <motion.div 
      style={styles.authPage}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div style={styles.authContainer}>
        <h2 style={styles.heading}>Login to Your Account</h2>
        
        {error && <div style={styles.errorMessage}>{error}</div>}

        <div style={styles.authMethods}>
          <button 
            style={{
              ...styles.methodTab,
              ...(activeMethod === 'email' ? styles.activeTab : {}),
              color: activeMethod === 'email' ? '#FFD700' : 'rgba(255, 255, 255, 0.7)',
              position: 'relative'
            }}
            onClick={() => setActiveMethod('email')}
          >
            Email Login
            {activeMethod === 'email' && (
              <div style={styles.activeTabIndicator}></div>
            )}
          </button>
          <button 
            style={{
              ...styles.methodTab,
              ...(activeMethod === 'phone' ? styles.activeTab : {}),
              color: activeMethod === 'phone' ? '#FFD700' : 'rgba(255, 255, 255, 0.7)',
              position: 'relative'
            }}
            onClick={() => setActiveMethod('phone')}
          >
            Phone Login
            {activeMethod === 'phone' && (
              <div style={styles.activeTabIndicator}></div>
            )}
          </button>
        </div>

        <div style={styles.socialAuth}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ ...styles.socialBtn, ...styles.googleBtn }}
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <FaGoogle /> Continue with Google
          </motion.button>
        </div>

        <div style={styles.divider}>
          <div style={styles.dividerLine}></div>
          <span style={styles.dividerText}>OR</span>
          <div style={styles.dividerLine}></div>
        </div>

        {activeMethod === 'phone' ? (
          !confirmationResult ? (
            <form style={styles.authForm} onSubmit={handlePhoneSubmit}>
              <div style={styles.inputGroup}>
                <FaPhone style={styles.inputIcon} />
                <input
                  type="tel"
                  placeholder="Phone Number (with country code)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={styles.submitBtn}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </motion.button>
              <div id="recaptcha-container" style={styles.recaptchaContainer}></div>
            </form>
          ) : (
            <form style={styles.authForm} onSubmit={handleOtpSubmit}>
              <div style={styles.inputGroup}>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  style={{ ...styles.input, paddingLeft: '15px' }}
                />
              </div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={styles.submitBtn}
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </motion.button>
            </form>
          )
        ) : (
          <form style={styles.authForm} onSubmit={handleEmailLogin}>
            <div style={styles.inputGroup}>
              <FaEnvelope style={styles.inputIcon} />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <FaLock style={styles.inputIcon} />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.input}
              />
            </div>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={styles.submitBtn}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </motion.button>
          </form>
        )}

        <div style={styles.authFooter}>
          <p style={{marginBottom:'1.5vh'}}>Don't have an account? <Link to="/signup" style={styles.link}>Sign up</Link></p>
          <p><Link to="/forgot-password" style={styles.link}>Forgot password?</Link></p>
        </div>
      </div>
    </motion.div>
  );
};

export default Login;