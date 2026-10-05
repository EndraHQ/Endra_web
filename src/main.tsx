import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ModalProvider } from './context/ModalContext';
import { App } from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <AppProvider>
        <ModalProvider>
          <App />
        </ModalProvider>
      </AppProvider>
    </AuthProvider>
  </React.StrictMode>
);
