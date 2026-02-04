import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import ObjectMenuWithCanvas from './conponents/ObjectMenuWithCanvas.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ObjectMenuWithCanvas />
  </StrictMode>,
);
