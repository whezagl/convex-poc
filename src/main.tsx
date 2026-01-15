import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConvexProvider, ConvexClient } from 'convex/react';
import App from './App.tsx';
import './index.css';

// Initialize Convex client with self-hosted URL
const convexClient = new ConvexClient({
  address: import.meta.env.VITE_CONVEX_URL || 'http://localhost:3210',
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexProvider client={convexClient}>
      <App />
    </ConvexProvider>
  </StrictMode>,
);
