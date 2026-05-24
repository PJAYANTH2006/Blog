import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Image, Compass, Trash2, ArrowLeft, ArrowUpRight, HelpCircle, Eye, EyeOff, Lock, User, RefreshCw } from 'lucide-react';
import './Editor.css';

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Authenticated State
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [username, setUsername] = useState(() => localStorage.getItem('username'));

  // Inline Authentication Form State (if not logged in)
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Post Composer State
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [size, setSize] = useState('medium');
  const [tags, setTags] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // Action status indicators
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [editorError, setEditorError] = useState('');

  // Handle same-tab storage changes
  useEffect(() => {
    const syncAuth = () => {
      setToken(localStorage.getItem('token'));
      setUsername(localStorage.getItem('username'));
    };
    window.addEventListener('user-login', syncAuth);
    return () => window.removeEventListener('user-login', syncAuth);
  }, []);

  // Fetch post if in Edit Mode
  // Fetch post if in Edit Mode
  useEffect(() => {
    const fetchPostDetails = async () => {
      setIsPageLoading(true);
      setEditorError('');
      try {
        const response = await fetch(`${API_URL}/api/posts/${id}`);
        if (!response.ok) {
          throw new Error('Could not fetch the specified post.');
        }
        const data = await response.json();
        
        // Verify author ownership
        const loggedInUserId = localStorage.getItem('userId');
        if (data.author && data.author._id !== loggedInUserId) {
          throw new Error('Access Denied: You are not the authorized author of this masterpiece.');
        }

        setTitle(data.title || '');
        setSummary(data.summary || '');
        setContent(data.content || '');
        setImageUrl(data.imageUrl || '');
        setSize(data.size || 'medium');
        setTags(data.tags ? data.tags.join(', ') : '');
      } catch (err) {
        setEditorError(err.message);
      } finally {
        setIsPageLoading(false);
      }
    };

    if (id && token) {
      setIsEditMode(true);
      fetchPostDetails();
    }
  }, [id, token, API_URL]);

  // Inline Authenticator Submission
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!authUsername.trim() || !authPassword.trim()) {
      return setAuthError('Please fill in all authentication fields.');
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
      localStorage.setItem('username', data.user.username);
      localStorage.setItem('userId', data.user.id);
      
      setToken(data.token);
      setUsername(data.user.username);
      window.dispatchEvent(new Event('user-login'));
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Local Image Upload handler
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setEditorError('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${API_URL}/api/posts/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'File upload failed.');
      }
      setImageUrl(data.imageUrl);
    } catch (err) {
      setEditorError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Publish or Save Revisions
  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      return setEditorError('A masterpiece requires at least a title and body content.');
    }

    setIsPublishing(true);
    setEditorError('');

    // Format tags array
    const tagsArray = tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .map(t => t.startsWith('#') ? t : `#${t}`);

    const postData = {
      title,
      summary,
      content,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200',
      size,
      tags: tagsArray
    };

    try {
      const url = isEditMode 
        ? `${API_URL}/api/posts/${id}`
        : `${API_URL}/api/posts`;
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(postData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error occurred while saving article.');
      }

      // Redirect to the newly created/updated post
      navigate(`/post/${isEditMode ? id : data._id}`);
    } catch (err) {
      setEditorError(err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  // Delete Article Action
  const handleDeletePost = async () => {
    if (!window.confirm('Are you absolutely sure you wish to delete this article? This action is irreversible.')) {
      return;
    }
    
    setIsPublishing(true);
    setEditorError('');
    try {
      const response = await fetch(`${API_URL}/api/posts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Could not delete the article.');
      }
      navigate('/');
    } catch (err) {
      setEditorError(err.message);
      setIsPublishing(false);
    }
  };

  // Client-Side Regex-based Mono Markdown parser
  const renderMarkdownHTML = (md) => {
    if (!md) return '<p style="color: var(--text-tertiary); font-style: italic;">Composing... your preview will render here.</p>';
    
    let html = md
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Blockquotes
    html = html.replace(/^\s*&gt;\s+(.+)$/gm, '<blockquote class="preview-quote">$1</blockquote>');
    
    // Headings
    html = html.replace(/^\s*###\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^\s*##\s+(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^\s*#\s+(.+)$/gm, '<h1>$1</h1>');
    
    // Code blocks
    html = html.replace(/```([\s\S]+?)```/g, '<pre class="preview-code"><code class="language-javascript">$1</code></pre>');
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="preview-inline-code">$1</code>');
    
    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Double Line breaks (paragraphs)
    html = html.replace(/\n\n/g, '</p><p>');
    
    // Single Line breaks
    html = html.replace(/\n/g, '<br />');
    
    return `<p>${html}</p>`;
  };

  // Estimate client reading time on-the-fly
  const getEstimatedReadingTime = () => {
    const words = content.trim().split(/\s+/).filter(w => w.length > 0).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  // Auth Drawer Screen
  if (!token) {
    return (
      <div className="editor-auth-fullscreen">
        <div className="auth-card-wrapper glass-panel">
          <div className="auth-card-badge">
            <Lock size={14} style={{ color: 'var(--accent-gold)' }} />
            <span>Author Portal Locked</span>
          </div>
          <h2>Access Creative Console</h2>
          <p className="auth-subtitle">Sign in or create an author profile to publish deep-dives on systems engineering, mathematics, and aesthetics.</p>
          
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
                  placeholder="e.g. L. Lamport"
                  required
                />
              </div>
            </div>
            
            <div className="auth-input-group">
              <label>Console Passphrase</label>
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
                  <span>Configuring Session...</span>
                </>
              ) : authMode === 'login' ? (
                <>
                  <span>Sign In & Compose</span>
                  <ArrowUpRight size={16} />
                </>
              ) : (
                <>
                  <span>Initialize Author Account</span>
                  <ArrowUpRight size={16} />
                </>
              )}
            </button>
          </form>
          
          <div className="auth-card-footer">
            {authMode === 'login' ? (
              <p>New to the terminal? <button onClick={() => setAuthMode('register')}>Create profile</button></p>
            ) : (
              <p>Already an author? <button onClick={() => setAuthMode('login')}>Sign in</button></p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Loader state while fetching post
  if (isPageLoading) {
    return (
      <div className="editor-loading-screen">
        <RefreshCw className="spinning-icon" size={40} style={{ color: 'var(--accent-gold)' }} />
        <h3>Recalling Document Revisions...</h3>
        <p>Fetching post metadata from the server.</p>
      </div>
    );
  }

  return (
    <div className="editor-workspace-container">
      {/* Upper Navigation Bar */}
      <div className="editor-actions-header">
        <button onClick={() => navigate(-1)} className="btn-back">
          <ArrowLeft size={16} />
          <span>Journal</span>
        </button>
        
        <div className="editor-status-middle">
          {isEditMode ? (
            <span className="badge-revision">REVISION WORKSPACE</span>
          ) : (
            <span className="badge-draft">NEW DRAFT</span>
          )}
          {title && <span className="current-title-truncate">“{title}”</span>}
        </div>
        
        <div className="editor-buttons-right">
          {isEditMode && (
            <button 
              onClick={handleDeletePost} 
              disabled={isPublishing} 
              className="btn-danger"
              title="Delete Article"
            >
              <Trash2 size={16} />
              <span>Delete</span>
            </button>
          )}
          
          <button 
            onClick={handlePublish} 
            disabled={isPublishing} 
            className="btn-publish"
          >
            {isPublishing ? (
              <>
                <RefreshCw className="spinning-icon" size={16} />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <span>Publish Masterpiece</span>
                <ArrowUpRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>

      {editorError && (
        <div className="editor-workspace-error">
          <span>{editorError}</span>
          <button onClick={() => setEditorError('')}>×</button>
        </div>
      )}

      {/* Main Split Pane Layout */}
      <div className="editor-split-panes">
        {/* LEFT WORKSPACE: COMPOSE */}
        <div className="editor-pane pane-compose">
          <div className="pane-header">
            <div className="pane-header-title">
              <FileText size={16} />
              <span>Compose Masterpiece</span>
            </div>
            <div className="pane-header-details">
              <span>{content.trim().split(/\s+/).filter(Boolean).length} Words</span>
            </div>
          </div>
          
          <div className="compose-fields-scrollable">
            {/* Cover Image Uploader */}
            <div className="uploader-box-container">
              {imageUrl ? (
                <div className="cover-preview-wrapper" style={{ backgroundImage: `url(${imageUrl})` }}>
                  <div className="cover-preview-overlay">
                    <button onClick={() => setImageUrl('')} className="btn-remove-cover">
                      <Trash2 size={14} />
                      <span>Remove Cover Image</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current.click()} 
                  className={`uploader-dropzone ${isUploading ? 'loading-upload' : ''}`}
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="spinning-icon" size={24} style={{ color: 'var(--accent-gold)' }} />
                      <p>Hosting Image File...</p>
                    </>
                  ) : (
                    <>
                      <Image size={24} style={{ color: 'var(--text-tertiary)' }} />
                      <p>Drag Cover Image or <span>Click to Upload</span></p>
                      <span className="file-limits">Multer storage engine | Maximum 5MB</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                  />
                </div>
              )}
              
              {/* Fallback Image URL Input */}
              <div className="url-image-input-group">
                <input 
                  type="text" 
                  value={imageUrl} 
                  onChange={(e) => setImageUrl(e.target.value)} 
                  placeholder="Or paste external Cover Image URL (e.g. Unsplash)..."
                />
              </div>
            </div>

            {/* Title Composer Area */}
            <div className="composer-field-group field-title">
              <textarea 
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  // Autosize heights
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                placeholder="Title your perspective..."
                rows={1}
                required
              />
            </div>

            {/* Layout Sizing & Tags Configuration */}
            <div className="editor-meta-flex-row">
              <div className="composer-field-group flex-1">
                <label>Bento Sizing Grid</label>
                <select value={size} onChange={(e) => setSize(e.target.value)}>
                  <option value="large">Large Card (Width: 2/3)</option>
                  <option value="medium">Medium Card (Width: 1/2)</option>
                  <option value="small">Small Card (Width: 1/3)</option>
                </select>
              </div>

              <div className="composer-field-group flex-1">
                <label>Tags (Comma separated)</label>
                <input 
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="systems, logic, computer science"
                />
              </div>
            </div>

            {/* Summary Input */}
            <div className="composer-field-group field-summary">
              <label>Article Summary (Aesthetic Teaser)</label>
              <textarea 
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="A concise, evocative synopsis highlighting the thesis of this perspective..."
                rows={2}
              />
            </div>

            {/* Markdown Text Area Composing */}
            <div className="composer-field-group field-markdown-content">
              <div className="markdown-labels-header">
                <label>Markdown Editor Terminal</label>
                <span className="markdown-cheatsheet-trigger" title="Supports H1 (#), H2 (##), H3 (###), Quotes (>), Bold (**text**), Italics (*text*), Code Blocks (```)">
                  <HelpCircle size={12} />
                  <span>Cheat sheet</span>
                </span>
              </div>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write in standard markdown or clean HTML...&#10;&#10;Use # for H1, ## for H2, > for citations, and ``` for blocks of code."
                rows={15}
                required
              />
            </div>
          </div>
        </div>

        {/* RIGHT WORKSPACE: LIVE PREVIEW */}
        <div className="editor-pane pane-preview">
          <div className="pane-header">
            <div className="pane-header-title">
              <Compass size={16} style={{ color: 'var(--accent-gold)' }} />
              <span>Live Rendering</span>
            </div>
            <div className="pane-header-details">
              <span>{getEstimatedReadingTime()} Minute Read</span>
            </div>
          </div>

          <div className="preview-document-scrollable">
            <div className="preview-document-frame glass-panel">
              {/* Preview Banner */}
              <div 
                className="preview-article-banner" 
                style={{ 
                  backgroundImage: `url(${imageUrl || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200'})`,
                  opacity: imageUrl ? 1 : 0.4
                }}
              ></div>
              
              <div className="preview-article-body">
                {/* Meta details */}
                <div className="preview-article-meta">
                  <span className="preview-meta-author">
                    <User size={10} style={{ marginRight: '0.1rem' }} />
                    {username || 'Author Pseudonym'}
                  </span>
                  <span className="preview-meta-dot">•</span>
                  <span>{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="preview-meta-dot">•</span>
                  <span>{getEstimatedReadingTime()} Min Read</span>
                </div>

                {/* Title */}
                <h1 className="preview-article-title">{title || 'Untitled Masterpiece'}</h1>

                {/* Summary */}
                {summary && (
                  <p className="preview-article-summary">{summary}</p>
                )}

                {/* Subtitle Divider line */}
                <div className="preview-divider-line"></div>

                {/* Dynamic Markdown parsed Content */}
                <div 
                  className="preview-article-content-rendered"
                  dangerouslySetInnerHTML={{ __html: renderMarkdownHTML(content) }}
                ></div>
                
                {/* Rendered Tags */}
                {tags && (
                  <div className="preview-tags-container">
                    {tags.split(',').map(t => t.trim()).filter(t => t.length > 0).map(t => (
                      <span key={t} className="preview-tag-badge">
                        {t.startsWith('#') ? t : `#${t}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
