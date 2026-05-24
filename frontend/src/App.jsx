import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import PostView from './pages/PostView';
import Editor from './pages/Editor';
import Dashboard from './pages/Dashboard';
import { AnimatePresence } from 'framer-motion';

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
            <Route path="/write" element={<Editor />} />
            <Route path="/edit/:id" element={<Editor />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </AnimatePresence>
      </main>
    </Router>
  );
}

export default App;
