import React, { useEffect, useState } from 'react';
import { Helmet } from "react-helmet-async";
import { 
  FaExchangeAlt, 
  FaBoxOpen, 
  FaShippingFast, 
  FaMoneyBillWave,
  FaPhone,
  FaEnvelope,
  FaChevronRight
} from 'react-icons/fa';
import AOS from 'aos';
import 'aos/dist/aos.css';
import logo from '../assades/logo.jpg';

const Return = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSmallDevice, setIsSmallDevice] = useState(false);

  // Check screen size and handle responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallDevice(window.innerWidth < 768); // Mobile and tablet
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Simulate API loading with realistic behavior
  useEffect(() => {
    const simulateApiLoading = async () => {
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simulate potential API failure (10% chance for testing)
        if (Math.random() > 0.9) {
          throw new Error('Failed to load return policy data');
        }
        
        // Successfully loaded
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading return policy:', error);
        // Even if API fails, show content after timeout
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
      }
    };

    simulateApiLoading();
  }, []);

  // Initialize AOS
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: false,
      mirror: true
    });
  }, []);

  // Main container style - matching PolicyPage
  const pageStyle = {
    backgroundColor: '#000',
    color: '#fff',
    fontFamily: "'Montserrat', sans-serif",
    position: 'relative',
    overflow: 'hidden',
    minHeight: '100vh',
    padding: '0',
    marginBottom: '0.7rem',
  };

  // Background logo style - matching PolicyPage
  const backgroundLogoStyle = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 0,
    opacity: 0.14,
    width: '100%',
    maxWidth: '800px',
    height: '100%',
    backgroundImage: `url(${logo})`,
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center center',
    backgroundPositionY: '70px',
    pointerEvents: 'none'
  };

  // Section styles - matching PolicyPage
  const sectionStyle = {
    padding: '2rem 5%',
    position: 'relative',
    zIndex: 1,
  };

  const sectionTitleStyle = {
    fontSize: 'clamp(1.5rem, 5vw, 1.8rem)',
    marginBottom: '1.5rem',
    color: '#EECDA0',
    position: 'relative',
    display: 'inline-block',
  };

  const heroStyle = {
    height: '25vh',
    minHeight: '200px',
    width: '100%',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  };

  const heroContentStyle = {
    textAlign: 'center',
    maxWidth: '800px',
    padding: '1rem',
  };

  const heroTitleStyle = {
    fontSize: 'clamp(1.5rem, 6vw, 2.5rem)',
    fontWeight: '500',
    marginBottom: '0.8rem',
    color: '#fff',
    textShadow: '0 0 15px rgba(238, 205, 160, 0.5)',
  };

  const heroSubtitleStyle = {
    fontSize: 'clamp(1rem, 3vw, 1.2rem)',
    fontWeight: '300',
    color: '#EECDA0',
  };

  const cardStyle = {
    background: 'rgba(30, 30, 30, 0.7)',
    border: '1px solid rgba(238, 205, 160, 0.3)',
    borderRadius: '10px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    transition: 'all 0.3s ease',
  };

  const listItemStyle = {
    alignItems: 'center',
    marginBottom: '0.8rem',
    display: 'flex',
    fontSize: 'clamp(0.75rem, 3vw, 0.9rem)',
    gap: '0.2rem',
  };

  const iconStyle = {
    color: '#EECDA0',
    fontSize: 'clamp(0.8rem, 3vw, 0.9rem)',
    marginTop: '0.2rem',
    flexShrink: '0',
  };

  const contactCardStyle = {
    background: 'rgba(238, 205, 160, 0.1)',
    border: '1px solid #EECDA0',
    borderRadius: '10px',
    padding: '1.5rem',
    textAlign: 'center',
  };

  // Policy card specific styles
  const policyContainerStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    // gap: '1.5rem',
    position: 'relative',
    zIndex: 1,
  };

  const policyCardStyle = {
    background: 'rgba(30, 30, 30, 0.7)',
    border: '1px solid rgba(238, 205, 160, 0.3)',
    borderRadius: '8px',
    padding: '1.5rem',
    transition: 'all 0.3s ease',
    color: '#fff',
    marginBottom: '1rem',
  };

  const policyIconStyle = {
    fontSize: 'clamp(2rem, 5vw, 2.5rem)',
    color: '#EECDA0',
    marginBottom: '0.8rem',
  };

  const policyTitleStyle = {
    fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
    fontWeight: '600',
    marginBottom: '0.8rem',
    color: '#EECDA0',
  };

  const policyTextStyle = {
    lineHeight: '1.6',
    marginBottom: '1.2rem',
    color: '#ddd',
    fontSize: 'clamp(0.8rem, 3vw, 1rem)',
  };

  // Responsive loading component for small devices
  const ResponsiveLoading = () => {
    if (!isLoading || !isSmallDevice) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#050505',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: '90vw'
        }}>
          {/* Animated logo with enhanced effects */}
          <div style={{
            animation: 'pulse 2s infinite',
            marginBottom: '5vh',
            background: 'radial-gradient(circle, rgba(255,165,0,0.1) 0%, rgba(255,165,0,0) 70%)',
            borderRadius: '50%',
            padding: '20px',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '150%',
              height: '150%',
              border: '2px solid rgba(255, 215, 0, 0.2)',
              borderRadius: '50%',
              animation: 'ripple 2s infinite'
            }} />
            <img
              src={logo}
              alt="Loading Logo"
              style={{
                width: 'min(25vw, 120px)',
                height: 'auto',
                borderRadius: '10px',
                filter: `
                  drop-shadow(0 0 10px rgba(255, 168, 0, 0.6))
                  drop-shadow(0 0 20px rgba(255, 200, 0, 0.4))
                `
              }}
            />
          </div>

          {/* Loading text with typing effect */}
          <div style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: 'clamp(12px, 3vw, 16px)',
            fontFamily: '"Helvetica Neue", sans-serif',
            fontWeight: 300,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginBottom: '20px',
            animation: 'fadeInOut 1.5s infinite'
          }}>
            Loading Return Policy
          </div>

          {/* Enhanced spinner */}
          <div style={{
            position: 'relative',
            width: '40px',
            height: '40px'
          }}>
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              border: '3px solid rgba(255, 215, 0, 0.3)',
              borderTop: '3px solid #FFD700',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '60%',
              height: '60%',
              border: '2px solid rgba(255, 165, 0, 0.5)',
              borderBottom: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spinReverse 0.8s linear infinite'
            }} />
          </div>

          {/* Progress indicator */}
          <div style={{
            width: '120px',
            height: '2px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '1px',
            marginTop: '20px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #FFA500, #FFD700)',
              borderRadius: '1px',
              animation: 'loadingProgress 2s ease-in-out infinite'
            }} />
          </div>
        </div>

        {/* Add CSS animations */}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes spinReverse {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(-360deg); }
          }
          @keyframes pulse {
            0% { transform: scale(0.9); opacity: 0.7; }
            50% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(0.9); opacity: 0.7; }
          }
          @keyframes ripple {
            0% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
          }
          @keyframes fadeInOut {
            0%, 100% { opacity: 0.7; }
            50% { opacity: 1; }
          }
          @keyframes loadingProgress {
            0% { width: 0%; }
            50% { width: 70%; }
            100% { width: 100%; }
          }
        `}</style>
      </div>
    );
  };

  return (
    <div style={pageStyle}>
      {/* Responsive loading screen for small devices */}
      <ResponsiveLoading />

      {/* Background logo - same as PolicyPage */}
      <div style={backgroundLogoStyle} />

      <Helmet>
        <title>Yokebud Group Oy - Returns Policy</title>
        <meta name="description" content="Yokebud's returns and refunds policy for B2B clothing orders" />
      </Helmet>

      {/* Hero Section - matching PolicyPage */}
      <div style={heroStyle} data-aos="fade-down">
        <div style={heroContentStyle}>
          <h1 style={heroTitleStyle} data-aos="fade-up" data-aos-delay="100">Returns & Refunds Policy</h1>
          <p style={heroSubtitleStyle} data-aos="fade-up" data-aos-delay="200">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Main Content Section */}
      <div style={sectionStyle}>
        {/* Policy Cards Grid */}
        <div style={policyContainerStyle}>
          <div style={policyCardStyle} data-aos="fade-up">
            <div style={policyIconStyle}><FaExchangeAlt /></div>
            <h2 style={policyTitleStyle}>Return Process</h2>
            <p style={policyTextStyle}>Our straightforward return process ensures minimal disruption to your business operations.</p>
            <ul style={{ paddingLeft: '1rem' }}>
              <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Notify us within 14 days of receiving defective items</li>
              <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Include your order number and reason for return</li>
              <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>We'll provide return authorization and instructions</li>
              <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Ship items back using our preferred carriers</li>
            </ul>
          </div>

          <div style={policyCardStyle} data-aos="fade-up" data-aos-delay="100">
            <div style={policyIconStyle}><FaBoxOpen /></div>
            <h2 style={policyTitleStyle}>Eligibility</h2>
            <p style={policyTextStyle}>To be eligible for a return, your item must meet the following criteria:</p>
            <ul style={{ paddingLeft: '1rem' }}>
              <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Unwashed and unworn condition</li>
              <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Original tags and packaging intact</li>
              <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Manufacturing defects only (not fit or style changes)</li>
              <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Return initiated within 14 days of delivery</li>
            </ul>
          </div>

          <div style={policyCardStyle} data-aos="fade-up" data-aos-delay="150">
            <div style={policyIconStyle}><FaShippingFast /></div>
            <h2 style={policyTitleStyle}>Shipping & Fees</h2>
            <p style={policyTextStyle}>Important information about return shipping and associated costs:</p>
            <ul style={{ paddingLeft: '1rem' }}>
              <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Buyer responsible for return shipping costs</li>
              <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>15% restocking fee applies to all returns</li>
              <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Original shipping fees non-refundable</li>
              <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Duties and taxes not refundable</li>
            </ul>
          </div>

          <div style={policyCardStyle} data-aos="fade-up" data-aos-delay="200">
            <div style={policyIconStyle}><FaMoneyBillWave /></div>
            <h2 style={policyTitleStyle}>Refund Process</h2>
            <p style={policyTextStyle}>What to expect after we receive your return:</p>
            <ul style={{ paddingLeft: '1rem' }}>
              <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Inspection within 3-5 business days of receipt</li>
              <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Refund processed within 10 business days</li>
              <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Credit issued to original payment method</li>
              <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>B2B accounts may opt for credit memo</li>
            </ul>
          </div>
        </div>

        {/* Non-Returnable Items */}
        <div style={{...cardStyle, marginTop: '1.5rem'}} data-aos="fade-up">
          <h2 style={{...policyTitleStyle, textAlign: 'center'}}>Non-Returnable Items</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginTop: '1rem'
          }}>
            <div data-aos="fade-up" data-aos-delay="100">
              <ul style={{ paddingLeft: '1rem' }}>
                <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Final sale items</li>
                <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Custom orders</li>
              </ul>
            </div>
            <div data-aos="fade-up" data-aos-delay="150">
              <ul style={{ paddingLeft: '1rem' }}>
                <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Personalized items</li>
                <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Special order fabrics</li>
              </ul>
            </div>
            <div data-aos="fade-up" data-aos-delay="200">
              <ul style={{ paddingLeft: '1rem' }}>
                <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Items without original tags</li>
                <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Washed or worn items</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section - matching PolicyPage */}
      <div style={{...sectionStyle, borderBottom: '1px solid rgba(238, 205, 160, 0.1)'}}>
        <h2 style={sectionTitleStyle} data-aos="fade-right">Need Help With a Return?</h2>
        <div style={contactCardStyle} data-aos="zoom-in">
          <p style={{marginBottom: '1.2rem', fontSize: 'clamp(0.8rem, 3vw, 1rem)'}} data-aos="fade-up" data-aos-delay="100">
            Contact our wholesale support team for return authorization or any questions about our policy.
          </p>
          <p style={{fontWeight: '600', marginBottom: '1.5rem', fontSize: 'clamp(0.9rem, 3vw, 1.1rem)'}} data-aos="fade-up" data-aos-delay="150">
            Yokebud Returns Department
          </p>
          <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap'}}>
            <p style={{...listItemStyle, fontSize: 'clamp(0.8rem, 3vw, 0.9rem)'}} data-aos="fade-up" data-aos-delay="200">
              <span style={iconStyle}><FaEnvelope /></span>Email: returns@yokebud.com
            </p>
            <p style={{...listItemStyle, fontSize: 'clamp(0.8rem, 3vw, 0.9rem)'}} data-aos="fade-up" data-aos-delay="250">
              <span style={iconStyle}><FaPhone /></span>Phone: +358 440 328 124
            </p>
          </div>
          <p style={{marginTop: '1rem', fontSize: 'clamp(0.8rem, 3vw, 0.9rem)'}} data-aos="fade-up" data-aos-delay="300">
            Pukinmäenaukio 4, 00720 Helsinki, Finland
          </p>
        </div>
      </div>

      <div style={{
        padding: '1.5rem 5%',
        borderTop: '1px solid rgba(238, 205, 160, 0.1)',
        fontSize: 'clamp(0.75rem, 3vw, 0.9rem)',
        color: '#aaa',
        textAlign: 'center'
      }} data-aos="fade-up">
        <p>Note: This policy applies only to items purchased directly from Yokebud Group Oy. Retail purchases must be returned to the place of purchase.</p>
      </div>
    </div>
  );
};

export default Return;