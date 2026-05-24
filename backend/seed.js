const mongoose = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment');

const mongoUri = 'mongodb://localhost:27017/blog';

const seedData = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding');

    // Clear existing data
    await User.deleteMany({});
    await Post.deleteMany({});
    await Comment.deleteMany({});
    console.log('Cleared existing data');

    // Create authors
    const authors = [
      { username: 'E. Codd', password: 'password' },
      { username: 'G. Hinton', password: 'password' },
      { username: 'C. Hoare', password: 'password' },
      { username: 'L. Lamport', password: 'password' },
      { username: 'D. M. Vance', password: 'password' }
    ];

    const createdAuthors = [];
    for (const authInfo of authors) {
      const user = new User(authInfo);
      await user.save();
      createdAuthors.push(user);
    }
    console.log('Authors created successfully');

    // Create posts
    const postsData = [
      {
        title: 'Anatomy of a Database Engine.',
        summary: 'B-Trees, Write-Ahead Logs, and the illusion of ACID transactions.',
        content: `
          <p>Database engines are the silent backbone of modern software. They present a simple abstraction: a structured repository where queries go in and data comes out. But under the hood, they are a masterpiece of mechanical and logical engineering designed to run at the limit of hardware speed.</p>
          <p>The primary index structure of almost all modern relational databases is the B-Tree. By maintaining sorted order and shallow tree depth, B-Trees ensure that read and write operations take logarithmic time, ensuring fast lookups even across billions of records. But indexing is only half the battle.</p>
          <blockquote><p>"In database engineering, we do not write to the disk because we want to; we write because we must survive."</p></blockquote>
          <p>To provide Durability (the 'D' in ACID), databases rely on Write-Ahead Logs (WAL). Before any table structure is updated in memory or committed, a sequential log entry is appended to disk. Because sequential writes are orders of magnitude faster than random database page writes, the WAL allows databases to guarantee safety with maximum throughput.</p>
        `,
        author: createdAuthors[0]._id, // E. Codd
        imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        readingTime: 12,
        size: 'large',
        tags: ['#systems', '#databases', '#theory']
      },
      {
        title: 'The Geometry of Neural Networks',
        summary: 'Visualizing high-dimensional loss landscapes in deep learning.',
        content: `
          <p>When we train a deep neural network, we are essentially navigating an extremely high-dimensional space. A model with millions or billions of parameters has a loss landscape that cannot be easily visualized by the human mind. Yet, understanding the geometry of this landscape is the key to training faster and achieving better generalization.</p>
          <p>Optimization algorithms like Stochastic Gradient Descent (SGD) act as blind mountaineers trying to find the lowest valley in a pitch-black mountain range. Along the way, they encounter saddle points, local minima, and narrow ravines. Standard optimization theories suggest that local minima are the greatest danger, but in high dimensions, saddle points are far more ubiquitous and problematic.</p>
          <p>Recent studies in neural network loss landscapes reveal that most local minima are actually connected by wide, flat valleys of nearly equal loss. By finding these flat regions, networks tend to generalize far better to unseen data, pointing to a beautiful hidden geometry within deep learning systems.</p>
        `,
        author: createdAuthors[1]._id, // G. Hinton
        imageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        readingTime: 6,
        size: 'small',
        tags: ['#ai', '#geometry', '#deep-learning']
      },
      {
        title: 'Rust as a Formal Proof',
        summary: 'Why memory safety is fundamentally a mathematical certainty.',
        content: `
          <p>For decades, programmers had to choose between speed (C/C++) and safety (Java/Python). But Rust emerged with a radical proposition: why not both? By introducing the concept of ownership, lifetime analysis, and borrow checking, Rust elevates memory safety from a runtime debugging challenge to a compile-time mathematical certainty.</p>
          <p>At its core, Rust's borrow checker enforces a simple mathematical invariant: you can have either any number of immutable references to a resource, or exactly one mutable reference, but never both at the same time. This prevents data races entirely at compile time.</p>
          <p>This invariant acts as a formal inductive proof of safety. Since every component of the program must adhere to this rule, the entire compiled executable is guaranteed to be free of dangling pointers, double frees, and data races. In this light, writing Rust is less like standard coding and more like drafting a mathematical proof.</p>
        `,
        author: createdAuthors[2]._id, // C. Hoare
        imageUrl: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        readingTime: 5,
        size: 'small',
        tags: ['#compilers', '#rust', '#math']
      },
      {
        title: 'Distributed Consensus',
        summary: 'Exploring the elegance of Raft and modern leader election protocols.',
        content: `
          <p>How do multiple computers, connected by a highly unreliable network that can drop, delay, or reorder packets, agree on a single sequence of events? This is the fundamental challenge of distributed consensus, and solving it is critical for building fault-tolerant infrastructure.</p>
          <p>For years, Paxos was the gold standard for consensus protocols. However, it was notoriously difficult to understand and implement correctly. Enter Raft, a consensus algorithm designed specifically for understandability. Raft decomposes consensus into three independent subproblems: leader election, log replication, and safety.</p>
          <p>By electing a single, authoritative leader to manage the log, Raft simplifies replication. If the leader fails, a new leader is elected through randomized election timeouts. Raft's elegant state machine approach ensures that as long as a majority of nodes are active, the system remains fully available and consistent.</p>
        `,
        author: createdAuthors[3]._id, // L. Lamport
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        readingTime: 8,
        size: 'medium',
        tags: ['#distributed-systems', '#consensus', '#raft']
      },
      {
        title: 'The Architecture of Silence.',
        summary: 'The power of negative space in digital environments and minimalist design.',
        content: `
          <p>Modernism brought us the glass box. Brutalism brought us the concrete monolith. But what does the current digital age bring us? We live in an era of invisible interfaces, where the best design is often the one you notice the least. Yet, there is a rebellion brewing. A return to texture, to depth, to the feeling of weight in a weightless medium.</p>
          <p>Consider the silence of a blank page compared to the noise of a cluttered dashboard. The power of negative space isn't just about what is absent, but how it frames what is present. True aesthetic value in the digital realm comes from intentionality—every pixel, every transition, every typography choice.</p>
          <blockquote><p>"The spaces between the elements carry as much weight as the elements themselves."</p></blockquote>
          <p>We are no longer satisfied with flat colors and generic templates. We crave the bespoke, the hand-crafted, the asymmetric. We want our digital environments to evoke emotion, much like a well-designed physical space does. This is the new frontier of web design: creating silence amidst the noise.</p>
        `,
        author: createdAuthors[4]._id, // D. M. Vance
        imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        readingTime: 4,
        size: 'medium',
        tags: ['#design', '#architecture', '#minimalism']
      }
    ];

    for (const postData of postsData) {
      const post = new Post(postData);
      await post.save();
    }
    console.log('Posts seeded successfully!');

    // Add some sample comments to "The Architecture of Silence."
    const silencePost = await Post.findOne({ title: 'The Architecture of Silence.' });
    if (silencePost) {
      const comment1 = new Comment({
        post: silencePost._id,
        author: createdAuthors[0]._id, // E. Codd
        content: 'Fascinating perspective on space. Relates heavily to minimalist relational modeling schemas as well.'
      });
      const comment2 = new Comment({
        post: silencePost._id,
        author: createdAuthors[2]._id, // C. Hoare
        content: 'Exactly! Designing interfaces is like designing algorithms—simplicity is the ultimate goal.'
      });
      await comment1.save();
      await comment2.save();
      console.log('Sample comments seeded!');
    }

    mongoose.disconnect();
    console.log('Disconnected from MongoDB. Seeding done!');
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
