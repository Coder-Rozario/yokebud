import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../pages/styles/Header.scss';
import {
  FaFacebook, FaWhatsapp, FaYoutube, FaInstagram, FaTiktok,
  FaPhone, FaEnvelope
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { auth } from '../firebase';

const Header = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const navigate = useNavigate();

  // Responsive breakpoints
  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);

    if (typeof window !== 'undefined' && window.AOS) {
      window.AOS.init({
        duration: 1000,
        easing: 'ease-in-out',
        once: true
      });
    }

    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    }, error => {
      console.error('Auth state error:', error);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      unsubscribe();
    };
  }, []);

  const handlePhoneClick = () => {
    window.location.href = 'tel:+358440328124';
  };

  const handleEmailClick = () => {
    window.location.href = 'mailto:info@yokebud.com';
  };

  // Animation variants
  const textVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const socialVariants = {
    hidden: { opacity: 0 },
    visible: (i) => ({
      opacity: 1,
      transition: {
        delay: 0.3 + i * 0.1,
        duration: 0.5
      }
    })
  };

  const nameVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.4,
        duration: 0.8
      }
    }
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.175, 0.885, 0.32, 1.275]
      }
    },
    hover: {
      scale: 1.2,
      y: -5,
      color: '#FFD700',
      textShadow: "0 0 10px rgba(255, 215, 0, 0.8)",
      transition: {
        duration: 0.3
      }
    }
  };

  const floatAnimation = {
    scale: [1, 1.05, 1],
    color: ['#FFFFFF', '#FFD700', '#FFFFFF'],
    textShadow: [
      '0 0 0px rgba(255, 215, 0, 0)',
      '0 0 15px rgba(255, 215, 0, 0.7)',
      '0 0 0px rgba(255, 215, 0, 0)'
    ],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  // Social links data
  const socialLinks = [
    { icon: <FaFacebook size={isMobile ? 16 : 20} />, url: "https://www.facebook.com/yokebud?mibextid=ZbWKwL" },
    { icon: <FaWhatsapp size={isMobile ? 16 : 20} />, url: "https://wa.me/+358440328124" },
    { icon: <FaYoutube size={isMobile ? 16 : 20} />, url: "https://www.youtube.com/@yokebud" },
    { icon: <FaInstagram size={isMobile ? 16 : 20} />, url: "https://www.instagram.com/yokebud/" },
    { icon: <FaTiktok size={isMobile ? 16 : 20} />, url: "https://www.tiktok.com/@yokebud" }
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="premium-header"
    >
      {/* Top bar with contact info and social media */}
      <div className={`header-top-bar ${isMobile ? 'mobile' : ''} ${isTablet ? 'tablet' : ''}`}>
        <motion.div
          className="contact-info"
          initial="hidden"
          animate="visible"
          variants={textVariants}
        >
          {/* Desktop View (1024px and above) */}
          {isDesktop && (
            <>
              <motion.div
                className="contact-items-container"
                style={{ display: 'flex', gap: '1rem' }}
              >
                <motion.div
                  className="contact-item"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePhoneClick}
                  style={{ cursor: 'pointer' }}
                > <FaPhone className="contact-icon" /> <span>+358 440 328 124</span>
                </motion.div>

                <motion.div 
                  className="contact-item"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEmailClick}
                  style={{ cursor: 'pointer' }}
                >
                  <FaEnvelope className="contact-icon" />
                  <span>info@yokebud.com</span>
                </motion.div>
              </motion.div>

              <motion.div
                className="company-name"
                initial="hidden"
                animate="visible"
                variants={nameVariants}
              >
                {["Yokebud"].map((word, wordIndex) => (
                  <motion.span 
                    key={wordIndex}
                    className="name-part"
                    animate={floatAnimation}
                  >
                    {word.split('').map((letter, letterIndex) => (
                      <motion.span
                        key={letterIndex}
                        variants={letterVariants}
                        style={{ display: 'inline-block' }}
                        animate={{
                          scale: [1, 1.1, 1],
                          y: [0, -3, 0],
                          color: ['#FFFFFF', '#FFD700', '#FFFFFF'],
                          textShadow: [
                            '0 0 0px rgba(255, 215, 0, 0)',
                            '0 0 10px rgba(255, 215, 0, 0.8)',
                            '0 0 0px rgba(255, 215, 0, 0)'
                          ],
                          transition: {
                            duration: 3,
                            delay: letterIndex * 0.1,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }
                        }}
                      >
                        {letter}
                      </motion.span>
                    ))}
                  </motion.span>
                ))}
<motion.span 
  style={{ 
    display: 'inline-block',
    fontSize: '0.4em',
    position: 'relative',
    top: '-1rem',
    marginLeft: '1px'
  }}
  animate={{
    scale: [1, 1.05, 1],
    y: [0, -1, 0],
    color: ['#FFFFFF', '#FFD700', '#FFFFFF'],
    textShadow: [
      '0 0 0px rgba(255, 215, 0, 0)',
      '0 0 5px rgba(255, 215, 0, 0.8)',
      '0 0 0px rgba(255, 215, 0, 0)'
    ]
  }}
  transition={{
    duration: 3,
    delay: 0.5,
    repeat: Infinity,
    ease: "easeInOut"
  }}
>
  Ltd
</motion.span>

              </motion.div>

              <motion.div 
                className="social-links"
                initial="hidden"
                animate="visible"
              >
                {socialLinks.map((item, i) => (
                  <motion.a
                    key={i}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    custom={i}
                    variants={socialVariants}
                    whileHover={{ 
                      scale: 1.2,
                      rotate: [0, 10, -10, 0],
                      transition: { duration: 0.5 }
                    }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {item.icon}   
                  </motion.a>
                ))}
              </motion.div>
            </>
          )}

          {/* Tablet View (768px to 1023px) */}
          {isTablet && (
            <div className="tablet-container">
              <motion.div 
                className="contact-items-container"
              >
                <motion.div 
                  className="contact-item" 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePhoneClick}
                  style={{ cursor: 'pointer' }}
                >
                  <FaPhone className="contact-icon" />
                  <span>+358440328124</span>
                </motion.div>
                
                <motion.div 
                  className="contact-item"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEmailClick}
                  style={{ cursor: 'pointer' }}
                >
                  <FaEnvelope className="contact-icon" />
                  <span>info@yokebud.com</span>
                </motion.div>
              </motion.div>

              <motion.div
                className="company-name"
                initial="hidden"
                animate="visible"
                variants={nameVariants}
              >
                {["Yokebud"].map((word, wordIndex) => (
                  <motion.span 
                    key={wordIndex}
                    className="name-part"
                  >
                    {word.split('').map((letter, letterIndex) => (
                      <motion.span
                        key={letterIndex}
                        variants={letterVariants}
                        style={{ display: 'inline-block' }}
                        animate={{
                          scale: [1, 1.1, 1],
                          y: [0, -3, 0],
                          color: ['#FFFFFF', '#FFD700', '#FFFFFF'],
                          textShadow: [
                            '0 0 0px rgba(255, 215, 0, 0)',
                            '0 0 10px rgba(255, 215, 0, 0.8)',
                            '0 0 0px rgba(255, 215, 0, 0)'
                          ],
                          transition: {
                            duration: 3,
                            delay: letterIndex * 0.1,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }
                        }}
                      >
                        {letter}
                      </motion.span>
                    ))}
                  </motion.span>
                ))}
                <motion.span 
                  style={{ 
                    display: 'inline-block',
                    fontSize: '0.7em',
                    verticalAlign: 'top',
                    marginLeft: '2px'
                  }}
                  animate={{
                    scale: [1, 1.05, 1],
                    y: [0, -1, 0],
                    color: ['#FFFFFF', '#FFD700', '#FFFFFF'],
                    textShadow: [
                      '0 0 0px rgba(255, 215, 0, 0)',
                      '0 0 5px rgba(255, 215, 0, 0.8)',
                      '0 0 0px rgba(255, 215, 0, 0)'
                    ],
                    transition: {
                      duration: 3,
                      delay: 0.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  }}
                >
                  .Ltd
                </motion.span>
              </motion.div>

              <motion.div 
                className="social-links"
                initial="hidden"
                animate="visible"
              >
                {socialLinks.map((item, i) => (
                  <motion.a
                    key={i}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    custom={i}
                    variants={socialVariants}
                    whileHover={{ 
                      scale: 1.2,
                      rotate: [0, 10, -10, 0],
                      transition: { duration: 0.5 }
                    }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {item.icon}   
                  </motion.a>
                ))}
              </motion.div>
            </div>
          )}

          {/* Mobile View (below 768px) */}
          {isMobile && (
            <div className="mobile-container">
              <motion.div 
                className="contact-items-container"
                style={{ 
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}
              >
                <motion.div 
                  className="contact-item" 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePhoneClick}
                  style={{ 
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <FaPhone className="contact-icon" size={10} />
                  <span>+358 440 328 124</span>
                </motion.div>
                
                <motion.div 
                  className="contact-item"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEmailClick}
                  style={{ 
                    cursor: 'pointer',
                    fontSize: '0.6rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <FaEnvelope className="contact-icon" size={10} />
                  <span>info@yokebud.com</span>
                </motion.div>
              </motion.div>

              <motion.div
                className="company-name"
                initial="hidden"
                animate="visible"
                variants={nameVariants}
                style={{ fontSize: '1.2rem', margin: '0.5rem 0' }}
              >
                {["Yokebud"].map((word, wordIndex) => (
                  <motion.span 
                    key={wordIndex}
                    className="name-part"
                  >
                    {word.split('').map((letter, letterIndex) => (
                      <motion.span
                        key={letterIndex}
                        variants={letterVariants}
                        style={{ display: 'inline-block' }}
                        animate={{
                          scale: [1, 1.05, 1],
                          y: [0, -2, 0],
                          color: ['#FFFFFF', '#FFD700', '#FFFFFF'],
                          textShadow: [
                            '0 0 0px rgba(255, 215, 0, 0)',
                            '0 0 5px rgba(255, 215, 0, 0.6)',
                            '0 0 0px rgba(255, 215, 0, 0)'
                          ],
                          transition: {
                            duration: 2.5,
                            delay: letterIndex * 0.05,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }
                        }}
                      >
                        {letter}
                      </motion.span>
                    ))}
                  </motion.span>
                ))}
                <motion.span 
                  style={{ 
                    display: 'inline-block',
                    fontSize: '0.6em',
                    verticalAlign: 'top',
                    marginLeft: '1px'
                  }}
                  animate={{
                    scale: [1, 1.05, 1],
                    y: [0, -1, 0],
                    color: ['#FFFFFF', '#FFD700', '#FFFFFF'],
                    textShadow: [
                      '0 0 0px rgba(255, 215, 0, 0)',
                      '0 0 3px rgba(255, 215, 0, 0.6)',
                      '0 0 0px rgba(255, 215, 0, 0)'
                    ],
                    transition: {
                      duration: 2.5,
                      delay: 0.3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  }}
                >
                  .Ltd
                </motion.span>
              </motion.div>

              <motion.div 
                className="social-links"
                initial="hidden"
                animate="visible"
                style={{ gap: '0.5rem' }}
              >
                {socialLinks.map((item, i) => (
                  <motion.a
                    key={i}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    custom={i}
                    variants={socialVariants}
                    whileHover={{ 
                      scale: 1.1,
                      rotate: [0, 10, -10, 0],
                      transition: { duration: 0.5 }
                    }}
                    whileTap={{ scale: 0.9 }}
                    style={{ fontSize: '0.9rem' }}
                  >
                    {item.icon}   
                  </motion.a>
                ))}
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.header>
  );
};

export default Header;