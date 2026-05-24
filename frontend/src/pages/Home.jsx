import { useState, useEffect } from 'react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { Link } from 'react-router-dom';
import { ArrowUpRight, Search } from 'lucide-react';
import './Home.css';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetch(`${API_URL}/api/posts`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch posts');
        return res.json();
      })
      .then(data => {
        setPosts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [API_URL]);

  // Extract unique tags dynamically
  const tags = ['all', ...new Set(posts.flatMap(p => p.tags || []))];

  // Filtering logic
  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.summary && post.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (post.author?.username && post.author.username.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = 
      selectedTag === 'all' || 
      post.tags?.includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  return (
    <div className="home-wrapper">
      <header className="hero-section">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="hero-subtitle">Vol. 01 — Computer Science</p>
          <h1 className="hero-title">Algorithms,<br />Architecture & Theory.</h1>
          
          {/* Elegant Search Container */}
          <div className="search-container">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Search by title, summary, or author..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </motion.div>
      </header>

      {/* Dynamic Tag Filters */}
      {!loading && !error && posts.length > 0 && (
        <motion.div 
          className="tags-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`tag-btn ${selectedTag === tag ? 'active' : ''}`}
            >
              {tag}
            </button>
          ))}
        </motion.div>
      )}

      {/* Bento Grid */}
      {loading ? (
        <motion.div 
          className="bento-grid"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {[1, 2, 3, 4].map(idx => (
            <div 
              key={idx} 
              className={`skeleton-card bento-${idx === 1 ? 'large' : idx === 4 ? 'medium' : 'small'}`}
            >
              <div className="skeleton-image"></div>
              <div className="skeleton-text">
                <div className="skeleton-meta">
                  <div className="skeleton-meta-item"></div>
                  <div className="skeleton-meta-item"></div>
                </div>
                <div className="skeleton-title"></div>
                <div className="skeleton-summary"></div>
                <div className="skeleton-summary short"></div>
              </div>
              <div className="shimmer-effect"></div>
            </div>
          ))}
        </motion.div>
      ) : error ? (
        <div className="error-panel glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--accent-red)' }}>
          <p>Error loading perspectives: {error}</p>
          <button onClick={() => window.location.reload()} className="tag-btn" style={{ marginTop: '1rem' }}>Retry</button>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="empty-panel glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 300 }}>No entries match your selection.</p>
          <button onClick={() => { setSearchQuery(''); setSelectedTag('all'); }} className="tag-btn" style={{ marginTop: '1.5rem' }}>Clear Filters</button>
        </div>
      ) : (
        <motion.div 
          className="bento-grid"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {filteredPosts.map((post) => (
            <motion.div key={post._id} className={`bento-card glass-panel bento-${post.size || 'medium'}`} variants={item}>
              <Link to={`/post/${post._id}`} className="bento-link">
                <div className="card-image-wrapper">
                  <img src={post.imageUrl} alt={post.title} className="card-image" />
                  <div className="card-overlay"></div>
                </div>
                <div className="card-content">
                  <div className="card-meta">
                    <span className="card-author">{post.author?.username || 'Anonymous'}</span>
                    <span className="card-reading-time">{post.readingTime} min read</span>
                  </div>
                  <h2 className="card-title">{post.title}</h2>
                  {post.summary && <p className="card-summary">{post.summary}</p>}
                  
                  {/* Visual Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: 'auto', paddingTop: '1.5rem', flexWrap: 'wrap' }}>
                      {post.tags.map(t => (
                        <span key={t} style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', opacity: 0.8 }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="card-action">
                  <ArrowUpRight strokeWidth={1} size={28} />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
