import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Heart, MessageSquare, Send, Lock, User, FileText, Bookmark } from 'lucide-react';
import './PostView.css';

export default function PostView() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Interaction / Like / Bookmark / Scroll States
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const milestonesSent = useRef(new Set());

  // Authentication State
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const userId = localStorage.getItem('userId');
    return token && username ? { token, username, userId } : null;
  });

  // Auth Form State (for quick in-line auth)
  const [authTab, setAuthTab] = useState('login'); // login | register
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Comment input state
  const [commentContent, setCommentContent] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Fetch article, comments and check like status
  useEffect(() => {
    setLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
    setError(null);

    // Fetch single post
    fetch(`${API_URL}/api/posts/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Post not found');
        return res.json();
      })
      .then(data => {
        setPost(data);
        setLikesCount(data.likes?.length || 0);

        // If user is logged in, check if they liked this post
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId && data.likes) {
          setLiked(data.likes.includes(storedUserId));
        }
        
        // Fetch comments
        return fetch(`${API_URL}/api/posts/${id}/comments`);
      })
      .then(res => res.json())
      .then(commentData => {
        setComments(commentData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [id, API_URL]);

  // Decoded likes check on user change
  useEffect(() => {
    if (post && user) {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId && post.likes) {
        setLiked(post.likes.includes(storedUserId)); // eslint-disable-line react-hooks/set-state-in-effect
      }
    } else {
      setLiked(false);
    }
  }, [post, user]);

  // Handle Like Toggle
  const handleLikeToggle = () => {
    if (!user) {
      alert('Please sign in below to appreciate this perspective.');
      return;
    }

    fetch(`${API_URL}/api/posts/${id}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to like post');
        return res.json();
      })
      .then(data => {
        setLikesCount(data.likesCount);
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
          setLiked(data.likes.includes(storedUserId));
        } else {
          setLiked(prev => !prev);
        }
      })
      .catch(err => {
        console.error(err);
      });
  };

  // Handle Comment Submission
  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentContent.trim() || commentSubmitting) return;

    setCommentSubmitting(true);

    fetch(`${API_URL}/api/posts/${id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify({ content: commentContent })
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to post comment');
        return res.json();
      })
      .then(newComment => {
        setComments(prev => [...prev, newComment]);
        setCommentContent('');
        setCommentSubmitting(false);
      })
      .catch(err => {
        console.error(err);
        setCommentSubmitting(false);
      });
  };

  // Handle Quick Login / Register
  const handleQuickAuth = (e) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput || authSubmitting) return;

    setAuthSubmitting(true);
    setAuthError(null);

    const endpoint = authTab === 'login' ? '/api/auth/login' : '/api/auth/register';

    fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameInput, password: passwordInput })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Authentication failed');
        return data;
      })
      .then(data => {
        if (authTab === 'login') {
          localStorage.setItem('token', data.token);
          localStorage.setItem('username', data.username);
          
          try {
            const payload = JSON.parse(atob(data.token.split('.')[1]));
            localStorage.setItem('userId', payload.userId);
            setUser({ token: data.token, username: data.username, userId: payload.userId });
          } catch {
            setUser({ token: data.token, username: data.username });
          }
          
          setUsernameInput('');
          setPasswordInput('');
        } else {
          setAuthTab('login');
          setAuthError('Registration successful! Please log in with your credentials.');
        }
        setAuthSubmitting(false);
      })
      .catch(err => {
        console.error(err);
        setAuthError(err.message);
        setAuthSubmitting(false);
      });
  };

  // Handle Sign Out
  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    setUser(null);
  };

  // Fetch bookmark status for current post
  useEffect(() => {
    if (user?.token) {
      fetch(`${API_URL}/api/users/profile`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.user && data.user.bookmarks) {
            const bookmarkedIds = data.user.bookmarks.map(b => typeof b === 'object' ? b._id : b);
            setBookmarked(bookmarkedIds.includes(id));
          }
        })
        .catch(err => console.error('Error fetching bookmark profile status:', err));
    } else {
      setBookmarked(false); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [id, user, API_URL]);

  // Scroll Progression Tracking & Milestone logger
  useEffect(() => {
    if (!user?.token) return;

    // Reset milestones Sent state
    milestonesSent.current.clear();

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
      setScrollProgress(scrollPercent);

      // Check and fire milestone logs
      const milestones = [25, 50, 75, 100];
      for (const m of milestones) {
        if (scrollPercent >= m && !milestonesSent.current.has(m)) {
          milestonesSent.current.add(m);
          fetch(`${API_URL}/api/users/history/${id}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({ progress: m })
          })
            .catch(err => console.error('Error logging scroll milestone progress:', err));
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [id, user, API_URL]);

  // Handle Bookmarks Toggle
  const handleBookmarkToggle = () => {
    if (!user?.token) return;

    fetch(`${API_URL}/api/users/bookmarks/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Bookmark toggle failed');
        return res.json();
      })
      .then(data => {
        setBookmarked(data.bookmarked);
      })
      .catch(err => {
        console.error(err);
      });
  };

  if (loading) {
    return (
      <div className="post-view-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <Link to="/" className="back-link"><ArrowLeft size={16} /><span>Return</span></Link>
        <div className="skeleton-title" style={{ height: '3rem', width: '70%', background: 'rgba(255,255,255,0.03)' }}></div>
        <div className="skeleton-image" style={{ height: '40vh', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
          <div className="skeleton-summary" style={{ height: '1.2rem', width: '100%', background: 'rgba(255,255,255,0.02)' }}></div>
          <div className="skeleton-summary" style={{ height: '1.2rem', width: '95%', background: 'rgba(255,255,255,0.02)' }}></div>
          <div className="skeleton-summary" style={{ height: '1.2rem', width: '80%', background: 'rgba(255,255,255,0.02)' }}></div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="post-view-wrapper" style={{ textAlign: 'center', paddingTop: '10rem' }}>
        <h2 style={{ color: 'var(--accent-red)', fontWeight: 400 }}>Perspectives Unavailable</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '1rem 0' }}>{error || 'The requested article does not exist.'}</p>
        <Link to="/" className="tag-btn" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '1rem' }}>Return Home</Link>
      </div>
    );
  }

  return (
    <motion.div 
      className="post-view-wrapper"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Scroll Progress Indicator Bar */}
      {user && (
        <div 
          className="scroll-progress-indicator" 
          style={{ 
            position: 'fixed', 
            top: '5.5rem', 
            left: 0, 
            width: `${scrollProgress}%`, 
            height: '3px', 
            background: 'var(--accent-gold)', 
            boxShadow: '0 0 8px var(--accent-gold)', 
            zIndex: 9999, 
            transition: 'width 0.1s ease-out' 
          }}
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <Link to="/" className="back-link" style={{ margin: 0 }}>
          <ArrowLeft size={20} />
          <span>Return</span>
        </Link>
        {post && post.author && localStorage.getItem('userId') === post.author._id && (
          <Link to={`/edit/${post._id}`} className="tag-btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.8rem', margin: 0 }}>
            <FileText size={14} style={{ color: 'var(--accent-gold)' }} />
            <span>Edit Article</span>
          </Link>
        )}
      </div>

      <article className="post-article">
        <header className="post-header">
          <motion.div 
            className="post-meta"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="post-author">{post.author?.username || 'Anonymous'}</span>
            <span className="post-date">{new Date(post.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span className="post-read-time">{post.readingTime || 5} min read</span>
          </motion.div>
          
          <motion.h1 
            className="post-title"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            {post.title}
          </motion.h1>
        </header>

        <motion.div 
          className="post-hero-image"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
        >
          <img src={post.imageUrl} alt={post.title} />
        </motion.div>

        <motion.div 
          className="post-content"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      {/* Heart / Appreciations & Bookmarks Bar */}
      <section className="post-interactions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button 
          onClick={handleLikeToggle} 
          className={`like-btn ${liked ? 'liked' : ''}`}
          aria-label="Like this perspective"
        >
          <Heart 
            className="like-icon-svg" 
            size={18} 
            fill={liked ? '#ef4444' : 'transparent'} 
            stroke={liked ? '#ef4444' : 'currentColor'} 
          />
          <span>{likesCount} Appreciations</span>
        </button>

        {user && (
          <button 
            onClick={handleBookmarkToggle} 
            className={`like-btn bookmark-btn ${bookmarked ? 'bookmarked' : ''}`}
            aria-label="Bookmark this perspective"
            style={{ 
              border: bookmarked ? '1px solid var(--accent-gold)' : '1px solid var(--border-color)', 
              color: bookmarked ? 'var(--accent-gold)' : 'var(--text-secondary)' 
            }}
          >
            <Bookmark 
              size={18} 
              fill={bookmarked ? 'var(--accent-gold)' : 'transparent'} 
              stroke={bookmarked ? 'var(--accent-gold)' : 'currentColor'} 
            />
            <span>{bookmarked ? 'Bookmarked' : 'Bookmark'}</span>
          </button>
        )}
        {!user && <span className="like-hint">Sign in to express your appreciation</span>}
      </section>

      {/* Dynamic Discussions Panel */}
      <section className="discussions-wrapper">
        <h2 className="discussions-title">
          <MessageSquare size={22} style={{ color: 'var(--accent-gold)' }} />
          <span>Discussions ({comments.length})</span>
        </h2>

        {/* Discussions List */}
        <div className="comments-list">
          {comments.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.95rem', fontStyle: 'italic', fontWeight: 300 }}>
              No perspectives shared on this topic yet. Be the first to share your thoughts.
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment._id} className="comment-card">
                <div className="comment-meta">
                  <span className="comment-author">
                    <User size={12} strokeWidth={2.5} style={{ marginRight: '0.2rem', color: 'var(--accent-gold)' }} />
                    {comment.author?.username || 'Anonymous Writer'}
                  </span>
                  <span className="comment-date">
                    {new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="comment-body">{comment.content}</div>
              </div>
            ))
          )}
        </div>

        {/* Comment Composer */}
        <div className="comment-composer">
          {user ? (
            <form onSubmit={handleCommentSubmit}>
              <div className="composer-user-info">
                <span>Sharing thoughts as <strong>{user.username}</strong></span>
                <button type="button" onClick={handleSignOut} className="signout-link">Sign Out</button>
              </div>
              <textarea
                placeholder="Share your perspective, raise a query, or offer constructive critique..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                className="composer-textarea"
                required
              />
              <button 
                type="submit" 
                disabled={commentSubmitting} 
                className="submit-comment-btn"
              >
                <Send size={14} />
                <span>{commentSubmitting ? 'Sharing...' : 'Share Perspective'}</span>
              </button>
            </form>
          ) : (
            <div className="auth-prompt-card">
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--accent-gold)' }}>
                <Lock size={24} strokeWidth={1.5} />
              </div>
              <h3 className="auth-prompt-title">Join the Discussion</h3>
              <p className="auth-prompt-subtitle">Access writing capabilities to comment and appreciate posts.</p>
              
              {/* Form Tabs */}
              <div className="auth-tabs">
                <button 
                  type="button" 
                  className={`auth-tab-btn ${authTab === 'login' ? 'active' : ''}`}
                  onClick={() => { setAuthTab('login'); setAuthError(null); }}
                >
                  Sign In
                </button>
                <button 
                  type="button" 
                  className={`auth-tab-btn ${authTab === 'register' ? 'active' : ''}`}
                  onClick={() => { setAuthTab('register'); setAuthError(null); }}
                >
                  Register
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleQuickAuth} className="auth-form">
                <div className="auth-input-wrapper">
                  <User size={14} className="auth-input-icon" />
                  <input
                    type="text"
                    placeholder="Username"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="auth-input"
                    required
                  />
                </div>
                <div className="auth-input-wrapper">
                  <Lock size={14} className="auth-input-icon" />
                  <input
                    type="password"
                    placeholder="Password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="auth-input"
                    required
                  />
                </div>
                <button type="submit" disabled={authSubmitting} className="auth-submit-btn">
                  {authSubmitting ? 'Processing...' : authTab === 'login' ? 'Sign In' : 'Register'}
                </button>
                {authError && <div className="auth-error">{authError}</div>}
              </form>
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}
