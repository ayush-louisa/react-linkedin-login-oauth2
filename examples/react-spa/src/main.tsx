import { StrictMode } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
// Using main import since this is a local example
import { LinkedInCallback } from 'react-linkedin-login-oauth2';
import './index.css';
import App from './App.tsx';

ReactDOM.render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/linkedin" element={<LinkedInCallback debug={true} />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
  document.getElementById('root')!,
);
