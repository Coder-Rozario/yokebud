import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaShoppingBag, FaEdit, FaSave, FaTimes, FaGoogle, FaEnvelope, FaCheck, FaExclamationTriangle, FaMapMarkerAlt, FaPhone, FaBuilding, FaBirthdayCake, FaVenusMars, FaGlobe, FaSpinner } from 'react-icons/fa';
import { signInWithPopup, signOut } from 'firebase/auth';
import { SOCKET_BASE } from '../utils/api';
import { apiFetch } from '../utils/api';
import { auth, googleProvider } from '../firebase';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Use centralized SOCKET_BASE for any real-time endpoints (if needed later)
const SOCKET_IO_BASE = SOCKET_BASE;

// Local fetch wrapper to prefix /api calls with API_BASE in production
const __originalFetch = typeof window !== 'undefined' ? window.fetch.bind(window) : fetch;
const fetch = (input, init) => {
  const isApiPath = typeof input === 'string' && input.startsWith('/api');
  const url = isApiPath ? `${API_BASE}${input}` : input;
  return __originalFetch(url, init);
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

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);
  const [showIncompleteFieldsPopup, setShowIncompleteFieldsPopup] = useState(false);
  const [incompleteFields, setIncompleteFields] = useState([]);
  
  // Login/Register states
  const [loginStep, setLoginStep] = useState('email');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [otpType, setOtpType] = useState('login');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    dateOfBirth: '',
    gender: ''
  });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    date_of_birth: '',
    gender: ''
  });

  // Profile completion form state
  const [completionForm, setCompletionForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    date_of_birth: '',
    gender: ''
  });

  // Responsive breakpoints
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;

  // Check for incomplete fields
  const checkIncompleteFields = (userData) => {
    const fields = [];
    if (!userData.first_name) fields.push('First Name');
    if (!userData.last_name) fields.push('Last Name');
    if (!userData.phone) fields.push('Phone Number');
    if (!userData.address) fields.push('Address');
    if (!userData.city) fields.push('City');
    if (!userData.country) fields.push('Country');
    if (!userData.date_of_birth) fields.push('Date of Birth');
    if (!userData.gender) fields.push('Gender');
    
    return fields;
  };

  // Show popup for incomplete fields
  useEffect(() => {
    if (isLoggedIn && user && !showProfileCompletion) {
      const incomplete = checkIncompleteFields(user);
      setIncompleteFields(incomplete);
      if (incomplete.length > 0) {
        setShowIncompleteFieldsPopup(true);
      }
    }
  }, [isLoggedIn, user, showProfileCompletion]);

  // Countdown timer for OTP
  useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

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
          
          if (!response.ok) {
            throw new Error('Failed to fetch profile');
          }
          
          const data = await response.json();
          
          if (data.success) {
            setUser(data.user);
            setIsLoggedIn(true);
            setProfileForm({
              first_name: data.user.first_name || '',
              last_name: data.user.last_name || '',
              phone: data.user.phone || '',
              company: data.user.company || '',
              address: data.user.address || '',
              city: data.user.city || '',
              state: data.user.state || '',
              zip_code: data.user.zip_code || '',
              country: data.user.country || '',
              date_of_birth: data.user.date_of_birth || '',
              gender: data.user.gender || ''
            });
            
            // Check if profile needs completion
            const needsCompletion = !data.user.first_name || !data.user.last_name || !data.user.phone;
            setNeedsProfileCompletion(needsCompletion);
            if (needsCompletion) {
              setShowProfileCompletion(true);
              setCompletionForm({
                first_name: data.user.first_name || '',
                last_name: data.user.last_name || '',
                phone: data.user.phone || '',
                company: data.user.company || '',
                address: data.user.address || '',
                city: data.user.city || '',
                state: data.user.state || '',
                zip_code: data.user.zip_code || '',
                country: data.user.country || '',
                date_of_birth: data.user.date_of_birth || '',
                gender: data.user.gender || ''
              });
            }
          } else {
            localStorage.removeItem('userToken');
            setIsLoggedIn(false);
          }
        } catch (error) {
          console.error('Error checking auth status:', error);
          localStorage.removeItem('userToken');
          setIsLoggedIn(false);
        }
      }
      setIsInitializing(false);
    };

    checkAuthStatus();
  }, []);

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

  useEffect(() => {
    if (isLoggedIn && activeTab === 'orders') {
      fetchUserOrders();
    }
  }, [activeTab, isLoggedIn]);

  const handleFirebaseLogin = async (firebaseUser) => {
    try {
      setLoading(true);
      
      const response = await apiFetch('/api/user/auth/firebase-google', {
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
        setUser(data.user);
        setIsLoggedIn(true);
        setLoginStep('email');
        
        // Set profile form data
        setProfileForm({
          first_name: data.user.first_name || '',
          last_name: data.user.last_name || '',
          phone: data.user.phone || '',
          company: data.user.company || '',
          address: data.user.address || '',
          city: data.user.city || '',
          state: data.user.state || '',
          zip_code: data.user.zip_code || '',
          country: data.user.country || '',
          date_of_birth: data.user.date_of_birth || '',
          gender: data.user.gender || ''
        });

        // Check if profile needs completion (Google login might not have all data)
        const needsCompletion = data.needsProfileCompletion || !data.user.first_name || !data.user.last_name || !data.user.phone;
        setNeedsProfileCompletion(needsCompletion);
        
        if (needsCompletion) {
          setShowProfileCompletion(true);
          setCompletionForm({
            first_name: data.user.first_name || '',
            last_name: data.user.last_name || '',
            phone: data.user.phone || '',
            company: data.user.company || '',
            address: data.user.address || '',
            city: data.user.city || '',
            state: data.user.state || '',
            zip_code: data.user.zip_code || '',
            country: data.user.country || '',
            date_of_birth: data.user.date_of_birth || '',
            gender: data.user.gender || ''
          });
          toast.info('Please complete your profile information');
        } else {
          toast.success('Login successful!');
        }
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

  const handleFirebaseSignOut = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('userToken');
      setUser(null);
      setIsLoggedIn(false);
      setFirebaseUser(null);
      setShowProfileCompletion(false);
      setNeedsProfileCompletion(false);
      setShowIncompleteFieldsPopup(false);
      toast.success('Logged out successfully!');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Logout failed. Please try again.');
    }
  };

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await apiFetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        setIsLoggedIn(true);
        setProfileForm({
          first_name: data.user.first_name || '',
          last_name: data.user.last_name || '',
          phone: data.user.phone || '',
          company: data.user.company || '',
          address: data.user.address || '',
          city: data.user.city || '',
          state: data.user.state || '',
          zip_code: data.user.zip_code || '',
          country: data.user.country || '',
          date_of_birth: data.user.date_of_birth || '',
          gender: data.user.gender || ''
        });
        
        // Check if profile still needs completion
        const needsCompletion = !data.user.first_name || !data.user.last_name || !data.user.phone;
        setNeedsProfileCompletion(needsCompletion);
      } else {
        localStorage.removeItem('userToken');
        setIsLoggedIn(false);
        toast.error('Session expired. Please login again.');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setIsLoggedIn(false);
      toast.error('Failed to load profile.');
    }
  };

  const fetchUserOrders = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await apiFetch('/api/user/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders);
      } else {
        toast.error('Failed to load orders.');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders.');
    }
  };

  const handleSendOtp = async (email, type = 'login') => {
    setLoading(true);
    try {
      let endpoint, requestBody;

      if (type === 'registration') {
        // For registration, send user data along with email
        endpoint = '/api/user/register/send-otp';
        requestBody = { email };
      } else {
        endpoint = '/api/user/login/send-otp';
        requestBody = { email };
      }
      
      const response = await apiFetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setOtpType(type);
        setLoginStep('otp');
        setOtpCountdown(60); // 1 minute countdown
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
      if (type === 'login') {
        const response = await apiFetch('/api/user/login/verify-otp', {
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
          setUser(data.user);
          setIsLoggedIn(true);
          setLoginStep('email');
          setLoginEmail('');
          setLoginOtp('');
          setOtpCountdown(0);
          setProfileForm({
            first_name: data.user.first_name || '',
            last_name: data.user.last_name || '',
            phone: data.user.phone || '',
            company: data.user.company || '',
            address: data.user.address || '',
            city: data.user.city || '',
            state: data.user.state || '',
            zip_code: data.user.zip_code || '',
            country: data.user.country || '',
            date_of_birth: data.user.date_of_birth || '',
            gender: data.user.gender || ''
          });

          // Check if profile needs completion
          const needsCompletion = !data.user.first_name || !data.user.last_name || !data.user.phone;
          setNeedsProfileCompletion(needsCompletion);
          
          if (needsCompletion) {
            setShowProfileCompletion(true);
            setCompletionForm({
              first_name: data.user.first_name || '',
              last_name: data.user.last_name || '',
              phone: data.user.phone || '',
              company: data.user.company || '',
              address: data.user.address || '',
              city: data.user.city || '',
              state: data.user.state || '',
              zip_code: data.user.zip_code || '',
              country: data.user.country || '',
              date_of_birth: data.user.date_of_birth || '',
              gender: data.user.gender || ''
            });
            toast.info('Please complete your profile information');
          } else {
            toast.success('Login successful!');
          }
        } else {
          toast.error(data.message || 'Invalid OTP');
        }
      } else {
        // For registration, verify OTP and create user in one step
        const response = await apiFetch('/api/user/register/verify-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: loginEmail,
            otp: loginOtp,
            userData: registerData
          })
        });
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        
        if (data.success) {
          localStorage.setItem('userToken', data.token);
          setUser(data.user);
          setIsLoggedIn(true);
          setLoginStep('email');
          setLoginEmail('');
          setLoginOtp('');
          setOtpCountdown(0);
          setRegisterData({
            firstName: '',
            lastName: '',
            phone: '',
            company: '',
            address: '',
            city: '',
            state: '',
            zipCode: '',
            country: '',
            dateOfBirth: '',
            gender: ''
          });
          setProfileForm({
            first_name: data.user.first_name || '',
            last_name: data.user.last_name || '',
            phone: data.user.phone || '',
            company: data.user.company || '',
            address: data.user.address || '',
            city: data.user.city || '',
            state: data.user.state || '',
            zip_code: data.user.zip_code || '',
            country: data.user.country || '',
            date_of_birth: data.user.date_of_birth || '',
            gender: data.user.gender || ''
          });

          // Check if profile needs completion
          const needsCompletion = !data.user.first_name || !data.user.last_name || !data.user.phone;
          setNeedsProfileCompletion(needsCompletion);
          
          if (needsCompletion) {
            setShowProfileCompletion(true);
            setCompletionForm({
              first_name: data.user.first_name || '',
              last_name: data.user.last_name || '',
              phone: data.user.phone || '',
              company: data.user.company || '',
              address: data.user.address || '',
              city: data.user.city || '',
              state: data.user.state || '',
              zip_code: data.user.zip_code || '',
              country: data.user.country || '',
              date_of_birth: data.user.date_of_birth || '',
              gender: data.user.gender || ''
            });
            toast.info('Please complete your profile information');
          } else {
            toast.success('Registration successful!');
          }
        } else {
          toast.error(data.message || 'Invalid OTP');
        }
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error('Failed to verify OTP. Please try again.');
    }
    setLoading(false);
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('userToken');
      const response = await apiFetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileForm)
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        setIsEditing(false);
        
        // Check if profile still needs completion after update
        const needsCompletion = !data.user.first_name || !data.user.last_name || !data.user.phone;
        setNeedsProfileCompletion(needsCompletion);
        
        // Check for incomplete fields after update
        const incomplete = checkIncompleteFields(data.user);
        setIncompleteFields(incomplete);
        if (incomplete.length > 0) {
          setShowIncompleteFieldsPopup(true);
        }
        
        toast.success('Profile updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    }
    setLoading(false);
  };

  const handleCompleteProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('userToken');
      const response = await apiFetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(completionForm)
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        setProfileForm({
          first_name: data.user.first_name || '',
          last_name: data.user.last_name || '',
          phone: data.user.phone || '',
          company: data.user.company || '',
          address: data.user.address || '',
          city: data.user.city || '',
          state: data.user.state || '',
          zip_code: data.user.zip_code || '',
          country: data.user.country || '',
          date_of_birth: data.user.date_of_birth || '',
          gender: data.user.gender || ''
        });
        setShowProfileCompletion(false);
        setNeedsProfileCompletion(false);
        
        // Check for incomplete fields after completion
        const incomplete = checkIncompleteFields(data.user);
        setIncompleteFields(incomplete);
        if (incomplete.length > 0) {
          setShowIncompleteFieldsPopup(true);
        }
        
        toast.success('Profile completed successfully!');
      } else {
        toast.error(data.message || 'Failed to complete profile');
      }
    } catch (error) {
      console.error('Error completing profile:', error);
      toast.error('Failed to complete profile. Please try again.');
    }
    setLoading(false);
  };

  const handleSkipProfileCompletion = () => {
    setShowProfileCompletion(false);
    toast.info('You can complete your profile later from the profile page.');
  };

  // Enhanced logout function with confirmation
  const handleLogout = async () => {
    // Create a custom confirmation toast
    const LogoutConfirmation = ({ closeToast }) => (
      <div style={{ padding: '10px', color: 'white' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#FFD700' }}>Confirm Logout</h4>
        <p style={{ margin: '0 0 15px 0' }}>Are you sure you want to logout?</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => {
              closeToast();
              performLogout();
            }}
            style={{
              background: '#ff4444',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Yes, Logout
          </button>
          <button
            onClick={closeToast}
            style={{
              background: 'transparent',
              color: '#FFD700',
              border: '1px solid #FFD700',
              padding: '8px 16px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );

    // Show confirmation toast
    toast.info(<LogoutConfirmation />, {
      position: "top-center",
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      closeButton: false,
      style: {
        background: 'rgba(40, 40, 40, 0.95)',
        border: '2px solid #FFD700',
        borderRadius: '10px'
      }
    });
  };

  // Actual logout function
  const performLogout = async () => {
    if (firebaseUser) {
      await handleFirebaseSignOut();
    } else {
      try {
        const token = localStorage.getItem('userToken');
        if (token) {
          await apiFetch('/api/user/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        }
        
        localStorage.removeItem('userToken');
        setUser(null);
        setIsLoggedIn(false);
        setActiveTab('profile');
        setLoginStep('email');
        setLoginEmail('');
        setShowProfileCompletion(false);
        setNeedsProfileCompletion(false);
        setShowIncompleteFieldsPopup(false);
        toast.success('Logged out successfully!');
      } catch (error) {
        console.error('Logout error:', error);
        toast.error('Logout failed. Please try again.');
      }
    }
  };

  // Resend OTP function
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
      
      const response = await apiFetch(endpoint, {
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
        setOtpCountdown(60); // Reset to 1 minute
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

  // Demo orders data
  const demoOrders = [
    {
      order_id: 'ORD-001',
      product_details: { product_name: 'Premium Cotton T-Shirt', quantity: 2, size: 'L', color: 'Black' },
      order_date: '2024-01-15',
      status: 'delivered',
      total_amount: 49.98,
      shipping_address: { 
        address: '123 Main Street', 
        city: 'Helsinki', 
        state: 'Uusimaa',
        zip_code: '00100',
        country: 'Finland' 
      },
      payment_method: 'Credit Card',
      tracking_number: 'TRK123456789'
    },
    {
      order_id: 'ORD-002',
      product_details: { product_name: 'Winter Jacket - Waterproof', quantity: 1, size: 'M', color: 'Navy Blue' },
      order_date: '2024-01-10',
      status: 'shipped',
      total_amount: 89.99,
      shipping_address: { 
        address: '123 Main Street', 
        city: 'Helsinki', 
        state: 'Uusimaa',
        zip_code: '00100',
        country: 'Finland' 
      },
      payment_method: 'PayPal',
      tracking_number: 'TRK987654321'
    },
    {
      order_id: 'ORD-003',
      product_details: { product_name: 'Casual Jeans', quantity: 1, size: '32', color: 'Dark Blue' },
      order_date: '2024-01-05',
      status: 'processing',
      total_amount: 59.99,
      shipping_address: { 
        address: '123 Main Street', 
        city: 'Helsinki', 
        state: 'Uusimaa',
        zip_code: '00100',
        country: 'Finland' 
      },
      payment_method: 'Credit Card',
      tracking_number: null
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return { background: 'rgba(0, 255, 0, 0.2)', color: '#00ff00' };
      case 'shipped':
        return { background: 'rgba(255, 165, 0, 0.2)', color: '#FFA500' };
      case 'processing':
        return { background: 'rgba(0, 191, 255, 0.2)', color: '#00bfff' };
      case 'pending':
        return { background: 'rgba(255, 255, 0, 0.2)', color: '#ffff00' };
      case 'cancelled':
        return { background: 'rgba(255, 0, 0, 0.2)', color: '#ff0000' };
      default:
        return { background: 'rgba(255, 255, 255, 0.1)', color: 'white' };
    }
  };

  // Format countdown timer
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Responsive container styles
  const containerStyles = {
    minHeight: isMobile?'70vh': '100vh',
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
    padding: isMobile ? '1rem 0.5rem' : isTablet ? '1.5rem 1rem' : '2rem 1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const mainContainerStyles = {
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: isMobile ? '15px' : '20px',
    overflow: 'hidden',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 215, 0, 0.2)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
  };

  const contentPadding = isMobile ? '1rem' : isTablet ? '1.5rem' : '2rem';

  // Loading animation during initialization
  if (isInitializing) {
    return (
      <div style={containerStyles}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center' }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{ marginBottom: '2rem' }}
          >
            <FaSpinner size={isMobile ? 40 : 50} color="#FFD700" />
          </motion.div>
          <h2 style={{ 
            color: '#FFD700', 
            marginBottom: '1rem',
            fontSize: isMobile ? '1.5rem' : '2rem'
          }}>
            Loading Your Profile
          </h2>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: isMobile ? '0.9rem' : '1rem'
          }}>
            Please wait while we prepare your experience...
          </p>
        </motion.div>
        <ToastContainer />
      </div>
    );
  }

  // Incomplete Fields Popup - Show this when user has incomplete fields
  if (showIncompleteFieldsPopup && isLoggedIn && !showProfileCompletion) {
    return (
      <div style={containerStyles}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            maxWidth: isMobile ? '95%' : '600px',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: isMobile ? '15px' : '20px',
            padding: isMobile ? '2rem 1rem' : '3rem 2rem',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            position: 'relative'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <FaExclamationTriangle size={isMobile ? 40 : 50} color="#FFD700" style={{ marginBottom: '1rem' }} />
              <h1 style={{ 
                color: '#FFD700', 
                marginBottom: '0.5rem',
                fontSize: isMobile ? '1.5rem' : '2rem'
              }}>
                Complete Your Profile
              </h1>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: isMobile ? '0.9rem' : '1rem'
              }}>
                Please complete the following fields for better experience
              </p>
            </motion.div>
          </div>

          <div style={{ 
            background: 'rgba(255, 215, 0, 0.1)',
            borderRadius: '10px',
            padding: isMobile ? '1rem' : '1.5rem',
            marginBottom: '2rem',
            border: '1px solid rgba(255, 215, 0, 0.3)'
          }}>
            <h3 style={{ 
              color: '#FFD700', 
              marginBottom: '1rem', 
              textAlign: 'center',
              fontSize: isMobile ? '1.1rem' : '1.3rem'
            }}>
              Incomplete Fields:
            </h3>
            <ul style={{ 
              color: 'white', 
              paddingLeft: isMobile ? '1rem' : '1.5rem',
              fontSize: isMobile ? '0.9rem' : '1rem'
            }}>
              {incompleteFields.map((field, index) => (
                <li key={index} style={{ marginBottom: '0.5rem' }}>
                  {field}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            justifyContent: 'center', 
            flexWrap: 'wrap',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setShowIncompleteFieldsPopup(false);
                setIsEditing(true);
              }}
              style={{
                background: 'linear-gradient(135deg, #FFA500, #FFD700)',
                color: 'black',
                border: 'none',
                padding: isMobile ? '12px 20px' : '15px 30px',
                borderRadius: '10px',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                minWidth: isMobile ? '100%' : '180px'
              }}
            >
              Complete Now
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowIncompleteFieldsPopup(false)}
              style={{
                background: 'transparent',
                color: '#FFD700',
                border: '2px solid #FFD700',
                padding: isMobile ? '12px 20px' : '15px 30px',
                borderRadius: '10px',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                minWidth: isMobile ? '100%' : '180px'
              }}
            >
              Skip for Now
            </motion.button>
          </div>
        </motion.div>
        <ToastContainer />
      </div>
    );
  }

  // Profile Completion Modal - Show this when user needs to complete profile
  if (showProfileCompletion && isLoggedIn) {
    return (
      <div style={containerStyles}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            maxWidth: isMobile ? '95%' : '800px',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: isMobile ? '15px' : '20px',
            padding: isMobile ? '1.5rem 1rem' : '3rem 2rem',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            position: 'relative'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <FaUser size={isMobile ? 40 : 50} color="#FFD700" style={{ marginBottom: '1rem' }} />
              <h1 style={{ 
                color: '#FFD700', 
                marginBottom: '0.5rem',
                fontSize: isMobile ? '1.5rem' : '2rem'
              }}>
                Complete Your Profile
              </h1>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: isMobile ? '0.9rem' : '1rem'
              }}>
                Please provide some additional information to complete your profile
              </p>
            </motion.div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '1.5rem' 
          }}>
            {/* Personal Information */}
            <div>
              <h3 style={{ 
                color: '#FFD700', 
                marginBottom: '1rem', 
                borderBottom: '1px solid rgba(255, 215, 0, 0.3)', 
                paddingBottom: '0.5rem',
                fontSize: isMobile ? '1.1rem' : '1.3rem'
              }}>
                Personal Information
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                  gap: '1rem' 
                }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      color: 'rgba(255, 255, 255, 0.8)', 
                      marginBottom: '0.5rem', 
                      fontSize: isMobile ? '0.8rem' : '0.9rem' 
                    }}>
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={completionForm.first_name}
                      onChange={(e) => setCompletionForm({...completionForm, first_name: e.target.value})}
                      placeholder="John"
                      style={{
                        width: '100%',
                        padding: isMobile ? '10px 12px' : '12px 15px',
                        border: '2px solid rgba(255, 215, 0, 0.3)',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      color: 'rgba(255, 255, 255, 0.8)', 
                      marginBottom: '0.5rem', 
                      fontSize: isMobile ? '0.8rem' : '0.9rem' 
                    }}>
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={completionForm.last_name}
                      onChange={(e) => setCompletionForm({...completionForm, last_name: e.target.value})}
                      placeholder="Doe"
                      style={{
                        width: '100%',
                        padding: isMobile ? '10px 12px' : '12px 15px',
                        border: '2px solid rgba(255, 215, 0, 0.3)',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    color: 'rgba(255, 255, 255, 0.8)', 
                    marginBottom: '0.5rem', 
                    fontSize: isMobile ? '0.8rem' : '0.9rem' 
                  }}>
                    <FaPhone style={{ marginRight: '8px', color: '#FFD700' }} />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={completionForm.phone}
                    onChange={(e) => setCompletionForm({...completionForm, phone: e.target.value})}
                    placeholder="+358 44 123 4567"
                    style={{
                      width: '100%',
                      padding: isMobile ? '10px 12px' : '12px 15px',
                      border: '2px solid rgba(255, 215, 0, 0.3)',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: isMobile ? '0.9rem' : '1rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    color: 'rgba(255, 255, 255, 0.8)', 
                    marginBottom: '0.5rem', 
                    fontSize: isMobile ? '0.8rem' : '0.9rem' 
                  }}>
                    <FaBuilding style={{ marginRight: '8px', color: '#FFD700' }} />
                    Company
                  </label>
                  <input
                    type="text"
                    value={completionForm.company}
                    onChange={(e) => setCompletionForm({...completionForm, company: e.target.value})}
                    placeholder="Your company name"
                    style={{
                      width: '100%',
                      padding: isMobile ? '10px 12px' : '12px 15px',
                      border: '2px solid rgba(255, 215, 0, 0.3)',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: isMobile ? '0.9rem' : '1rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                  gap: '1rem' 
                }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      color: 'rgba(255, 255, 255, 0.8)', 
                      marginBottom: '0.5rem', 
                      fontSize: isMobile ? '0.8rem' : '0.9rem' 
                    }}>
                      <FaBirthdayCake style={{ marginRight: '8px', color: '#FFD700' }} />
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={completionForm.date_of_birth}
                      onChange={(e) => setCompletionForm({...completionForm, date_of_birth: e.target.value})}
                      style={{
                        width: '100%',
                        padding: isMobile ? '10px 12px' : '12px 15px',
                        border: '2px solid rgba(255, 215, 0, 0.3)',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      color: 'rgba(255, 255, 255, 0.8)', 
                      marginBottom: '0.5rem', 
                      fontSize: isMobile ? '0.8rem' : '0.9rem' 
                    }}>
                      <FaVenusMars style={{ marginRight: '8px', color: '#FFD700' }} />
                      Gender
                    </label>
                    <select
                      value={completionForm.gender}
                      onChange={(e) => setCompletionForm({...completionForm, gender: e.target.value})}
                      style={{
                        width: '100%',
                        padding: isMobile ? '10px 12px' : '12px 15px',
                        border: '2px solid rgba(255, 215, 0, 0.3)',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        outline: 'none'
                      }}
                    >
                      <option value="" style={{ color: 'white' }}>Select Gender</option>
                      <option value="male" style={{ color: 'black' }}>Male</option>
                      <option value="female" style={{ color: 'black' }}>Female</option>
                      <option value="other" style={{ color: 'black' }}>Other</option>
                      <option value="prefer-not-to-say" style={{ color: 'black' }}>Prefer not to say</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h3 style={{ 
                color: '#FFD700', 
                marginBottom: '1rem', 
                borderBottom: '1px solid rgba(255, 215, 0, 0.3)', 
                paddingBottom: '0.5rem',
                fontSize: isMobile ? '1.1rem' : '1.3rem'
              }}>
                Address Information
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    color: 'rgba(255, 255, 255, 0.8)', 
                    marginBottom: '0.5rem', 
                    fontSize: isMobile ? '0.8rem' : '0.9rem' 
                  }}>
                    <FaMapMarkerAlt style={{ marginRight: '8px', color: '#FFD700' }} />
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={completionForm.address}
                    onChange={(e) => setCompletionForm({...completionForm, address: e.target.value})}
                    placeholder="123 Main Street"
                    style={{
                      width: '100%',
                      padding: isMobile ? '10px 12px' : '12px 15px',
                      border: '2px solid rgba(255, 215, 0, 0.3)',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: isMobile ? '0.9rem' : '1rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                  gap: '1rem' 
                }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      color: 'rgba(255, 255, 255, 0.8)', 
                      marginBottom: '0.5rem', 
                      fontSize: isMobile ? '0.8rem' : '0.9rem' 
                    }}>
                      City
                    </label>
                    <input
                      type="text"
                      value={completionForm.city}
                      onChange={(e) => setCompletionForm({...completionForm, city: e.target.value})}
                      placeholder="Helsinki"
                      style={{
                        width: '100%',
                        padding: isMobile ? '10px 12px' : '12px 15px',
                        border: '2px solid rgba(255, 215, 0, 0.3)',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      color: 'rgba(255, 255, 255, 0.8)', 
                      marginBottom: '0.5rem', 
                      fontSize: isMobile ? '0.8rem' : '0.9rem' 
                    }}>
                      State/Region
                    </label>
                    <input
                      type="text"
                      value={completionForm.state}
                      onChange={(e) => setCompletionForm({...completionForm, state: e.target.value})}
                      placeholder="Uusimaa"
                      style={{
                        width: '100%',
                        padding: isMobile ? '10px 12px' : '12px 15px',
                        border: '2px solid rgba(255, 215, 0, 0.3)',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                  gap: '1rem' 
                }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      color: 'rgba(255, 255, 255, 0.8)', 
                      marginBottom: '0.5rem', 
                      fontSize: isMobile ? '0.8rem' : '0.9rem' 
                    }}>
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={completionForm.zip_code}
                      onChange={(e) => setCompletionForm({...completionForm, zip_code: e.target.value})}
                      placeholder="00100"
                      style={{
                        width: '100%',
                        padding: isMobile ? '10px 12px' : '12px 15px',
                        border: '2px solid rgba(255, 215, 0, 0.3)',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      color: 'rgba(255, 255, 255, 0.8)', 
                      marginBottom: '0.5rem', 
                      fontSize: isMobile ? '0.8rem' : '0.9rem' 
                    }}>
                      <FaGlobe style={{ marginRight: '8px', color: '#FFD700' }} />
                      Country
                    </label>
                    <select
                      value={completionForm.country}
                      onChange={(e) => setCompletionForm({...completionForm, country: e.target.value})}
                      style={{
                        width: '100%',
                        padding: isMobile ? '10px 12px' : '12px 15px',
                        border: '2px solid rgba(255, 215, 0, 0.3)',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        outline: 'none'
                      }}
                    >
                      <option value="" style={{ color: 'white' }}>Select Country</option>
                      {countries.map((country) => (
                        <option key={country} value={country} style={{ color: 'black' }}>{country}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            justifyContent: 'center', 
            marginTop: '2.5rem', 
            flexWrap: 'wrap',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCompleteProfile}
              disabled={loading || !completionForm.first_name || !completionForm.last_name || !completionForm.phone}
              style={{
                background: 'linear-gradient(135deg, #FFA500, #FFD700)',
                color: 'black',
                border: 'none',
                padding: isMobile ? '12px 20px' : '15px 30px',
                borderRadius: '10px',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: (loading || !completionForm.first_name || !completionForm.last_name || !completionForm.phone) ? 0.6 : 1,
                minWidth: isMobile ? '100%' : '180px'
              }}
            >
              {loading ? 'Saving...' : 'Complete Profile'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSkipProfileCompletion}
              style={{
                background: 'transparent',
                color: '#FFD700',
                border: '2px solid #FFD700',
                padding: isMobile ? '12px 20px' : '15px 30px',
                borderRadius: '10px',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                minWidth: isMobile ? '100%' : '180px'
              }}
            >
              Skip for Now
            </motion.button>
          </div>
        </motion.div>
        <ToastContainer />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div style={containerStyles}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            maxWidth: isMobile ? '95%' : '500px',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: isMobile ? '15px' : '20px',
            padding: isMobile ? '1.5rem 1rem' : '3rem 2rem',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 style={{ 
                color: '#FFD700', 
                marginBottom: '0.5rem',
                fontSize: isMobile ? '1.8rem' : '2.5rem',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {loginStep === 'email' ? 'Welcome Back' : 
                 loginStep === 'otp' ? 'Verify Your Email' : 
                 'Complete Registration'}
              </h1>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: isMobile ? '0.9rem' : '1.1rem',
                marginBottom: '0'
              }}>
                {loginStep === 'email' && 'Sign in to your account or create a new one'}
                {loginStep === 'otp' && 'Enter the verification code sent to your email'}
                {loginStep === 'register' && 'Complete your registration details'}
              </p>
            </motion.div>
          </div>

          {/* Email Input Step */}
          <AnimatePresence mode="wait">
            {loginStep === 'email' && (
              <motion.div
                key="email-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
              >
                <div>
                  <label style={{ 
                    display: 'block', 
                    color: 'rgba(255, 255, 255, 0.8)', 
                    marginBottom: '0.8rem',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    fontWeight: '500'
                  }}>
                    <FaEnvelope style={{ marginRight: '8px', color: '#FFD700' }} />
                    Email Address
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Enter your email address"
                    style={{
                      width: '100%',
                      padding: isMobile ? '12px 15px' : '15px 20px',
                      border: '2px solid rgba(255, 215, 0, 0.3)',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: isMobile ? '0.9rem' : '1rem',
                      outline: 'none',
                      transition: 'all 0.3s ease'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: '0 5px 15px rgba(255, 215, 0, 0.3)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSendOtp(loginEmail, 'login')}
                    disabled={loading || !loginEmail}
                    style={{
                      background: 'linear-gradient(135deg, #FFA500, #FFD700)',
                      color: 'black',
                      border: 'none',
                      padding: isMobile ? '12px 20px' : '15px 30px',
                      borderRadius: '12px',
                      fontSize: isMobile ? '0.9rem' : '1.1rem',
                      fontWeight: 'bold',
                      cursor: loading || !loginEmail ? 'not-allowed' : 'pointer',
                      opacity: loading || !loginEmail ? 0.6 : 1,
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 12px rgba(255, 215, 0, 0.2)'
                    }}
                  >
                    {loading ? (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        Sending OTP...
                      </motion.span>
                    ) : (
                      'Sign In with Email'
                    )}
                  </motion.button>

                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: 'rgba(255, 255, 255, 0.6)', margin: '1rem 0', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>
                      Don't have an account?
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setOtpType('registration');
                        setLoginStep('register');
                      }}
                      disabled={loading || !loginEmail}
                      style={{
                        background: 'transparent',
                        color: '#FFD700',
                        border: '2px solid #FFD700',
                        padding: isMobile ? '10px 20px' : '12px 24px',
                        borderRadius: '10px',
                        fontSize: isMobile ? '0.8rem' : '1rem',
                        fontWeight: 'bold',
                        cursor: loading || !loginEmail ? 'not-allowed' : 'pointer',
                        opacity: loading || !loginEmail ? 0.6 : 1,
                        transition: 'all 0.3s ease',
                        width: '100%'
                      }}
                    >
                      Create New Account
                    </motion.button>
                  </div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  margin: '1rem 0',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.2)' }}></div>
                  <span style={{ padding: '0 1rem', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>or continue with</span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.2)' }}></div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 5px 15px rgba(255, 255, 255, 0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    padding: isMobile ? '12px 20px' : '15px 30px',
                    borderRadius: '12px',
                    fontSize: isMobile ? '0.9rem' : '1.1rem',
                    fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <FaGoogle style={{ color: '#4285F4' }} />
                  Continue with Google
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* OTP Verification Step */}
          <AnimatePresence mode="wait">
            {loginStep === 'otp' && (
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
              >
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <FaEnvelope size={isMobile ? 40 : 50} color="#FFD700" style={{ marginBottom: '1rem' }} />
                  </motion.div>
                  <h3 style={{ 
                    color: '#FFD700', 
                    marginBottom: '0.5rem',
                    fontSize: isMobile ? '1.2rem' : '1.4rem'
                  }}>
                    {otpType === 'login' ? 'Sign In Verification' : 'Account Verification'}
                  </h3>
                  <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                    We sent a 6-digit code to
                  </p>
                  <p style={{ color: '#FFD700', fontWeight: 'bold', fontSize: isMobile ? '1rem' : '1.1rem' }}>
                    {loginEmail}
                  </p>
                  {otpCountdown > 0 && (
                    <p style={{ color: '#ff4444', fontSize: isMobile ? '0.8rem' : '0.9rem', marginTop: '0.5rem' }}>
                      OTP expires in: {formatTime(otpCountdown)}
                    </p>
                  )}
                </div>

                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type="text"
                  value={loginOtp}
                  onChange={(e) => setLoginOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  style={{
                    width: '100%',
                    padding: isMobile ? '12px 15px' : '15px 20px',
                    border: '2px solid rgba(255, 215, 0, 0.3)',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontSize: isMobile ? '1.2rem' : '1.5rem',
                    textAlign: 'center',
                    letterSpacing: '10px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    fontWeight: 'bold'
                  }}
                />

                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 5px 15px rgba(255, 215, 0, 0.3)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleVerifyOtp(loginEmail, loginOtp, otpType)}
                  disabled={loading || loginOtp.length !== 6}
                  style={{
                    background: 'linear-gradient(135deg, #FFA500, #FFD700)',
                    color: 'black',
                    border: 'none',
                    padding: isMobile ? '12px 20px' : '15px 30px',
                    borderRadius: '12px',
                    fontSize: isMobile ? '0.9rem' : '1.1rem',
                    fontWeight: 'bold',
                    cursor: loading || loginOtp.length !== 6 ? 'not-allowed' : 'pointer',
                    opacity: loading || loginOtp.length !== 6 ? 0.6 : 1,
                    transition: 'all 0.3s ease'
                  }}
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </motion.button>

                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <button
                    onClick={handleResendOtp}
                    disabled={loading || otpCountdown > 0}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: otpCountdown > 0 ? 'rgba(255, 215, 0, 0.5)' : '#FFD700',
                      cursor: loading || otpCountdown > 0 ? 'not-allowed' : 'pointer',
                      fontSize: isMobile ? '0.8rem' : '0.9rem',
                      textDecoration: 'underline',
                      marginRight: '1rem'
                    }}
                  >
                    {loading ? 'Sending...' : otpCountdown > 0 ? `Resend OTP (${formatTime(otpCountdown)})` : 'Resend OTP'}
                  </button>
                  
                  <button
                    onClick={() => {
                      setLoginStep('email');
                      setLoginOtp('');
                      setOtpCountdown(0);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#FFD700',
                      cursor: 'pointer',
                      fontSize: isMobile ? '0.8rem' : '0.9rem',
                      textDecoration: 'underline'
                    }}
                  >
                    ← Back to Email
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Registration Form Step */}
          <AnimatePresence mode="wait">
            {loginStep === 'register' && (
              <motion.div
                key="register-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <FaUser size={isMobile ? 25 : 30} color="#FFD700" style={{ marginBottom: '0.5rem' }} />
                  <h3 style={{ 
                    color: '#FFD700', 
                    marginBottom: '0.5rem',
                    fontSize: isMobile ? '1.2rem' : '1.4rem'
                  }}>
                    Complete Registration
                  </h3>
                  <p style={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: isMobile ? '0.8rem' : '0.9rem'
                  }}>
                    Please fill in your details to create an account
                  </p>
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                  gap: '1rem' 
                }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      color: 'rgba(255, 255, 255, 0.8)', 
                      marginBottom: '0.5rem', 
                      fontSize: isMobile ? '0.8rem' : '0.9rem' 
                    }}>
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={registerData.firstName}
                      onChange={(e) => setRegisterData({...registerData, firstName: e.target.value})}
                      placeholder="John"
                      style={{
                        width: '100%',
                        padding: isMobile ? '8px 10px' : '10px 12px',
                        border: '1px solid rgba(255, 215, 0, 0.3)',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        fontSize: isMobile ? '0.8rem' : '0.9rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      color: 'rgba(255, 255, 255, 0.8)', 
                      marginBottom: '0.5rem', 
                      fontSize: isMobile ? '0.8rem' : '0.9rem' 
                    }}>
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={registerData.lastName}
                      onChange={(e) => setRegisterData({...registerData, lastName: e.target.value})}
                      placeholder="Doe"
                      style={{
                        width: '100%',
                        padding: isMobile ? '8px 10px' : '10px 12px',
                        border: '1px solid rgba(255, 215, 0, 0.3)',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        fontSize: isMobile ? '0.8rem' : '0.9rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    color: 'rgba(255, 255, 255, 0.8)', 
                    marginBottom: '0.5rem', 
                    fontSize: isMobile ? '0.8rem' : '0.9rem' 
                  }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                    placeholder="+358 44 123 4567"
                    style={{
                      width: '100%',
                      padding: isMobile ? '8px 10px' : '10px 12px',
                      border: '1px solid rgba(255, 215, 0, 0.3)',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: isMobile ? '0.8rem' : '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    // Validate required fields
                    if (!registerData.firstName || !registerData.lastName || !registerData.phone) {
                      toast.error('Please fill all required fields (First Name, Last Name, Phone)');
                      return;
                    }
                    handleSendOtp(loginEmail, 'registration');
                  }}
                  disabled={loading}
                  style={{
                    background: 'linear-gradient(135deg, #FFA500, #FFD700)',
                    color: 'black',
                    border: 'none',
                    padding: isMobile ? '10px 20px' : '12px 24px',
                    borderRadius: '10px',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    transition: 'all 0.3s ease',
                    marginTop: '1rem'
                  }}
                >
                  {loading ? 'Sending OTP...' : 'Send OTP & Continue'}
                </motion.button>

                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={() => {
                      setLoginStep('email');
                      setRegisterData({
                        firstName: '',
                        lastName: '',
                        phone: '',
                        company: '',
                        address: '',
                        city: '',
                        state: '',
                        zipCode: '',
                        country: '',
                        dateOfBirth: '',
                        gender: ''
                      });
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#FFD700',
                      cursor: 'pointer',
                      fontSize: isMobile ? '0.8rem' : '0.9rem',
                      textDecoration: 'underline',
                      marginTop: '1rem'
                    }}
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        <ToastContainer />
      </div>
    );
  }

  // Logged in state - Profile and Orders tabs
  return (
    <div style={containerStyles}>
      <div style={mainContainerStyles}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 165, 0, 0.2), rgba(255, 215, 0, 0.1))',
          padding: isMobile ? '1rem 0.5rem' : '0.5rem',
          textAlign: 'center',
          borderBottom: '1px solid rgba(255, 215, 0, 0.2)'
        }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 style={{ 
              color: '#FFD700', 
              marginBottom: '0.5rem',
              fontSize: isMobile ? '1.5rem' : '2rem',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              User Profile
            </h1>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.7)', 
              fontSize: isMobile ? '0.9rem' : '1.1rem' 
            }}>
              Welcome back, <strong style={{ color: '#FFD700' }}>{user?.first_name || user?.email}</strong>
              {firebaseUser && <span style={{ color: '#4285F4' }}> (Google)</span>}
            </p>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.5)', 
              fontSize: isMobile ? '0.8rem' : '0.9rem', 
              marginTop: '0.5rem' 
            }}>
              Email: {user?.email}
            </p>
            {needsProfileCompletion && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  background: 'rgba(255, 215, 0, 0.2)',
                  border: '1px solid rgba(255, 215, 0, 0.5)',
                  borderRadius: '8px',
                  padding: isMobile ? '8px 12px' : '10px 15px',
                  marginTop: '1rem',
                  display: 'inline-block',
                  maxWidth: '90%'
                }}
              >
                <p style={{ 
                  color: '#FFD700', 
                  margin: 0, 
                  fontSize: isMobile ? '0.8rem' : '0.9rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  flexWrap: 'wrap',
                  justifyContent: 'center'
                }}>
                  <FaExclamationTriangle /> 
                  Your profile is incomplete. 
                  <button 
                    onClick={() => setShowProfileCompletion(true)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#FFD700',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      marginLeft: '5px',
                      fontSize: 'inherit'
                    }}
                  >
                    Complete it now
                  </button>
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
          background: 'rgba(30, 30, 30, 0.5)'
        }}>
          {['profile', 'orders'].map((tab) => (
            <motion.button
              key={tab}
              whileHover={{ backgroundColor: 'rgba(255, 215, 0, 0.1)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: isMobile ? '1rem 0.5rem' : '1.2rem 2rem',
                background: 'transparent',
                border: 'none',
                color: activeTab === tab ? '#FFD700' : 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: 'bold',
                borderBottom: activeTab === tab ? '3px solid #FFD700' : '3px solid transparent',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isMobile ? '5px' : '10px'
              }}
            >
              {tab === 'profile' ? <><FaUser /> {isMobile ? 'Profile' : 'Profile'}</> : <><FaShoppingBag /> {isMobile ? 'Orders' : 'Order History'}</>}
            </motion.button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: contentPadding }}>
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                flexWrap: 'wrap',
                gap: '1rem',
                flexDirection: isMobile ? 'column' : 'row'
              }}>
                <h2 style={{ 
                  color: '#FFD700', 
                  margin: 0,
                  fontSize: isMobile ? '1.4rem' : '1.8rem',
                  textAlign: isMobile ? 'center' : 'left'
                }}>
                  Personal Information
                </h2>
                {!isEditing ? (
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 5px 15px rgba(255, 215, 0, 0.3)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsEditing(true)}
                    style={{
                      background: 'linear-gradient(135deg, #FFA500, #FFD700)',
                      color: 'black',
                      border: 'none',
                      padding: isMobile ? '10px 20px' : '12px 24px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontWeight: 'bold',
                      fontSize: isMobile ? '0.9rem' : '1rem',
                      boxShadow: '0 4px 12px rgba(255, 215, 0, 0.2)'
                    }}
                  >
                    <FaEdit /> {isMobile ? 'Edit' : 'Edit Profile'}
                  </motion.button>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    flexWrap: 'wrap',
                    justifyContent: isMobile ? 'center' : 'flex-end',
                    width: isMobile ? '100%' : 'auto'
                  }}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleUpdateProfile}
                      disabled={loading}
                      style={{
                        background: 'linear-gradient(135deg, #00b300, #00cc00)',
                        color: 'white',
                        border: 'none',
                        padding: isMobile ? '10px 20px' : '12px 24px',
                        borderRadius: '10px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 'bold',
                        opacity: loading ? 0.6 : 1,
                        fontSize: isMobile ? '0.9rem' : '1rem'
                      }}
                    >
                      <FaSave /> {loading ? 'Saving...' : (isMobile ? 'Save' : 'Save Changes')}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setIsEditing(false);
                        setProfileForm({
                          first_name: user.first_name || '',
                          last_name: user.last_name || '',
                          phone: user.phone || '',
                          company: user.company || '',
                          address: user.address || '',
                          city: user.city || '',
                          state: user.state || '',
                          zip_code: user.zip_code || '',
                          country: user.country || '',
                          date_of_birth: user.date_of_birth || '',
                          gender: user.gender || ''
                        });
                      }}
                      style={{
                        background: 'rgba(255, 0, 0, 0.3)',
                        color: 'white',
                        border: '1px solid rgba(255, 0, 0, 0.5)',
                        padding: isMobile ? '10px 20px' : '12px 24px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 'bold',
                        fontSize: isMobile ? '0.9rem' : '1rem'
                      }}
                    >
                      <FaTimes /> {isMobile ? 'Cancel' : 'Cancel'}
                    </motion.button>
                  </div>
                )}
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr' : 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: isMobile ? '1.5rem' : '2rem'
              }}>
                {/* Personal Info Card */}
                <motion.div
                  whileHover={{ y: isMobile ? 0 : -5 }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: isMobile ? '1.5rem 1rem' : '2rem',
                    borderRadius: '15px',
                    border: '1px solid rgba(255, 215, 0, 0.2)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <h3 style={{ 
                    color: '#FFD700', 
                    marginBottom: '1.5rem', 
                    borderBottom: '2px solid rgba(255, 215, 0, 0.3)', 
                    paddingBottom: '0.75rem',
                    fontSize: isMobile ? '1.2rem' : '1.4rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <FaUser /> Personal Details
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                      gap: '1rem' 
                    }}>
                      <div>
                        <label style={{ 
                          display: 'block', 
                          color: 'rgba(255, 255, 255, 0.7)', 
                          marginBottom: '0.5rem', 
                          fontSize: isMobile ? '0.85rem' : '0.95rem', 
                          fontWeight: '500' 
                        }}>
                          First Name
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profileForm.first_name}
                            onChange={(e) => setProfileForm({...profileForm, first_name: e.target.value})}
                            style={{
                              width: '100%',
                              padding: isMobile ? '10px 12px' : '12px 15px',
                              border: '2px solid rgba(255, 215, 0, 0.3)',
                              borderRadius: '8px',
                              background: 'rgba(255, 255, 255, 0.1)',
                              color: 'white',
                              fontSize: isMobile ? '0.9rem' : '1rem',
                              outline: 'none',
                              transition: 'all 0.3s ease'
                            }}
                          />
                        ) : (
                          <p style={{ 
                            color: 'white', 
                            margin: 0, 
                            padding: isMobile ? '10px 12px' : '12px 15px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            fontSize: isMobile ? '0.9rem' : '1rem'
                          }}>
                            {user?.first_name || 'Not set'}
                          </p>
                        )}
                      </div>
                      <div>
                        <label style={{ 
                          display: 'block', 
                          color: 'rgba(255, 255, 255, 0.7)', 
                          marginBottom: '0.5rem', 
                          fontSize: isMobile ? '0.85rem' : '0.95rem', 
                          fontWeight: '500' 
                        }}>
                          Last Name
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profileForm.last_name}
                            onChange={(e) => setProfileForm({...profileForm, last_name: e.target.value})}
                            style={{
                              width: '100%',
                              padding: isMobile ? '10px 12px' : '12px 15px',
                              border: '2px solid rgba(255, 215, 0, 0.3)',
                              borderRadius: '8px',
                              background: 'rgba(255, 255, 255, 0.1)',
                              color: 'white',
                              fontSize: isMobile ? '0.9rem' : '1rem',
                              outline: 'none',
                              transition: 'all 0.3s ease'
                            }}
                          />
                        ) : (
                          <p style={{ 
                            color: 'white', 
                            margin: 0, 
                            padding: isMobile ? '10px 12px' : '12px 15px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            fontSize: isMobile ? '0.9rem' : '1rem'
                          }}>
                            {user?.last_name || 'Not set'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label style={{ 
                        display: 'block', 
                        color: 'rgba(255, 255, 255, 0.7)', 
                        marginBottom: '0.5rem', 
                        fontSize: isMobile ? '0.85rem' : '0.95rem', 
                        fontWeight: '500' 
                      }}>
                        <FaEnvelope style={{ marginRight: '8px', color: '#FFD700' }} />
                        Email Address
                      </label>
                      <p style={{ 
                        color: 'white', 
                        margin: 0, 
                        padding: isMobile ? '10px 12px' : '12px 15px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        fontSize: isMobile ? '0.9rem' : '1rem'
                      }}>
                        {user?.email}
                      </p>
                    </div>

                    <div>
                      <label style={{ 
                        display: 'block', 
                        color: 'rgba(255, 255, 255, 0.7)', 
                        marginBottom: '0.5rem', 
                        fontSize: isMobile ? '0.85rem' : '0.95rem', 
                        fontWeight: '500' 
                      }}>
                        <FaPhone style={{ marginRight: '8px', color: '#FFD700' }} />
                        Phone Number
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                          placeholder="+358 44 123 4567"
                          style={{
                            width: '100%',
                            padding: isMobile ? '10px 12px' : '12px 15px',
                            border: '2px solid rgba(255, 215, 0, 0.3)',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            fontSize: isMobile ? '0.9rem' : '1rem',
                            outline: 'none',
                            transition: 'all 0.3s ease'
                          }}
                        />
                      ) : (
                        <p style={{ 
                          color: 'white', 
                          margin: 0, 
                          padding: isMobile ? '10px 12px' : '12px 15px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          fontSize: isMobile ? '0.9rem' : '1rem'
                        }}>
                          {user?.phone || 'Not set'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label style={{ 
                        display: 'block', 
                        color: 'rgba(255, 255, 255, 0.7)', 
                        marginBottom: '0.5rem', 
                        fontSize: isMobile ? '0.85rem' : '0.95rem', 
                        fontWeight: '500' 
                      }}>
                        <FaBuilding style={{ marginRight: '8px', color: '#FFD700' }} />
                        Company
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profileForm.company}
                          onChange={(e) => setProfileForm({...profileForm, company: e.target.value})}
                          style={{
                            width: '100%',
                            padding: isMobile ? '10px 12px' : '12px 15px',
                            border: '2px solid rgba(255, 215, 0, 0.3)',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            fontSize: isMobile ? '0.9rem' : '1rem',
                            outline: 'none',
                            transition: 'all 0.3s ease'
                          }}
                        />
                      ) : (
                        <p style={{ 
                          color: 'white', 
                          margin: 0, 
                          padding: isMobile ? '10px 12px' : '12px 15px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          fontSize: isMobile ? '0.9rem' : '1rem'
                        }}>
                          {user?.company || 'Not set'}
                        </p>
                      )}
                    </div>

                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                      gap: '1rem' 
                    }}>
                      <div>
                        <label style={{ 
                          display: 'block', 
                          color: 'rgba(255, 255, 255, 0.7)', 
                          marginBottom: '0.5rem', 
                          fontSize: isMobile ? '0.85rem' : '0.95rem', 
                          fontWeight: '500' 
                        }}>
                          <FaBirthdayCake style={{ marginRight: '8px', color: '#FFD700' }} />
                          Date of Birth
                        </label>
                        {isEditing ? (
                          <input
                            type="date"
                            value={profileForm.date_of_birth}
                            onChange={(e) => setProfileForm({...profileForm, date_of_birth: e.target.value})}
                            style={{
                              width: '100%',
                              padding: isMobile ? '10px 12px' : '12px 15px',
                              border: '2px solid rgba(255, 215, 0, 0.3)',
                              borderRadius: '8px',
                              background: 'rgba(255, 255, 255, 0.1)',
                              color: 'white',
                              fontSize: isMobile ? '0.9rem' : '1rem',
                              outline: 'none',
                              transition: 'all 0.3s ease'
                            }}
                          />
                        ) : (
                          <p style={{ 
                            color: 'white', 
                            margin: 0, 
                            padding: isMobile ? '10px 12px' : '12px 15px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            fontSize: isMobile ? '0.9rem' : '1rem'
                          }}>
                            {user?.date_of_birth
                              ? new Date(user.date_of_birth).toLocaleDateString('en-GB')
                              : 'Not set'}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label style={{ 
                          display: 'block', 
                          color: 'rgba(255, 255, 255, 0.7)', 
                          marginBottom: '0.5rem', 
                          fontSize: isMobile ? '0.85rem' : '0.95rem', 
                          fontWeight: '500' 
                        }}>
                          <FaVenusMars style={{ marginRight: '8px', color: '#FFD700' }} />
                          Gender
                        </label>
                        {isEditing ? (
                          <select
                            value={profileForm.gender}
                            onChange={(e) => setProfileForm({...profileForm, gender: e.target.value})}
                            style={{
                              width: '100%',
                              padding: isMobile ? '10px 12px' : '12px 15px',
                              border: '2px solid rgba(255, 215, 0, 0.3)',
                              borderRadius: '8px',
                              background: 'rgba(255, 255, 255, 0.1)',
                              color: 'white',
                              fontSize: isMobile ? '0.9rem' : '1rem',
                              outline: 'none'
                            }}
                          >
                            <option value="" style={{ color: 'gray' }}>Select Gender</option>
                            <option value="male" style={{ color: 'black' }}>Male</option>
                            <option value="female" style={{ color: 'black' }}>Female</option>
                            <option value="other" style={{ color: 'black' }}>Other</option>
                            <option value="prefer-not-to-say" style={{ color: 'black' }}>Prefer not to say</option>
                          </select>
                        ) : (
                          <p style={{ 
                            color: 'white', 
                            margin: 0, 
                            padding: isMobile ? '10px 12px' : '12px 15px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            fontSize: isMobile ? '0.9rem' : '1rem'
                          }}>
                            {user?.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'Not set'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Address Info Card */}
                <motion.div
                  whileHover={{ y: isMobile ? 0 : -5 }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: isMobile ? '1.5rem 1rem' : '2rem',
                    borderRadius: '15px',
                    border: '1px solid rgba(255, 215, 0, 0.2)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <h3 style={{ 
                    color: '#FFD700', 
                    marginBottom: '1.5rem', 
                    borderBottom: '2px solid rgba(255, 215, 0, 0.3)', 
                    paddingBottom: '0.75rem',
                    fontSize: isMobile ? '1.2rem' : '1.4rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <FaMapMarkerAlt /> Address Information
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        color: 'rgba(255, 255, 255, 0.7)', 
                        marginBottom: '0.5rem', 
                        fontSize: isMobile ? '0.85rem' : '0.95rem', 
                        fontWeight: '500' 
                      }}>
                        Street Address
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={profileForm.address}
                          onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                          placeholder="123 Main Street"
                          style={{
                            width: '100%',
                            padding: isMobile ? '10px 12px' : '12px 15px',
                            border: '2px solid rgba(255, 215, 0, 0.3)',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            fontSize: isMobile ? '0.9rem' : '1rem',
                            outline: 'none',
                            transition: 'all 0.3s ease'
                          }}
                        />
                      ) : (
                        <p style={{ 
                          color: 'white', 
                          margin: 0, 
                          padding: isMobile ? '10px 12px' : '12px 15px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          fontSize: isMobile ? '0.9rem' : '1rem'
                        }}>
                          {user?.address || 'Not set'}
                        </p>
                      )}
                    </div>

                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                      gap: '1rem' 
                    }}>
                      <div>
                        <label style={{ 
                          display: 'block', 
                          color: 'rgba(255, 255, 255, 0.7)', 
                          marginBottom: '0.5rem', 
                          fontSize: isMobile ? '0.85rem' : '0.95rem', 
                          fontWeight: '500' 
                        }}>
                          City
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profileForm.city}
                            onChange={(e) => setProfileForm({...profileForm, city: e.target.value})}
                            placeholder="Helsinki"
                            style={{
                              width: '100%',
                              padding: isMobile ? '10px 12px' : '12px 15px',
                              border: '2px solid rgba(255, 215, 0, 0.3)',
                              borderRadius: '8px',
                              background: 'rgba(255, 255, 255, 0.1)',
                              color: 'white',
                              fontSize: isMobile ? '0.9rem' : '1rem',
                              outline: 'none',
                              transition: 'all 0.3s ease'
                            }}
                          />
                        ) : (
                          <p style={{ 
                            color: 'white', 
                            margin: 0, 
                            padding: isMobile ? '10px 12px' : '12px 15px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            fontSize: isMobile ? '0.9rem' : '1rem'
                          }}>
                            {user?.city || 'Not set'}
                          </p>
                        )}
                      </div>
                      <div>
                        <label style={{ 
                          display: 'block', 
                          color: 'rgba(255, 255, 255, 0.7)', 
                          marginBottom: '0.5rem', 
                          fontSize: isMobile ? '0.85rem' : '0.95rem', 
                          fontWeight: '500' 
                        }}>
                          State/Region
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profileForm.state}
                            onChange={(e) => setProfileForm({...profileForm, state: e.target.value})}
                            placeholder="Uusimaa"
                            style={{
                              width: '100%',
                              padding: isMobile ? '10px 12px' : '12px 15px',
                              border: '2px solid rgba(255, 215, 0, 0.3)',
                              borderRadius: '8px',
                              background: 'rgba(255, 255, 255, 0.1)',
                              color: 'white',
                              fontSize: isMobile ? '0.9rem' : '1rem',
                              outline: 'none',
                              transition: 'all 0.3s ease'
                            }}
                          />
                        ) : (
                          <p style={{ 
                            color: 'white', 
                            margin: 0, 
                            padding: isMobile ? '10px 12px' : '12px 15px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            fontSize: isMobile ? '0.9rem' : '1rem'
                          }}>
                            {user?.state || 'Not set'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                      gap: '1rem' 
                    }}>
                      <div>
                        <label style={{ 
                          display: 'block', 
                          color: 'rgba(255, 255, 255, 0.7)', 
                          marginBottom: '0.5rem', 
                          fontSize: isMobile ? '0.85rem' : '0.95rem', 
                          fontWeight: '500' 
                        }}>
                          ZIP Code
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={profileForm.zip_code}
                            onChange={(e) => setProfileForm({...profileForm, zip_code: e.target.value})}
                            placeholder="00100"
                            style={{
                              width: '100%',
                              padding: isMobile ? '10px 12px' : '12px 15px',
                              border: '2px solid rgba(255, 215, 0, 0.3)',
                              borderRadius: '8px',
                              background: 'rgba(255, 255, 255, 0.1)',
                              color: 'white',
                              fontSize: isMobile ? '0.9rem' : '1rem',
                              outline: 'none',
                              transition: 'all 0.3s ease'
                            }}
                          />
                        ) : (
                          <p style={{ 
                            color: 'white', 
                            margin: 0, 
                            padding: isMobile ? '10px 12px' : '12px 15px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            fontSize: isMobile ? '0.9rem' : '1rem'
                          }}>
                            {user?.zip_code || 'Not set'}
                          </p>
                        )}
                      </div>
                      <div>
                        <label style={{ 
                          display: 'block', 
                          color: 'rgba(255, 255, 255, 0.7)', 
                          marginBottom: '0.5rem', 
                          fontSize: isMobile ? '0.85rem' : '0.95rem', 
                          fontWeight: '500' 
                        }}>
                          <FaGlobe style={{ marginRight: '8px', color: '#FFD700' }} />
                          Country
                        </label>
                        {isEditing ? (
                          <select
                            value={profileForm.country}
                            onChange={(e) => setProfileForm({...profileForm, country: e.target.value})}
                            style={{
                              width: '100%',
                              padding: isMobile ? '10px 12px' : '12px 15px',
                              border: '2px solid rgba(255, 215, 0, 0.3)',
                              borderRadius: '8px',
                              background: 'rgba(255, 255, 255, 0.1)',
                              color: 'white',
                              fontSize: isMobile ? '0.9rem' : '1rem',
                              outline: 'none'
                            }}
                          >
                            <option value="" style={{ color: 'white' }}>Select Country</option>
                            {countries.map((country) => (
                              <option key={country} value={country} style={{ color: 'black' }}>{country}</option>
                            ))}
                          </select>
                        ) : (
                          <p style={{ 
                            color: 'white', 
                            margin: 0, 
                            padding: isMobile ? '10px 12px' : '12px 15px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            fontSize: isMobile ? '0.9rem' : '1rem'
                          }}>
                            {user?.country || 'Not set'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Logout Button */}
              <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 5px 15px rgba(255, 0, 0, 0.3)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  style={{
                    background: 'rgba(255, 215, 0, 0.1)',
                    color: 'white',
                    border: 'none',
                    padding: isMobile ? '10px 25px' : '12px 30px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(255, 0, 0, 0.2)'
                  }}
                >
                  Logout
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 style={{ 
                color: '#FFD700', 
                marginBottom: '1.5rem',
                fontSize: isMobile ? '1.4rem' : '1.8rem',
                textAlign: 'center'
              }}>
                Order History
              </h2>
              
              {(orders.length > 0 ? orders : demoOrders).map((order, index) => {
                const statusStyle = getStatusColor(order.status);
                return (
                  <motion.div
                    key={order.order_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: isMobile ? '1rem' : '1.5rem',
                      borderRadius: '15px',
                      border: '1px solid rgba(255, 215, 0, 0.2)',
                      marginBottom: '1.5rem',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '1rem',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      flexDirection: isMobile ? 'column' : 'row'
                    }}>
                      <div style={{ flex: 1, minWidth: isMobile ? '100%' : '250px' }}>
                        <h3 style={{ 
                          color: '#FFD700', 
                          margin: '0 0 0.5rem 0', 
                          fontSize: isMobile ? '1.1rem' : '1.3rem' 
                        }}>
                          {order.product_details.product_name}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <p style={{ 
                            color: 'rgba(255, 255, 255, 0.7)', 
                            margin: 0, 
                            fontSize: isMobile ? '0.8rem' : '0.9rem' 
                          }}>
                            <strong>Order ID:</strong> {order.order_id}
                          </p>
                          <p style={{ 
                            color: 'rgba(255, 255, 255, 0.7)', 
                            margin: 0, 
                            fontSize: isMobile ? '0.8rem' : '0.9rem' 
                          }}>
                            <strong>Date:</strong> {new Date(order.order_date).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                          <p style={{ 
                            color: 'rgba(255, 255, 255, 0.7)', 
                            margin: 0, 
                            fontSize: isMobile ? '0.8rem' : '0.9rem' 
                          }}>
                            <strong>Quantity:</strong> {order.product_details.quantity}
                            {order.product_details.size && ` • Size: ${order.product_details.size}`}
                            {order.product_details.color && ` • Color: ${order.product_details.color}`}
                          </p>
                        </div>
                      </div>
                      <div style={{ 
                        textAlign: isMobile ? 'left' : 'right', 
                        minWidth: isMobile ? '100%' : '150px' 
                      }}>
                        <div style={{
                          background: statusStyle.background,
                          color: statusStyle.color,
                          padding: '6px 16px',
                          borderRadius: '20px',
                          fontSize: isMobile ? '0.7rem' : '0.8rem',
                          fontWeight: 'bold',
                          marginBottom: '0.75rem',
                          display: 'inline-block',
                          border: `1px solid ${statusStyle.color}20`,
                          width: isMobile ? 'auto' : 'fit-content'
                        }}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </div>
                        <p style={{ 
                          color: '#FFD700', 
                          fontSize: isMobile ? '1.2rem' : '1.4rem', 
                          fontWeight: 'bold', 
                          margin: 0 
                        }}>
                          ${order.total_amount}
                        </p>
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '1.5rem',
                      borderTop: '1px solid rgba(255, 215, 0, 0.2)',
                      paddingTop: '1.5rem'
                    }}>
                      <div>
                        <p style={{ 
                          color: 'rgba(255, 255, 255, 0.7)', 
                          margin: '0 0 0.5rem 0', 
                          fontSize: isMobile ? '0.8rem' : '0.9rem' 
                        }}>
                          <strong>Payment Method:</strong>
                        </p>
                        <p style={{ 
                          color: 'white', 
                          margin: 0, 
                          fontWeight: '500',
                          fontSize: isMobile ? '0.9rem' : '1rem'
                        }}>
                          {order.payment_method}
                        </p>
                        {order.tracking_number && (
                          <>
                            <p style={{ 
                              color: 'rgba(255, 255, 255, 0.7)', 
                              margin: '1rem 0 0.5rem 0', 
                              fontSize: isMobile ? '0.8rem' : '0.9rem' 
                            }}>
                              <strong>Tracking Number:</strong>
                            </p>
                            <p style={{ 
                              color: '#FFD700', 
                              margin: 0, 
                              fontWeight: '500', 
                              fontFamily: 'monospace',
                              fontSize: isMobile ? '0.9rem' : '1rem'
                            }}>
                              {order.tracking_number}
                            </p>
                          </>
                        )}
                      </div>
                      <div>
                        <p style={{ 
                          color: 'rgba(255, 255, 255, 0.7)', 
                          margin: '0 0 0.5rem 0', 
                          fontSize: isMobile ? '0.8rem' : '0.9rem' 
                        }}>
                          <strong>Shipping Address:</strong>
                        </p>
                        <p style={{ 
                          color: 'white', 
                          margin: 0, 
                          lineHeight: '1.4',
                          fontSize: isMobile ? '0.9rem' : '1rem'
                        }}>
                          {order.shipping_address.address}<br/>
                          {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip_code}<br/>
                          {order.shipping_address.country}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {(orders.length === 0 && demoOrders.length === 0) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    textAlign: 'center',
                    padding: isMobile ? '2rem 1rem' : '4rem 2rem',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}
                >
                  <FaShoppingBag size={isMobile ? 48 : 64} style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
                  <h3 style={{ 
                    color: 'rgba(255, 255, 255, 0.5)', 
                    marginBottom: '1rem', 
                    fontSize: isMobile ? '1.2rem' : '1.5rem' 
                  }}>
                    No Orders Yet
                  </h3>
                  <p style={{ 
                    fontSize: isMobile ? '0.9rem' : '1.1rem', 
                    marginBottom: '2rem' 
                  }}>
                    Your order history will appear here once you make a purchase.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.location.href = '/'}
                    style={{
                      background: 'linear-gradient(135deg, #FFA500, #FFD700)',
                      color: 'black',
                      border: 'none',
                      padding: isMobile ? '10px 25px' : '12px 30px',
                      borderRadius: '10px',
                      fontSize: isMobile ? '0.9rem' : '1rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(255, 215, 0, 0.2)'
                    }}
                  >
                    Start Shopping
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default UserProfile;