import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApi } from '../hooks/useApi';
import { Line, Doughnut } from 'react-chartjs-2';

const MetricsDashboard = ({ metrics }) => {
  const { status, isOnline } = useApi();
  const [realMetrics, setRealMetrics] = useState({
    apiCalls: 0,
    avgLatency: '0s',
    successRate: '0%',
    voiceQuality: '0%'
  });

  // Atualizar métricas baseado no status real
  useEffect(() => {
    if (isOnline && status === 'success') {
      setRealMetrics({
        apiCalls: metrics.apiCalls || 0,
        avgLatency: metrics.avgLatency || '0s',
        successRate: '100%',
        voiceQuality: '95%'
      });
    } else {
      setRealMetrics({
        apiCalls: 0,
        avgLatency: '0s',
        successRate: '0%',
        voiceQuality: '0%'
      });
    }
  }, [isOnline, status, metrics]);

  const chartData = {
    labels: hours,
    datasets: [
      {
        label: 'Uso de CPU (%)',
        data: usageData,
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Erros por hora',
        data: errorData,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: '#fff',
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#9ca3af',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y: {
        ticks: {
          color: '#9ca3af',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  };

  const doughnutData = {
    labels: ['Texto', 'Voz', 'Imagem', 'Multimodal'],
    datasets: [
      {
        data: [45, 30, 15, 10],
        backgroundColor: [
          'rgba(139, 92, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
        ],
        borderColor: [
          'rgba(139, 92, 246, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(245, 158, 11, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#fff',
          padding: 20,
        },
      },
    },
  };

  const metricCards = [
    {
      title: 'Status da API',
      value: isOnline ? 'Online' : 'Offline',
      change: status,
      changeType: isOnline ? 'positive' : 'negative',
      gradient: isOnline ? 'from-green-500 to-teal-600' : 'from-red-500 to-pink-600',
      icon: '🔌'
    },
    {
      title: 'Conversas Hoje',
      value: realMetrics.apiCalls,
      change: isOnline ? 'Ativo' : 'Inativo',
      changeType: isOnline ? 'positive' : 'negative',
      gradient: 'from-blue-500 to-purple-600',
      icon: '💬'
    },
    {
      title: 'Latência Média',
      value: realMetrics.avgLatency,
      change: isOnline ? 'OK' : 'N/A',
      changeType: isOnline ? 'positive' : 'negative',
      gradient: 'from-green-500 to-teal-600',
      icon: '⚡'
    },
    {
      title: 'Taxa de Sucesso',
      value: realMetrics.successRate,
      change: isOnline ? '100%' : '0%',
      changeType: isOnline ? 'positive' : 'negative',
      gradient: 'from-orange-500 to-red-600',
      icon: '✅'
    }
  ];

  // Arrays simulados para build local (substitua por dados reais depois)
  const hours = Array.from({length: 24}, (_, i) => `${i}h`);
  const usageData = Array.from({length: 24}, () => Math.floor(Math.random() * 100));
  const errorData = Array.from({length: 24}, () => Math.floor(Math.random() * 10));

  return (
    <div className="space-y-6">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-gradient-to-r ${card.gradient} p-6 rounded-xl text-white shadow-lg`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">{card.icon}</span>
              <span className={`text-sm px-2 py-1 rounded-full ${
                card.changeType === 'positive' 
                  ? 'bg-green-500/20 text-green-200' 
                  : 'bg-red-500/20 text-red-200'
              }`}>
                {card.change}
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-1">{card.title}</h3>
            <p className="text-3xl font-bold">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-black/20 backdrop-blur rounded-xl p-6 border border-purple-500/20"
        >
          <h3 className="text-xl font-semibold text-white mb-4">📈 Uso ao Longo do Dia</h3>
          <Line data={chartData} options={chartOptions} />
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-black/20 backdrop-blur rounded-xl p-6 border border-purple-500/20"
        >
          <h3 className="text-xl font-semibold text-white mb-4">🍩 Tipos de Interação</h3>
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </motion.div>
      </div>

      {/* Métricas Detalhadas */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-black/20 backdrop-blur rounded-xl p-6 border border-purple-500/20"
      >
        <h3 className="text-xl font-semibold text-white mb-4">📊 Métricas Detalhadas</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-300">Performance</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Tempo de Resposta</span>
                <span className="text-white">2.3s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Throughput</span>
                <span className="text-white">150 req/min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Uptime</span>
                <span className="text-green-400">99.9%</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-300">Qualidade</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Precisão TTS</span>
                <span className="text-white">94%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Satisfação</span>
                <span className="text-white">4.8/5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Erros</span>
                <span className="text-red-400">1.3%</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-300">Recursos</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">CPU</span>
                <span className="text-white">45%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">RAM</span>
                <span className="text-white">2.1GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">GPU</span>
                <span className="text-white">78%</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MetricsDashboard; 