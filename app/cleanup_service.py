# ================================
# GODOFREDA CLEANUP SERVICE
# ================================
# Serviço de limpeza automática para evitar vazamento de memória
# ================================

import os
import time
import asyncio
import logging
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime, timedelta
from config import config

logger = logging.getLogger(__name__)

class CleanupService:
    """Serviço de limpeza automática de arquivos temporários"""
    
    def __init__(self):
        self.cleanup_config = {
            'tts_temp': {
                'path': config.tts.temp_dir,
                'max_age_hours': config.file.file_max_age_hours,
                'max_size_mb': 100,  # 100MB
                'file_patterns': ['*.wav', '*.mp3', '*.ogg']
            },
            'logs': {
                'path': os.path.dirname(config.logging.file_path),
                'max_age_hours': 7 * 24,  # 7 dias
                'max_size_mb': 500,  # 500MB
                'file_patterns': ['*.log', '*.txt']
            },
            'cache': {
                'path': '/tmp/godofreda_cache',
                'max_age_hours': 24,  # 24 horas
                'max_size_mb': 50,  # 50MB
                'file_patterns': ['*.cache', '*.tmp']
            }
        }
        self.is_running = False
    
    async def start_cleanup_service(self) -> None:
        """Inicia o serviço de limpeza em background"""
        if self.is_running:
            logger.warning("Cleanup service already running")
            return
        
        self.is_running = True
        logger.info("Starting cleanup service")
        
        # Executar limpeza inicial
        await self.cleanup_all()
        
        # Loop principal com agendamento manual
        while self.is_running:
            try:
                # Limpeza de TTS temp a cada 30 minutos
                if int(time.time()) % 1800 == 0:
                    await self.cleanup_tts_temp()
                
                # Limpeza de logs a cada 2 horas
                if int(time.time()) % 7200 == 0:
                    await self.cleanup_logs()
                
                # Limpeza de cache a cada 6 horas
                if int(time.time()) % 21600 == 0:
                    await self.cleanup_cache()
                
                # Limpeza geral a cada hora
                if int(time.time()) % 3600 == 0:
                    await self.cleanup_all()
                
                await asyncio.sleep(60)  # Verificar a cada minuto
                
            except Exception as e:
                logger.error(f"Error in cleanup loop: {e}")
                await asyncio.sleep(60)
    
    def stop_cleanup_service(self) -> None:
        """Para o serviço de limpeza"""
        self.is_running = False
        logger.info("Cleanup service stopped")
    
    async def cleanup_all(self) -> Dict[str, int]:
        """
        Executa limpeza completa de todos os diretórios
        
        Returns:
            Dicionário com número de arquivos removidos por categoria
        """
        results = {}
        
        try:
            results['tts_temp'] = await self.cleanup_tts_temp()
            results['logs'] = await self.cleanup_logs()
            results['cache'] = await self.cleanup_cache()
            
            total_removed = sum(results.values())
            if total_removed > 0:
                logger.info(f"Cleanup completed: {total_removed} files removed")
            
            return results
            
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")
            return results
    
    async def cleanup_tts_temp(self) -> int:
        """
        Limpa arquivos temporários de TTS
        
        Returns:
            Número de arquivos removidos
        """
        config_cleanup = self.cleanup_config['tts_temp']
        return await self._cleanup_directory(
            path=config_cleanup['path'],
            max_age_hours=config_cleanup['max_age_hours'],
            max_size_mb=config_cleanup['max_size_mb'],
            file_patterns=config_cleanup['file_patterns'],
            category="TTS temp"
        )
    
    async def cleanup_logs(self) -> int:
        """
        Limpa arquivos de log antigos
        
        Returns:
            Número de arquivos removidos
        """
        config_cleanup = self.cleanup_config['logs']
        return await self._cleanup_directory(
            path=config_cleanup['path'],
            max_age_hours=config_cleanup['max_age_hours'],
            max_size_mb=config_cleanup['max_size_mb'],
            file_patterns=config_cleanup['file_patterns'],
            category="Logs"
        )
    
    async def cleanup_cache(self) -> int:
        """
        Limpa arquivos de cache
        
        Returns:
            Número de arquivos removidos
        """
        config_cleanup = self.cleanup_config['cache']
        return await self._cleanup_directory(
            path=config_cleanup['path'],
            max_age_hours=config_cleanup['max_age_hours'],
            max_size_mb=config_cleanup['max_size_mb'],
            file_patterns=config_cleanup['file_patterns'],
            category="Cache"
        )
    
    async def _cleanup_directory(self, path: str, max_age_hours: int, 
                               max_size_mb: int, file_patterns: List[str], 
                               category: str) -> int:
        """
        Limpa diretório específico
        
        Args:
            path: Caminho do diretório
            max_age_hours: Idade máxima dos arquivos em horas
            max_size_mb: Tamanho máximo do diretório em MB
            file_patterns: Padrões de arquivo para incluir
            category: Categoria para logging
            
        Returns:
            Número de arquivos removidos
        """
        if not os.path.exists(path):
            return 0
        
        try:
            # Executar em thread separada para não bloquear
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(
                None,
                self._cleanup_directory_sync,
                path, max_age_hours, max_size_mb, file_patterns, category
            )
        except Exception as e:
            logger.error(f"Error cleaning {category} directory: {e}")
            return 0
    
    def _cleanup_directory_sync(self, path: str, max_age_hours: int, 
                              max_size_mb: int, file_patterns: List[str], 
                              category: str) -> int:
        """Versão síncrona da limpeza de diretório"""
        removed_count = 0
        cutoff_time = time.time() - (max_age_hours * 3600)
        
        try:
            # Encontrar arquivos que atendem aos critérios
            files_to_remove = []
            total_size = 0
            
            for pattern in file_patterns:
                for file_path in Path(path).glob(pattern):
                    if file_path.is_file():
                        file_stat = file_path.stat()
                        file_age = file_stat.st_mtime
                        file_size = file_stat.st_size
                        
                        total_size += file_size
                        
                        # Verificar idade do arquivo
                        if file_age < cutoff_time:
                            files_to_remove.append((file_path, file_size))
            
            # Verificar se precisa remover por tamanho
            if total_size > (max_size_mb * 1024 * 1024):
                # Ordenar por idade (mais antigos primeiro)
                all_files = []
                for pattern in file_patterns:
                    for file_path in Path(path).glob(pattern):
                        if file_path.is_file():
                            all_files.append((file_path, file_path.stat().st_mtime, file_path.stat().st_size))
                
                all_files.sort(key=lambda x: x[1])  # Ordenar por data de modificação
                
                current_size = total_size
                for file_path, _, file_size in all_files:
                    if current_size <= (max_size_mb * 1024 * 1024):
                        break
                    files_to_remove.append((file_path, file_size))
                    current_size -= file_size
            
            # Remover arquivos
            for file_path, file_size in files_to_remove:
                try:
                    file_path.unlink()
                    removed_count += 1
                    logger.debug(f"Removed {category} file: {file_path.name} ({file_size} bytes)")
                except Exception as e:
                    logger.warning(f"Failed to remove {category} file {file_path}: {e}")
            
            if removed_count > 0:
                logger.info(f"Cleaned {category}: {removed_count} files removed")
            
            return removed_count
            
        except Exception as e:
            logger.error(f"Error in {category} cleanup: {e}")
            return removed_count
    
    def get_cleanup_stats(self) -> Dict[str, Any]:
        """
        Retorna estatísticas de limpeza
        
        Returns:
            Dicionário com estatísticas
        """
        stats = {
            'service_running': self.is_running,
            'directories': {}
        }
        
        for category, config_cleanup in self.cleanup_config.items():
            path = config_cleanup['path']
            if os.path.exists(path):
                try:
                    total_size = sum(
                        f.stat().st_size for f in Path(path).rglob('*') 
                        if f.is_file()
                    )
                    file_count = len([f for f in Path(path).rglob('*') if f.is_file()])
                    
                    stats['directories'][category] = {
                        'path': path,
                        'total_size_mb': round(total_size / (1024 * 1024), 2),
                        'file_count': file_count,
                        'max_size_mb': config_cleanup['max_size_mb'],
                        'max_age_hours': config_cleanup['max_age_hours']
                    }
                except Exception as e:
                    stats['directories'][category] = {'error': str(e)}
            else:
                stats['directories'][category] = {'path': path, 'exists': False}
        
        return stats

# Instância global do serviço de limpeza
cleanup_service = CleanupService()

# Função para iniciar limpeza em background
async def start_background_cleanup():
    """Inicia o serviço de limpeza em background"""
    await cleanup_service.start_cleanup_service()

# Função para limpeza manual
async def manual_cleanup() -> Dict[str, int]:
    """Executa limpeza manual"""
    return await cleanup_service.cleanup_all() 