import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Menu } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 100], [0, -100]);
  const opacity = useTransform(scrollY, [0, 100], [1, 0]);

  return (
    <>
      <motion.nav 
        className="navbar-main"
        style={{ opacity, y }}
      >
        <div className="nav-brand">
          <Link to="/">System.out</Link>
        </div>
        <div className="nav-links">
          <Link to="/journal" className="nav-link">Journal</Link>
          <Link to="/manifesto" className="nav-link">Manifesto</Link>
          <button className="nav-btn">Subscribe</button>
        </div>
        <button className="nav-mobile-toggle">
          <Menu size={24} />
        </button>
      </motion.nav>

      {/* Floating minimal nav that appears when scrolling down */}
      <motion.nav 
        className="navbar-floating glass-panel"
        initial={{ y: -100, opacity: 0 }}
        animate={{ 
          y: scrollY.get() > 150 ? 0 : -100,
          opacity: scrollY.get() > 150 ? 1 : 0
        }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <Link to="/" className="nav-brand-small">Sys</Link>
        <button className="nav-btn-small">Menu</button>
      </motion.nav>
    </>
  );
}
