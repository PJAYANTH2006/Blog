const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

// Get User Profile details (bookmarks, reading history, and authored posts)
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password')
      .populate({
        path: 'bookmarks',
        populate: { path: 'author', select: 'username' }
      })
      .populate({
        path: 'readingHistory.post',
        populate: { path: 'author', select: 'username' }
      });

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Fetch posts written by this user
    const writtenPosts = await Post.find({ author: req.userId }).sort({ createdAt: -1 });

    res.json({
      user,
      writtenPosts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle Post Bookmark
router.post('/bookmarks/:postId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const index = user.bookmarks.indexOf(req.params.postId);
    let bookmarked = false;
    
    if (index === -1) {
      user.bookmarks.push(req.params.postId);
      bookmarked = true;
    } else {
      user.bookmarks.splice(index, 1);
      bookmarked = false;
    }
    
    await user.save();
    res.json({ bookmarked, bookmarks: user.bookmarks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Record or update reading progress log
router.post('/history/:postId', auth, async (req, res) => {
  try {
    const { progress } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Ensure the post exists
    const postExists = await Post.findById(req.params.postId);
    if (!postExists) return res.status(404).json({ message: 'Post not found' });

    const historyIndex = user.readingHistory.findIndex(h => h.post && h.post.toString() === req.params.postId);

    if (historyIndex > -1) {
      // Update progress only if new progress is higher, and update timestamp
      if (progress > user.readingHistory[historyIndex].progress) {
        user.readingHistory[historyIndex].progress = progress;
      }
      user.readingHistory[historyIndex].readAt = Date.now();
    } else {
      // Add new log entry
      user.readingHistory.push({
        post: req.params.postId,
        progress: progress || 0,
        readAt: Date.now()
      });
    }

    // Sort to keep newest first and limit to 20 entries
    user.readingHistory.sort((a, b) => b.readAt - a.readAt);
    if (user.readingHistory.length > 20) {
      user.readingHistory = user.readingHistory.slice(0, 20);
    }

    await user.save();
    res.json({ message: 'Reading progress updated', readingHistory: user.readingHistory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
