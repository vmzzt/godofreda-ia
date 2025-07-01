/**
 * Error Boundary Component
 * Captura erros JavaScript em componentes filhos e exibe UI de fallback
 */

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Atualiza o state para que a próxima renderização mostre a UI de fallback
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log do erro para debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Aqui você pode enviar o erro para um serviço de monitoramento
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center p-4">
          <div className="bg-black/20 backdrop-blur rounded-xl border border-red-500/20 p-8 max-w-md text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="w-16 h-16 text-red-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-4">
              Ops! Algo deu errado
            </h1>
            
            <p className="text-gray-300 mb-6">
              Ocorreu um erro inesperado. Não se preocupe, nossa equipe foi notificada.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-red-400 cursor-pointer mb-2">
                  Detalhes do erro (desenvolvimento)
                </summary>
                <div className="bg-gray-800 p-4 rounded text-xs text-gray-300 overflow-auto">
                  <pre>{this.state.error.toString()}</pre>
                  <pre className="mt-2">{this.state.errorInfo.componentStack}</pre>
                </div>
              </details>
            )}
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg text-white flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg text-white transition-colors"
              >
                Recarregar Página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 