import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { Menu, LogOut, FileText, User, Sun, Moon } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 100], [0, -100]);
  const opacity = useTransform(scrollY, [0, 100], [1, 0]);
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    return token && username ? { username } : null;
  });

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleAuthChange = () => {
      const token = localStorage.getItem('token');
      const username = localStorage.getItem('username');
      if (token && username) {
        setUser({ username });
      } else {
        setUser(null);
      }
    };

    const handleStorageChange = (e) => {
      if (e.key === 'theme' && e.newValue) {
        setTheme(e.newValue);
      }
    };

    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('user-login', handleAuthChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('user-login', handleAuthChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    setUser(null);
    window.dispatchEvent(new Event('user-login'));
    navigate('/');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <>
      <motion.nav 
        className="navbar-main"
        style={{ opacity, y }}
      >
        <div className="nav-brand">
          <Link to="/">Blog Platform</Link>
        </div>
        <div className="nav-links">
          <Link to="/" className="nav-link">Journal</Link>
          <Link to="/write" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FileText size={14} />
            <span>Write</span>
          </Link>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <Link to="/dashboard" className="user-badge" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                <User size={12} style={{ marginRight: '0.1rem' }} />
                {user.username}
              </Link>
              <button onClick={handleSignOut} className="nav-btn-outline">
                <LogOut size={12} />
                <span>Exit</span>
              </button>
            </div>
          ) : (
            <Link to="/write" className="nav-btn">Subscribe</Link>
          )}

          {/* Theme Toggler */}
          <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle theme">
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
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
        <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
          <Link to="/write" className="nav-link-small">Write</Link>
          {user && (
            <Link to="/dashboard" style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '0.05em', textDecoration: 'none' }}>
              {user.username}
            </Link>
          )}
          {user ? (
            <button onClick={handleSignOut} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <LogOut size={12} />
            </button>
          ) : null}

          {/* Floating theme toggle */}
          <button onClick={toggleTheme} className="theme-toggle-btn-small" aria-label="Toggle theme">
            {theme === 'light' ? <Moon size={13} /> : <Sun size={13} />}
          </button>
        </div>
      </motion.nav>
    </>
  );
}
