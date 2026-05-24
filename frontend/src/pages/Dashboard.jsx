import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Bookmark, FileText, User, Calendar, Trash2, ArrowUpRight, Compass, Edit, Heart, MessageSquare, Lock, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import './Dashboard.css';

export default function Dashboard() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Authentication State
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [username, setUsername] = useState(() => localStorage.getItem('username'));

  // Quick Auth Panel state (for guests)
  const [authMode, setAuthMode] = useState('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Profile data state
  const [profile, setProfile] = useState(null);
  const [writtenPosts, setWrittenPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Active Tab: 'bookmarks' | 'history' | 'console'
  const [activeTab, setActiveTab] = useState('bookmarks');

  // Same-tab authentication listener
  useEffect(() => {
    const handleAuthChange = () => {
      setToken(localStorage.getItem('token'));
      setUsername(localStorage.getItem('username'));
    };
    window.addEventListener('user-login', handleAuthChange);
    return () => window.removeEventListener('user-login', handleAuthChange);
  }, []);

  // Fetch unified profile data when token is available
  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch(`${API_URL}/api/users/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to retrieve profile data.');
        }
        setProfile(data.user);
        setWrittenPosts(data.writtenPosts || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchUserProfile();
    }
  }, [token, API_URL]);

  // Auth Submit handler (if guest)
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!authUsername.trim() || !authPassword.trim()) {
      return setAuthError('Please fill in all credentials.');
    }

    setAuthLoading(true);
    try {
      const url = `${API_URL}/api/auth/${authMode}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUsername, password: authPassword })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed.');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.user ? data.user.username : data.username);
      localStorage.setItem('userId', data.user ? data.user.id : data.userId);

      setToken(data.token);
      setUsername(data.user ? data.user.username : data.username);
      window.dispatchEvent(new Event('user-login'));
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Toggle bookmark directly from Dashboard
  const handleRemoveBookmark = async (e, postId) => {
    e.stopPropagation();
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/api/users/bookmarks/${postId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Could not toggle bookmark.');
      
      // Update local state by filtering out bookmarked item
      setProfile(prev => ({
        ...prev,
        bookmarks: prev.bookmarks.filter(b => b._id !== postId)
      }));
    } catch (err) {
      console.error(err);
    }
  };

  // Delete written article cascading comments
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you wish to delete this article? All comments will be cascaded.')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete the article.');
      }
      
      // Update written posts list
      setWrittenPosts(prev => prev.filter(p => p._id !== postId));
    } catch (err) {
      alert(err.message);
    }
  };

  // Compute average reading progress
  const getAverageReadingProgress = () => {
    if (!profile || !profile.readingHistory || profile.readingHistory.length === 0) return 0;
    const total = profile.readingHistory.reduce((sum, h) => sum + (h.progress || 0), 0);
    return Math.round(total / profile.readingHistory.length);
  };

  // Render Fullscreen Authenticator if Guest
  if (!token) {
    return (
      <div className="dashboard-auth-fullscreen">
        <div className="auth-card-wrapper glass-panel">
          <div className="auth-card-badge">
            <Lock size={14} style={{ color: 'var(--accent-gold)' }} />
            <span>Identity Protected</span>
          </div>
          <h2>Unlock Personal Workspace</h2>
          <p className="auth-subtitle">Sign in or register an account to view your reading histories, organize bookmarked resources, and track authored perspectives.</p>
          
          {authError && <div className="auth-error-banner">{authError}</div>}
          
          <form onSubmit={handleAuthSubmit} className="auth-form-body">
            <div className="auth-input-group">
              <label>Pseudonym / Username</label>
              <div className="input-with-icon">
                <User size={16} />
                <input 
                  type="text" 
                  value={authUsername} 
                  onChange={(e) => setAuthUsername(e.target.value)} 
                  placeholder="Username"
                  required
                />
              </div>
            </div>
            
            <div className="auth-input-group">
              <label>Passphrase</label>
              <div className="input-with-icon">
                <Lock size={16} />
                <input 
                  type="password" 
                  value={authPassword} 
                  onChange={(e) => setAuthPassword(e.target.value)} 
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>
            
            <button type="submit" disabled={authLoading} className="auth-submit-btn">
              {authLoading ? (
                <>
                  <RefreshCw className="spinning-icon" size={16} />
                  <span>Authorizing...</span>
                </>
              ) : authMode === 'login' ? (
                <>
                  <span>Unlock Profile Console</span>
                  <ArrowUpRight size={16} />
                </>
              ) : (
                <>
                  <span>Initialize Account</span>
                  <ArrowUpRight size={16} />
                </>
              )}
            </button>
          </form>
          
          <div className="auth-card-footer">
            {authMode === 'login' ? (
              <p>New pseudonymous reader? <button onClick={() => setAuthMode('register')}>Initialize profile</button></p>
            ) : (
              <p>Already registered? <button onClick={() => setAuthMode('login')}>Unlock session</button></p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Loading Screen
  if (isLoading || !profile) {
    return (
      <div className="dashboard-loading-screen">
        <RefreshCw className="spinning-icon" size={40} style={{ color: 'var(--accent-gold)' }} />
        <h3>Retrieving Profile Stats...</h3>
        <p>Connecting to system database terminal.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page-container">
      {error && <div className="auth-error-banner" style={{ marginBottom: '1.5rem' }}>{error}</div>}
      {/* 1. Header Profile Banner Card */}
      <div className="dashboard-profile-header glass-panel">
        <div className="profile-header-main">
          <div className="avatar-circle">
            <span>{username ? username.substring(0, 2).toUpperCase() : 'US'}</span>
          </div>
          <div className="profile-user-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <h2>{profile.username}</h2>
              {writtenPosts.length > 0 && <span className="author-badge-glow">AUTHOR CONTROLLER</span>}
            </div>
            <p className="profile-join-date">
              <Calendar size={12} />
              <span>Joined console on {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
            </p>
          </div>
        </div>

        {/* Stats Block Grid */}
        <div className="profile-stats-grid">
          <div className="stat-item-box">
            <span className="stat-value">{profile.bookmarks ? profile.bookmarks.length : 0}</span>
            <span className="stat-label">Bookmarks</span>
          </div>

          <div className="stat-item-box">
            <span className="stat-value">{getAverageReadingProgress()}%</span>
            <span className="stat-label">Avg. Progress</span>
          </div>

          <div className="stat-item-box">
            <span className="stat-value">{writtenPosts.length}</span>
            <span className="stat-label">Perspectives Written</span>
          </div>
        </div>
      </div>

      {/* 2. Tabs Navigation bar */}
      <div className="dashboard-tabs-nav">
        <button 
          onClick={() => setActiveTab('bookmarks')}
          className={`tab-toggle-btn ${activeTab === 'bookmarks' ? 'active' : ''}`}
        >
          <Bookmark size={14} />
          <span>Bookmarks Library</span>
        </button>

        <button 
          onClick={() => setActiveTab('history')}
          className={`tab-toggle-btn ${activeTab === 'history' ? 'active' : ''}`}
        >
          <BookOpen size={14} />
          <span>Reading Logbook</span>
        </button>

        {writtenPosts.length > 0 && (
          <button 
            onClick={() => setActiveTab('console')}
            className={`tab-toggle-btn ${activeTab === 'console' ? 'active' : ''}`}
          >
            <FileText size={14} />
            <span>Author Console</span>
          </button>
        )}
      </div>

      {/* 3. Render Active Tab Panel */}
      <div className="tab-pane-content">
        <AnimatePresence mode="wait">
          {activeTab === 'bookmarks' && (
            <motion.div 
              key="bookmarks"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="bookmarks-tab-grid"
            >
              {profile.bookmarks && profile.bookmarks.length === 0 ? (
                <div className="empty-tab-state glass-panel">
                  <Bookmark size={40} style={{ color: 'var(--text-tertiary)', marginBottom: '1rem' }} />
                  <h3>Library Empty</h3>
                  <p>Save evocative deep-dives by clicking the bookmark ribbon icon inside perspectives.</p>
                  <Link to="/" className="btn-explore">
                    <span>Explore Perspectives</span>
                    <Compass size={14} />
                  </Link>
                </div>
              ) : (
                <div className="dashboard-grid-layout">
                  {profile.bookmarks.map(post => (
                    <div key={post._id} className="dashboard-card glass-panel">
                      <div 
                        className="card-banner-preview" 
                        style={{ backgroundImage: `url(${post.imageUrl})` }}
                      />
                      <div className="card-body-preview">
                        <div className="card-meta-row">
                          <span className="card-author-name">{post.author?.username || 'Pseudonym'}</span>
                          <span>{post.readingTime || 5} Min read</span>
                        </div>
                        <h3><Link to={`/post/${post._id}`}>{post.title}</Link></h3>
                        <p className="card-teaser-summary">{post.summary || 'Click to read this bookmarked masterpiece.'}</p>
                        
                        <div className="card-actions-row">
                          <button 
                            onClick={(e) => handleRemoveBookmark(e, post._id)} 
                            className="btn-card-action btn-unsave"
                            title="Remove Bookmark"
                          >
                            <Trash2 size={14} />
                            <span>Remove</span>
                          </button>
                          
                          <Link to={`/post/${post._id}`} className="btn-card-read">
                            <span>Read Article</span>
                            <ArrowUpRight size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="history-tab-list"
            >
              {!profile.readingHistory || profile.readingHistory.length === 0 ? (
                <div className="empty-tab-state glass-panel">
                  <BookOpen size={40} style={{ color: 'var(--text-tertiary)', marginBottom: '1rem' }} />
                  <h3>Logbook Blank</h3>
                  <p>Read logs will compile automatically as you scroll through published perspectives.</p>
                  <Link to="/" className="btn-explore">
                    <span>Explore Perspectives</span>
                    <Compass size={14} />
                  </Link>
                </div>
              ) : (
                <div className="history-timeline-container">
                  {profile.readingHistory.map(entry => {
                    if (!entry.post) return null;
                    return (
                      <div key={entry._id} className="history-item-row glass-panel">
                        <div className="history-info-col">
                          <span className="history-date-stamp">
                            {new Date(entry.readAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <h3><Link to={`/post/${entry.post._id}`}>{entry.post.title}</Link></h3>
                          <div className="history-progress-wrapper">
                            <div className="progress-outer-track">
                              <div 
                                className="progress-inner-fill" 
                                style={{ width: `${entry.progress || 0}%` }}
                              />
                            </div>
                            <span className="progress-percentage-label">
                              {entry.progress === 100 ? (
                                <span className="badge-read-completed">COMPLETED</span>
                              ) : (
                                `${entry.progress}% READ`
                              )}
                            </span>
                          </div>
                        </div>

                        <Link to={`/post/${entry.post._id}`} className="btn-resume-read">
                          <span>{entry.progress === 100 ? 'Re-read' : 'Resume'}</span>
                          <ArrowUpRight size={14} />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'console' && (
            <motion.div 
              key="console"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="console-tab-list"
            >
              <div className="console-header-flex">
                <h3>Pseudonym Publications Console</h3>
                <Link to="/write" className="btn-new-masterpiece">
                  <span>Compose New Perspective</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>

              <div className="console-items-grid">
                {writtenPosts.map(post => (
                  <div key={post._id} className="console-item-card glass-panel">
                    <div className="console-item-info">
                      <span className="console-item-date">{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <h4><Link to={`/post/${post._id}`}>{post.title}</Link></h4>
                      <p className="console-item-teaser">{post.summary || 'Refining low-latency logic.'}</p>
                      
                      {/* Metric Badges */}
                      <div className="console-metrics-row">
                        <span className="metric-badge">
                          <Heart size={12} style={{ color: '#ef4444' }} />
                          <span>{post.likes ? post.likes.length : 0} Likes</span>
                        </span>
                        <span className="metric-badge">
                          <MessageSquare size={12} style={{ color: 'var(--accent-gold)' }} />
                          <span>{post.comments ? post.comments.length : 0} Discussions</span>
                        </span>
                      </div>
                    </div>

                    <div className="console-item-actions">
                      <Link to={`/edit/${post._id}`} className="btn-console-edit" title="Edit Article">
                        <Edit size={14} />
                        <span>Edit</span>
                      </Link>
                      <button 
                        onClick={() => handleDeletePost(post._id)} 
                        className="btn-console-delete"
                        title="Delete Article"
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
