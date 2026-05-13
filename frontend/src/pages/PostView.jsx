import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './PostView.css';

export default function PostView() {
  const { id } = useParams();

  // Mock data for display purposes
  const post = {
    title: 'The Architecture of Silence.',
    author: { username: 'D. M. Vance' },
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    content: `
      <p>Modernism brought us the glass box. Brutalism brought us the concrete monolith. But what does the current digital age bring us? We live in an era of invisible interfaces, where the best design is often the one you notice the least. Yet, there is a rebellion brewing. A return to texture, to depth, to the feeling of weight in a weightless medium.</p>
      <p>Consider the silence of a blank page compared to the noise of a cluttered dashboard. The power of negative space isn't just about what is absent, but how it frames what is present. True aesthetic value in the digital realm comes from intentionality—every pixel, every transition, every typography choice.</p>
      <blockquote><p>"The spaces between the elements carry as much weight as the elements themselves."</p></blockquote>
      <p>We are no longer satisfied with flat colors and generic templates. We crave the bespoke, the hand-crafted, the asymmetric. We want our digital environments to evoke emotion, much like a well-designed physical space does. This is the new frontier of web design: creating silence amidst the noise.</p>
    `,
    createdAt: '2026-04-15T12:00:00Z',
    readingTime: 4
  };

  return (
    <motion.div 
      className="post-view-wrapper"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Link to="/" className="back-link">
        <ArrowLeft size={20} />
        <span>Return</span>
      </Link>

      <article className="post-article">
        <header className="post-header">
          <motion.div 
            className="post-meta"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="post-author">{post.author.username}</span>
            <span className="post-date">{new Date(post.createdAt).toLocaleDateString()}</span>
            <span className="post-read-time">{post.readingTime} min read</span>
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
    </motion.div>
  );
}
