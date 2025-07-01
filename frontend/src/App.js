/**
 * Godofreda Dashboard - Aplicação Principal
 * Dashboard profissional para IA VTuber Godofreda
 */

import React, { Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import GodofredaDashboard from './components/GodofredaDashboard';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import { ToastConfig } from './config/toastConfig';
import './App.css';

/**
 * Componente principal da aplicação
 * Gerencia o layout geral e configurações globais
 */
function App() {
  return (
    <ErrorBoundary>
      <div className="App">
        <Suspense fallback={<LoadingSpinner />}>
          <GodofredaDashboard />
        </Suspense>
        
        <Toaster 
          position={ToastConfig.position}
          toastOptions={ToastConfig.options}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App; 