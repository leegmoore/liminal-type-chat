import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import Header from './components/Header';
import Footer from './components/Footer';
import HealthDashboard from './pages/HealthDashboard';
import ChatPage from './pages/ChatPage';

/**
 * Main App component that sets up routing and layout
 */
const App: React.FC = () => {
  return (
    <Router>
      <Box minH="100vh" display="flex" flexDirection="column">
        <Header />
        <Box as="main" flex="1" py={8} px={4}>
          <Routes>
            <Route path="/" element={<HealthDashboard />} />
            <Route path="/chat" element={<ChatPage />} />
          </Routes>
        </Box>
        <Footer />
      </Box>
    </Router>
  );
};

export default App;
