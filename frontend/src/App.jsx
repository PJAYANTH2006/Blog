import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import PostView from './pages/PostView';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  return (
    <Router>
      <div className="noise-overlay"></div>
      <Navbar />
      <main className="app-container">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/post/:id" element={<PostView />} />
          </Routes>
        </AnimatePresence>
      </main>
    </Router>
  );
}

export default App;
