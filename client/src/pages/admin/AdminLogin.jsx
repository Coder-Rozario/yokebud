import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [lastAttemptTime, setLastAttemptTime] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [isOtpPhase, setIsOtpPhase] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0); // seconds
  const [resendCount, setResendCount] = useState(0);
  const [lockout, setLockout] = useState(false);
  const navigate = useNavigate();

  // Add the security measures from PublicLayout
  useEffect(() => {
    const disableRightClick = (e) => {
      e.preventDefault();
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return false;
    };

    const disableDevTools = (e) => {
      if (e.keyCode === 123 || // F12
          (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
          (e.ctrlKey && e.shiftKey && e.keyCode === 74) || // Ctrl+Shift+J
          (e.ctrlKey && e.keyCode === 85)) { // Ctrl+U
        e.preventDefault();
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return false;
      }
    };

    document.addEventListener('contextmenu', disableRightClick);
    document.addEventListener('keydown', disableDevTools);

    return () => {
      document.removeEventListener('contextmenu', disableRightClick);
      document.removeEventListener('keydown', disableDevTools);
    };
  }, []);

  // Proper environment variable handling with fallbacks
  const API_URL = import.meta.env.VITE_API_URL || 
    (import.meta.env.MODE === 'development' 
      ? 'https://api.yokebud.com' 
      : 'https://api.yokebud.com');

  // OTP countdown ticker
  useEffect(() => {
    if (!isOtpPhase || otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOtpPhase, otpCountdown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side rate limiting
    const now = Date.now();
    if (now - lastAttemptTime < 2000) {
      setError('Please wait a moment before trying again');
      return;
    }
    setLastAttemptTime(now);

    // If in OTP phase, ignore username/password submission
    if (isOtpPhase) return;

    if (!credentials.username.trim() || !credentials.password.trim()) {
      setError('Both username and password are required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username.trim(),
          password: credentials.password.trim()
        }),
      });
      
      if (!response.ok) {
        // After 5th failure enter OTP phase
        // Server should not reveal which field failed
        // Trigger OTP flow immediately on 5th failure tracked server-side or client-side sequence
        startOtpFlow();
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Login failed. Please check your credentials.');
      }

      await response.json();
      // Successful credential check → direct access (no OTP needed)
      localStorage.setItem('isAdminAuthenticated', 'true');
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred during login');
      
      setCredentials(prev => ({
        ...prev,
        password: ''
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const startOtpFlow = async () => {
    // Enter OTP phase and send first OTP
    setIsOtpPhase(true);
    setError('');
    setOtpCode('');
    setResendCount(0);
    await sendAdminOtp();
  };

  const sendAdminOtp = async () => {
    if (lockout) return;
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/admin/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'yokebud@gmail.com' })
      });
      if (!response.ok) {
        const e = await response.json().catch(() => ({}));
        throw new Error(e.error || 'Failed to send OTP');
      }
      // Start 60s validity window
      setOtpCountdown(60);
      setError('OTP sent to admin email. It expires in 1 minute.');
    } catch (err) {
      console.error('Send OTP error:', err);
      setError(err.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpCountdown > 0) return;
    if (resendCount >= 5) {
      setLockout(true);
      return;
    }
    const next = resendCount + 1;
    setResendCount(next);
    await sendAdminOtp();
    if (next >= 5) {
      // Next attempts will lockout
      setError('Maximum OTP resend limit reached.');
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.trim().length !== 6) {
      setError('Enter the 6-digit OTP');
      return;
    }
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/admin/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: 'yokebud@gmail.com', otp: otpCode.trim() })
      });
      if (!response.ok) {
        const e = await response.json().catch(() => ({}));
        throw new Error(e.error || 'Invalid or expired OTP');
      }
      const data = await response.json();
      if (data && data.success) {
        localStorage.setItem('isAdminAuthenticated', 'true');
        localStorage.setItem('isAdminOtpVerified', 'true');
        navigate('/admin/dashboard');
      } else {
        throw new Error('Invalid or expired OTP');
      }
    } catch (err) {
      console.error('Verify OTP error:', err);
      setError(err.message || 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <main
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        minHeight: '100vh',
        background: 'radial-gradient(circle at top left, #1f1f1f, #000000)',
        padding: '20px',
        fontFamily: "'Poppins', sans-serif",
        boxSizing: 'border-box'
      }}
    >
      {/* Toast Notification */}
      {showToast && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          justifyContent: 'center',
          backgroundColor: '#black',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          transform: 'translateY(0)',
          opacity: 1,
          animation: 'toast-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          borderLeft: '4px solid #f56565'
        }}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ color: '#f56565', flexShrink: 0 }}
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div>
            <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>Action Restricted</div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>This function is disabled on this website.</div>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: '#161616',
          padding: '40px',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(255, 165, 0, 0.15)',
          width: '100%',
          maxWidth: '420px',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            color: '#FFA500',
            fontSize: '28px',
            fontWeight: 600,
            letterSpacing: '0.5px',
            margin: 0
          }}>
            {isOtpPhase ? 'Admin OTP Verification' : 'Admin Login'}
          </h1>
          <p style={{
            color: '#aaa',
            fontSize: '14px',
            marginTop: '8px'
          }}>
            {isOtpPhase
              ? 'Enter the 6-digit code sent to yokebud@gmail.com'
              : 'Enter your credentials to continue'}
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: 'rgba(255, 77, 77, 0.2)',
              color: '#ff4d4d',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '24px',
              fontSize: '14px',
              textAlign: 'center',
              border: '1px solid rgba(255, 77, 77, 0.3)'
            }}
          >
            {error}
          </div>
        )}
        {!isOtpPhase ? (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="username" style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 500,
                fontSize: '14px',
                color: '#ddd'
              }}>
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Enter your username"
                value={credentials.username}
                onChange={handleChange}
                autoComplete="username"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '8px',
                  border: '1px solid #333',
                  backgroundColor: '#212121',
                  color: '#fff',
                  fontSize: '15px',
                  transition: 'all 0.3s',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#FFA500';
                  e.target.style.boxShadow = '0 0 0 2px rgba(255, 165, 0, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#333';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ marginBottom: '28px', position: 'relative' }}>
              <label htmlFor="password" style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 500,
                fontSize: '14px',
                color: '#ddd'
              }}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={credentials.password}
                onChange={handleChange}
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '14px 40px 14px 16px',
                  borderRadius: '8px',
                  border: '1px solid #333',
                  backgroundColor: '#212121',
                  color: '#fff',
                  fontSize: '15px',
                  transition: 'all 0.3s',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#FFA500';
                  e.target.style.boxShadow = '0 0 0 2px rgba(255, 165, 0, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#333';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '38px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#aaa',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: '16px', textAlign: 'center', color: '#ddd', fontSize: '14px' }}>
              {otpCountdown > 0 ? `OTP expires in ${Math.floor(otpCountdown/60)}:${String(otpCountdown%60).padStart(2,'0')}` : 'OTP expired'}
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="otp" style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 500,
                fontSize: '14px',
                color: '#ddd'
              }}>
                Enter 6-digit OTP
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0,6))}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '8px',
                  border: '1px solid #333',
                  backgroundColor: '#212121',
                  color: '#fff',
                  fontSize: '18px',
                  letterSpacing: '10px',
                  textAlign: 'center',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#FFA500';
                  e.target.style.boxShadow = '0 0 0 2px rgba(255, 165, 0, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#333';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {!lockout ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otpCode.length !== 6}
                  style={{
                    padding: '10px 16px',
                    background: 'linear-gradient(135deg, #FFA500, #ff7f00)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: isLoading || otpCode.length !== 6 ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '14px'
                  }}
                >
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading || otpCountdown > 0 || resendCount >= 5}
                  style={{
                    padding: '10px 16px',
                    background: 'transparent',
                    color: otpCountdown > 0 ? '#777' : '#FFA500',
                    border: `1px solid ${otpCountdown > 0 ? '#555' : '#FFA500'}`,
                    borderRadius: '8px',
                    cursor: isLoading || otpCountdown > 0 || resendCount >= 5 ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: '14px'
                  }}
                >
                  {otpCountdown > 0 ? 'Resend in 1m' : `Resend OTP (${5 - resendCount} left)`}
                </button>
              </div>
            ) : (
              <div style={{
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                color: '#FFD700',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                Maximum OTP attempts reached. Please contact the developer.
              </div>
            )}

            {lockout && (
              <button
                type="button"
                onClick={() => {
                  // Reset to login form
                  setIsOtpPhase(false);
                  setLockout(false);
                  setResendCount(0);
                  setOtpCode('');
                  setOtpCountdown(0);
                  setError('');
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #444, #222)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Acknowledge & Return to Login
              </button>
            )}
          </>
        )}

        {!isOtpPhase && (
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              background: isLoading
                ? '#555'
                : 'linear-gradient(135deg, #FFA500, #ff7f00)',
              color: isLoading ? '#aaa' : '#000',
              border: 'none',
              borderRadius: '8px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '15px',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              boxShadow: isLoading
                ? 'none'
                : '0 4px 15px rgba(255, 165, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isLoading ? (
              <>
                <span style={{
                  display: 'inline-block',
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(0,0,0,0.2)',
                  borderTopColor: 'rgba(0,0,0,0.6)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                Logging in...
              </>
            ) : 'Login'}
          </button>
        )}

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes toast-in {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
      </form>
    </main>
  );
};

export default AdminLogin;