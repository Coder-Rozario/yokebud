import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../pages/context/CartContext';
import { 
  FiMessageSquare, 
  FiShoppingCart, 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiMapPin,
  FiCalendar,
  FiSearch,
  FiFilter,
  FiEye,
  FiX,
  FiSend,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
  FiBell,
  FiInfo,
  FiChevronDown,
  FiLoader,
  FiRefreshCw,
  FiImage,
  FiExternalLink,
  FiFile,
  FiPaperclip
} from 'react-icons/fi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import io from 'socket.io-client';
import { SOCKET_BASE, apiFetch } from '../utils/api';

// Firebase imports for authentication
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

// Socket.IO client (uses shared SOCKET_BASE)
const socket = io(SOCKET_BASE, {
  transports: ['websocket', 'polling'],
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

// File icon mapping
const FILE_ICONS = {
  'image/jpeg': FiImage,
  'image/jpg': FiImage,
  'image/png': FiImage,
  'image/webp': FiImage,
  'image/gif': FiImage,
  'application/pdf': FiFile,
  'text/plain': FiFile,
  'application/msword': FiFile,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FiFile,
  'application/vnd.ms-excel': FiFile,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FiFile,
  'application/zip': FiFile,
  'application/vnd.rar': FiFile
};

// Country data with all countries
const countries = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", 
  "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", 
  "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", 
  "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", 
  "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", 
  "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", 
  "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", 
  "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", 
  "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", 
  "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea North", "Korea South", "Kosovo", "Kuwait", "Kyrgyzstan", 
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", 
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", 
  "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", 
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", 
  "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", 
  "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", 
  "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", 
  "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", 
  "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", 
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", 
  "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", 
  "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

// Authentication Components
const LoginForm = ({ onClose, onSuccess, isMobile }) => {
  const [loginStep, setLoginStep] = useState('email');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [otpType, setOtpType] = useState('login');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(null);

  // Countdown timer for OTP
  useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setFirebaseUser(user);
      if (user) {
        await handleFirebaseLogin(user);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleFirebaseLogin = async (firebaseUser) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/user/auth/firebase-google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified
          }
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('userToken', data.token);
        onSuccess(data.user);
        toast.success('Login successful!');
      } else {
        console.error('Backend authentication failed:', data.message);
        await signOut(auth);
        toast.error('Authentication failed. Please try again.');
      }
    } catch (error) {
      console.error('Firebase login error:', error);
      await signOut(auth);
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast.error('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (email, type = 'login') => {
    setLoading(true);
    try {
      const endpoint = type === 'login' 
        ? '/api/user/login/send-otp'
        : '/api/user/register/send-otp';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setOtpType(type);
        setLoginStep('otp');
        setOtpCountdown(60);
        toast.success('OTP sent successfully to your email!');
      } else {
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error('Email not registered. Please create an account by pressing the button below.');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (email, otp, type = 'login') => {
    setLoading(true);
    try {
      const endpoint = type === 'login' 
        ? '/api/user/login/verify-otp'
        : '/api/user/register/verify-otp';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, otp })
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('userToken', data.token);
        onSuccess(data.user);
        setLoginStep('email');
        setLoginEmail('');
        setLoginOtp('');
        setOtpCountdown(0);
        toast.success(type === 'login' ? 'Login successful!' : 'Registration successful!');
      } else {
        toast.error(data.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error('Failed to verify OTP. Please try again.');
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    if (otpCountdown > 0) {
      toast.info(`Please wait ${otpCountdown} seconds before requesting a new OTP`);
      return;
    }

    setLoading(true);
    try {
      const endpoint = otpType === 'login' 
        ? '/api/user/login/send-otp'
        : '/api/user/register/send-otp';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: loginEmail })
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setOtpCountdown(60);
        toast.success('OTP resent successfully!');
      } else {
        toast.error(data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      toast.error('Failed to resend OTP. Please try again.');
    }
    setLoading(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        borderRadius: '15px',
        padding: isMobile ? '20px' : '30px',
        maxWidth: '400px',
        width: '100%',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#FFD700', marginBottom: '10px' }}>
          {loginStep === 'email' ? 'Sign In / Sign Up' : 'Verify Your Email'}
        </h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          {loginStep === 'email' 
            ? 'Please sign in or create an account to continue' 
            : 'Enter the verification code sent to your email'}
        </p>
      </div>

      {/* Email Input Step */}
      {loginStep === 'email' && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
        >
          <div>
            <label style={{ 
              display: 'block', 
              color: 'rgba(255, 255, 255, 0.8)', 
              marginBottom: '8px' 
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="Enter your email address"
              style={{
                width: '100%',
                padding: '12px 15px',
                border: '2px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => handleSendOtp(loginEmail, 'login')}
              disabled={loading || !loginEmail}
              style={{
                background: 'linear-gradient(135deg, #FFA500, #FFD700)',
                color: 'black',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: loading || !loginEmail ? 'not-allowed' : 'pointer',
                opacity: loading || !loginEmail ? 0.6 : 1
              }}
            >
              {loading ? 'Sending OTP...' : 'Sign In with Email'}
            </button>

            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', margin: '10px 0' }}>
                Don't have an account?
              </p>
              <button
                onClick={() => {
                  setOtpType('registration');
                  handleSendOtp(loginEmail, 'registration');
                }}
                disabled={loading || !loginEmail}
                style={{
                  background: 'transparent',
                  color: '#FFD700',
                  border: '2px solid #FFD700',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: loading || !loginEmail ? 'not-allowed' : 'pointer',
                  opacity: loading || !loginEmail ? 0.6 : 1,
                  width: '100%'
                }}
              >
                Create New Account
              </button>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            margin: '10px 0',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.2)' }}></div>
            <span style={{ padding: '0 10px', fontSize: '12px' }}>or continue with</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.2)' }}></div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <FiUser />
            Continue with Google
          </button>
        </motion.div>
      )}

      {/* OTP Verification Step */}
      {loginStep === 'otp' && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
        >
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#FFD700', marginBottom: '5px' }}>
              {otpType === 'login' ? 'Sign In Verification' : 'Account Verification'}
            </h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              We sent a 6-digit code to
            </p>
            <p style={{ color: '#FFD700', fontWeight: 'bold' }}>
              {loginEmail}
            </p>
            {otpCountdown > 0 && (
              <p style={{ color: '#ff4444', fontSize: '12px', marginTop: '5px' }}>
                OTP expires in: {formatTime(otpCountdown)}
              </p>
            )}
          </div>

          <input
            type="text"
            value={loginOtp}
            onChange={(e) => setLoginOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            style={{
              width: '100%',
              padding: '15px',
              border: '2px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              fontSize: '18px',
              textAlign: 'center',
              letterSpacing: '10px',
              outline: 'none',
              fontWeight: 'bold'
            }}
          />

          <button
            onClick={() => handleVerifyOtp(loginEmail, loginOtp, otpType)}
            disabled={loading || loginOtp.length !== 6}
            style={{
              background: 'linear-gradient(135deg, #FFA500, #FFD700)',
              color: 'black',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: loading || loginOtp.length !== 6 ? 'not-allowed' : 'pointer',
              opacity: loading || loginOtp.length !== 6 ? 0.6 : 1
            }}
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleResendOtp}
              disabled={loading || otpCountdown > 0}
              style={{
                background: 'transparent',
                border: 'none',
                color: otpCountdown > 0 ? 'rgba(255, 215, 0, 0.5)' : '#FFD700',
                cursor: loading || otpCountdown > 0 ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                textDecoration: 'underline',
                marginRight: '10px'
              }}
            >
              {loading ? 'Sending...' : otpCountdown > 0 ? `Resend OTP (${formatTime(otpCountdown)})` : 'Resend OTP'}
            </button>
            
            <button
              onClick={() => setLoginStep('email')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#FFD700',
                cursor: 'pointer',
                fontSize: '12px',
                textDecoration: 'underline'
              }}
            >
              ← Back to Email
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

const ProfileCompletionForm = ({ user, onComplete, onSkip, isMobile }) => {
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    company: user?.company || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zip_code: user?.zip_code || '',
    country: user?.country || '',
    date_of_birth: user?.date_of_birth || '',
    gender: user?.gender || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      
      if (data.success) {
        onComplete(data.user);
        toast.success('Profile completed successfully!');
      } else {
        toast.error(data.message || 'Failed to complete profile');
      }
    } catch (error) {
      console.error('Error completing profile:', error);
      toast.error('Failed to complete profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.first_name && formData.last_name && formData.phone;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        borderRadius: '15px',
        padding: isMobile ? '20px' : '30px',
        maxWidth: '500px',
        width: '100%',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#FFD700', marginBottom: '10px' }}>
          Complete Your Profile
        </h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Please provide your information to continue with the inquiry
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '5px', fontSize: '12px' }}>
              First Name *
            </label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({...formData, first_name: e.target.value})}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '5px', fontSize: '12px' }}>
              Last Name *
            </label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({...formData, last_name: e.target.value})}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '5px', fontSize: '12px' }}>
            Phone Number *
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '2px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '5px', fontSize: '12px' }}>
            Company
          </label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({...formData, company: e.target.value})}
            style={{
              width: '100%',
              padding: '10px',
              border: '2px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '5px', fontSize: '12px' }}>
              Country
            </label>
            <select
              value={formData.country}
              onChange={(e) => setFormData({...formData, country: e.target.value})}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <option value="">Select Country</option>
              {countries.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '5px', fontSize: '12px' }}>
              City
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '14px',
                outline: 'none'
            }}
          />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button
            type="submit"
            disabled={loading || !isFormValid}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #FFA500, #FFD700)',
              color: 'black',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: loading || !isFormValid ? 'not-allowed' : 'pointer',
              opacity: loading || !isFormValid ? 0.6 : 1
            }}
          >
            {loading ? 'Saving...' : 'Complete Profile'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

// Mobile Detection Hook
const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= breakpoint);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
};

// ENHANCED TIME FORMATTING FUNCTION - FIXED
const formatTime = (timestamp) => {
  if (!timestamp) return 'Unknown';
  
  try {
    const now = new Date();
    const time = new Date(timestamp);
    
    // Validate the date
    if (isNaN(time.getTime())) {
      return 'Invalid date';
    }
    
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    // For older dates, show actual date and time
    return time.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Time error';
  }
};

// Helper Functions
const getStatusColor = (status) => {
  switch (status) {
    case 'new': return '#e74c3c';
    case 'pending': return '#f39c12';
    case 'processing': return '#3498db';
    case 'completed': return '#27ae60';
    case 'cancelled': return '#95a5a6';
    default: return '#95a5a6';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'new': return 'New Inquiry';
    case 'pending': return 'Pending';
    case 'processing': return 'Processing';
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
};

const truncate = (text, length) => {
  return text && text.length > length ? text.substring(0, length) + '...' : text;
};

// Safe JSON parser
const safeJsonParse = (str, fallback = null) => {
  if (!str) return fallback;
  try {
    return typeof str === 'string' ? JSON.parse(str) : str;
  } catch (error) {
    console.error('JSON parse error:', error);
    return fallback;
  }
};

// File Message Component
const FileMessage = ({ files }) => {
  const imageFiles = files.filter(file => file.type && file.type.startsWith('image/'));
  const otherFiles = files.filter(file => !file.type || !file.type.startsWith('image/'));

  return (
    <div className="file-message-container">
      {/* Image Files */}
      {imageFiles.map((file, index) => (
        <div key={`img-${index}`} className="file-message-image">
          <a href={file.url} target="_blank" rel="noopener noreferrer">
            <img 
              src={file.url} 
              alt={file.name} 
              onError={(e) => { 
                e.target.style.display = 'none'; 
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="image-error-fallback">
              <FiImage size={20} />
              <span>Image not available</span>
            </div>
          </a>
        </div>
      ))}

      {/* Other Files */}
      {otherFiles.map((file, index) => {
        const FileIcon = FILE_ICONS[file.type] || FiFile;

        return (
          <div
            key={`file-${index}`}
            className="file-message-item"
            onClick={() => window.open(file.url, '_blank')}
          >
            <FileIcon size={16} />
            <div className="file-info">
              <div className="file-name">{file.name}</div>
              <div className="file-size">
                {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'File'}
              </div>
            </div>
            <button
              className="file-open-button"
              onClick={(e) => {
                e.stopPropagation();
                window.open(file.url, '_blank');
              }}
            >
              <FiExternalLink size={10} />
              Open
            </button>
          </div>
        );
      })}
    </div>
  );
};

// Product Gallery Component
const ProductGallery = ({ product, isMobile }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const safeProduct = {
    product_photos: [],
    ...product
  };

  const processedPhotos = Array.isArray(safeProduct.product_photos)
    ? safeProduct.product_photos
    : (typeof safeProduct.product_photos === 'string'
      ? safeJsonParse(safeProduct.product_photos || '[]')
      : []);

  const nextImage = (e) => {
    e.stopPropagation();
    if (processedPhotos.length === 0) return;
    setCurrentImageIndex(prev =>
      prev === processedPhotos.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = (e) => {
    e.stopPropagation();
    if (processedPhotos.length === 0) return;
    setCurrentImageIndex(prev =>
      prev === 0 ? processedPhotos.length - 1 : prev - 1
    );
  };

  if (processedPhotos.length === 0) {
    return (
      <div className="product-gallery no-image">
        <FiImage size={isMobile ? 20 : 24} />
      </div>
    );
  }

  return (
    <div className="product-gallery">
      <div className="product-gallery-image-wrapper">
        <img
          src={processedPhotos[currentImageIndex]}
          alt={product.product_name}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div className="product-gallery-image-error">
          <FiImage size={24} />
        </div>
      </div>

      {processedPhotos.length > 1 && (
        <>
          <button onClick={prevImage} className="gallery-nav prev">
            <FiChevronLeft />
          </button>
          <button onClick={nextImage} className="gallery-nav next">
            <FiChevronRight />
          </button>
          <div className="gallery-counter">
            {currentImageIndex + 1}/{processedPhotos.length}
          </div>
        </>
      )}
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => (
  <span
    className="status-badge"
    style={{ backgroundColor: getStatusColor(status) }}
  >
    {getStatusText(status)}
  </span>
);

// Auto Expanding Textarea Component
const AutoExpandingTextarea = ({ value, onChange, placeholder, disabled, onSend, className = '' }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (onSend) {
        onSend();
      }
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      onKeyPress={handleKeyPress}
      className={`auto-expanding-textarea ${className}`}
      rows={1}
    />
  );
};

// File Preview Component
const FilePreview = ({ files, onRemove }) => (
  <div className="file-preview-container">
    {files.map((file, index) => {
      const isImage = file.type && file.type.startsWith('image/');
      const previewUrl = isImage ? URL.createObjectURL(file) : null;

      return (
        <div key={index} className="file-preview-item">
          {isImage && previewUrl ? (
            <img src={previewUrl} alt="Preview" className="file-image-preview" />
          ) : (
            <FiFile size={14} />
          )}
          <span className="file-preview-name">{truncate(file.name, 15)}</span>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="remove-file-button"
          >
            <FiX size={12} />
          </button>
        </div>
      );
    })}
  </div>
);

// Enhanced Chat Item Component with ADMIN MESSAGE INDICATOR
const ChatListItem = ({ inquiry, isSelected, unreadCount, onSelect, hasNewMessage, hasAdminReply }) => {
  const productData = safeJsonParse(inquiry.product_data);
  const productName = productData?.product_name || 'Product Inquiry';
  const lastMessage = inquiry.messages?.[inquiry.messages.length - 1];

  return (
    <motion.div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 20px',
        cursor: 'pointer',
        transition: 'background 0.3s ease',
        background: unreadCount > 0
                   ? 'rgba(52, 152, 219, 0.12)'
                   : isSelected
                     ? 'rgba(255, 215, 0, 0.1)'
                     : hasAdminReply
                       ? 'rgba(46, 204, 113, 0.12)'
                       : hasNewMessage
                         ? 'rgba(52, 152, 219, 0.08)'
                         : 'transparent',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        borderLeft: unreadCount > 0
                   ? '4px solid #3498db'
                   : hasAdminReply
                     ? '4px solid #27ae60'
                     : hasNewMessage
                       ? '4px solid #3498db'
                       : isSelected
                         ? '4px solid #FFD700'
                         : '4px solid transparent',
        position: 'relative'
      }}
      onClick={() => onSelect(inquiry)}
      whileHover={{ background: 'rgba(255, 255, 255, 0.05)' }}
      layout
    >
      {/* Product Thumbnail */}
      <div style={{
        width: '50px',
        height: '50px',
        borderRadius: '8px',
        background: 'rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: '15px',
        flexShrink: 0,
        overflow: 'hidden',
        position: 'relative'
      }}>
        {productData?.product_photos?.[0] ? (
          <img 
            src={productData.product_photos[0]} 
            alt={productName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <FiShoppingCart size={20} />
        )}
        
        {/* Admin Reply Indicator Badge */}
        {hasAdminReply && (
          <div style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            width: '16px',
            height: '16px',
            backgroundColor: '#27ae60',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #1a1a1a'
          }}>
            <FiMessageSquare size={8} color="#fff" />
          </div>
        )}
      </div>

      {/* Chat Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '4px'
        }}>
          <span style={{
            fontWeight: '600',
            fontSize: '13px',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {unreadCount > 0 && (
              <span style={{
                background: '#3498db',
                color: '#fff',
                borderRadius: '10px',
                padding: '2px 6px',
                fontSize: '10px',
                fontWeight: 700,
                lineHeight: 1,
                flexShrink: 0
              }}>{unreadCount}</span>
            )}
            {truncate(productName, 20)}
          </span>
          <span style={{
            fontSize: '9.5px',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            {formatTime(inquiry.last_activity)}
          </span>
        </div>
        
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <span style={{
            fontSize: '10px',
            color: unreadCount > 0 ? '#fff' : 'rgba(255, 255, 255, 0.7)',
            fontWeight: unreadCount > 0 ? 'bold' : 'normal'
          }}>
            Inquiry #{inquiry.inquiry_number}
          </span>
          <StatusBadge status={inquiry.status} />
        </div>
        
        {lastMessage && (
          <div style={{
            fontSize: '12px', 
            color: hasAdminReply ? '#27ae60' : 'rgba(255,255,255,0.6)', 
            marginTop: '4px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontWeight: hasAdminReply ? '600' : 'normal'
          }}>
            {hasAdminReply && '💬 '}
            {truncate(lastMessage.message, 30)}
          </div>
        )}

        {/* New Message Indicator */}
        {hasNewMessage && (
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '8px',
            height: '8px',
            backgroundColor: '#e74c3c',
            borderRadius: '50%',
            animation: 'pulse 1.5s infinite'
          }}></div>
        )}
      </div>
    </motion.div>
  );
};

// Main MessagesPage Component
const MessagesPage = () => {
  const [inquiries, setInquiries] = useState([]);
  const [filteredInquiries, setFilteredInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDetails, setShowDetails] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [newMessageInquiries, setNewMessageInquiries] = useState(new Set());
  const [adminReplyInquiries, setAdminReplyInquiries] = useState(new Set());

  // Authentication states
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showProfileCompletionPopup, setShowProfileCompletionPopup] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);

  // Checkout related states
  const [isCheckoutActive, setIsCheckoutActive] = useState(false);
  const [priceData, setPriceData] = useState(null);

  const isMobile = useIsMobile();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Refs for stable socket callbacks
  const inquiriesRef = useRef(inquiries);
  const selectedInquiryRef = useRef(selectedInquiry);

  // Update refs on state changes
  useEffect(() => {
    inquiriesRef.current = inquiries;
    selectedInquiryRef.current = selectedInquiry;
  }, [inquiries, selectedInquiry]);

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsInitializing(true);
      const token = localStorage.getItem('userToken');
      
      if (token) {
        try {
          const response = await apiFetch('/api/user/profile', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.success) {
              setUser(data.user);
              setIsLoggedIn(true);
              
              const needsCompletion = !data.user.first_name || !data.user.last_name || !data.user.phone;
              setNeedsProfileCompletion(needsCompletion);
              
              if (needsCompletion) {
                setShowProfileCompletionPopup(true);
              } else {
                // Load inquiries if profile is complete
                fetchUserInquiries();
              }
            } else {
              localStorage.removeItem('userToken');
              setShowLoginPopup(true);
            }
          } else {
            localStorage.removeItem('userToken');
            setShowLoginPopup(true);
          }
        } catch (error) {
          console.error('Error checking auth status:', error);
          localStorage.removeItem('userToken');
          setShowLoginPopup(true);
        }
      } else {
        setShowLoginPopup(true);
      }
      setIsInitializing(false);
    };

    checkAuthStatus();
  }, []);

  // Authentication handlers
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    setShowLoginPopup(false);
    
    const needsCompletion = !userData.first_name || !userData.last_name || !userData.phone;
    setNeedsProfileCompletion(needsCompletion);
    
    if (needsCompletion) {
      setShowProfileCompletionPopup(true);
    } else {
      // Load inquiries after successful login
      fetchUserInquiries();
    }
  };

  const handleProfileCompletion = (userData) => {
    setUser(userData);
    setNeedsProfileCompletion(false);
    setShowProfileCompletionPopup(false);
    
    // Load inquiries after profile completion
    fetchUserInquiries();
  };

  const handleProfileSkip = () => {
    setShowProfileCompletionPopup(false);
    fetchUserInquiries();
    toast.info('You can complete your profile later');
  };

  // Fetch user's inquiries from API
  const fetchUserInquiries = useCallback(async () => {
    if (!isLoggedIn) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        toast.error('Please login to view your inquiries');
        return;
      }

      const response = await apiFetch('/api/inquiries/user/' + getUserIdFromToken(token), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch inquiries');
      }

      const data = await response.json();
      
      if (data.success) {
        // Process each inquiry to use message-based timing and compute unread
        const processedInquiries = data.inquiries.map(inquiry => {
          // Use last message time as last_activity if available
          if (inquiry.messages && inquiry.messages.length > 0) {
            const lastMessage = inquiry.messages[inquiry.messages.length - 1];
            const computedUnread = inquiry.messages.filter(m => m.sender_type === 'admin' && !m.is_read).length;
            return {
              ...inquiry,
              last_activity: lastMessage.timestamp || lastMessage.created_at || inquiry.last_activity,
              created_at: inquiry.messages[0].timestamp || inquiry.messages[0].created_at || inquiry.created_at,
              is_checkout_active: inquiry.is_checkout_active || false,
              price_data: inquiry.price_data || null,
              unread_count: typeof inquiry.unread_count === 'number' ? inquiry.unread_count : computedUnread
            };
          }
          return inquiry;
        });

        const sortedInquiries = processedInquiries.sort((a, b) => 
          new Date(b.last_activity) - new Date(a.last_activity)
        );
        
        setInquiries(sortedInquiries);
        
        // Calculate total unread count
        const totalUnread = sortedInquiries.reduce((total, inquiry) => total + (inquiry.unread_count || 0), 0);
        setUnreadCount(totalUnread);

        // Check for admin replies and update indicators
        const adminReplies = new Set();
        sortedInquiries.forEach(inquiry => {
          if (inquiry.messages && inquiry.messages.length > 0) {
            const lastMessage = inquiry.messages[inquiry.messages.length - 1];
            if (lastMessage.sender_type === 'admin') {
              adminReplies.add(inquiry.id);
            }
          }
        });
        setAdminReplyInquiries(adminReplies);

        // Join socket rooms for all user inquiries
        sortedInquiries.forEach(inquiry => {
          if (socket.connected) {
            socket.emit('join_inquiry', inquiry.id);
          }
        });
      } else {
        throw new Error(data.message || 'Failed to fetch inquiries');
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      toast.error('Failed to load inquiries');
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  // Get user ID from JWT token
  const getUserIdFromToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  // Load messages for a specific inquiry
  const loadInquiryMessages = useCallback(async (inquiryId) => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await apiFetch(`/api/inquiries/${inquiryId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.inquiry;
        }
      }
      return null;
    } catch (error) {
      console.error('Error loading inquiry messages:', error);
      return null;
    }
  }, []);

  // ENHANCED SOCKET.IO IMPLEMENTATION WITH ADMIN REPLY DETECTION
  useEffect(() => {
    if (!isLoggedIn) return;
    
    console.log('Setting up Socket.IO listeners for MessagesPage...');

    // Handle new incoming messages from admin
    const handleNewMessage = (message) => {
      console.log('User received new message via socket:', message);

      // Ignore echo of user's own messages to prevent duplicates
      if (message && message.sender_type === 'user') {
        return;
      }

      // Add to new message indicators
      setNewMessageInquiries(prev => new Set([...prev, message.inquiryId]));

      // If message is from admin, add to admin reply indicators
      if (message.sender_type === 'admin') {
        setAdminReplyInquiries(prev => new Set([...prev, message.inquiryId]));
        
        // Show special toast for admin replies
        toast.info(`💬 Admin replied to your inquiry`, {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }

      // Update selected inquiry if it's the current one
      if (selectedInquiryRef.current && selectedInquiryRef.current.id === message.inquiryId) {
        setSelectedInquiry(prev => {
          if (!prev) return prev;
          
          const existingMessages = prev.messages || [];
          const messageExists = existingMessages.some(
            msg => msg.id === message.id || 
                   (msg.temporaryId === message.temporaryId)
          );

          if (messageExists) {
            console.log('Duplicate message detected, skipping:', message.id);
            return prev;
          }

          return {
            ...prev,
            messages: [...existingMessages, {
              ...message,
              timestamp: message.timestamp || new Date().toISOString()
            }],
            last_activity: new Date().toISOString()
          };
        });
      }

      // Update inquiries list with new activity
      setInquiries(prev => {
        const inquiryIndex = prev.findIndex(inq => inq.id === message.inquiryId);
        if (inquiryIndex === -1) return prev;

        const updatedInquiry = { 
          ...prev[inquiryIndex], 
          last_activity: new Date().toISOString(),
          unread_count: (prev[inquiryIndex].unread_count || 0) + (message.sender_type === 'admin' ? 1 : 0)
        };

        const newInquiries = [...prev];
        newInquiries.splice(inquiryIndex, 1);
        return [updatedInquiry, ...newInquiries];
      });

      // Update unread count for admin messages
      if (message.sender_type === 'admin') {
        setUnreadCount(prev => prev + 1);
      }
    };

    // Handle message sent confirmation
    const handleMessageSent = (data) => {
      console.log('Message sent confirmation received:', data);
      
      if (data.success && data.message && data.temporaryId) {
        setSelectedInquiry(prev => {
          if (!prev) return prev;
          
          const existingMessages = prev.messages || [];
          
          // Replace temporary message with actual message from server
          const updatedMessages = existingMessages.map(msg => 
            msg.temporaryId === data.temporaryId 
              ? { ...data.message, id: data.message.id }
              : msg
          );

          // If temporary message not found, add the new message
          if (!existingMessages.some(msg => msg.temporaryId === data.temporaryId)) {
            return {
              ...prev,
              messages: [...existingMessages, data.message]
            };
          }

          return {
            ...prev,
            messages: updatedMessages
          };
        });
      }
    };

    // Handle checkout activation from admin
    const handleCheckoutActivated = (data) => {
      console.log('Checkout activated for inquiry:', data);
      
      if (data.inquiryId) {
        // Update the specific inquiry with checkout data
        setInquiries(prev => prev.map(inquiry => 
          inquiry.id === data.inquiryId 
            ? { 
                ...inquiry, 
                is_checkout_active: true, 
                price_data: data.prices 
              }
            : inquiry
        ));

        // Update selected inquiry if it's the current one
        if (selectedInquiryRef.current && selectedInquiryRef.current.id === data.inquiryId) {
          setSelectedInquiry(prev => ({
            ...prev,
            is_checkout_active: true,
            price_data: data.prices
          }));
          setIsCheckoutActive(true);
          setPriceData(data.prices);
        }

        toast.success('Checkout has been activated! You can now proceed to purchase.');
      }
    };

    // Socket connection handlers
    const handleConnect = () => {
      console.log('✅ User connected to server via Socket.IO');
      
      // Join all existing inquiry rooms
      inquiriesRef.current.forEach(inquiry => {
        socket.emit('join_inquiry', inquiry.id);
      });

      // Join user's personal room for notifications
      const token = localStorage.getItem('userToken');
      if (token) {
        const userId = getUserIdFromToken(token);
        socket.emit('join_user_room', userId);
      }
    };

    const handleDisconnect = () => console.log('❌ User disconnected from server');
    
    const handleConnectError = (error) => {
      console.error('Socket connection error:', error);
      toast.error('Connection error. Please refresh the page.');
    };

    // Socket event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('new_message', handleNewMessage);
    socket.on('message_sent', handleMessageSent);
    socket.on('checkout_activated', handleCheckoutActivated);
    // Persisted read updates from server
    const handleMessagesRead = (data) => {
      const { inquiryId, newUnreadCount } = data || {};
      if (!inquiryId) return;

      // Update inquiry list unread count and total badge
      setInquiries(prev => {
        const updated = prev.map(inq => inq.id === inquiryId ? { ...inq, unread_count: newUnreadCount } : inq);
        const total = updated.reduce((sum, inq) => sum + (inq.unread_count || 0), 0);
        setUnreadCount(total);
        return updated;
      });

      // If this is the selected inquiry and admin messages were just marked read, clear admin reply indicator
      if (selectedInquiryRef.current && selectedInquiryRef.current.id === inquiryId && newUnreadCount === 0) {
        setAdminReplyInquiries(prev => {
          const copy = new Set(prev);
          copy.delete(inquiryId);
          return copy;
        });
      }
    };
    socket.on('messages_read', handleMessagesRead);

    // Cleanup
    return () => {
      console.log('Cleaning up Socket.IO listeners for MessagesPage');
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('new_message', handleNewMessage);
      socket.off('message_sent', handleMessageSent);
      socket.off('checkout_activated', handleCheckoutActivated);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [isLoggedIn]);

  // Join/Leave Socket rooms when inquiry selection changes
  useEffect(() => {
    if (selectedInquiry && socket.connected) {
      socket.emit('join_inquiry', selectedInquiry.id);
      console.log('User joined room:', selectedInquiry.id);
      
      // Remove from new message indicators when selected
      if (newMessageInquiries.has(selectedInquiry.id)) {
        setNewMessageInquiries(prev => {
          const updated = new Set(prev);
          updated.delete(selectedInquiry.id);
          return updated;
        });
      }
      
      // Remove from admin reply indicators when selected (only if user views the reply)
      if (adminReplyInquiries.has(selectedInquiry.id)) {
        const lastMessage = selectedInquiry.messages?.[selectedInquiry.messages.length - 1];
        if (lastMessage && lastMessage.sender_type === 'admin') {
          setAdminReplyInquiries(prev => {
            const updated = new Set(prev);
            updated.delete(selectedInquiry.id);
            return updated;
          });
        }
      }

      // Update checkout status for selected inquiry
      if (selectedInquiry) {
        setIsCheckoutActive(selectedInquiry.is_checkout_active || false);
        setPriceData(selectedInquiry.price_data || null);
      }
    }

    return () => {
      if (selectedInquiry) {
        socket.emit('leave_inquiry', selectedInquiry.id);
      }
    };
  }, [selectedInquiry]);

  // Handle file attachment
  const handleFileAttach = () => {
    if (!isLoggedIn) {
      setShowLoginPopup(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'application/pdf', 
        'text/plain', 
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip',
        'application/vnd.rar'
      ];
      
      const validFiles = files.filter(file => allowedTypes.includes(file.type));
      
      if (validFiles.length === 0) {
        toast.error('Please select valid files (images, PDF, documents, archives)');
        return;
      }

      if (validFiles.length > 5) {
        toast.error('Maximum 5 files allowed at once');
        return;
      }

      setAttachedFiles(prev => [...prev, ...validFiles]);
      e.target.value = '';
    }
  };

  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Upload files to server
  const uploadFiles = async (inquiryId, files) => {
    if (!inquiryId || files.length === 0) return [];

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const token = localStorage.getItem('userToken');
      const response = await apiFetch(`/api/inquiries/${inquiryId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  };

  // Send message
  const sendMessage = async (inquiryId, messageText, files = []) => {
    if ((!messageText.trim() && files.length === 0) || !inquiryId) return;

    if (!isLoggedIn) {
      setShowLoginPopup(true);
      return;
    }

    setIsSending(true);
    
    let uploadedFiles = [];
    
    // Upload files first if any
    if (files.length > 0) {
      try {
        uploadedFiles = await uploadFiles(inquiryId, files);
      } catch (error) {
        toast.error('Failed to upload files');
        setIsSending(false);
        return;
      }
    }

    // Create temporary message for optimistic update
    const temporaryId = `user-temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const tempMessage = {
      id: temporaryId,
      temporaryId: temporaryId,
      inquiryId: inquiryId,
      message: messageText,
      sender_type: 'user',
      files: uploadedFiles,
      timestamp: new Date().toISOString(),
      is_read: true
    };

    // Optimistically add message to UI immediately
    setSelectedInquiry(prev => ({
      ...prev,
      messages: [...(prev.messages || []), tempMessage],
      last_activity: new Date().toISOString()
    }));

    setNewMessage('');
    setAttachedFiles([]);

    try {
      // Send via Socket.IO
      socket.emit('send_message', {
        inquiryId: inquiryId,
        message: messageText,
        senderType: 'user',
        files: uploadedFiles,
        temporaryId: temporaryId
      });

      console.log('User message sent via Socket.IO with temp ID:', temporaryId);

      // Update the inquiry in the list to move it to top
      setInquiries(prev => {
        const otherInquiries = prev.filter(inq => inq.id !== inquiryId);
        const updatedInquiry = prev.find(inq => inq.id === inquiryId);
        if (updatedInquiry) {
          return [{
            ...updatedInquiry,
            last_activity: new Date().toISOString()
          }, ...otherInquiries];
        }
        return prev;
      });
        
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setSelectedInquiry(prev => ({
        ...prev,
        messages: (prev.messages || []).filter(msg => msg.temporaryId !== temporaryId)
      }));
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (inquiryId) => {
    try {
      const token = localStorage.getItem('userToken');
      const userId = getUserIdFromToken(token);
      
      await apiFetch(`/api/inquiries/${inquiryId}/messages/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          userId: userId,
          userType: 'user'
        })
      });

      // Socket emit for real-time update
      socket.emit('mark_messages_read', {
        inquiryId: inquiryId,
        userId: userId,
        userType: 'user'
      });

    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, []);

  // Handle checkout
  const handleCheckout = async () => {
    if (!isLoggedIn) {
      setShowLoginPopup(true);
      return;
    }

    if (!isCheckoutActive) {
      toast.info('Checkout will be activated once the admin sets the prices');
      return;
    }

    if (!selectedInquiry) {
      toast.error('No inquiry selected');
      return;
    }

    try {
      setIsLoading(true);
      
      toast.success('Proceeding to checkout with approved prices!');
      
      // Navigate to checkout page with inquiry data
      setTimeout(() => {
        const productData = safeJsonParse(selectedInquiry.product_data);
        const products = productData ? [{
          ...productData,
          id: productData.id,
          product_name: productData.product_name,
          price: productData.min_price || productData.discounted_price || productData.price,
          min_price: productData.min_price || productData.discounted_price || productData.price,
          max_price: productData.max_price || productData.price,
          discounted_price: productData.discounted_price,
          product_photos: productData.product_photos || [],
          quantity: productData.quantity || 1,
          selectedSize: productData.selectedSize || 'Customizable'
        }] : [];

        console.log('Navigating to checkout with:', {
          products: products,
          priceData: priceData,
          inquiryNumber: selectedInquiry.inquiry_number
        });
        
        // Navigate to checkout page with product data
        window.location.href = `/Checkout?source=inquiry&inquiryId=${selectedInquiry.id}&inquiryNumber=${selectedInquiry.inquiry_number}`;
        
        // Store product data in localStorage for checkout page to access
        localStorage.setItem('inquiryCheckoutData', JSON.stringify({
          products: products,
          priceData: priceData,
          inquiryNumber: selectedInquiry.inquiry_number,
          inquiryId: selectedInquiry.id
        }));
        
      }, 1000);
      
    } catch (error) {
      console.error('Error during checkout:', error);
      toast.error('Failed to proceed with checkout');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (isLoggedIn && !needsProfileCompletion) {
      fetchUserInquiries();
    }
  }, [isLoggedIn, needsProfileCompletion, fetchUserInquiries]);

  // Apply filters
  useEffect(() => {
    let filtered = inquiries;

    if (searchTerm) {
      filtered = filtered.filter(inquiry => {
        const productData = safeJsonParse(inquiry.product_data);
        return (
          inquiry.inquiry_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (productData?.product_name?.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(inquiry => inquiry.status === statusFilter);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(inquiry => {
        const inquiryDate = new Date(inquiry.last_activity);
        switch (dateFilter) {
          case 'today':
            return inquiryDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.setDate(now.getDate() - 7));
            return inquiryDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
            return inquiryDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    setFilteredInquiries(filtered);
  }, [inquiries, searchTerm, statusFilter, dateFilter]);

  // Handle inquiry selection
  const handleSelectInquiry = async (inquiry) => {
    if (!isLoggedIn) {
      setShowLoginPopup(true);
      return;
    }

    const inquiryWithMessages = await loadInquiryMessages(inquiry.id);
    if (inquiryWithMessages) {
      setSelectedInquiry(inquiryWithMessages);
      
      // Update checkout status
      setIsCheckoutActive(inquiryWithMessages.is_checkout_active || false);
      setPriceData(inquiryWithMessages.price_data || null);
      
      // Mark messages as read if there are unread messages
      if (inquiry.unread_count > 0) {
        markMessagesAsRead(inquiry.id);
        // Optimistically zero unread for this inquiry locally and update total badge
        setInquiries(prev => prev.map(inq =>
          inq.id === inquiry.id ? { ...inq, unread_count: 0 } : inq
        ));
        setUnreadCount(prev => Math.max(0, prev - (inquiry.unread_count || 0)));
      }
      
      // Remove from admin reply indicators when user views the inquiry
      if (adminReplyInquiries.has(inquiry.id)) {
        setAdminReplyInquiries(prev => {
          const updated = new Set(prev);
          updated.delete(inquiry.id);
          return updated;
        });
      }
    } else {
      setSelectedInquiry(inquiry);
      setIsCheckoutActive(inquiry.is_checkout_active || false);
      setPriceData(inquiry.price_data || null);
      // If no immediate load, still clear unread optimistically
      if (inquiry.unread_count > 0) {
        markMessagesAsRead(inquiry.id);
        setInquiries(prev => prev.map(inq =>
          inq.id === inquiry.id ? { ...inq, unread_count: 0 } : inq
        ));
        setUnreadCount(prev => Math.max(0, prev - (inquiry.unread_count || 0)));
      }
    }
    
    // Remove from new message indicators
    if (newMessageInquiries.has(inquiry.id)) {
      setNewMessageInquiries(prev => {
        const updated = new Set(prev);
        updated.delete(inquiry.id);
        return updated;
      });
    }
    
    // On mobile, show details pane when a chat is selected
    if (isMobile) {
      setShowDetails(true);
    }
  };

  // Handle sending message
  const handleSendMessage = () => {
    if (!selectedInquiry) return;
    sendMessage(selectedInquiry.id, newMessage, attachedFiles);
  };

  // Handle manual refresh
  const handleRefresh = () => {
    if (!isLoggedIn) {
      setShowLoginPopup(true);
      return;
    }
    fetchUserInquiries();
    setLastRefresh(Date.now());
    toast.success('Refreshed inquiries');
  };

  // Get unread count for a single inquiry
  const getUnreadCountForInquiry = (inquiry) => {
    return inquiry.unread_count || 0;
  };

  // Check if inquiry has admin reply
  const hasAdminReply = (inquiry) => {
    return adminReplyInquiries.has(inquiry.id);
  };

  // Format price range
  const formatPriceRange = (productData) => {
    if (!productData) return 'N/A';
    
    const minPrice = productData.min_price || productData.discounted_price || productData.price;
    const maxPrice = productData.max_price || productData.price;
    
    if (minPrice === maxPrice) {
      return `$${parseFloat(minPrice).toFixed(2)}`;
    }
    
    return `$${parseFloat(minPrice).toFixed(2)} - $${parseFloat(maxPrice).toFixed(2)}`;
  };

  // Get product name from inquiry
  const getProductName = (inquiry) => {
    const productData = safeJsonParse(inquiry.product_data);
    return productData?.product_name || 'Product Inquiry';
  };

  // Get product image from inquiry
  const getProductImage = (inquiry) => {
    const productData = safeJsonParse(inquiry.product_data);
    const photos = Array.isArray(productData?.product_photos) 
      ? productData.product_photos 
      : (typeof productData?.product_photos === 'string'
        ? safeJsonParse(productData.product_photos || '[]')
        : []);
    return photos[0] || null;
  };

  // Get real created_at time for inquiry (from messages)
  const getInquiryCreatedTime = (inquiry) => {
    if (inquiry.messages && inquiry.messages.length > 0) {
      // Return the timestamp of the first message (inquiry creation time)
      const firstMessage = inquiry.messages[0];
      return firstMessage.timestamp || firstMessage.created_at || inquiry.created_at;
    }
    return inquiry.created_at;
  };

  // Get real last activity time for inquiry (from messages)
  const getInquiryLastActivityTime = (inquiry) => {
    if (inquiry.messages && inquiry.messages.length > 0) {
      // Return the timestamp of the last message (most recent activity)
      const lastMessage = inquiry.messages[inquiry.messages.length - 1];
      return lastMessage.timestamp || lastMessage.created_at || inquiry.last_activity;
    }
    return inquiry.last_activity;
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [selectedInquiry?.messages]);

  const styles = {
    container: {
      width: '100%',
      height: '105vh',
      display: 'flex',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      color: '#fff',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      overflow: 'hidden'
    },
    
    // Sidebar (Chat List)
    sidebar: {
      width: '370px',
      minWidth: '300px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRight: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s ease, min-width 0.3s ease',
      ...(isMobile && {
        width: '100%',
        height: '100vh',
        borderRight: 'none',
        display: selectedInquiry ? 'none' : 'flex'
      })
    },
    sidebarHeader: {
      padding: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    },
    title: {
      fontSize: '1.2rem',
      fontWeight: '700',
      background: 'linear-gradient(90deg, #FFD700, #FFA500)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      margin: 0
    },
    notificationBadge: {
      background: '#e74c3c',
      color: 'white',
      borderRadius: '50%',
      width: '28px',
      height: '28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: 'bold'
    },
    searchContainer: {
      position: 'relative',
      padding: '15px 20px',
    },
    searchInput: {
      width: '100%',
      padding: '12px 20px 12px 45px',
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '25px',
      color: '#fff',
      fontSize: '14px',
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'all 0.3s ease',
    },
    filterContainer: {
      display: 'flex',
      gap: '10px',
      padding: '0 20px 15px 20px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    },
    select: {
      flex: 1,
      padding: '10px 15px',
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '20px',
      color: '#fff',
      fontSize: '12px',
      outline: 'none',
      cursor: 'pointer',
    },
    chatList: {
      flex: 1,
      overflowY: 'auto',
      padding: '10px 0'
    },

    // Chat View (Right Pane)
    chatView: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(0, 0, 0, 0.2)',
      ...(isMobile && {
        width: '100%',
        height: '100vh',
        display: selectedInquiry ? 'flex' : 'none'
      })
    },
    emptyChatView: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      color: 'rgba(255, 255, 255, 0.5)',
      padding: '20px'
    },
    chatHeader: {
      padding: '10px 20px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    chatHeaderInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px'
    },
    backButton: {
      display: isMobile ? 'flex' : 'none',
      background: 'none',
      border: 'none',
      color: '#fff',
      cursor: 'pointer',
      padding: 0,
      marginRight: '10px'
    },
    chatHeaderName: {
      fontSize: isMobile ? '9px': '1rem',
      fontWeight: '600',
      margin: 0
    },
    statusBadge: (status) => ({
      display: isMobile ?'none':'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      borderRadius: '20px',
      background: `rgba(${parseInt(getStatusColor(status).slice(1), 16)}, 0.2)`,
      color: getStatusColor(status),
      fontSize: '10px',
      fontWeight: '600',
    }),
    chatHeaderActions: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    iconButton: (isActive) => ({
      background: isActive ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)',
      border: `1px solid ${isActive ? '#FFD700' : 'rgba(255, 255, 255, 0.2)'}`,
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      color: isActive ? '#FFD700' : '#fff',
      transition: 'all 0.3s ease',
    }),
    
    // Main Chat Body & Details Sidebar
    chatBodyContainer: {
      flex: 1,
      display: 'flex',
      overflow: 'hidden'
    },
    messagesContainerWrapper: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    },
    messagesContainer: {
      flex: 1,
      overflowY: 'auto',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    messageBubble: (type) => ({
      background: type === 'user' 
        ? '#ffd7001f'
        : 'rgba(255, 255, 255, 0.1)',
      padding: '12px 18px',
      borderRadius: '20px',
      maxWidth: '70%',
      alignSelf: type === 'user' ? 'flex-end' : 'flex-start',
      border: `1px solid ${type === 'user' ? 'rgba(52, 152, 219, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
      color: '#ffffff',
      lineHeight: 1.5
    }),
    messageMeta: {
      fontSize: '11px', 
      opacity: 0.7, 
      marginBottom: '5px',
      fontWeight: '600'
    },

    // Chat Input Footer
    chatFooter: {
      padding: '15px 25px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    },
    messageInputWrapper: {
      display: 'flex',
      gap: '10px',
      alignItems: 'flex-end'
    },
    attachmentButton: {
      background: 'rgba(255, 255, 255, 0.1)',
      border: 'none',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      color: '#fff',
      flexShrink: 0,
      transition: 'background 0.2s ease',
    },
    messageInput: {
      flex: 1,
      padding: '12px 20px',
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '25px',
      color: '#fff',
      fontSize: '14px',
      outline: 'none',
      minHeight: '20px',
      maxHeight: '120px',
      resize: 'none',
      fontFamily: 'inherit'
    },
    sendButton: {
      background: 'linear-gradient(135deg, #3498db, #2980b9)',
      border: 'none',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      flexShrink: 0
    },

    // Details Sidebar (Right)
    detailsSidebar: {
      width: '300px',
      minWidth: '300px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
      overflowY: 'auto',
      padding: '20px',
      transition: 'all 0.3s ease',
      ...(isMobile && {
        position: 'absolute',
        top: '77px',
        right: 0,
        bottom: '78px',
        height: 'auto',
        zIndex: 10,
        background: 'rgba(45, 45, 45, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 215, 0, 0.3)',
        borderRadius: '10px 0 0 10px',
        width: '80%'
      })
    },
    detailsHeader: {
      color: '#FFD700', 
      marginBottom: '15px',
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px',
      fontSize: '1.1rem',
      borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
      paddingBottom: '10px'
    },
    productItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '10px',
      marginBottom: '10px',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    productImage: {
      width: '60px',
      height: '60px',
      borderRadius: '8px',
      backgroundColor: '#2d2d2d',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontSize: '24px',
      flexShrink: 0,
      overflow: 'hidden'
    },
    priceRange: (item) => {
      const productData = safeJsonParse(item.product_data);
      return (
        <div style={{marginTop: '5px'}}>
          <span style={{
            fontSize: '14px',
            fontWeight: '600',
            background: 'linear-gradient(90deg, #FFD700, #FFA500)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent'
          }}>
            {formatPriceRange(productData)}
          </span>
        </div>
      );
    },
    summaryBox: {
      background: 'rgba(255, 255, 255, 0.05)', 
      borderRadius: '10px', 
      padding: '15px',
      marginTop: '20px'
    },
    summaryItem: {
      display: 'flex', 
      justifyContent: 'space-between',
      fontSize: '10px',
      padding: '6px 0',
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
    },
    
    // Checkout Section Styles
    checkoutSection: {
      marginTop: '20px', 
      padding: '15px', 
      borderRadius: '12px', 
      background: isCheckoutActive 
        ? 'linear-gradient(135deg, rgba(46, 204, 113, 0.2), rgba(39, 174, 96, 0.3))' 
        : 'linear-gradient(135deg, #ffa50047, #ffc60017)', 
      color: '#333', 
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
    },
    checkoutText: {
      fontWeight: '350', 
      fontSize: '11px', 
      textAlign: 'justify',
      marginBottom: '15px', 
      lineHeight: '1.8',
      color: '#fff',
    },
    checkoutButton: {
      background: isCheckoutActive 
        ? 'linear-gradient(135deg, #2ecc71, #27ae60)'
        : 'linear-gradient(135deg, #ff9700, #ffc102)',
      color: '#fff',
      border: 'none',
      borderRadius: '30px',
      padding: '12px 30px',
      fontSize: '10px',
      fontWeight: '600',
      marginTop: '5px',
      cursor: isCheckoutActive ? 'pointer' : 'not-allowed',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
      opacity: (!isLoggedIn || isLoading || !selectedInquiry || !isCheckoutActive) ? 0.6 : 1,
      width: '100%'
    },
    
    // Loading / Empty States
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      fontSize: '16px',
      color: '#FFD700'
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px 20px',
      color: 'rgba(255, 255, 255, 0.7)'
    },
    refreshButton: {
      padding: '8px 16px',
      background: 'rgba(255, 215, 0, 0.1)',
      border: '1px solid rgba(255, 215, 0, 0.3)',
      borderRadius: '20px',
      color: '#FFD700',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: '600',
      transition: 'all 0.2s ease',
    },
    // Overlay styles for login popup
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: isMobile ? '10px' : '20px'
    },
  };

  // Show loading during initialization
  if (isInitializing) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', padding: '50px', width: '100%' }}>
          <FiLoader size={40} className="spin" style={{ marginBottom: '20px', color: '#FFD700' }} />
          <p>Loading Messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Login Popup */}
      <AnimatePresence>
        {showLoginPopup && (
          <motion.div
            style={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LoginForm 
              onClose={() => setShowLoginPopup(false)}
              onSuccess={handleLoginSuccess}
              isMobile={isMobile}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Completion Popup */}
      <AnimatePresence>
        {showProfileCompletionPopup && (
          <motion.div
            style={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ProfileCompletionForm 
              user={user}
              onComplete={handleProfileCompletion}
              onSkip={handleProfileSkip}
              isMobile={isMobile}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.txt,.doc,.docx,.xls,.xlsx,.zip,.rar"
        multiple
      />

      {/* Sidebar (Chat List) */}
      {isLoggedIn ? (
        <motion.div 
          style={styles.sidebar}
          layout
          initial={{ x: isMobile ? '-100%' : 0 }}
          animate={{ x: 0 }}
          exit={{ x: isMobile ? '-100%' : 0 }}
          transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
        >
          <div style={styles.sidebarHeader}>
            <h1 style={styles.title}>My Inquiries</h1>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              {unreadCount > 0 && (
                <motion.div 
                  style={styles.notificationBadge}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  {unreadCount}
                </motion.div>
              )}
              <button 
                style={styles.refreshButton}
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <FiRefreshCw className={isLoading ? 'spin' : ''} />
              </button>
            </div>
          </div>
          
          <div style={styles.searchContainer}>
            <FiSearch style={{ 
              position: 'absolute', 
              left: '35px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: 'rgba(255, 255, 255, 0.5)'
            }} />
            <input
              type="text"
              placeholder="Search by product name or inquiry #..."
              style={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div style={styles.filterContainer}>
            <select 
              style={styles.select}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="new">New Inquiry</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select 
              style={styles.select}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          <div style={styles.chatList}>
            {isLoading ? (
              <div style={styles.loadingContainer}>
                <FiLoader size={24} className="spin" />
                <div style={{marginLeft: '10px'}}>Loading inquiries...</div>
              </div>
            ) : filteredInquiries.length === 0 ? (
              <div style={styles.emptyState}>
                <FiMessageSquare size={48} style={{ opacity: 0.5, marginBottom: '15px' }} />
                <p>No inquiries found.</p>
                <p style={{fontSize: '14px', marginTop: '10px'}}>
                  {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                    ? 'Try adjusting your search filters' 
                    : 'You haven\'t made any inquiries yet'}
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredInquiries.map(inquiry => {
                  const unreadCount = getUnreadCountForInquiry(inquiry);
                  const hasNewMessage = newMessageInquiries.has(inquiry.id);
                  const hasAdminReply = adminReplyInquiries.has(inquiry.id);

                  return (
                    <ChatListItem
                      key={inquiry.id}
                      inquiry={inquiry}
                      isSelected={selectedInquiry?.id === inquiry.id}
                      unreadCount={unreadCount}
                      hasNewMessage={hasNewMessage}
                      hasAdminReply={hasAdminReply}
                      onSelect={handleSelectInquiry}
                    />
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      ) : (
        /* Not Logged In State for Sidebar */
        <motion.div 
          style={styles.sidebar}
          layout
          initial={{ x: isMobile ? '-100%' : 0 }}
          animate={{ x: 0 }}
          transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
        >
          <div style={styles.emptyState}>
            <FiUser size={isMobile ? 48 : 64} style={{ marginBottom: '20px', color: '#FFD700' }} />
            <h2 style={{ color: '#FFD700', marginBottom: '10px' }}>Authentication Required</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '30px' }}>
              Please sign in to view your messages
            </p>
            <button 
              style={{
                background: 'linear-gradient(135deg, #FFA500, #FFD700)',
                color: 'black',
                border: 'none',
                padding: '15px 30px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
              onClick={() => setShowLoginPopup(true)}
            >
              Sign In / Sign Up
            </button>
          </div>
        </motion.div>
      )}

      {/* Chat View (Main Window) */}
      <motion.div 
        style={styles.chatView}
        layout
        initial={{ x: isMobile ? '100%' : 0 }}
        animate={{ x: 0 }}
        transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
      >
        {!isLoggedIn ? (
          <div style={styles.emptyChatView}>
            <FiMessageSquare size={80} style={{ opacity: 0.3, marginBottom: '20px' }} />
            <h2 style={{ margin: 0, color: 'rgba(255, 255, 255, 0.8)' }}>
              Please Sign In
            </h2>
            <p>Sign in to access your messages and inquiries.</p>
            <button 
              style={{
                background: 'linear-gradient(135deg, #FFA500, #FFD700)',
                color: 'black',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginTop: '15px'
              }}
              onClick={() => setShowLoginPopup(true)}
            >
              Sign In Now
            </button>
          </div>
        ) : !selectedInquiry ? (
          <div style={styles.emptyChatView}>
            <FiMessageSquare size={80} style={{ opacity: 0.3, marginBottom: '20px' }} />
            <h2 style={{ margin: 0, color: 'rgba(255, 255, 255, 0.8)' }}>
              Select an Inquiry
            </h2>
            <p>Choose a conversation from the list to view messages.</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div style={styles.chatHeader}>
              <div style={styles.chatHeaderInfo}>
                <button 
                  style={styles.backButton}
                  onClick={() => setSelectedInquiry(null)}
                >
                  <FiChevronLeft size={24} />
                </button>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  // marginRight: '10px',
                  flexShrink: 0,
                  overflow: 'hidden'
                }}>
                  {getProductImage(selectedInquiry) ? (
                    <img 
                      src={getProductImage(selectedInquiry)} 
                      alt={getProductName(selectedInquiry)}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <FiShoppingCart size={20} />
                  )}
                </div>
                <div>
                  <h2 style={styles.chatHeaderName}>{getProductName(selectedInquiry)}</h2>
                  <div style={styles.statusBadge(selectedInquiry.status)}>
                    {getStatusText(selectedInquiry.status)}
                  </div>
                </div>
              </div>
              <div style={styles.chatHeaderActions}>
                <button 
                  style={styles.iconButton(showDetails)}
                  onClick={() => setShowDetails(!showDetails)}
                >
                  <FiInfo size={18} />
                </button>
              </div>
            </div>
            
            {/* Chat Body & Details */}
            <div style={styles.chatBodyContainer}>
              <div style={styles.messagesContainerWrapper}>
                {/* Messages */}
                <div 
                  ref={messagesContainerRef}
                  style={styles.messagesContainer}
                >
                  <AnimatePresence>
                    {selectedInquiry.messages?.map((message) => (
                      <motion.div
                        key={message.id || message.temporaryId}
                        style={styles.messageBubble(message.sender_type)}
                        layout
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      >
                        <div style={styles.messageMeta}>
                          {message.sender_type === 'user' ? 'You' : 'Admin'} • {formatTime(message.timestamp)}
                        </div>
                        <div>{message.message}</div>
                        {message.files && message.files.length > 0 && (
                          <FileMessage files={message.files} />
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>

                {/* File Previews */}
                {attachedFiles.length > 0 && (
                  <FilePreview files={attachedFiles} onRemove={removeFile} />
                )}

                {/* Message Input */}
                <div style={styles.chatFooter}>
                  <div style={styles.messageInputWrapper}>
                    <button 
                      style={styles.attachmentButton}
                      onClick={handleFileAttach}
                      title="Attach files"
                    >
                      <FiPaperclip size={18} />
                    </button>
                    <AutoExpandingTextarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      onSend={handleSendMessage}
                      className="chat-textarea"
                      disabled={isSending}
                    />
                    <button 
                      style={{
                        ...styles.sendButton,
                        opacity: (isSending || (!newMessage.trim() && attachedFiles.length === 0)) ? 0.6 : 1,
                        cursor: (isSending || (!newMessage.trim() && attachedFiles.length === 0)) ? 'not-allowed' : 'pointer'
                      }}
                      onClick={handleSendMessage}
                      disabled={isSending || (!newMessage.trim() && attachedFiles.length === 0)}
                    >
                      {isSending ? <FiLoader className="spin" /> : <FiSend color="#fff" size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Details Sidebar */}
              <AnimatePresence>
                {showDetails && (
                  <motion.div 
                    style={styles.detailsSidebar}
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
                  >
                    <h3 style={styles.detailsHeader}><FiShoppingCart /> Product Details</h3>
                    
                    {selectedInquiry.product_data && (() => {
                      const productData = safeJsonParse(selectedInquiry.product_data);
                      return (
                        <div style={styles.productItem}>
                          <div style={styles.productImage}>
                            <ProductGallery product={productData} isMobile={isMobile} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize:'10px', fontWeight: '600', marginBottom: '10px' }}>
                              {productData.product_name}
                            </div>
                            <div style={{ fontSize: '10px', opacity: 0.8 }}>
                              Quantity: {productData.quantity || 1} • Size: {productData.selectedSize || 'Customizable'}
                            </div>
                            {styles.priceRange(selectedInquiry)}
                          </div>
                        </div>
                      );
                    })()}

                    <h3 style={{...styles.detailsHeader, marginTop: '20px'}}><FiInfo /> Inquiry Summary</h3>
                    <div style={styles.summaryBox}>
                      <div style={styles.summaryItem}>
                        <span>Inquiry ID:</span>
                        <strong style={{color: '#FFD700'}}>{selectedInquiry.inquiry_number}</strong>
                      </div>
                      <div style={styles.summaryItem}>
                        <span>Status:</span>
                        <strong style={{color: getStatusColor(selectedInquiry.status)}}>
                          {getStatusText(selectedInquiry.status)}
                        </strong>
                      </div>
                      <div style={styles.summaryItem}>
                        <span>Created:</span>
                        <strong>{formatTime(getInquiryCreatedTime(selectedInquiry))}</strong>
                      </div>
                      <div style={styles.summaryItem}>
                        <span>Last Activity:</span>
                        <strong>{formatTime(getInquiryLastActivityTime(selectedInquiry))}</strong>
                      </div>
                      <div style={{...styles.summaryItem, borderBottom: 'none'}}>
                        <span>Total Messages:</span>
                        <strong>{selectedInquiry.messages?.length || 0}</strong>
                      </div>
                    </div>

                    {/* Checkout Section (Added at the bottom of details sidebar) */}
                    <div style={styles.checkoutSection}>
                      <p style={styles.checkoutText}>
                        {isCheckoutActive 
                          ? 'The admin has approved the prices for your products. You can now proceed to checkout and complete your purchase.'
                          : 'Product prices will be confirmed by our sales team. Once the price is finalized through negotiation, the Checkout button will be enabled, allowing you to proceed with your purchase.'
                        }
                      </p>

                      <button 
                        style={styles.checkoutButton}
                        onClick={handleCheckout}
                        disabled={!isLoggedIn || isLoading || !selectedInquiry || !isCheckoutActive}
                        onMouseOver={e => {
                          if (isCheckoutActive) {
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }
                        }}
                        onMouseOut={e => {
                          if (isCheckoutActive) {
                            e.currentTarget.style.transform = 'scale(1)';
                          }
                        }}
                      >
                        {isLoading ? 'Processing...' : isCheckoutActive ? 'Proceed to Checkout' : 'Checkout (Pending Approval)'}
                      </button>

                      {!isCheckoutActive && (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px', 
                          marginTop: '10px',
                          padding: '8px',
                          background: 'rgba(255,255,255,0.1)',
                          borderRadius: '6px'
                        }}>
                          <FiAlertCircle size={14} color="#f39c12" />
                          <span style={{ fontSize: '12px', color: '#f39c12' }}>
                            Waiting for admin to set prices
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </motion.div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .spin {
            animation: spin 1s linear infinite;
          }

          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
          }

          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb {
            background: rgba(255, 215, 0, 0.4);
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 215, 0, 0.6);
          }
          
          select option {
            background: #2d2d2d;
            color: #fff;
          }

          .status-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.7rem;
            font-weight: 600;
            color: #fff;
            line-height: 1;
          }

          .file-message-container {
            margin-top: 10px;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          
          .file-message-image {
             max-width: 100%;
          }
          .file-message-image img {
             max-width: 100%;
             height: auto;
             max-height: 200px;
             border-radius: 8px;
             display: block;
             cursor: zoom-in;
             transition: opacity 0.2s ease;
          }
          .file-message-image img:hover {
             opacity: 0.9;
          }
          .image-error-fallback {
            display: none;
            width: 150px;
            height: 100px;
            align-items: center;
            justify-content: center;
            background-color: #333;
            color: #fff;
            border-radius: 8px;
            font-size: 12px;
            opacity: 0.8;
            flex-direction: column;
            gap: 5px;
          }

          .file-message-item {
            padding: 8px 12px;
            background: rgba(255,255,255,0.15);
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .file-message-item:hover {
            background: rgba(255,255,255,0.25);
          }
          .file-info {
            flex: 1;
            min-width: 0;
          }
          .file-name {
            font-size: 0.85rem;
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            textOverflow: ellipsis;
          }
          .file-size {
            font-size: 0.75rem;
            color: rgba(255,255,255,0.7);
          }
          .file-open-button {
            background: rgba(255,255,255,0.2);
            border: none;
            border-radius: 4px;
            padding: 4px 8px;
            color: #fff;
            cursor: pointer;
            font-size: 0.7rem;
            display: flex;
            align-items: center;
            gap: 4px;
            flex-shrink: 0;
            transition: background 0.2s ease;
          }
          .file-open-button:hover {
             background: rgba(255,255,255,0.3);
          }
          
          .product-gallery {
            position: relative;
            width: 100%;
            height: 60px;
            border-radius: 8px;
            overflow: 'hidden';
            background-color: #2d2d2d;
          }
          .product-gallery.no-image {
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            border: 1px dashed rgba(255,255,255,0.2);
          }
          .product-gallery-image-wrapper {
            width: 100%;
            height: 100%;
            position: relative;
          }
          .product-gallery-image-wrapper img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .product-gallery-image-error {
            display: none;
            width: 100%;
            height: 100%;
            align-items: center;
            justify-content: center;
            background-color: #2d2d2d;
            color: #fff;
          }
          .gallery-nav {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0,0,0,0.7);
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            cursor: pointer;
            font-size: 12px;
            transition: background 0.2s ease;
          }
          .gallery-nav:hover {
            background: rgba(0,0,0,0.9);
          }
          .gallery-nav.prev { left: 2px; }
          .gallery-nav.next { right: 2px; }
          .gallery-counter {
            position: absolute;
            bottom: 4px;
            right: 4px;
            background: rgba(0,0,0,0.7);
            color: #fff;
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 10px;
            font-weight: 600;
          }

          .file-preview-container {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            padding: 0 10px;
          }
          .file-preview-item {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 10px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            font-size: 0.75rem;
          }
          .file-image-preview {
            width: 20px;
            height: 20px;
            object-fit: cover;
            border-radius: 4px;
          }
          .file-preview-name {
            max-width: 80px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .remove-file-button {
            background: none;
            border: none;
            color: #ff6b6b;
            cursor: pointer;
            padding: 2px;
            border-radius: 50%;
            display: flex;
            alignItems: 'center';
            transition: color 0.2s ease;
          }
          .remove-file-button:hover {
            color: #e74c3c;
          }

          input:disabled, button:disabled, textarea:disabled {
            cursor: not-allowed;
            opacity: 0.6;
          }

          textarea {
            resize: none;
            font-family: inherit;
          }

          .auto-expanding-textarea.chat-textarea {
            width: 100%;
            padding: 12px 20px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 25px;
            color: #fff;
            font-size: 14px;
            outline: none;
            min-height: 20px;
            overflow: hidden;
            max-height: 120px;
            resize: none;
            font-family: inherit;
            lineHeight: 1.4;
          }

          @media (max-width: 768px) {
            .product-gallery, .product-thumbnail {
              height: 50px;
            }
            .product-thumbnail {
              width: 45px;
              height: 45px;
            }
          }
        `}
      </style>
    </div>
  );
};

export default MessagesPage;