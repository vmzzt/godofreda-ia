import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, Image, Paperclip, Volume2, VolumeX } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { useChat, useTTS } from '../hooks/useApi';
import { validateFileType, validateFileSize, API_CONFIG } from '../config/api';

const ChatMultimodal = () => {
  const { messages, isTyping, sendChatMessage, sendMultimodal, clearMessages } = useChat();
  const { synthesize, isSynthesizing } = useTTS();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      toast.success('Imagem selecionada!');
    } else {
      toast.error('Por favor, selecione apenas imagens.');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    multiple: false
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        handleVoiceMessage(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.success('Gravando... Clique novamente para parar.');
    } catch (error) {
      toast.error('Erro ao acessar microfone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleVoiceMessage = async (audioBlob) => {
    // Simular processamento de voz
    toast.loading('Processando áudio...');
    
    // Aqui você integraria com um serviço de Speech-to-Text
    setTimeout(() => {
      const transcribedText = "Olá Godofreda, como você está hoje?";
      setMessage(transcribedText);
      toast.dismiss();
      toast.success('Áudio transcrito!');
    }, 2000);
  };

  const handleSendMessage = async () => {
    if (!message.trim() && !selectedImage) return;

    try {
      if (selectedImage) {
        // Validar arquivo
        if (!validateFileType(selectedImage, API_CONFIG.UPLOAD.ALLOWED_IMAGE_TYPES)) {
          toast.error('Tipo de arquivo não suportado');
          return;
        }
        
        if (!validateFileSize(selectedImage, API_CONFIG.UPLOAD.MAX_FILE_SIZE)) {
          toast.error('Arquivo muito grande');
          return;
        }

        // Enviar mensagem multimodal
        await sendMultimodal(message, selectedImage);
      } else {
        // Enviar mensagem de texto
        await sendChatMessage(message);
      }

      setMessage('');
      setSelectedImage(null);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Correção: isProcessing é o estado de processamento geral
  const isProcessing = isTyping || isSynthesizing;
  // Correção: sendMessage é handleSendMessage
  const sendMessage = handleSendMessage;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
      {/* Chat Area */}
      <div className="lg:col-span-2 bg-black/20 backdrop-blur rounded-xl border border-purple-500/20 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            💬 Conversar com Godofreda
            {isProcessing && <div className="spinner"></div>}
          </h2>
        </div>
        
        {/* Messages */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs p-3 rounded-xl ${
                  msg.sender === 'user' 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-gray-700 text-gray-100'
                }`}>
                  {msg.type === 'multimodal' && msg.image && (
                    <img 
                      src={URL.createObjectURL(msg.image)} 
                      className="rounded mb-2 w-full h-32 object-cover" 
                      alt="Uploaded"
                    />
                  )}
                  <p>{msg.text}</p>
                  <div className="text-xs opacity-70 mt-1">
                    {msg.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/10">
          {selectedImage && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-3 p-2 bg-gray-800 rounded flex items-center gap-2"
            >
              <img 
                src={URL.createObjectURL(selectedImage)} 
                className="w-12 h-12 rounded object-cover" 
                alt="Preview"
              />
              <span className="text-sm text-gray-300 flex-1">{selectedImage.name}</span>
              <button 
                onClick={() => setSelectedImage(null)} 
                className="text-red-400 hover:text-red-300 btn-hover"
              >
                ×
              </button>
            </motion.div>
          )}
          
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem ou clique no microfone..."
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none"
                rows="1"
                disabled={isProcessing}
              />
            </div>
            
            <motion.button
              {...getRootProps()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-3 rounded-lg transition-colors ${
                isDragActive ? 'bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              <input {...getInputProps()} />
              <Image size={20} />
            </motion.button>
            
            <motion.button
              onClick={isRecording ? stopRecording : startRecording}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-3 rounded-lg transition-colors ${
                isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </motion.button>
            
            <motion.button
              onClick={sendMessage}
              disabled={isProcessing || (!message.trim() && !selectedImage)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-3 rounded-lg transition-colors ${
                isProcessing || (!message.trim() && !selectedImage)
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-purple-500 hover:bg-purple-600'
              }`}
            >
              <Send size={20} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Sidebar Controls */}
      <div className="space-y-4">
        <GodofredaControls />
        <VoiceSettings audioEnabled={audioEnabled} setAudioEnabled={setAudioEnabled} />
        <QuickActions />
      </div>
    </div>
  );
};

const GodofredaControls = () => {
  const [personality, setPersonality] = useState({
    sarcasm: 75,
    intelligence: 90,
    humor: 80
  });

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-black/20 backdrop-blur rounded-xl p-4 border border-purple-500/20"
    >
      <h3 className="text-lg font-semibold text-white mb-4">🎭 Personalidade</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Sarcasmo: {personality.sarcasm}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={personality.sarcasm}
            onChange={(e) => setPersonality({...personality, sarcasm: e.target.value})}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Inteligência: {personality.intelligence}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={personality.intelligence}
            onChange={(e) => setPersonality({...personality, intelligence: e.target.value})}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Humor: {personality.humor}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={personality.humor}
            onChange={(e) => setPersonality({...personality, humor: e.target.value})}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </motion.div>
  );
};

const VoiceSettings = ({ audioEnabled, setAudioEnabled }) => {
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-black/20 backdrop-blur rounded-xl p-4 border border-purple-500/20"
    >
      <h3 className="text-lg font-semibold text-white mb-4">🎤 Voz</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">Áudio</span>
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              audioEnabled ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Velocidade: {voiceSpeed}x
          </label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={voiceSpeed}
            onChange={(e) => setVoiceSpeed(e.target.value)}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <button className="w-full p-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white transition-colors btn-hover">
          🎵 Testar Voz
        </button>
      </div>
    </motion.div>
  );
};

const QuickActions = () => {
  const actions = [
    { label: 'Limpar Chat', icon: '🗑️', action: () => toast.success('Chat limpo!') },
    { label: 'Exportar', icon: '📤', action: () => toast.success('Exportado!') },
    { label: 'Configurações', icon: '⚙️', action: () => toast.success('Abrindo configurações...') },
    { label: 'Ajuda', icon: '❓', action: () => toast.success('Abrindo ajuda...') }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-black/20 backdrop-blur rounded-xl p-4 border border-purple-500/20"
    >
      <h3 className="text-lg font-semibold text-white mb-4">⚡ Ações Rápidas</h3>
      
      <div className="space-y-2">
        {actions.map((action, index) => (
          <motion.button
            key={index}
            onClick={action.action}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors flex items-center gap-2"
          >
            <span>{action.icon}</span>
            {action.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default ChatMultimodal; 