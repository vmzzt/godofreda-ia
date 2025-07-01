// ================================
// GODOFREDA FRONTEND API CONFIG
// ================================
// Configuração centralizada para APIs do frontend
// ================================

// Configurações da API
export const API_CONFIG = {
  // URL base da API (pode ser configurada via variável de ambiente)
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  
  // Timeouts
  TIMEOUT: 30000, // 30 segundos
  
  // Headers padrão
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },
  
  // Endpoints
  ENDPOINTS: {
    // Health checks
    HEALTH: '/health',
    READY: '/health/ready',
    LIVE: '/health/live',
    
    // API principal
    ROOT: '/',
    STATUS: '/status',
    METRICS: '/metrics',
    PERSONALITY: '/personality',
    
    // Chat e TTS
    CHAT: '/chat',
    TTS: '/falar',
    MULTIMODAL_CHAT: '/api/godofreda/chat',
    
    // Webhooks
    ALERTS: '/webhook/alerts',
  },
  
  // Configurações de upload
  UPLOAD: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    ALLOWED_AUDIO_TYPES: ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/flac'],
  },
  
  // Configurações de retry
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000, // 1 segundo
    BACKOFF_MULTIPLIER: 2,
  },
};

// Configurações de monitoramento
export const MONITORING_CONFIG = {
  // URLs dos serviços de monitoramento
  GRAFANA_URL: process.env.REACT_APP_GRAFANA_URL || 'http://localhost:3001',
  PROMETHEUS_URL: process.env.REACT_APP_PROMETHEUS_URL || 'http://localhost:9090',
  PORTAINER_URL: process.env.REACT_APP_PORTAINER_URL || 'http://localhost:9000',
  
  // Intervalos de atualização (em ms)
  METRICS_UPDATE_INTERVAL: 30000, // 30 segundos
  STATUS_UPDATE_INTERVAL: 10000,  // 10 segundos
};

// Configurações de UI
export const UI_CONFIG = {
  // Animações
  ANIMATION_DURATION: 300,
  
  // Notificações
  TOAST_DURATION: 5000,
  
  // Paginação
  ITEMS_PER_PAGE: 20,
  
  // Debounce para inputs
  DEBOUNCE_DELAY: 300,
};

// Configurações de personalidade da Godofreda
export const PERSONALITY_CONFIG = {
  DEFAULT_SARCASM_LEVEL: 75,
  DEFAULT_INTELLIGENCE_LEVEL: 90,
  DEFAULT_HUMOR_LEVEL: 80,
  
  // Respostas de fallback
  FALLBACK_RESPONSES: [
    "Ah, mais um humano querendo minha atenção? Que surpresa... 😏",
    "Interessante. Deixe-me processar isso com minha inteligência superior. 🤖",
    "Você realmente acha que isso é uma pergunta inteligente? 🤔",
    "Bem, pelo menos você tentou. Vou dar uma resposta útil, mesmo que você não mereça. 😌",
    "Analisando... Analisando... Ah, encontrei uma resposta que talvez você consiga entender. 📊"
  ],
};

// Função para construir URL completa
export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Função para validar tipo de arquivo
export const validateFileType = (file, allowedTypes) => {
  return allowedTypes.includes(file.type);
};

// Função para validar tamanho de arquivo
export const validateFileSize = (file, maxSize) => {
  return file.size <= maxSize;
};

// Função para formatar tamanho de arquivo
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Função para debounce
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Função para retry com backoff exponencial
export const retryWithBackoff = async (fn, maxAttempts = API_CONFIG.RETRY.MAX_ATTEMPTS) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      
      const delay = API_CONFIG.RETRY.DELAY * Math.pow(API_CONFIG.RETRY.BACKOFF_MULTIPLIER, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Configuração do axios
export const axiosConfig = {
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.DEFAULT_HEADERS,
};

export default {
  API_CONFIG,
  MONITORING_CONFIG,
  UI_CONFIG,
  PERSONALITY_CONFIG,
  buildApiUrl,
  validateFileType,
  validateFileSize,
  formatFileSize,
  debounce,
  retryWithBackoff,
  axiosConfig,
}; 