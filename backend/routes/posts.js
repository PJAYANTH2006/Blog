const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');

// Setup Multer Storage Engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Single image file upload route
router.post('/upload', auth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }
    const host = req.get('host');
    const protocol = req.protocol;
    const imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().populate('author', 'username').sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'username');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create dynamic post (automatically computes reading time)
router.post('/', auth, async (req, res) => {
  try {
    const wordCount = req.body.content ? req.body.content.split(/\s+/).length : 0;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    const post = new Post({ 
      ...req.body, 
      author: req.userId,
      readingTime
    });
    
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit existing post (verifies author validation)
router.put('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    let readingTime = post.readingTime;
    if (req.body.content) {
      const wordCount = req.body.content.split(/\s+/).length;
      readingTime = Math.max(1, Math.ceil(wordCount / 200));
    }

    post.title = req.body.title || post.title;
    post.summary = req.body.summary !== undefined ? req.body.summary : post.summary;
    post.content = req.body.content || post.content;
    post.imageUrl = req.body.imageUrl || post.imageUrl;
    post.size = req.body.size || post.size;
    post.tags = req.body.tags || post.tags;
    post.readingTime = readingTime;

    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cascade deletions (post + associated discussions)
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.userId) return res.status(403).json({ message: 'Unauthorized' });

    // Cascade delete comments
    await Comment.deleteMany({ post: req.params.id });
    await post.deleteOne();
    
    res.json({ message: 'Post deleted and discussions cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle Like
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const userLikeIndex = post.likes.indexOf(req.userId);
    if (userLikeIndex === -1) {
      post.likes.push(req.userId);
    } else {
      post.likes.splice(userLikeIndex, 1);
    }
    await post.save();
    res.json({ likesCount: post.likes.length, likes: post.likes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch comments for a post
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.id })
      .populate('author', 'username')
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Post a comment
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Comment content is required' });
    }
    const comment = new Comment({
      post: req.params.id,
      author: req.userId,
      content
    });
    await comment.save();
    await comment.populate('author', 'username');
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
