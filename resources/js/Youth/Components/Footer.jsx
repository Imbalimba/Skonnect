import React from 'react';
import '../css/Footer.css';
import { FaMapMarkerAlt, FaEnvelope, FaPhoneAlt, FaFacebookF, FaTwitter, FaInstagram, FaChevronRight } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="youth-footer">
      <div className="youth-footer-container">
        <div className="youth-footer-row">
          <div className="youth-footer-column">
            <h2 className="youth-footer-heading">Vision & Mission</h2>
            <p className="youth-footer-text">
              <strong>VISION:</strong> The Office of the Sangguniang Kabataan 
              Pederasyon President envisions itself as governance where paragon of good 
              Sangguniang Kabataan officials and the youth sector are empowered through 
              inclusive and participatory youth-centered legislation and representation.
            </p>
            <p className="youth-footer-text">
              <strong>MISSION:</strong> The Office of the Sangguniang Kabataan
              Pederasyon President ensures genuine and participative youth representation in local
              decision-making bodies and the legislation of sustainable and sound policies for the social,
              political, economic, physical, cultural and moral development of the Pasigueño youth.
            </p>
          </div>
          <div className="youth-footer-column">
            <h2 className="youth-footer-heading">Contact Us</h2>
            <address className="youth-footer-contact">
              <p><FaMapMarkerAlt className="youth-footer-icon" /> <strong>Address:</strong> 7th Floor, Pasig City Hall, Caruncho Avenue, Pasig City</p>
              <p><FaEnvelope className="youth-footer-icon" /> <strong>Email:</strong> <a href="mailto:sk@pasigcity.gov.ph" className="youth-footer-link">sk@pasigcity.gov.ph</a></p>
              <p><FaPhoneAlt className="youth-footer-icon" /> <strong>Phone:</strong> (02) 8643-1111 local 1700</p>
            </address>
            <div className="youth-social-links">
              <a href="https://facebook.com" className="youth-social-link" aria-label="Facebook">
                <FaFacebookF />
              </a>
              <a href="https://twitter.com" className="youth-social-link" aria-label="Twitter">
                <FaTwitter />
              </a>
              <a href="https://instagram.com" className="youth-social-link" aria-label="Instagram">
                <FaInstagram />
              </a>
            </div>
          </div>
          <div className="youth-footer-column">
            <h2 className="youth-footer-heading">Quick Links</h2>
            <ul className="youth-footer-links">
              <li><a href="/about" className="youth-footer-link"><FaChevronRight className="youth-footer-icon-sm" /> About SK</a></li>
              <li><a href="/programs" className="youth-footer-link"><FaChevronRight className="youth-footer-icon-sm" /> Programs</a></li>
              <li><a href="/events" className="youth-footer-link"><FaChevronRight className="youth-footer-icon-sm" /> Events</a></li>
              <li><a href="/resources" className="youth-footer-link"><FaChevronRight className="youth-footer-icon-sm" /> Resources</a></li>
              <li><a href="/contact" className="youth-footer-link"><FaChevronRight className="youth-footer-icon-sm" /> Contact</a></li>
              <li><a href="/privacy" className="youth-footer-link"><FaChevronRight className="youth-footer-icon-sm" /> Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="youth-footer-bottom">
          <p className="youth-copyright">© {currentYear} Sangguniang Kabataan Federation - Pasig City. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;