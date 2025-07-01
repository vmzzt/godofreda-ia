/**
 * Configuração centralizada para toast notifications
 */

export const ToastConfig = {
  position: "top-right",
  options: {
    duration: 4000,
    style: {
      background: '#1f2937',
      color: '#fff',
      border: '1px solid #374151',
      borderRadius: '8px',
      fontSize: '14px',
      padding: '12px 16px',
    },
    success: {
      iconTheme: {
        primary: '#10b981',
        secondary: '#fff',
      },
    },
    error: {
      iconTheme: {
        primary: '#ef4444',
        secondary: '#fff',
      },
    },
    loading: {
      iconTheme: {
        primary: '#3b82f6',
        secondary: '#fff',
      },
    },
  },
}; 