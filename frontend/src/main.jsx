import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import CenterObjectCanvas from './conponents/CenterObjectCanvas.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CenterObjectCanvas />
  </StrictMode>,
);
