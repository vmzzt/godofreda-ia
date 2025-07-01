# 🤖 Godofreda Dashboard Frontend

Dashboard profissional e moderno para o sistema Godofreda com chat multimodal integrado.

## 🚀 Características

- **Interface Moderna**: Design elegante com glass morphism e gradientes
- **Chat Multimodal**: Suporte a texto, voz e imagem
- **Dashboard Profissional**: Métricas em tempo real com gráficos interativos
- **Configurações Avançadas**: Controle completo da personalidade da Godofreda
- **Monitoramento**: Painel de monitoramento em tempo real
- **Responsivo**: Funciona perfeitamente em desktop e mobile

## 🛠️ Tecnologias

- **React 18**: Framework principal
- **Tailwind CSS**: Estilização moderna
- **Framer Motion**: Animações suaves
- **Chart.js**: Gráficos interativos
- **Lucide React**: Ícones modernos
- **React Hot Toast**: Notificações elegantes

## 📦 Instalação

### Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm start
```

### Docker

```bash
# Construir imagem
docker build -t godofreda-dashboard .

# Executar container
docker run -p 3000:3000 godofreda-dashboard
```

## 🎨 Componentes Principais

### GodofredaDashboard
Componente principal que gerencia a navegação entre as diferentes seções.

### ChatMultimodal
Interface de chat com suporte a:
- Texto
- Gravação de voz
- Upload de imagens
- Controles de personalidade

### MetricsDashboard
Dashboard com métricas em tempo real:
- Cards de métricas principais
- Gráficos de linha e rosca
- Estatísticas detalhadas

### ConfigPanel
Painel de configurações avançadas:
- Personalidade da Godofreda
- Configurações de voz
- Configurações do sistema
- Configurações de segurança

### MonitoringPanel
Monitoramento em tempo real:
- Status dos serviços
- Métricas de recursos
- Alertas e logs

## 🔧 Configuração

### Variáveis de Ambiente

```env
REACT_APP_API_URL=http://localhost:8000
```

### Personalização

O dashboard pode ser personalizado através dos componentes:

1. **Cores**: Edite `tailwind.config.js` para alterar o esquema de cores
2. **Animações**: Modifique as configurações do Framer Motion
3. **Métricas**: Atualize os dados nos componentes de métricas
4. **Layout**: Ajuste o grid e espaçamentos no CSS

## 📱 Responsividade

O dashboard é totalmente responsivo e se adapta a diferentes tamanhos de tela:

- **Desktop**: Layout completo com sidebar
- **Tablet**: Layout adaptado com navegação otimizada
- **Mobile**: Layout vertical com navegação por tabs

## 🎯 Funcionalidades

### Chat Multimodal
- Envio de mensagens de texto
- Gravação de áudio com WebRTC
- Upload de imagens com drag & drop
- Controles de personalidade em tempo real

### Dashboard de Métricas
- Métricas em tempo real
- Gráficos interativos
- Animações suaves
- Atualização automática

### Configurações
- Controle de personalidade
- Configurações de voz
- Configurações do sistema
- Import/Export de configurações

### Monitoramento
- Status dos serviços
- Métricas de recursos
- Alertas em tempo real
- Logs detalhados

## 🚀 Deploy

### Produção com Docker

```bash
# Construir para produção
docker build -t godofreda-dashboard:prod .

# Executar em produção
docker run -d -p 3000:3000 --name godofreda-dashboard godofreda-dashboard:prod
```

### Nginx (Recomendado)

O Dockerfile já inclui configuração do Nginx otimizada para produção com:
- Compressão Gzip
- Cache de arquivos estáticos
- Headers de segurança
- Proxy para API

## 🔍 Debug

### Logs de Desenvolvimento

```bash
# Ver logs do React
npm start

# Ver logs do Docker
docker logs godofreda-dashboard
```

### Ferramentas de Desenvolvimento

- React Developer Tools
- Redux DevTools (se necessário)
- Network tab para debug de API

## 📈 Performance

O dashboard foi otimizado para performance:

- **Lazy Loading**: Componentes carregados sob demanda
- **Memoização**: React.memo para componentes pesados
- **Otimização de Imagens**: Compressão e formatos modernos
- **Bundle Splitting**: Código dividido em chunks

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🆘 Suporte

Para suporte, entre em contato através dos issues do GitHub ou email. 