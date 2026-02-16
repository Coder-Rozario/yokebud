import React, { useEffect } from 'react';
import { Helmet } from "react-helmet-async";
import{
  FaTruck,
  FaBoxes,
  FaClock,
  FaGlobeEurope,
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaPhone,
  FaEnvelope,
  FaChevronRight
} from 'react-icons/fa';
import AOS from 'aos';
import 'aos/dist/aos.css';
import logo from '../assades/logo.jpg';

const Shipping = () => {
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
    overflowX: 'hidden',
    minHeight: '100vh',
    padding: '0',
    overflow: 'hidden',
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
    height: 'clamp(200px, 30vh, 300px)',
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
    marginBottom: '0.5rem',
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
    marginBottom: '0.8rem',
    display: 'flex',
    fontSize: 'clamp(0.7rem, 3vw, 0.9rem)',
    alignItems: 'center',
    gap: '0.2rem',
  };

  const iconStyle = {
    color: '#EECDA0',
    fontSize: 'clamp(0.7rem, 3vw, 0.9rem)',
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

  // Responsive policy card container
  const policyContainerStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
    position: 'relative',
    zIndex: 1,
  };

  // Policy card specific styles
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
    fontSize: 'clamp(1.8rem, 6vw, 2.5rem)',
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
    marginBottom: '1rem',
    color: '#ddd',
    fontSize: 'clamp(0.7rem, 3vw, 0.9rem)',
  };

  return (
    <div style={pageStyle}>
      {/* Background logo - same as PolicyPage */}
      <div style={backgroundLogoStyle} />

      <Helmet>
        <title>Yokebud Group Oy - Shipping Policy</title>
        <meta name="description" content="Yokebud's shipping and delivery policy for B2B clothing orders" />
      </Helmet>

      {/* Hero Section - matching PolicyPage */}
      <div style={heroStyle} data-aos="fade-down">
        <div style={heroContentStyle}>
          <h1 style={heroTitleStyle} data-aos="fade-up" data-aos-delay="100">Shipping & Delivery Policy</h1>
          <p style={heroSubtitleStyle} data-aos="fade-up" data-aos-delay="200">Last Updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Main Content Section */}
      <div style={sectionStyle}>
        {/* Policy Cards Grid */}
        <div style={policyContainerStyle}>
          <div style={policyCardStyle} data-aos="fade-up">
            <div style={policyIconStyle}><FaTruck /></div>
            <h2 style={policyTitleStyle}>Shipping Methods</h2>
            <p style={policyTextStyle}>We offer reliable shipping options tailored for our B2B clients:</p>
            <ul style={{ paddingLeft: '1rem' }}>
              <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Standard Ground Shipping (3-7 business days)</li>
              <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Expedited Shipping (2-3 business days)</li>
              <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Express Shipping (1-2 business days)</li>
              <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Freight Shipping for bulk orders</li>
            </ul>
          </div>

          <div style={policyCardStyle} data-aos="fade-up" data-aos-delay="100">
            <div style={policyIconStyle}><FaClock /></div>
            <h2 style={policyTitleStyle}>Processing Times</h2>
            <p style={policyTextStyle}>Order processing before shipment:</p>
            <ul style={{ paddingLeft: '1rem' }}>
              <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Standard orders: 1-2 business days</li>
              <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Custom/bulk orders: 3-5 business days</li>
              <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>During peak seasons: Additional 1-2 days</li>
              <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Orders placed after 2pm ET processed next business day</li>
            </ul>
          </div>

          <div style={policyCardStyle} data-aos="fade-up" data-aos-delay="150">
            <div style={policyIconStyle}><FaGlobeEurope /></div>
            <h2 style={policyTitleStyle}>International Shipping</h2>
            <p style={policyTextStyle}>For our international B2B clients:</p>
            <ul style={{ paddingLeft: '1rem' }}>
              <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>DDP (Delivered Duty Paid) available</li>
              <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Standard international: 7-14 business days</li>
              <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Express international: 3-5 business days</li>
              <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>All customs fees buyer's responsibility unless DDP</li>
            </ul>
          </div>

          <div style={policyCardStyle} data-aos="fade-up" data-aos-delay="200">
            <div style={policyIconStyle}><FaMoneyBillWave /></div>
            <h2 style={policyTitleStyle}>Shipping Costs</h2>
            <p style={policyTextStyle}>Our transparent pricing structure:</p>
            <ul style={{ paddingLeft: '1rem' }}>
              <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Free shipping on orders over €500 (domestic)</li>
              <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Volume discounts available for frequent orders</li>
              <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Freight quotes provided upon request</li>
              <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Expedited shipping fees vary by destination</li>
            </ul>
          </div>
        </div>

        {/* Additional Shipping Info */}
        <div style={{...cardStyle, marginTop: '1.5rem'}} data-aos="fade-up">
          <h2 style={{...policyTitleStyle, textAlign: 'center'}}>Important Shipping Notes</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
            marginTop: '1rem'
          }}>
            <div data-aos="fade-up" data-aos-delay="100">
              <h3 style={{...policyTitleStyle, fontSize: 'clamp(1rem, 3vw, 1.2rem)', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <FaBoxes /> Order Tracking
              </h3>
              <ul style={{ paddingLeft: '1rem' }}>
                <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Tracking provided for all shipments</li>
                <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Email notifications at key milestones</li>
              </ul>
            </div>
            <div data-aos="fade-up" data-aos-delay="150">
              <h3 style={{...policyTitleStyle, fontSize: 'clamp(1rem, 3vw, 1.2rem)', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <FaExclamationTriangle /> Delivery Issues
              </h3>
              <ul style={{ paddingLeft: '1rem' }}>
                <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Report damaged shipments within 48 hours</li>
                <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Missing packages must be reported within 7 days</li>
              </ul>
            </div>
            <div data-aos="fade-up" data-aos-delay="200">
              <h3 style={{...policyTitleStyle, fontSize: 'clamp(1rem, 3vw, 1.2rem)', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <FaTruck /> Carrier Partners
              </h3>
              <ul style={{ paddingLeft: '1rem' }}>
                <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>DHL Express</li>
                <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>UPS</li>
                <li style={listItemStyle}><span style={iconStyle}><FaChevronRight /></span>Posti (Finland)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section - matching PolicyPage */}
      <div style={{...sectionStyle, borderBottom: '1px solid rgba(238, 205, 160, 0.1)'}}>
        <h2 style={sectionTitleStyle} data-aos="fade-right">Need Shipping Assistance?</h2>
        <div style={contactCardStyle} data-aos="zoom-in">
          <p style={{marginBottom: '1rem', fontSize: 'clamp(0.8rem, 3vw, 1rem)'}} data-aos="fade-up" data-aos-delay="100">
            Contact our logistics team for shipping quotes or any questions about delivery.
          </p>
          <p style={{fontWeight: '600', marginBottom: '1.5rem', fontSize: 'clamp(0.9rem, 3vw, 1.1rem)'}} data-aos="fade-up" data-aos-delay="150">
            Yokebud Logistics Department
          </p>
          <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap'}}>
            <p style={{...listItemStyle, fontSize: 'clamp(0.7rem, 3vw, 0.9rem)'}} data-aos="fade-up" data-aos-delay="200">
              <span style={iconStyle}><FaEnvelope /></span>Email: shipping@yokebud.com
            </p>
            <p style={{...listItemStyle, fontSize: 'clamp(0.7rem, 3vw, 0.9rem)'}} data-aos="fade-up" data-aos-delay="250">
              <span style={iconStyle}><FaPhone /></span>Phone: +358 440 328 124
            </p>
          </div>
          <p style={{marginTop: '1rem', fontSize: 'clamp(0.7rem, 3vw, 0.9rem)'}} data-aos="fade-up" data-aos-delay="300">
            Pukinmäenaukio 4, 00720 Helsinki, Finland
          </p>
        </div>
      </div>

      <div style={{
        padding: '1.5rem 5%',
        borderTop: '1px solid rgba(238, 205, 160, 0.1)',
        fontSize: 'clamp(0.7rem, 3vw, 0.9rem)',
        marginBottom: '1.5rem',
        color: '#aaa',
        textAlign: 'center'
      }} data-aos="fade-up">
        <p>Note: Shipping times are estimates and not guaranteed. Actual delivery times may vary based on carrier and destination.</p>
      </div>
    </div>
  );
};

export default Shipping;