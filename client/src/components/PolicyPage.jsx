import React, { useEffect } from 'react';
import { Helmet } from "react-helmet-async";
import { FaChevronRight, FaShieldAlt, FaFileContract, FaExchangeAlt, FaLock, FaEnvelope, FaPhone } from 'react-icons/fa';
import AOS from 'aos';
import 'aos/dist/aos.css';
import logo from '../assades/logo.jpg';

const PolicyPage = () => {
  // Initialize AOS
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: false,
      mirror: true
    });
  }, []);

  // Main container style with responsive adjustments
  const pageStyle = {
    backgroundColor: '#000',
    color: '#fff',
    fontFamily: "'Montserrat', sans-serif",
    position: 'relative',
    overflowX: 'hidden',
    minHeight: '100vh',
    padding: '0',
  };

  // Background logo style
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

  // Section styles with responsive adjustments
  const sectionStyle = {
    padding: 'clamp(1.5rem, 5vw, 3rem) clamp(1rem, 5vw, 5%)',
    position: 'relative',
    zIndex: 1,
  };

  const sectionTitleStyle = {
    fontSize: 'clamp(1.3rem, 4vw, 1.5rem)',
    marginBottom: 'clamp(1rem, 3vw, 2rem)',
    color: '#EECDA0',
    position: 'relative',
    display: 'inline-block',
  };

  const sectionTitleAfterStyle = {
    content: '""',
    position: 'absolute',
    bottom: '-10px',
    left: '0',
    width: '100%',
    height: '2px',
    background: 'linear-gradient(90deg, #EECDA0, transparent)',
  };

  const heroStyle = {
    height: 'clamp(25vh, 30vw, 30vh)',
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
    padding: 'clamp(1rem, 3vw, 2rem)',
  };

  const heroTitleStyle = {
    fontSize: 'clamp(1.5rem, 6vw, 2.5rem)',
    fontWeight: '500',
    marginBottom: 'clamp(0.8rem, 2vw, 1rem)',
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
    padding: 'clamp(1.2rem, 3vw, 2rem)',
    marginBottom: 'clamp(1.2rem, 3vw, 2rem)',
    transition: 'all 0.3s ease',
  };

  const listItemStyle = {
    marginBottom: 'clamp(0.8rem, 2vw, 1rem)',
    display: 'flex',
    fontSize: 'clamp(0.75rem, 3vw, 0.9rem)',
    alignItems: 'center',
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
    padding: 'clamp(1.2rem, 3vw, 2rem)',
    textAlign: 'center',
  };

  return (
    <div style={pageStyle}>
      {/* Background logo */}
      <div style={backgroundLogoStyle} />

      <Helmet>
        <title>Yokebud Group Oy - Policies</title>
        <meta name="description" content="Yokebud B2B Clothing E-commerce policies including privacy, terms, and returns" />
      </Helmet>

      {/* Hero Section */}
      <div style={heroStyle} data-aos="fade-down">
        <div style={heroContentStyle}>
          <h1 style={heroTitleStyle} data-aos="fade-up" data-aos-delay="100">Yokebud Group Oy Policies</h1>
          <p style={heroSubtitleStyle} data-aos="fade-up" data-aos-delay="200">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div style={{...sectionStyle, borderBottom: '1px solid rgba(238, 205, 160, 0.1)'}}>
        <h2 style={sectionTitleStyle} data-aos="fade-right">Privacy Policy</h2>
        <div style={cardStyle} data-aos="fade-up">
          <p style={{fontSize: 'clamp(0.8rem, 3vw, 1rem)'}}>At Yokebud, we are committed to protecting the privacy of our B2B clients. This policy outlines how we collect, use, and safeguard your business information.</p>
          
          <h3 style={{...sectionTitleStyle, fontSize: 'clamp(1.1rem, 3vw, 1.3rem)', margin: 'clamp(1rem, 2vw, 1.5rem) 0 clamp(0.8rem, 2vw, 1rem)'}} data-aos="fade-right" data-aos-delay="100">Information We Collect:</h3>
          <ul style={{paddingLeft: '1rem'}} data-aos="fade-up" data-aos-delay="150">
            <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Business contact information (name, email, phone number)</li>
            <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Company details (name, address, tax ID)</li>
            <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Order history and transaction records</li>
            <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Website usage data through cookies</li>
          </ul>

          <h3 style={{...sectionTitleStyle, fontSize: 'clamp(1.1rem, 3vw, 1.3rem)', margin: 'clamp(1rem, 2vw, 1.5rem) 0 clamp(0.8rem, 2vw, 1rem)'}} data-aos="fade-right" data-aos-delay="200">How We Use Your Information:</h3>
          <ul style={{paddingLeft: '1rem'}} data-aos="fade-up" data-aos-delay="250">
            <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Process and fulfill wholesale orders</li>
            <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Provide customer support</li>
            <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Improve our products and services</li>
            <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Communicate business offers and updates</li>
          </ul>
        </div>
      </div>

      <div style={{...sectionStyle, borderBottom: '1px solid rgba(238, 205, 160, 0.1)'}}>
        <h2 style={sectionTitleStyle} data-aos="fade-right">Terms of Service</h2>
        <div style={cardStyle} data-aos="fade-up">
          <div style={{marginBottom: 'clamp(1.2rem, 3vw, 2rem)'}} data-aos="fade-up" data-aos-delay="100">
            <h3 style={{...sectionTitleStyle, fontSize: 'clamp(1.1rem, 3vw, 1.3rem)', margin: '0 0 clamp(0.8rem, 2vw, 1rem)'}}>Wholesale Account Requirements:</h3>
            <ul style={{paddingLeft: '1rem'}}>
              <li style={listItemStyle}><span style={iconStyle}><FaFileContract /></span>Valid business license or tax ID required</li>
              <li style={listItemStyle}><span style={iconStyle}><FaFileContract /></span>Minimum order quantities apply</li>
              <li style={listItemStyle}><span style={iconStyle}><FaFileContract /></span>Account approval at Yokebud's discretion</li>
            </ul>
          </div>

          <div style={{marginBottom: 'clamp(1.2rem, 3vw, 2rem)'}} data-aos="fade-up" data-aos-delay="150">
            <h3 style={{...sectionTitleStyle, fontSize: 'clamp(1.1rem, 3vw, 1.3rem)', margin: '0 0 clamp(0.8rem, 2vw, 1rem)'}}>Ordering & Payment:</h3>
            <ul style={{paddingLeft: '1rem'}}>
              <li style={listItemStyle}><span style={iconStyle}><FaFileContract /></span>Net 30 payment terms for approved accounts</li>
              <li style={listItemStyle}><span style={iconStyle}><FaFileContract /></span>Credit card payments accepted for first-time orders</li>
              <li style={listItemStyle}><span style={iconStyle}><FaFileContract /></span>Prices subject to change without notice</li>
            </ul>
          </div>

          <div data-aos="fade-up" data-aos-delay="200">
            <h3 style={{...sectionTitleStyle, fontSize: 'clamp(1.1rem, 3vw, 1.3rem)', margin: '0 0 clamp(0.8rem, 2vw, 1rem)'}}>Shipping Policy:</h3>
            <ul style={{paddingLeft: '1rem'}}>
              <li style={listItemStyle}><span style={iconStyle}><FaFileContract /></span>FOB shipping point (buyer pays shipping)</li>
              <li style={listItemStyle}><span style={iconStyle}><FaFileContract /></span>Lead times vary by product and season</li>
              <li style={listItemStyle}><span style={iconStyle}><FaFileContract /></span>Damage claims must be filed within 7 days of receipt</li>
            </ul>
          </div>
        </div>
      </div>

      <div style={{...sectionStyle, borderBottom: '1px solid rgba(238, 205, 160, 0.1)'}}>
        <h2 style={sectionTitleStyle} data-aos="fade-right">Return Policy</h2>
        <div style={cardStyle} data-aos="fade-up">
          <ul style={{paddingLeft: '1rem'}} data-aos="fade-up" data-aos-delay="100">
            <li style={listItemStyle}><span style={iconStyle}><FaExchangeAlt /></span>Defective merchandise may be returned within 14 days</li>
            <li style={listItemStyle}><span style={iconStyle}><FaExchangeAlt /></span>Returns subject to 15% restocking fee</li>
            <li style={listItemStyle}><span style={iconStyle}><FaExchangeAlt /></span>Buyer responsible for return shipping costs</li>
            <li style={listItemStyle}><span style={iconStyle}><FaExchangeAlt /></span>Final sale items cannot be returned</li>
          </ul>
        </div>
      </div>

      <div style={{...sectionStyle, borderBottom: '1px solid rgba(238, 205, 160, 0.1)'}}>
        <h2 style={sectionTitleStyle} data-aos="fade-right">Data Security</h2>
        <div style={cardStyle} data-aos="fade-up">
          <p style={{fontSize: 'clamp(0.8rem, 3vw, 1rem)'}} data-aos="fade-up" data-aos-delay="100">We implement industry-standard security measures to protect your business information, including:</p>
          <ul style={{paddingLeft: '1rem', marginTop: 'clamp(0.8rem, 2vw, 1rem)'}} data-aos="fade-up" data-aos-delay="150">
            <li style={listItemStyle}><span style={iconStyle}><FaLock /></span>SSL encryption for all transactions</li>
            <li style={listItemStyle}><span style={iconStyle}><FaLock /></span>Secure servers with firewalls</li>
            <li style={listItemStyle}><span style={iconStyle}><FaLock /></span>Limited employee access to sensitive data</li>
          </ul>
        </div>
      </div>

      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle} data-aos="fade-right">Contact Information</h2>
        <div style={contactCardStyle} data-aos="zoom-in">
          <p style={{marginBottom: 'clamp(1rem, 2vw, 1.5rem)', fontSize: 'clamp(0.8rem, 3vw, 1rem)'}} data-aos="fade-up" data-aos-delay="100">For any policy-related questions:</p>
          <p style={{fontWeight: '600', marginBottom: 'clamp(1.5rem, 3vw, 2.5rem)', fontSize: 'clamp(0.9rem, 3vw, 1.1rem)'}} data-aos="fade-up" data-aos-delay="150">Yokebud Wholesale Department</p>
          <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: 'clamp(1rem, 3vw, 2.3rem)', flexWrap: 'wrap'}}>
            <p style={{...listItemStyle, fontSize: 'clamp(0.8rem, 3vw, 0.9rem)'}} data-aos="fade-up" data-aos-delay="200">
              <span style={iconStyle}><FaEnvelope /></span>Email: Info@yokebud.com
            </p>
            <p style={{...listItemStyle, fontSize: 'clamp(0.8rem, 3vw, 0.9rem)'}} data-aos="fade-up" data-aos-delay="250">
              <span style={iconStyle}><FaPhone /></span>Phone: +358 440 328 124
            </p>
          </div>
          <p style={{marginTop: 'clamp(0.8rem, 2vw, 1rem)', fontSize: 'clamp(0.8rem, 3vw, 0.9rem)'}} data-aos="fade-up" data-aos-delay="300">
            Pukinmäenaukio 4, 00720 Helsinki, Finland
          </p>
        </div>
      </div>

      <div style={{
        padding: 'clamp(1rem, 3vw, 2rem) clamp(5%, 10vw, 10%)',
        borderTop: '1px solid rgba(238, 205, 160, 0.1)',
        fontSize: 'clamp(0.75rem, 3vw, 0.9rem)',
        color: '#aaa',
        marginBottom: 'clamp(1rem, 2vw, 2rem)',
        textAlign: 'center'
      }} data-aos="fade-up">
        <p>Note: This is a template. Please consult with a legal professional to ensure compliance with all applicable laws and regulations for your specific business and jurisdiction.</p>
      </div>
    </div>
  );
};

export default PolicyPage;