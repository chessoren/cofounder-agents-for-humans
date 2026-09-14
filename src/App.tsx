import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import AgentOverlay from './AgentOverlay';

function App() {
  // The agent overlay window loads the same bundle with #agent.
  if (typeof window !== 'undefined' && window.location.hash.startsWith('#agent')) {
    return <AgentOverlay />;
  }
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
      </Routes>
    </Router>
  );
}

export default App;
