import React, { useState, useEffect, useCallback } from 'react';
import { SOCKET_BASE } from '../utils/api';
import { apiFetch } from '../utils/api';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaSearch, FaUser, FaSignInAlt, FaShoppingCart, FaSignOutAlt, FaBars, FaTimes, FaEnvelope, FaUserCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import logo from '../assades/logo.jpg';
import { auth } from '../firebase';
import { useCart } from '../pages/context/CartContext';
import io from 'socket.io-client';

// Socket.IO client for real-time notifications with PERSISTENT COUNT
const socket = io(SOCKET_BASE, {
  transports: ['websocket', 'polling'],
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);
  // Temporarily suppress blinking after known automatic admin messages
  const [ignoreBlinkUntil, setIgnoreBlinkUntil] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  
  const { totalProductsCount = 0 } = useCart?.() || {};

  const isMobile = windowWidth < 850;

  // Get user ID from token
  const getUserIdFromToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  // Check for unread messages FROM DATABASE
  const checkUnreadMessages = useCallback(async (token) => {
    try {
      const response = await apiFetch('/api/user/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUnreadCount(data.totalUnread);
          setHasUnreadMessages(data.totalUnread > 0);
          
          // Start blinking if there are unread messages
          if (data.totalUnread > 0) {
            setIsBlinking(true);
          }
          
          console.log('Navbar: Initial unread count from database:', data.totalUnread);
        }
      }
    } catch (error) {
      console.error('Error checking unread messages:', error);
    }
  }, []);

  // Check if user is logged in and get PERSISTENT unread count
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (token) {
      apiFetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setCurrentUser(data.user);
          checkUnreadMessages(token);
          
          // Join user's personal room for notifications
          const userId = getUserIdFromToken(token);
          if (userId) {
            socket.emit('user_join', userId);
            socket.emit('join_user_room', userId);
            socket.emit('get_unread_count', { userId });
          }
        } else {
          localStorage.removeItem('userToken');
        }
      })
      .catch(error => {
        console.error('Profile fetch error:', error);
        localStorage.removeItem('userToken');
      });
    }
  }, [checkUnreadMessages]);

  // REAL-TIME SOCKET.IO NOTIFICATION LISTENERS WITH PERSISTENT COUNT
  useEffect(() => {
    console.log('Setting up Socket.IO notification listeners for Navbar with persistent count...');

    // Listen for unread count updates FROM DATABASE
    const handleUnreadCountUpdate = (data) => {
      console.log('Navbar: Unread count updated from database', data);
      
      setUnreadCount(data.totalUnread);
      setHasUnreadMessages(data.totalUnread > 0);
      
      if (data.totalUnread > 0) {
        // Suppress blinking if we're within the ignore window (e.g., auto welcome)
        if (Date.now() < ignoreBlinkUntil) {
          return;
        }
        setIsBlinking(true);
      } else {
        setIsBlinking(false);
      }
    };

    // Listen for new admin messages
    const handleNewAdminMessage = (data) => {
      console.log('Navbar: New admin message notification received', data);
      // Try to detect and ignore automatic welcome messages
      const msg = data?.message || data?.msg || {};
      const text = msg?.message || msg?.text || data?.messageText || '';
      const isAuto = data?.isAuto || msg?.is_auto || msg?.is_automatic || (
        typeof text === 'string' && text.startsWith('Thank you for your inquiry!')
      );

      if (isAuto) {
        // Do not show toast or trigger blinking for auto messages
        // Also create a short window to suppress blink from unread_count_update
        setIgnoreBlinkUntil(Date.now() + 5000);
        return;
      }

      // For manual admin messages, update state and show notification
      setUnreadCount(data.unreadCount);
      setHasUnreadMessages(data.unreadCount > 0);
      setIsBlinking(true);

      toast.info({
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    };

    // Socket event listeners
    socket.on('unread_count_update', handleUnreadCountUpdate);
    socket.on('new_admin_message', handleNewAdminMessage);

    // Cleanup
    return () => {
      socket.off('unread_count_update', handleUnreadCountUpdate);
      socket.off('new_admin_message', handleNewAdminMessage);
    };
  }, [ignoreBlinkUntil]);

  // Reset unread messages when message icon is clicked - WITH PERSISTENT COUNT
  const handleMessageClick = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (token) {
        const userId = getUserIdFromToken(token);
        
        // Mark all messages as read via API
        await apiFetch('/api/inquiries/mark-all-read', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Socket.IO emit messages read event
        socket.emit('mark_all_messages_read', { userId });
        
        // Stop blinking and reset notification
        setIsBlinking(false);
        setHasUnreadMessages(false);
        setUnreadCount(0);
      }
      
      navigate('/MessagesPage');
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Error marking messages as read:', error);
      toast.error('Failed to mark messages as read');
    }
  };

  // Optimized resize handler
  useEffect(() => {
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        setWindowWidth(window.innerWidth);
      }, 50);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim() === '') return;

    if (location.pathname !== '/') {
      navigate('/', { 
        state: { searchQuery },
        replace: true
      });
    } else {
      navigate('.', { 
        state: { searchQuery },
        replace: true
      });
    }
    
    setSearchQuery('');
    setIsMobileMenuOpen(false);
  };

  const handleLogoutConfirm = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (token) {
        await apiFetch('/api/user/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Socket disconnect
        socket.disconnect();
      }
      
      localStorage.removeItem('userToken');
      setCurrentUser(null);
      setHasUnreadMessages(false);
      setUnreadCount(0);
      setIsBlinking(false);
      setIsMenuOpen(false);
      setIsMobileMenuOpen(false);
      
      toast.success('Successfully logged out!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed. Please try again.', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const handleLogout = () => {
    toast.info(
      <div style={{ padding: '10px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Confirm Logout</h4>
        <p style={{ margin: '0 0 15px 0', color: '#666' }}>Are you sure you want to logout?</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => {
              toast.dismiss();
              handleLogoutConfirm();
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#FFD700',
              color: '#111',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.8rem'
            }}
          >
            Yes
          </button>
          <button
            onClick={() => toast.dismiss()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            No
          </button>
        </div>
      </div>,
      {
        position: "top-center",
        autoClose: false,
        hideProgressBar: true,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        closeButton: false,
        style: {
          background: 'white',
          color: 'black'
        }
      }
    );
  };

  const handleCartClick = () => {
    navigate('/cart');
    setIsMobileMenuOpen(false);
  };

  const handleProfileClick = () => {
    if (currentUser) {
      navigate('/userprofile');
    } else {
      navigate('/userprofile');
    }
    setIsMobileMenuOpen(false);
    setIsMenuOpen(false);
  };

  const handleNavLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const mobileMenuVariants = {
    open: {
      opacity: 1,
      height: "auto",
      transition: {
        opacity: { duration: 0.2, ease: "easeOut" },
        height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
      }
    },
    closed: {
      opacity: 0,
      height: 0,
      transition: {
        opacity: { duration: 0.15, ease: "easeIn" },
        height: { duration: 0.25, ease: [0.4, 0, 0.2, 1] }
      }
    }
  };

  const navItemVariants = {
    open: {
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.2,
        ease: "easeOut"
      }
    },
    closed: { 
      opacity: 0, 
      y: -8,
      transition: {
        duration: 0.15
      }
    }
  };

  // Enhanced Notification Dot with Blink/Glow Effect - Cart Style
  const MessageNotificationDot = () => (
    <motion.div
      style={{
        position: 'absolute',
        top: '-5px',
        right: '-5px',
        background: '#e74c3c',
        borderRadius: '50%',
        width: isMobile ? '18px' : '20px',
        height: isMobile ? '18px' : '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isBlinking 
          ? '0 0 15px rgba(231, 76, 60, 1)' 
          : '0 0 8px rgba(231, 76, 60, 0.8)',
        border: '2px solid #1a1a1a',
        zIndex: 10
      }}
      animate={{
        scale: isBlinking ? [1, 1.2, 1] : 1,
        opacity: isBlinking ? [0.7, 1, 0.7] : 1,
      }}
      transition={{
        duration: 0.8,
        repeat: isBlinking ? Infinity : 0,
        ease: "easeInOut"
      }}
    >
      <span style={{
        color: 'white',
        fontSize: isMobile ? '10px' : '11px',
        fontWeight: 'bold',
        lineHeight: 1
      }}>
        {unreadCount > 9 ? '9+' : unreadCount}
      </span>
    </motion.div>
  );

  return (
    <div style={{
      width: '100%',
      background: 'linear-gradient(to right, #111111 0%, #1e1e1e 50%, #111111 100%)',
      position: 'sticky',
      top: 0,
      zIndex: 4000
    }}>
      {/* Main Navbar Container */}
      <div style={{
        width: '100%',
        margin: '0 auto',
        padding: isMobile ? '0.1rem 0' : '0vh 0',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: 'row',
        gap: '0'
      }}>
        {/* Left Section - Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '15px' : '40px',
          marginLeft: isMobile ? '3vw' : '1.5vw'
        }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
          > 
            <Link to="/">
              <img
                src={logo}
                alt="Yokebud Group Oy Logo" 
                style={{
                  height: isMobile ? '40px' : '60px',
                  filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.3))',
                  transition: 'all 0.5s ease',
                  marginLeft: isMobile ? '5px' : '10px',
                }}
              />
            </Link>
          </motion.div>
          
          {/* Icons Container - Show only on Desktop */}
          {!isMobile && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px'
            }}>
              {/* User Profile Button */}
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleProfileClick}
                style={{
                  position: 'relative',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                <FaUserCircle style={{
                  color: 'white',
                  fontSize: '1.2rem',
                  transition: 'all 0.3s ease'
                }} />
              </motion.div>

              {/* Cart Button - SHOW ONLY ON DESKTOP */}
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCartClick}
                style={{
                  position: 'relative',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                <FaShoppingCart style={{
                  color: 'white',
                  fontSize: '1.2rem',
                  transition: 'all 0.3s ease'
                }} />
                {totalProductsCount > 0 && (
                  <motion.div
                    style={{
                      position: 'absolute',
                      top: '-5px',
                      right: '-5px',
                      background: '#FFD700',
                      color: '#111',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      boxShadow: '0 0 5px rgba(255, 215, 0, 0.8)',
                      border: '2px solid #1a1a1a'
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  >
                    {totalProductsCount > 9 ? '9+' : totalProductsCount}
                  </motion.div>
                )}
              </motion.div>

              {/* Message Button with PERSISTENT REAL-TIME BLINKING NOTIFICATION - CART STYLE */}
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleMessageClick}
                style={{
                  position: 'relative',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: hasUnreadMessages 
                    ? 'rgba(231, 76, 60, 0.2)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  border: hasUnreadMessages 
                    ? '1px solid rgba(231, 76, 60, 0.5)' 
                    : '1px solid rgba(255, 215, 0, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                <FaEnvelope style={{
                  color: hasUnreadMessages ? '#e74c3c' : 'white',
                  fontSize: '1.2rem',
                  transition: 'all 0.3s ease'
                }} />
                
                {/* PERSISTENT REAL-TIME BLINKING NOTIFICATION DOT - CART STYLE */}
                {hasUnreadMessages && <MessageNotificationDot />}
              </motion.div>
            </div>
          )}

          {/* Mobile: Show User Profile, Message Icons - BUT HIDE CART ICON */}
          {isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleProfileClick}
                style={{
                  position: 'relative',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                <FaUserCircle style={{
                  color: 'white',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease'
                }} />
              </motion.div>

              {/* Mobile Message Button with PERSISTENT REAL-TIME BLINKING NOTIFICATION */}
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleMessageClick}
                style={{
                  position: 'relative',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: hasUnreadMessages 
                    ? 'rgba(231, 76, 60, 0.2)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  border: hasUnreadMessages 
                    ? '1px solid rgba(231, 76, 60, 0.5)' 
                    : '1px solid rgba(255, 215, 0, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                <FaEnvelope style={{
                  color: hasUnreadMessages ? '#e74c3c' : 'white',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease'
                }} />
                
                {/* PERSISTENT REAL-TIME BLINKING NOTIFICATION DOT FOR MOBILE - CART STYLE */}
                {hasUnreadMessages && <MessageNotificationDot />}
              </motion.div>
            </div>
          )}
        </div>
        
        {/* Right Section - Actions */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '8px' : '1.8rem',
          marginRight: isMobile ? '3vw' : '1.5vw'
        }}>
          {/* Middle Section - Navigation (Desktop Only) */}
          {!isMobile && (
            <nav style={{ width: 'fit-content' }}>
              <ul style={{
                display: 'flex',
                listStyle: 'none',
                margin: '0',
                padding: '0',
                marginLeft: '8vw',
                gap: '2rem',
                justifyContent: 'flex-end'
              }}>
                {['/', '/about', '/clothing', '/other-products', '/contact'].map((path) => (
                  <motion.li
                    key={path}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ position: 'relative' }}
                  >
                    <Link 
                      to={path} 
                      style={{ 
                        textDecoration: 'none',
                        padding: '8px 5px',
                        display: 'block'
                      }}
                    >
                      <motion.div
                        style={{
                          color: location.pathname === path ? '#FFD700' : 'white',
                          fontWeight: '500',
                          textTransform: 'uppercase',
                          letterSpacing: '1.5px',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease, text-shadow 0.3s ease',
                          whiteSpace: 'nowrap',
                          borderRadius: '8px',
                          background: 'transparent'
                        }}
                        whileHover={{
                          color: '#FFD700',
                          textShadow: '0px 0px 5px rgba(255, 215, 0, 0.5)',
                          background: 'transparent'
                        }}
                      >
                        {path === '/' ? 'Home' : 
                         path === '/about' ? 'About Us' : 
                         path === '/clothing' ? 'Clothings' : 
                         path === '/other-products' ? 'Other Products' : 
                         'Contact'}
                      </motion.div>
                    </Link>
                    
                    {(location.pathname === path) && (
                      <motion.div 
                        style={{
                          position: 'absolute',
                          bottom: '0',
                          left: '0',
                          width: '100%',
                          height: '2px',
                          background: '#FFD700',
                          borderRadius: '50px',
                          boxShadow: '0 0 8px rgba(255, 215, 0, 0.6)'
                        }}
                        layoutId="underline"
                      />
                    )}
                  </motion.li>
                ))}
              </ul>
            </nav>
          )}

          {/* Search Bar (Mobile) */}
          {isMobile && (
            <motion.form 
              onSubmit={handleSearch}
              style={{
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
                width: isMobile ? '45vw' : '65vw',
                marginRight: '8px'
              }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <motion.input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 25px 6px 10px',
                  border: '1px solid rgba(255, 215, 0, 0.4)',
                  borderRadius: '20px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(6px)',
                  color: 'white',
                  fontFamily: '"Montserrat", sans-serif',
                  fontSize: '0.75rem',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                }}
                whileFocus={{
                  border: '1px solid #FFD700',
                  boxShadow: '0 0 10px rgba(255, 215, 0, 0.3)'
                }}
              />
              <button 
                type="submit"
                style={{
                  position: 'absolute',
                  right: '6px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <FaSearch 
                  size={10} 
                  color="#FFD700"
                />
              </button>
            </motion.form>
          )}

          {/* Hamburger Menu (Mobile Only) */}
          {isMobile && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait">
                {isMobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FaTimes size={18} style={{ color: '#FFD700' }} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FaBars size={18} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          )}

          {/* Desktop Search (Hidden on Mobile) */}
          {!isMobile && (
            <motion.form 
              onSubmit={handleSearch}
              style={{
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
                width: '250px'
              }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <motion.input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 15px',
                  border: '1px solid rgba(255, 215, 0, 0.4)',
                  borderRadius: '25px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(6px)',
                  color: 'white',
                  fontFamily: '"Montserrat", sans-serif',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 0 12px rgba(255, 215, 0, 0.15)',
                }}
                whileFocus={{
                  border: '1px solid #FFD700',
                  boxShadow: '0 0 20px rgba(255, 215, 0, 0.4)'
                }}
              />
              <button 
                type="submit"
                style={{
                  position: 'absolute',
                  right: '15px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <FaSearch 
                  size={16} 
                  color="#FFD700"
                />
              </button>
            </motion.form>
          )}
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isMobile && isMobileMenuOpen && (
          <motion.div 
            initial="closed"
            animate="open"
            exit="closed"
            variants={mobileMenuVariants}
            style={{
              width: '100%',
              background: 'rgba(17, 17, 17, 0.98)',
              borderTop: '1px solid rgba(255, 215, 0, 0.2)',
              padding: '15px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '15px',
              overflow: 'hidden',
            }}
          >
            {/* Mobile Navigation Links */}
            <nav style={{ width: '100%' }}>
              <ul style={{
                display: 'flex',
                flexDirection: 'column',
                listStyle: 'none',
                margin: '0',
                padding: '0',
                alignItems: 'center',
                gap: '10px'
              }}>
                {['/', '/about', '/clothing', '/other-products', '/contact'].map((path, index) => (
                  <motion.li
                    key={path}
                    variants={navItemVariants}
                    custom={index}
                    initial="closed"
                    animate="open"
                    exit="closed"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ 
                      width: '100%',
                      textAlign: 'center',
                      position: 'relative'
                    }}
                  >
                    <Link 
                      to={path} 
                      onClick={handleNavLinkClick}
                      style={{ 
                        textDecoration: 'none',
                        padding: '10px 0',
                        display: 'block',
                        width: '100%'
                      }}
                    >
                      <motion.div
                        style={{
                          color: location.pathname === path ? '#FFD700' : 'white',
                          fontWeight: '500',
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          whiteSpace: 'nowrap',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          margin: '0 15px'
                        }}
                        whileHover={{
                          color: '#FFD700',
                          textShadow: '0px 0px 5px rgba(255, 215, 0, 0.5)',
                          background: 'rgba(255, 215, 0, 0.1)'
                        }}
                      >
                        {path === '/' ? 'Home' : 
                         path === '/about' ? 'About Us' : 
                         path === '/clothing' ? 'Clothings' : 
                         path === '/other-products' ? 'Other Products' : 
                         'Contact'}
                      </motion.div>
                    </Link>
                    
                    {(location.pathname === path) && (
                      <motion.div 
                        style={{
                          position: 'absolute',
                          bottom: '0',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '50%',
                          height: '2px',
                          background: '#FFD700',
                          borderRadius: '50px',
                          boxShadow: '0 0 8px rgba(255, 215, 0, 0.6)'
                        }}
                        layoutId="mobile-underline"
                      />
                    )}
                  </motion.li>
                ))}
              </ul>
            </nav>

            {/* Mobile: Add Cart Option in Menu */}
            <motion.div
              variants={navItemVariants}
              style={{
                width: '80%',
                maxWidth: '400px',
                borderRadius: '8px',
                padding: '12px',
                // border: '1px solid rgba(255, 215, 0, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
    
              {/* Mobile Message Button with PERSISTENT REAL-TIME NOTIFICATION */}

              
              {/* Mobile Auth Buttons */}
              {currentUser ? (
                <motion.div
                  variants={navItemVariants}
                  style={{
                    width: '80%',
                    margin: '0 auto',
                    maxWidth: '400px',
                    background: 'rgba(30, 30, 30, 0.7)',
                    borderRadius: '8px',
                    paddingTop: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px'
                  }}
                >
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(255, 215, 0, 0.1)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      handleProfileClick();
                      setIsMobileMenuOpen(false);
                    }}
                    style={{
                      background: 'rgba(255, 215, 0, 0.1)',
                      border: '1px solid rgba(255, 215, 0, 0.3)',
                      color: 'white',
                      padding: '8px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '0.8rem',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <FaUserCircle /> Profile
                  </motion.button>
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(255, 215, 0, 0.1)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    style={{
                      background: 'rgba(255, 215, 0, 0.1)',
                      border: '1px solid rgba(255, 215, 0, 0.3)',
                      color: 'white',
                      padding: '8px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '0.8rem',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <FaSignOutAlt /> Logout
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  variants={navItemVariants}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    padding: '8px 0'
                  }}
                >
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(255, 215, 0, 0.1)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleProfileClick}
                    style={{
                      background: 'rgba(255, 215, 0, 0.1)',
                      border: '1px solid rgba(255, 215, 0, 0.3)',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '5px',
                      margin: '0 auto',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '0.8rem',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <FaSignInAlt /> Login/Signup
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>
        {`
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
          .blinking-dot {
            animation: blink 1s infinite;
          }
        `}
      </style>
    </div>
  );
};

export default Navbar;