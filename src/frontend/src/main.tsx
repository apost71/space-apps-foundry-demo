import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';
import { DocumentsPage } from './components/core/DocumentsPage';

// Mount the React app to a div with id "react-root" that we'll add to the HTML
const rootElement = document.getElementById('react-root');

// Minimal hash routing: #/documents shows the Knowledge Base page, anything
// else shows the chat.
const renderRoute = () => {
  if (!rootElement) {
    console.error('Failed to find the react-root element');
    return;
  }
  if (window.location.hash === '#/documents') {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <DocumentsPage />
      </React.StrictMode>
    );
  } else {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
};

renderRoute();
window.addEventListener('hashchange', renderRoute);