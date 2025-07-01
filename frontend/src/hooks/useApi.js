// ================================
// GODOFREDA API HOOK
// ================================
// Hook personalizado para gerenciar estado da API
// Aplicando clean code e design patterns
// ================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { HealthService, ChatService, TTSService, PersonalityService } from '../services/api';
import { PERSONALITY_CONFIG } from '../config/api';

// ================================
// ESTADOS DA API
// ================================

export const API_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  OFFLINE: 'offline'
};

// ================================
// HOOK PRINCIPAL
// ================================

/**
 * Hook para gerenciar estado da API
 * @param {Object} options - Opções de configuração
 * @returns {Object} Estado e funções da API
 */
export const useApi = (options = {}) => {
  const {
    autoCheckHealth = true,
    healthCheckInterval = 30000, // 30 segundos
    retryAttempts = 3,
    retryDelay = 1000
  } = options;

  // Estados
  const [status, setStatus] = useState(API_STATUS.IDLE);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  // Refs
  const healthCheckRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  // ================================
  // FUNÇÕES DE UTILIDADE
  // ================================

  /**
   * Limpa timeouts
   */
  const clearTimeouts = useCallback(() => {
    if (healthCheckRef.current) {
      clearInterval(healthCheckRef.current);
      healthCheckRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  /**
   * Função wrapper para requisições com retry
   */
  const withRetry = useCallback(async (apiCall, attempts = retryAttempts) => {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        setStatus(API_STATUS.LOADING);
        const result = await apiCall();
        setStatus(API_STATUS.SUCCESS);
        setError(null);
        setLastUpdate(new Date());
        return result;
      } catch (err) {
        console.error(`API attempt ${attempt} failed:`, err);
        
        if (attempt === attempts) {
          setStatus(API_STATUS.ERROR);
          setError(err.message || 'Erro desconhecido');
          throw err;
        }
        
        // Aguardar antes da próxima tentativa
        await new Promise(resolve => {
          retryTimeoutRef.current = setTimeout(resolve, retryDelay * attempt);
        });
      }
    }
  }, [retryAttempts, retryDelay]);

  // ================================
  // FUNÇÕES DA API
  // ================================

  /**
   * Verifica saúde da API
   */
  const checkHealth = useCallback(async () => {
    try {
      const response = await HealthService.check();
      setIsOnline(true);
      return response.data;
    } catch (err) {
      setIsOnline(false);
      throw err;
    }
  }, []);

  /**
   * Obtém status detalhado
   */
  const getStatus = useCallback(async () => {
    return withRetry(() => HealthService.status());
  }, [withRetry]);

  /**
   * Envia mensagem de chat
   */
  const sendChatMessage = useCallback(async (message, context = '') => {
    return withRetry(() => ChatService.sendMessage(message, context));
  }, [withRetry]);

  /**
   * Envia mensagem multimodal
   */
  const sendMultimodalMessage = useCallback(async (text, image = null, voice = null) => {
    return withRetry(() => ChatService.sendMultimodalMessage(text, image, voice));
  }, [withRetry]);

  /**
   * Sintetiza texto em áudio
   */
  const synthesizeText = useCallback(async (text) => {
    return withRetry(() => TTSService.synthesize(text));
  }, [withRetry]);

  /**
   * Obtém personalidade
   */
  const getPersonality = useCallback(async () => {
    return withRetry(() => PersonalityService.getPersonality());
  }, [withRetry]);

  /**
   * Atualiza personalidade
   */
  const updatePersonality = useCallback(async (personality) => {
    return withRetry(() => PersonalityService.updatePersonality(personality));
  }, [withRetry]);

  // ================================
  // EFEITOS
  // ================================

  // Health check automático
  useEffect(() => {
    if (autoCheckHealth) {
      // Verificação inicial
      checkHealth().catch(console.error);
      
      // Configurar verificação periódica
      healthCheckRef.current = setInterval(() => {
        checkHealth().catch(console.error);
      }, healthCheckInterval);
    }

    return () => {
      clearTimeouts();
    };
  }, [autoCheckHealth, healthCheckInterval, checkHealth, clearTimeouts]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, [clearTimeouts]);

  // ================================
  // RETORNO
  // ================================

  return {
    // Estados
    status,
    error,
    lastUpdate,
    isOnline,
    
    // Funções
    checkHealth,
    getStatus,
    sendChatMessage,
    sendMultimodalMessage,
    synthesizeText,
    getPersonality,
    updatePersonality,
    
    // Utilitários
    clearTimeouts,
    withRetry
  };
};

// ================================
// HOOKS ESPECIALIZADOS
// ================================

/**
 * Hook para chat
 */
export const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  
  const { sendChatMessage, sendMultimodalMessage, status, error } = useApi();

  const addMessage = useCallback((message) => {
    setMessages(prev => [...prev, {
      ...message,
      id: Date.now(),
      timestamp: new Date()
    }]);
  }, []);

  const sendMessage = useCallback(async (text, context = '') => {
    setIsTyping(true);
    
    try {
      // Adicionar mensagem do usuário
      addMessage({
        sender: 'user',
        text,
        type: 'text'
      });

      // Enviar para API
      const response = await sendChatMessage(text, context);
      
      // Adicionar resposta da Godofreda
      addMessage({
        sender: 'godofreda',
        text: response.data.response,
        type: 'text'
      });
      
    } catch (err) {
      // Adicionar mensagem de erro
      addMessage({
        sender: 'system',
        text: `Erro: ${err.message}`,
        type: 'error'
      });
    } finally {
      setIsTyping(false);
    }
  }, [sendChatMessage, addMessage]);

  const sendMultimodal = useCallback(async (text, image = null, voice = null) => {
    setIsTyping(true);
    
    try {
      // Adicionar mensagem do usuário
      addMessage({
        sender: 'user',
        text,
        type: image || voice ? 'multimodal' : 'text',
        image,
        voice
      });

      // Enviar para API
      const response = await sendMultimodalMessage(text, image, voice);
      
      // Extrair texto da resposta
      const responseText = response.headers['x-response-text'] || 'Resposta da Godofreda';
      
      // Adicionar resposta da Godofreda
      addMessage({
        sender: 'godofreda',
        text: responseText,
        type: 'text',
        audio: response.data
      });
      
    } catch (err) {
      // Adicionar mensagem de erro
      addMessage({
        sender: 'system',
        text: `Erro: ${err.message}`,
        type: 'error'
      });
    } finally {
      setIsTyping(false);
    }
  }, [sendMultimodalMessage, addMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isTyping,
    sendMessage,
    sendMultimodal,
    clearMessages,
    status,
    error
  };
};

/**
 * Hook para TTS
 */
export const useTTS = () => {
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const { synthesizeText, status, error } = useApi();

  const synthesize = useCallback(async (text) => {
    setIsSynthesizing(true);
    
    try {
      const response = await synthesizeText(text);
      return response.data;
    } finally {
      setIsSynthesizing(false);
    }
  }, [synthesizeText]);

  return {
    synthesize,
    isSynthesizing,
    status,
    error
  };
};

/**
 * Hook para personalidade
 */
export const usePersonality = () => {
  const [personality, setPersonality] = useState({
    sarcasm: PERSONALITY_CONFIG.DEFAULT_SARCASM_LEVEL,
    intelligence: PERSONALITY_CONFIG.DEFAULT_INTELLIGENCE_LEVEL,
    humor: PERSONALITY_CONFIG.DEFAULT_HUMOR_LEVEL
  });
  
  const { getPersonality, updatePersonality, status, error } = useApi();

  const loadPersonality = useCallback(async () => {
    try {
      const response = await getPersonality();
      setPersonality(response.data.personality || personality);
    } catch (err) {
      console.error('Erro ao carregar personalidade:', err);
    }
  }, [getPersonality, personality]);

  const savePersonality = useCallback(async (newPersonality) => {
    try {
      await updatePersonality(newPersonality);
      setPersonality(newPersonality);
    } catch (err) {
      console.error('Erro ao salvar personalidade:', err);
      throw err;
    }
  }, [updatePersonality]);

  return {
    personality,
    loadPersonality,
    savePersonality,
    status,
    error
  };
};

export default useApi; 