import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle, Clock, Server, Database, Cpu } from 'lucide-react';
import { useApi } from '../hooks/useApi';

const MonitoringPanel = () => {
  const { isOnline, status, lastUpdate } = useApi();
  
  const [systemStatus, setSystemStatus] = useState({
    api: 'offline',
    tts: 'offline',
    database: 'offline',
    redis: 'offline'
  });

  const [metrics, setMetrics] = useState({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0
  });

  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);

  // Atualizar status baseado no estado real da API
  useEffect(() => {
    setSystemStatus(prev => ({
      ...prev,
      api: isOnline ? 'online' : 'offline',
      tts: isOnline ? 'online' : 'offline'
    }));

    if (isOnline) {
      setMetrics({
        cpu: 25,
        memory: 45,
        disk: 15,
        network: 8
      });
    } else {
      setMetrics({
        cpu: 0,
        memory: 0,
        disk: 0,
        network: 0
      });
    }
  }, [isOnline]);

  const getStatusColor = (status) => {
    return status === 'online' ? 'text-green-400' : 'text-red-400';
  };

  const getStatusIcon = (status) => {
    return status === 'online' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />;
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'error': return 'text-red-400 bg-red-500/10';
      case 'warning': return 'text-yellow-400 bg-yellow-500/10';
      case 'info': return 'text-blue-400 bg-blue-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'error': return <AlertTriangle size={14} />;
      case 'warning': return <AlertTriangle size={14} />;
      case 'info': return <CheckCircle size={14} />;
      default: return <Activity size={14} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Status dos Serviços */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {Object.entries(systemStatus).map(([service, status]) => (
          <motion.div
            key={service}
            whileHover={{ scale: 1.02 }}
            className="bg-black/20 backdrop-blur rounded-xl p-4 border border-purple-500/20"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-300 capitalize">{service}</span>
              <div className={`flex items-center gap-1 ${getStatusColor(status)}`}>
                {getStatusIcon(status)}
                <span className="text-xs">{status}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-xs text-gray-400">Última verificação: agora</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Métricas de Recursos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-black/20 backdrop-blur rounded-xl p-6 border border-purple-500/20"
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Server size={20} />
            Recursos do Sistema
          </h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-300 flex items-center gap-2">
                  <Cpu size={14} />
                  CPU
                </span>
                <span className="text-sm text-white">{Math.round(metrics.cpu)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    metrics.cpu > 80 ? 'bg-red-500' : metrics.cpu > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${metrics.cpu}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-300 flex items-center gap-2">
                  <Cpu size={14} />
                  Memória
                </span>
                <span className="text-sm text-white">{Math.round(metrics.memory)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    metrics.memory > 80 ? 'bg-red-500' : metrics.memory > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${metrics.memory}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-300 flex items-center gap-2">
                  <Database size={14} />
                  Disco
                </span>
                <span className="text-sm text-white">{Math.round(metrics.disk)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    metrics.disk > 80 ? 'bg-red-500' : metrics.disk > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${metrics.disk}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-300 flex items-center gap-2">
                  <Activity size={14} />
                  Rede
                </span>
                <span className="text-sm text-white">{Math.round(metrics.network)} MB/s</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-500 bg-blue-500"
                  style={{ width: `${(metrics.network / 25) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Alertas */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-black/20 backdrop-blur rounded-xl p-6 border border-purple-500/20"
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle size={20} />
            Alertas Recentes
          </h3>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {alerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-3 rounded-lg border-l-4 ${
                  alert.level === 'error' ? 'border-red-500 bg-red-500/10' :
                  alert.level === 'warning' ? 'border-yellow-500 bg-yellow-500/10' :
                  'border-blue-500 bg-blue-500/10'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-white">{alert.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {alert.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${getLevelColor(alert.level)}`}>
                    {alert.level}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Logs em Tempo Real */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-black/20 backdrop-blur rounded-xl p-6 border border-purple-500/20"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Clock size={20} />
            Logs em Tempo Real
          </h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-400">Live</span>
          </div>
        </div>
        
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-2 rounded hover:bg-white/5 transition-colors"
            >
              <div className={`mt-1 ${getLevelColor(log.level)}`}>
                {getLevelIcon(log.level)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">{log.message}</p>
                <p className="text-xs text-gray-400">
                  {log.timestamp.toLocaleTimeString()}
                </p>
              </div>
              <div className={`px-2 py-1 rounded text-xs ${getLevelColor(log.level)}`}>
                {log.level}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Estatísticas Rápidas */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-75">Requisições/min</p>
              <p className="text-2xl font-bold">150</p>
            </div>
            <Activity size={24} />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-teal-600 p-4 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-75">Uptime</p>
              <p className="text-2xl font-bold">99.9%</p>
            </div>
            <CheckCircle size={24} />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-4 rounded-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-75">Erros hoje</p>
              <p className="text-2xl font-bold">3</p>
            </div>
            <AlertTriangle size={24} />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MonitoringPanel; 