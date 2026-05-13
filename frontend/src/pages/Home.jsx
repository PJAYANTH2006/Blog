import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import './Home.css';

const mockPosts = [
  {
    _id: '1',
    title: 'Anatomy of a Database Engine.',
    summary: 'B-Trees, Write-Ahead Logs, and the illusion of ACID transactions.',
    author: { username: 'E. Codd' },
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    readingTime: 12,
    size: 'large' // for bento grid
  },
  {
    _id: '2',
    title: 'The Geometry of Neural Networks',
    summary: 'Visualizing high-dimensional loss landscapes in deep learning.',
    author: { username: 'G. Hinton' },
    imageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    readingTime: 6,
    size: 'small'
  },
  {
    _id: '3',
    title: 'Rust as a Formal Proof',
    summary: 'Why memory safety is fundamentally a mathematical certainty.',
    author: { username: 'C. Hoare' },
    imageUrl: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    readingTime: 5,
    size: 'small'
  },
  {
    _id: '4',
    title: 'Distributed Consensus',
    summary: 'Exploring the elegance of Raft and modern leader election protocols.',
    author: { username: 'L. Lamport' },
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    readingTime: 8,
    size: 'medium'
  }
];

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
        </motion.div>
      </header>

      <motion.div 
        className="bento-grid"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {mockPosts.map((post) => (
          <motion.div key={post._id} className={`bento-card glass-panel bento-${post.size}`} variants={item}>
            <Link to={`/post/${post._id}`} className="bento-link">
              <div className="card-image-wrapper">
                <img src={post.imageUrl} alt={post.title} className="card-image" />
                <div className="card-overlay"></div>
              </div>
              <div className="card-content">
                <div className="card-meta">
                  <span className="card-author">{post.author.username}</span>
                  <span className="card-reading-time">{post.readingTime} min read</span>
                </div>
                <h2 className="card-title">{post.title}</h2>
                {post.summary && <p className="card-summary">{post.summary}</p>}
              </div>
              <div className="card-action">
                <ArrowUpRight strokeWidth={1} size={28} />
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
