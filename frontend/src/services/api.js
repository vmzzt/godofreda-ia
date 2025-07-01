// ================================
// GODOFREDA API SERVICE
// ================================
// Serviço centralizado para comunicação com a API
// Aplicando clean code e design patterns
// ================================

import axios from 'axios';
import { 
  API_CONFIG, 
  buildApiUrl, 
  validateFileType, 
  validateFileSize,
  retryWithBackoff 
} from '../config/api';

// ================================
// CONFIGURAÇÃO DO AXIOS
// ================================

// Criar instância do axios com configurações padrão
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.DEFAULT_HEADERS,
});

// ================================
// INTERCEPTORS
// ================================

// Interceptor para requisições
apiClient.interceptors.request.use(
  (config) => {
    // Adicionar timestamp para cache busting
    if (config.method === 'get') {
      config.params = { ...config.params, _t: Date.now() };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para respostas
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Tratamento centralizado de erros
    if (error.response) {
      // Erro do servidor
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Erro de rede
      console.error('Network Error:', error.request);
    } else {
      // Outro erro
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// ================================
// VALIDAÇÕES
// ================================

/**
 * Valida arquivo antes do upload
 * @param {File} file - Arquivo a ser validado
 * @param {string[]} allowedTypes - Tipos permitidos
 * @param {number} maxSize - Tamanho máximo em bytes
 * @returns {Object} Resultado da validação
 */
const validateUploadFile = (file, allowedTypes, maxSize) => {
  const errors = [];
  
  if (!file) {
    errors.push('Nenhum arquivo selecionado');
    return { isValid: false, errors };
  }
  
  if (!validateFileType(file, allowedTypes)) {
    errors.push(`Tipo de arquivo não suportado. Tipos permitidos: ${allowedTypes.join(', ')}`);
  }
  
  if (!validateFileSize(file, maxSize)) {
    errors.push(`Arquivo muito grande. Tamanho máximo: ${Math.round(maxSize / (1024 * 1024))}MB`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// ================================
// SERVIÇOS DE API
// ================================

/**
 * Serviço de Health Check
 */
export const HealthService = {
  /**
   * Verifica saúde da API
   */
  async check() {
    return retryWithBackoff(() => 
      apiClient.get(API_CONFIG.ENDPOINTS.HEALTH)
    );
  },
  
  /**
   * Verifica se a API está pronta
   */
  async ready() {
    return retryWithBackoff(() => 
      apiClient.get(API_CONFIG.ENDPOINTS.READY)
    );
  },
  
  /**
   * Verifica se a API está viva
   */
  async live() {
    return retryWithBackoff(() => 
      apiClient.get(API_CONFIG.ENDPOINTS.LIVE)
    );
  },
  
  /**
   * Obtém status detalhado
   */
  async status() {
    return retryWithBackoff(() => 
      apiClient.get(API_CONFIG.ENDPOINTS.STATUS)
    );
  }
};

/**
 * Serviço de Chat
 */
export const ChatService = {
  /**
   * Envia mensagem de chat
   * @param {string} message - Mensagem do usuário
   * @param {string} context - Contexto adicional
   */
  async sendMessage(message, context = '') {
    const formData = new FormData();
    formData.append('user_input', message);
    formData.append('context', context);
    
    return retryWithBackoff(() => 
      apiClient.post(API_CONFIG.ENDPOINTS.CHAT, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      })
    );
  },
  
  /**
   * Chat multimodal com imagem e/ou áudio
   * @param {string} text - Texto da mensagem
   * @param {File} image - Imagem opcional
   * @param {File} voice - Áudio opcional
   */
  async sendMultimodalMessage(text, image = null, voice = null) {
    // Validar arquivos
    if (image) {
      const imageValidation = validateUploadFile(
        image, 
        API_CONFIG.UPLOAD.ALLOWED_IMAGE_TYPES, 
        API_CONFIG.UPLOAD.MAX_FILE_SIZE
      );
      if (!imageValidation.isValid) {
        throw new Error(`Erro na validação da imagem: ${imageValidation.errors.join(', ')}`);
      }
    }
    
    if (voice) {
      const voiceValidation = validateUploadFile(
        voice, 
        API_CONFIG.UPLOAD.ALLOWED_AUDIO_TYPES, 
        API_CONFIG.UPLOAD.MAX_FILE_SIZE
      );
      if (!voiceValidation.isValid) {
        throw new Error(`Erro na validação do áudio: ${voiceValidation.errors.join(', ')}`);
      }
    }
    
    const formData = new FormData();
    formData.append('text', text);
    
    if (image) {
      formData.append('image', image);
    }
    
    if (voice) {
      formData.append('voice', voice);
    }
    
    return retryWithBackoff(() => 
      apiClient.post(API_CONFIG.ENDPOINTS.MULTIMODAL_CHAT, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'blob'
      })
    );
  }
};

/**
 * Serviço de TTS (Text-to-Speech)
 */
export const TTSService = {
  /**
   * Converte texto em áudio
   * @param {string} text - Texto para converter
   */
  async synthesize(text) {
    if (!text || text.trim().length === 0) {
      throw new Error('Texto não pode estar vazio');
    }
    
    if (text.length > 1000) {
      throw new Error('Texto muito longo (máximo 1000 caracteres)');
    }
    
    const formData = new FormData();
    formData.append('texto', text);
    
    return retryWithBackoff(() => 
      apiClient.post(API_CONFIG.ENDPOINTS.TTS, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'blob'
      })
    );
  }
};

/**
 * Serviço de Personalidade
 */
export const PersonalityService = {
  /**
   * Obtém configurações de personalidade
   */
  async getPersonality() {
    return retryWithBackoff(() => 
      apiClient.get(API_CONFIG.ENDPOINTS.PERSONALITY)
    );
  },
  
  /**
   * Atualiza configurações de personalidade
   * @param {Object} personality - Configurações de personalidade
   */
  async updatePersonality(personality) {
    return retryWithBackoff(() => 
      apiClient.post(API_CONFIG.ENDPOINTS.PERSONALITY, personality)
    );
  }
};

/**
 * Serviço de Métricas
 */
export const MetricsService = {
  /**
   * Obtém métricas do Prometheus
   */
  async getMetrics() {
    return retryWithBackoff(() => 
      apiClient.get(API_CONFIG.ENDPOINTS.METRICS, {
        headers: {
          'Accept': 'text/plain',
        }
      })
    );
  }
};

// ================================
// UTILITÁRIOS
// ================================

/**
 * Função para reproduzir áudio
 * @param {Blob} audioBlob - Blob do áudio
 * @returns {Promise} Promise que resolve quando o áudio terminar
 */
export const playAudio = (audioBlob) => {
  return new Promise((resolve, reject) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      resolve();
    };
    
    audio.onerror = (error) => {
      URL.revokeObjectURL(audioUrl);
      reject(error);
    };
    
    audio.play().catch(reject);
  });
};

/**
 * Função para limpar URLs de objetos
 * @param {string} url - URL a ser limpa
 */
export const cleanupObjectURL = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

// ================================
// EXPORTAÇÕES
// ================================

export default {
  HealthService,
  ChatService,
  TTSService,
  PersonalityService,
  MetricsService,
  playAudio,
  cleanupObjectURL,
  apiClient,
}; 