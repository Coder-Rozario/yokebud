import { useState, useEffect } from 'react';
import { FaFacebook, FaWhatsapp, FaYoutube, FaInstagram, FaChevronDown, FaTiktok } from 'react-icons/fa';
import { SiVisa, SiMastercard, SiAmericanexpress, SiStripe } from "react-icons/si";
import { toast } from 'react-toastify';
import { auth } from '../firebase';
import '../pages/styles/Footer.scss';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [activeMenu, setActiveMenu] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check for logged-in user and set email
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      if (user && user.email) {
        setEmail(user.email);
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Check subscription status when component mounts
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      // First check if user is logged in
      const user = auth.currentUser;
      const userEmail = user ? user.email : localStorage.getItem('userEmail');
      
      if (userEmail) {
        try {
          const response = await fetch(`/api/subscription-status?email=${encodeURIComponent(userEmail)}`);
          if (response.ok) {
            const data = await response.json();
            setIsSubscribed(data.isSubscribed);
          }
        } catch (error) {
          console.error('Error checking subscription status:', error);
        }
      }
    };

    checkSubscriptionStatus();
  }, []);

  // Debounce function to limit rapid submissions
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  // Optimized subscribe handler with debounce
  const handleSubscribe = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter a valid email address.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    // Prevent multiple submissions
    if (isLoading) return;
    
    setIsLoading(true);
    
    // Show immediate feedback
    toast.info('Processing subscription...', { autoClose: 2000 });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      // Add a small delay to ensure the backend has time to process
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Successfully subscribed to newsletter!');
        setEmail('');
        setIsSubscribed(true);
        // Store email for future reference
        localStorage.setItem('userEmail', email);
        
        // Force a small delay to ensure backend processing completes
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        toast.error(data.message || 'Subscription failed. Please try again.');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      if (error.name === 'AbortError') {
        toast.error('Request timed out. Please try again later.');
      } else {
        toast.error('An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMenu = (index) => {
    setActiveMenu(activeMenu === index ? null : index);
  };

  return (
    <footer className={`footer ${isScrolled ? 'scrolled' : ''}`}>
      <div className="footer-wave">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" fill="var(--footer-background)"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" fill="var(--footer-background)"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="var(--footer-background)"></path>
        </svg>
      </div>

      <section className="footer-content">
        <div className="footer-grid">
          <div className={`footer-column ${activeMenu === 0 ? 'active' : ''}`}>
            <h3 onClick={() => toggleMenu(0)}>
              Contact us
              <FaChevronDown className="dropdown-icon" />
            </h3>
            <ul>
              <li>
                <div className="contact-item">
                  <span className="contact-label">Call us 24/7 (Whatsapp)</span>
                  <a href="https://wa.me/358440328124" className="contact-value">+358 440 328 124</a>
                </div>
                <div className="contact-item">
                  <span className="contact-label">Email:</span>
                  <a href="mailto:yokebudvintage@gmail.com" className="contact-value">yokebud@gmail.com</a>
                </div>
                <div 
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    marginBottom: '1rem'
                  }} 
                  className="contact-item"
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span 
                      className="contact-label" 
                      style={{
                        fontWeight: '600',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Address:
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div>
                        <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Finland:</strong>
                        <span className="contact-value">Pukinmäenaukio 4, 00720 Helsinki, Finland</span>
                      </div>
                      <div>
                        <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Bangladesh:</strong>
                        <span className="contact-value">Nayonpur, Shahebpara, Rajendropur Cantonment Gazipur 1742, Bangladesh</span>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <div className={`footer-column ${activeMenu === 1 ? 'active' : ''}`}>
            <h3 onClick={() => toggleMenu(1)}>
              Quick Links
              <FaChevronDown className="dropdown-icon" />
            </h3>
            <ul>
              <li><a href="/" className="footer-link">Home</a></li>
              <li><a href="/about" className="footer-link">About Us</a></li>
              <li><a href="/clothing" className="footer-link">Clothings</a></li>
              <li><a href="/other-products" className="footer-link">Other's Products</a></li>
              <li><a href="/contact" className="footer-link">Contact</a></li>
            </ul>
          </div>

          <div className={`footer-column ${activeMenu === 2 ? 'active' : ''}`}>
            <h3 onClick={() => toggleMenu(2)}>
              Company Policy
              <FaChevronDown className="dropdown-icon" />
            </h3>
            <ul>
              <li><a href="/policy" className="footer-link">Policy</a></li>
              <li><a href="/return" className="footer-link">Return</a></li>
              <li><a href="/shipping" className="footer-link">Shipping</a></li>
            </ul>
          </div>

          <div className={`footer-column ${activeMenu === 3 ? 'active' : ''}`}>
            <h3 onClick={() => toggleMenu(3)}>
              Newsletter
              <FaChevronDown className="dropdown-icon" />
            </h3>
            <ul>
              <li>
                <div className="newsletter-form">
                  <p>Subscribe to our newsletter for weekly product updates and wholesale opportunities</p>
                  {isSubscribed ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '10px',
                      background: 'rgba(46, 204, 113, 0.1)',
                      border: '1px solid #2ecc71',
                      borderRadius: '8px',
                      color: '#2ecc71'
                    }}>
                      ✓ You're subscribed to our newsletter!
                    </div>
                  ) : (
                    <form onSubmit={handleSubscribe} className="input-group">
                      <input 
                        type="email" 
                        placeholder="Your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="email-input"
                        required
                        disabled={isLoading}
                      />
                      <button 
                        type="submit" 
                        className="subscribe-btn"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Subscribing...' : 'Subscribe'}
                      </button>
                    </form>
                  )}
                  <p style={{ fontSize: '12px', color: '#95a5a6', marginTop: '8px' }}>
                    Weekly updates • New products • Exclusive offers
                  </p>
                </div>
                <div className="social-links">
                  <a href="https://www.facebook.com/yokebud?mibextid=ZbWKwL" target="_blank" rel="noopener noreferrer" className="social-icon">
                    <FaFacebook />
                  </a>
                  <a href="https://wa.me/+358440328124" target="_blank" rel="noopener noreferrer" className="social-icon">
                    <FaWhatsapp />
                  </a>
                  <a href="https://www.youtube.com/@yokebud" target="_blank" rel="noopener noreferrer" className="social-icon">
                    <FaYoutube />
                  </a>
                  <a href="https://www.instagram.com/yokebud/" target="_blank" rel="noopener noreferrer" className="social-icon">
                    <FaInstagram />
                  </a>
                  <a href="https://www.tiktok.com/@yokebud" target="_blank" rel="noopener noreferrer" className="social-icon">
                    <FaTiktok />
                  </a>
                </div>
 <div className="payment-methods">
                  <div className="payment-title">We accept:</div>
                  <div className="payment-icons">
                    <SiVisa className="payment-icon" title="Visa" />
                    <SiMastercard className="payment-icon" title="Mastercard" />
                    <SiAmericanexpress className="payment-icon" title="American Express" />
                    <SiStripe className="payment-icon" title="Secured by Stripe" />
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Yokebud Group Oy. All rights reserved</p>
      </div>
    </footer>
  );
};

export default Footer;