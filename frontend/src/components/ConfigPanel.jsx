import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, RotateCcw, Download, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePersonality } from '../hooks/useApi';

const ConfigPanel = () => {
  const { personality, loadPersonality, savePersonality } = usePersonality();
  
  const [settings, setSettings] = useState({
    personality: {
      sarcasm_level: 75,
      intelligence_level: 90,
      humor_style: 'sophisticated',
      response_length: 'medium'
    },
    voice: {
      speed: 1.0,
      pitch: 1.0,
      volume: 0.8,
      voice_model: 'godofreda_v2'
    },
    system: {
      auto_save: true,
      debug_mode: false,
      log_level: 'info',
      max_conversation_length: 100
    },
    security: {
      require_auth: false,
      session_timeout: 30,
      rate_limit: 100
    }
  });

  // Carregar configurações ao montar o componente
  useEffect(() => {
    loadPersonality();
  }, [loadPersonality]);

  // Atualizar configurações quando a personalidade mudar
  useEffect(() => {
    if (personality) {
      setSettings(prev => ({
        ...prev,
        personality: {
          ...prev.personality,
          ...personality
        }
      }));
    }
  }, [personality]);

  const handleSave = async () => {
    try {
      await savePersonality(settings.personality);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    }
  };

  const handleReset = () => {
    setSettings({
      personality: {
        sarcasm_level: 75,
        intelligence_level: 90,
        humor_style: 'sophisticated',
        response_length: 'medium'
      },
      voice: {
        speed: 1.0,
        pitch: 1.0,
        volume: 0.8,
        voice_model: 'godofreda_v2'
      },
      system: {
        auto_save: true,
        debug_mode: false,
        log_level: 'info',
        max_conversation_length: 100
      },
      security: {
        require_auth: false,
        session_timeout: 30,
        rate_limit: 100
      }
    });
    toast.success('Configurações resetadas!');
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'godofreda-config.json';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Configurações exportadas!');
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target.result);
          setSettings(importedSettings);
          toast.success('Configurações importadas!');
        } catch (error) {
          toast.error('Erro ao importar configurações');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h2 className="text-2xl font-bold text-white">⚙️ Configurações Avançadas</h2>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white flex items-center gap-2 transition-colors"
          >
            <Save size={16} />
            Salvar
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-white flex items-center gap-2 transition-colors"
          >
            <RotateCcw size={16} />
            Resetar
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExport}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white flex items-center gap-2 transition-colors"
          >
            <Download size={16} />
            Exportar
          </motion.button>
          <label className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white flex items-center gap-2 transition-colors cursor-pointer">
            <Upload size={16} />
            Importar
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personalidade */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-black/20 backdrop-blur rounded-xl p-6 border border-purple-500/20"
        >
          <h3 className="text-xl font-semibold text-white mb-4">🎭 Personalidade</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nível de Sarcasmo: {settings.personality.sarcasm_level}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.personality.sarcasm_level}
                onChange={(e) => setSettings({
                  ...settings,
                  personality: {
                    ...settings.personality,
                    sarcasm_level: parseInt(e.target.value)
                  }
                })}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nível de Inteligência: {settings.personality.intelligence_level}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.personality.intelligence_level}
                onChange={(e) => setSettings({
                  ...settings,
                  personality: {
                    ...settings.personality,
                    intelligence_level: parseInt(e.target.value)
                  }
                })}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Estilo de Humor</label>
              <select 
                value={settings.personality.humor_style}
                onChange={(e) => setSettings({
                  ...settings,
                  personality: {
                    ...settings.personality,
                    humor_style: e.target.value
                  }
                })}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                <option value="sophisticated">Sofisticado</option>
                <option value="sarcastic">Sarcástico</option>
                <option value="witty">Espirituoso</option>
                <option value="dry">Seco</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tamanho da Resposta</label>
              <select 
                value={settings.personality.response_length}
                onChange={(e) => setSettings({
                  ...settings,
                  personality: {
                    ...settings.personality,
                    response_length: e.target.value
                  }
                })}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                <option value="short">Curta</option>
                <option value="medium">Média</option>
                <option value="long">Longa</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Configurações de Voz */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-black/20 backdrop-blur rounded-xl p-6 border border-purple-500/20"
        >
          <h3 className="text-xl font-semibold text-white mb-4">🎤 Configurações de Voz</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Velocidade: {settings.voice.speed}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={settings.voice.speed}
                onChange={(e) => setSettings({
                  ...settings,
                  voice: {
                    ...settings.voice,
                    speed: parseFloat(e.target.value)
                  }
                })}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tom: {settings.voice.pitch}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={settings.voice.pitch}
                onChange={(e) => setSettings({
                  ...settings,
                  voice: {
                    ...settings.voice,
                    pitch: parseFloat(e.target.value)
                  }
                })}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Volume: {Math.round(settings.voice.volume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.voice.volume}
                onChange={(e) => setSettings({
                  ...settings,
                  voice: {
                    ...settings.voice,
                    volume: parseFloat(e.target.value)
                  }
                })}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Modelo de Voz</label>
              <select 
                value={settings.voice.voice_model}
                onChange={(e) => setSettings({
                  ...settings,
                  voice: {
                    ...settings.voice,
                    voice_model: e.target.value
                  }
                })}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                <option value="godofreda_v1">Godofreda v1</option>
                <option value="godofreda_v2">Godofreda v2</option>
                <option value="godofreda_premium">Godofreda Premium</option>
              </select>
            </div>
            
            <button className="w-full p-3 bg-purple-500 hover:bg-purple-600 rounded-lg text-white transition-colors btn-hover">
              🎵 Testar Configurações de Voz
            </button>
          </div>
        </motion.div>

        {/* Configurações do Sistema */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-black/20 backdrop-blur rounded-xl p-6 border border-purple-500/20"
        >
          <h3 className="text-xl font-semibold text-white mb-4">🔧 Sistema</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Auto-save</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.system.auto_save}
                  onChange={(e) => setSettings({
                    ...settings,
                    system: {
                      ...settings.system,
                      auto_save: e.target.checked
                    }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Modo Debug</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.system.debug_mode}
                  onChange={(e) => setSettings({
                    ...settings,
                    system: {
                      ...settings.system,
                      debug_mode: e.target.checked
                    }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nível de Log</label>
              <select 
                value={settings.system.log_level}
                onChange={(e) => setSettings({
                  ...settings,
                  system: {
                    ...settings.system,
                    log_level: e.target.value
                  }
                })}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Máximo de Mensagens: {settings.system.max_conversation_length}
              </label>
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                value={settings.system.max_conversation_length}
                onChange={(e) => setSettings({
                  ...settings,
                  system: {
                    ...settings.system,
                    max_conversation_length: parseInt(e.target.value)
                  }
                })}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </motion.div>

        {/* Configurações de Segurança */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-black/20 backdrop-blur rounded-xl p-6 border border-purple-500/20"
        >
          <h3 className="text-xl font-semibold text-white mb-4">🔒 Segurança</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Requer Autenticação</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.security.require_auth}
                  onChange={(e) => setSettings({
                    ...settings,
                    security: {
                      ...settings.security,
                      require_auth: e.target.checked
                    }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Timeout da Sessão: {settings.security.session_timeout} min
              </label>
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={settings.security.session_timeout}
                onChange={(e) => setSettings({
                  ...settings,
                  security: {
                    ...settings.security,
                    session_timeout: parseInt(e.target.value)
                  }
                })}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Rate Limit: {settings.security.rate_limit} req/min
              </label>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={settings.security.rate_limit}
                onChange={(e) => setSettings({
                  ...settings,
                  security: {
                    ...settings.security,
                    rate_limit: parseInt(e.target.value)
                  }
                })}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ConfigPanel; 