import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  FaChevronRight, 
  FaCheck,
  FaMedal,
  FaShippingFast,
  FaBoxOpen,
  FaTools,
  FaMoneyBillWave,
  FaUserTie,
  FaChartLine,
  FaLeaf,
  FaGlobeEurope,
  FaRulerCombined,
  FaClipboardCheck,
  FaIndustry,
  FaProjectDiagram
} from 'react-icons/fa';
import '../pages/styles/About.scss';
import { useNavigate } from 'react-router-dom';
import aboutImage from '../assades/About-1.jpg';
import teamImg from '../assades/team.webp';
import bglogoimg from '../assades/logo.jpg';

const About = () => {
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };
  const navigate = useNavigate();

  const item = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  const hoverEffect = {
    scale: 1.05,
    y: -5,
    transition: { type: "spring", stiffness: 150 }
  };

  const tapEffect = {
    scale: 0.98,
    transition: { duration: 0.2 }
  };

  const teamMembers = [
    {
      id: 1,
      name: "Md Anwar Hossen",
      position: "Email: anwarsadat1830@gmail.com",
      image: teamImg,
    },
    {
      id: 2,
      name: "Misbah Ul Islam",
      position: "Email: misbahislam.fi@gmail.com",
      image: teamImg,
    },
    {
      id: 3,
      name: "Abul Kalam Azad",
      position: "Email: akazad.bc07@gmail.com",
      image: teamImg,
    },
  ];

  const ScrollAnimatedSection = ({ children, threshold = 0.1, delay = 0 }) => {
    const controls = useAnimation();
    const [ref, inView] = useInView({ threshold, triggerOnce: true });

    useEffect(() => {
      if (inView) {
        controls.start("visible");
      }
    }, [controls, inView]);


    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate={controls}
        variants={{
          hidden: { opacity: 0, y: 50 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, delay }
          }
        }}
      >
        {children}
      </motion.div>
    );
  };

  const ScrollAnimatedList = ({ items, delay = 0 }) => {
    return (
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {items.map((item, index) => (
          <motion.div key={index} variants={item}>
            {item}
          </motion.div>
        ))}
      </motion.div>
    );
  };

  return (
    <motion.div 
      className="about-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        // backgroundColor: '#0d0d0d',
        position: 'relative',
        backgroundImage:'none',
        overflow: 'hidden'
      }}
    >
      
      
      {/* Background logo */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 0,
        opacity: 0.14,
        width: '100%',
        maxWidth: '800px',
        height: '100%',
        backgroundImage: `url(${bglogoimg})`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        pointerEvents: 'none'
      }} />

      {/* Hero Section */}
      <motion.section 
        className="about-hero"
        variants={container}
        initial="hidden"
        animate="visible"
        style={{ 
          position: 'relative', 
          zIndex: 1,
          backgroundColor: 'transparent'
        }}
      >
        <motion.div className="hero-overlay" variants={item}>
          <motion.h1 
            className="hero-title"
            whileHover={hoverEffect}
            whileTap={tapEffect}
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, type: "spring" }}
          >
            About Yokebud Group
          </motion.h1>
          <motion.p 
            className="hero-subtitle"
            whileHover={hoverEffect}
            whileTap={tapEffect}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, type: "spring" }}
          >
            Your Reliable Garment Business Support Partner
          </motion.p>
        </motion.div>
      </motion.section>

      {/* Intro Section */}
      <section className="about-intro" style={{ 
        position: 'relative', 
        zIndex: 1,
        backgroundColor: 'transparent'
      }}>
        <ScrollAnimatedSection>
          <div className="intro-content">
            <motion.h2 
              className="section-title"
              whileHover={hoverEffect}
              whileTap={tapEffect}
            >
              Professional OEM & ODM Factory With 5+ Years Experience
            </motion.h2>
            <motion.p 
              className="section-text"
              whileHover={{ scale: 1.01 }}
              whileTap={tapEffect}
            >
              Develop maximize synergistic benefit, and become a prominent exporter in the world market 
              through the pursuit of high productivity, advanced technological innovation and absolute 
              customer satisfaction by leveraging on the strengths of our core business.
            </motion.p>
          </div>
        </ScrollAnimatedSection>

        <ScrollAnimatedSection delay={0.2}>
          <motion.div 
            className="intro-image"
            whileHover={{ scale: 1.03, rotateY: 5 }}
            whileTap={{ scale: 0.98 }}
          >
            <img src={aboutImage} alt="Yokebud Factory" />
          </motion.div>
        </ScrollAnimatedSection>
      </section>

      {/* Company Overview */}
      <section className="about-overview" style={{ 
        position: 'relative', 
        zIndex: 1,
        backgroundColor: 'transparent'
      }}>
        <ScrollAnimatedSection>
          <motion.h2 
            className="section-title"
            whileHover={hoverEffect}
            whileTap={tapEffect}
          >
            Yokebud Group OY
          </motion.h2>
          <motion.p 
            className="section-text"
            whileHover={{ scale: 1.01 }}
            whileTap={tapEffect}
          >
            Yokebud Group OY is a premier manufacturing company based in Bangladesh, with a focus on 
            delivering high-quality textile and garment products to clients across the globe. With our 
            expertise in producing premium apparel, we are dedicated to helping brands build their own 
            identity in the competitive fashion industry. We take pride in offering tailored solutions 
            to clients in Finland, as well as expanding our services worldwide, ensuring that our clients 
            receive top-notch products that reflect their brand's vision.
          </motion.p>
        </ScrollAnimatedSection>
      </section>

      {/* What We Offer */}
      <section className="about-offer" style={{ 
        position: 'relative', 
        zIndex: 1,
        backgroundColor: 'transparent'
      }}>
        <ScrollAnimatedSection>
          <motion.h2 
            className="section-title"
            whileHover={hoverEffect}
            whileTap={tapEffect}
          >
            What We Offer
          </motion.h2>
          <motion.p 
            className="section-text"
            whileHover={{ scale: 1.01 }}
            whileTap={tapEffect}
          >
            We specialize in custom manufacturing, allowing businesses and entrepreneurs to create their 
            own branded apparel and fashion products, including but not limited to:
          </motion.p>
        </ScrollAnimatedSection>
        
        <ScrollAnimatedSection delay={0.2}>
          <div className="offer-grid">
            {[
              "Hoodies & Sweatshirts",
              "Jackets & Outerwear",
              "T-Shirts & Polos",
              "Activewear & Sportswear",
              "Casual & Corporate Wear"
            ].map((item, index) => (
              <motion.div 
                key={index}
                className="offer-item"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ 
                  scale: 1.05,
                  backgroundColor: 'rgba(255, 215, 0, 0.1)',
                  borderColor: '#FFD700'
                }}
                whileTap={tapEffect}
              >
                <FaChevronRight className="offer-icon" />
                <span>{item}</span>
              </motion.div>
            ))}
          </div>
        </ScrollAnimatedSection>
      </section>

      {/* Why Choose Us Section */}
      <section className="about-why-choose" style={{ 
        position: 'relative', 
        zIndex: 1,
        backgroundColor: 'transparent'
      }}>
        <ScrollAnimatedSection>
          <motion.h2 
            className="section-title"
            whileHover={hoverEffect}
            whileTap={tapEffect}
          >
            Why Choose Yokebud Group
          </motion.h2>
        </ScrollAnimatedSection>

        <ScrollAnimatedSection delay={0.2}>
          <div className="features-grid">
            {[
              {
                icon: <FaMedal className="feature-icon" />,
                title: "Best Quality",
                description: "We provide only the highest quality products that meet international standards with rigorous quality control processes."
              },
              {
                icon: <FaShippingFast className="feature-icon" />,
                title: "Fast Delivery",
                description: "Efficient logistics network ensures express, air cargo or sea vessel delivery within 72 hours as per buyer requirements."
              },
              {
                icon: <FaBoxOpen className="feature-icon" />,
                title: "Premium Packaging",
                description: "Standardized packaging with custom options available to perfectly represent your brand and protect your products."
              },
              {
                icon: <FaTools className="feature-icon" />,
                title: "Custom Solutions",
                description: "7+ years expertise in custom manufacturing with complete in-house knitting, dyeing, printing and embroidery facilities."
              },
              {
                icon: <FaMoneyBillWave className="feature-icon" />,
                title: "Competitive Pricing",
                description: "Direct factory pricing ensures you get the best value without compromising on quality or service."
              },
              {
                icon: <FaUserTie className="feature-icon" />,
                title: "Experienced Team",
                description: "Our skilled professionals bring decades of combined experience in garment manufacturing and international trade."
              }
            ].map((feature, index) => (
              <motion.div 
                key={index}
                className="feature-card"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{
                  y: -10,
                  boxShadow: '0 15px 30px rgba(238, 205, 160, 0.2)'
                }}
              >
                <div className="feature-icon-container">
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </ScrollAnimatedSection>

        <ScrollAnimatedSection delay={0.3}>
          <motion.h2 
            className="process-title"
            whileHover={{ scale: 1.02 }}
            whileTap={tapEffect}
          >
            Our Order Process
          </motion.h2>
        </ScrollAnimatedSection>

        <ScrollAnimatedSection delay={0.4}>
          <div className="process-steps">
            {[
              { icon: <FaClipboardCheck />, text: "Inquiry Request" },
              { icon: <FaRulerCombined />, text: "Prepare Order" },
              { icon: <FaMoneyBillWave />, text: "Payment Confirmation" },
              { icon: <FaProjectDiagram />, text: "Design" },
              { icon: <FaUserTie />, text: "Buyer Approval" },
              { icon: <FaIndustry />, text: "Cutting" },
              { icon: <FaIndustry />, text: "Sewing" },
              { icon: <FaIndustry />, text: "Ironing" },
              { icon: <FaCheck />, text: "Quality Control" },
              { icon: <FaBoxOpen />, text: "Packaging" },
              { icon: <FaShippingFast />, text: "Shipping" },
              { icon: <FaGlobeEurope />, text: "Delivery" }
            ].map((step, index) => (
              <motion.div 
                key={index}
                className="process-step"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ y: -5 }}
              >
                <div className="step-icon">{step.icon}</div>
                <div className="step-line"></div>
                <p>{step.text}</p>
              </motion.div>
            ))}
          </div>
        </ScrollAnimatedSection>
      </section>

      {/* Team Members Section */}
      {/* <section className="about-team" style={{ 
        position: 'relative', 
        zIndex: 1,
        backgroundColor: 'transparent'
      }}>
        <ScrollAnimatedSection>
          <motion.h2 
            className="section-title"
            whileHover={hoverEffect}
            whileTap={tapEffect}
          >
            Meet Our Team
          </motion.h2>
          <motion.p 
            className="section-text"
            whileHover={{ scale: 1.01 }}
            whileTap={tapEffect}
          >
            Our dedicated team of professionals brings together decades of experience in the garment industry,
            ensuring your products meet the highest standards of quality and design.
          </motion.p>
        </ScrollAnimatedSection>
        
        <ScrollAnimatedSection delay={0.2}>
          <div className="team-grid">
            {teamMembers.map((member, index) => (
              <motion.div 
                key={member.id}
                className="team-card"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ 
                  y: -10,
                  boxShadow: '0 15px 30px rgba(238, 205, 160, 0.3)'
                }}
                whileTap={tapEffect}
              >
                <div className="team-image-container">
                  <img src={member.image} alt={member.name} className="team-image" />
                </div>
                <div className="team-info">
                  <h3>{member.name}</h3>
                  <p className="position">{member.position}</p>
                  <p className="description">{member.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollAnimatedSection>
      </section> */}

      {/* Why Partner With Us */}
      <section className="about-partner" style={{ 
        position: 'relative', 
        zIndex: 1,
        backgroundColor: 'transparent'
      }}>
        <ScrollAnimatedSection>
          <motion.h2 
            className="section-title"
            whileHover={hoverEffect}
            whileTap={tapEffect}
          >
            Why Partner with Yokebud Group OY?
          </motion.h2>
        </ScrollAnimatedSection>
        
        <ScrollAnimatedSection delay={0.2}>
          <div className="partner-grid">
            {[
              {
                title: "Custom Design & Production",
                points: [
                  "Your Vision, Our Expertise: We collaborate closely with clients to bring their design concepts to life",
                  "Flexible Order Sizes: We cater to both small and large orders"
                ]
              },
              {
                title: "Superior Quality Control",
                points: [
                  "Manufactured in Bangladesh with rigorous quality control",
                  "Quality Assurance: Meets international quality standards"
                ]
              },
              {
                title: "Global Reach, Local Expertise",
                points: [
                  "Finland Base for European Market",
                  "Worldwide Services: Deliver products globally"
                ]
              },
              {
                title: "Sustainability & Ethical Manufacturing",
                points: [
                  "Eco-Friendly Practices",
                  "Ethical Labor Practices"
                ]
              }
            ].map((item, index) => (
              <motion.div 
                key={index}
                className="partner-card"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ 
                  y: -10,
                  boxShadow: '0 10px 25px rgba(255, 215, 0, 0.2)'
                }}
                whileTap={tapEffect}
              >
                <h3>{item.title}</h3>
                <ul>
                  {item.points.map((point, i) => (
                    <motion.li 
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: i * 0.1 + index * 0.1 }}
                    >
                      <FaCheck className="check-icon" />
                      {point}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </ScrollAnimatedSection>
      </section>

      {/* Services Section */}
      <section className="about-services" style={{ 
        position: 'relative', 
        zIndex: 1,
        backgroundColor: 'transparent'
      }}>
        <ScrollAnimatedSection>
          <motion.h2 
            className="section-title"
            whileHover={hoverEffect}
            whileTap={tapEffect}
          >
            Services We Provide
          </motion.h2>
        </ScrollAnimatedSection>
        
        <ScrollAnimatedSection delay={0.2}>
          <div className="services-grid">
            {[
              {
                title: "Private Label & Branding",
                content: "Custom labeling, embroidery, and screen printing services to ensure your brand's identity is reflected in every detail."
              },
              {
                title: "Product Development",
                content: "Assistance in product design, pattern making, and prototype development to ensure your product is exactly as envisioned."
              },
              {
                title: "Bulk Production",
                content: "High-capacity production facilities allow for efficient bulk production with a focus on consistency and quality."
              },
              {
                title: "Logistics & Distribution",
                content: "Seamless shipping and logistics support to ensure your products reach you on time, wherever you are in the world."
              }
            ].map((service, index) => (
              <motion.div 
                key={index}
                className="service-card"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ 
                  scale: 1.03,
                  backgroundColor: 'rgba(30, 30, 30, 0.9)'
                }}
                whileTap={tapEffect}
              >
                <h3>{service.title}</h3>
                <p>{service.content}</p>
              </motion.div>
            ))}
          </div>
        </ScrollAnimatedSection>
      </section>

      {/* Who Should Partner Section */}
      <section className="about-who" style={{ 
        position: 'relative', 
        zIndex: 1,
        backgroundColor: 'transparent'
      }}>
        <ScrollAnimatedSection>
          <motion.h2 
            className="section-title"
            whileHover={hoverEffect}
            whileTap={tapEffect}
          >
            Who Should Partner with Us?
          </motion.h2>
        </ScrollAnimatedSection>
        
        <ScrollAnimatedSection delay={0.2}>
          <div className="who-grid">
            {[
              "New Brands & Startups",
              "Established Brands",
              "Retailers & Wholesalers",
              "Sports Teams & Corporate Clients"
            ].map((item, index) => (
              <motion.div 
                key={index}
                className="who-item"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ 
                  scale: 1.05,
                  backgroundColor: 'rgba(255, 215, 0, 0.1)',
                  borderColor: '#FFD700'
                }}
                whileTap={tapEffect}
              >
                {item}
              </motion.div>
            ))}
          </div>
        </ScrollAnimatedSection>
      </section>

      {/* What We Provide Section */}
      <section className="about-provide" style={{ 
        position: 'relative', 
        zIndex: 1,
        backgroundColor: 'transparent'
      }}>
        <ScrollAnimatedSection>
          <motion.h2 
            className="section-title"
            whileHover={hoverEffect}
            whileTap={tapEffect}
          >
            What We Provide
          </motion.h2>
        </ScrollAnimatedSection>
        
        <ScrollAnimatedSection delay={0.2}>
          <div className="provide-grid">
            {[
              {
                title: "Lead Time",
                content: "90-120 days from fabric approval/design selection"
              },
              {
                title: "MOQ",
                content: "500 pieces per color, per style"
              },
              {
                title: "Sample",
                content: "Proto sample: 4-7 days, Sales sample: 6-10 weeks"
              },
              {
                title: "Payment Terms",
                content: "Telegraphic Transfer (T/T) for all transactions"
              },
              {
                title: "Design & Development",
                content: "Assistance in creating fits and designs with wide fabric choices"
              },
              {
                title: "Process & Quality",
                content: "Strict quality control with 3rd party testing"
              },
              {
                title: "Manufacturing",
                content: "Consistent quality whether 1,000 or 100,000 pieces"
              },
              {
                title: "ERP System",
                content: "Enterprise Resource Planning for efficient production"
              }
            ].map((item, index) => (
              <motion.div 
                key={index}
                className="provide-card"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ 
                  scale: 1.03,
                  boxShadow: '0 5px 15px rgba(255, 215, 0, 0.2)'
                }}
                whileTap={tapEffect}
              >
                <h3>{item.title}</h3>
                <p>{item.content}</p>
              </motion.div>
            ))}
          </div>
        </ScrollAnimatedSection>
      </section>

      {/* Future Section */}
      <section className="about-future" style={{ 
        position: 'relative', 
        zIndex: 1,
        backgroundColor: 'transparent'
      }}>
        <ScrollAnimatedSection>
          <motion.h2 
            className="section-title"
            whileHover={hoverEffect}
            whileTap={tapEffect}
          >
            The Future
          </motion.h2>
          <motion.p 
            className="section-text"
            whileHover={{ scale: 1.01 }}
            whileTap={tapEffect}
          >
            Yokebud Oy envisions expanding its operations throughout Europe, with plans to:
          </motion.p>
        </ScrollAnimatedSection>
        
        <ScrollAnimatedSection delay={0.2}>
          <ul className="future-list">
            {[
              "Broaden Product Range: Introduce new clothing lines based on market demand and trends",
              "Enhance Sustainable Practices: Invest in sustainable materials and production techniques",
              "Expand Market Presence: Open additional marketing offices in key European cities"
            ].map((item, index) => (
              <motion.li 
                key={index}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ x: 10 }}
                whileTap={tapEffect}
              >
                <FaChevronRight className="future-icon" />
                {item}
              </motion.li>
            ))}
          </ul>
        </ScrollAnimatedSection>
      </section>

      {/* CTA Section */}
      <section className="about-cta" style={{ 
        position: 'relative', 
        zIndex: 1,
        backgroundColor: 'transparent'
      }}>
        <ScrollAnimatedSection>
          <div className="cta-content">
            <motion.h2 
              className="cta-title"
              initial={{ opacity: 0, y: -30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={hoverEffect}
              whileTap={tapEffect}
            >
              Ready to Start Your Project?
            </motion.h2>
            <motion.p 
              className="cta-text"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ scale: 1.01 }}
              whileTap={tapEffect}
            >
              Are you looking for a reliable manufacturing partner to bring your apparel ideas to life? 
              Let's collaborate! We are ready to provide tailored solutions for your brand.
            </motion.p>
            <motion.button 
              className="cta-button"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.4 }}
              whileHover={{ 
                scale: 1.05,
                boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)'
              }}
              whileTap={tapEffect}
              onClick={() => navigate('/contact')}
            >
              Contact Us
            </motion.button>
          </div>
        </ScrollAnimatedSection>
      </section>
    </motion.div>
  );
};

export default About;