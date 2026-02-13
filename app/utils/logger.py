"""
AI Director Assistant - 日志管理模块
"""

import logging
import os
from datetime import datetime
from logging.handlers import RotatingFileHandler
from app.config import Config

class LoggerManager:
    """日志管理器"""
    
    def __init__(self, name='AI_Director_Assistant'):
        self.logger = logging.getLogger(name)
        self.setup_logger()
    
    def setup_logger(self):
        """设置日志器"""
        # 如果已经设置过，直接返回
        if self.logger.handlers:
            return
        
        # 设置日志级别
        log_level = getattr(logging, Config.LOG_LEVEL.upper(), logging.INFO)
        self.logger.setLevel(log_level)
        
        # 创建日志目录
        log_dir = os.path.dirname(Config.LOG_FILE)
        if log_dir and not os.path.exists(log_dir):
            os.makedirs(log_dir)
        
        # 文件处理器（轮转日志）
        file_handler = RotatingFileHandler(
            Config.LOG_FILE,
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=5,
            encoding='utf-8'
        )
        
        # 控制台处理器
        console_handler = logging.StreamHandler()
        
        # 设置日志格式
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        
        file_handler.setFormatter(formatter)
        console_handler.setFormatter(formatter)
        
        # 添加处理器
        self.logger.addHandler(file_handler)
        self.logger.addHandler(console_handler)
    
    def get_logger(self):
        """获取日志器"""
        return self.logger
    
    def log_request(self, method, path, status_code, duration):
        """记录请求日志"""
        self.logger.info(f"{method} {path} - {status_code} ({duration:.3f}s)")
    
    def log_error(self, error, context=""):
        """记录错误日志"""
        self.logger.error(f"{context}: {str(error)}", exc_info=True)
    
    def log_api_call(self, endpoint, params, response_time, success=True):
        """记录API调用日志"""
        status = "成功" if success else "失败"
        self.logger.info(f"API调用 {endpoint} - {status} ({response_time:.3f}s)")
        if not success:
            self.logger.warning(f"API参数: {params}")
    
    def log_security_event(self, event_type, details, level="WARNING"):
        """记录安全事件日志"""
        log_func = getattr(self.logger, level.lower(), self.logger.warning)
        log_func(f"安全事件 - {event_type}: {details}")
    
    def log_performance(self, operation, duration, details=None):
        """记录性能日志"""
        message = f"性能 - {operation}: {duration:.3f}s"
        if details:
            message += f" ({details})"
        self.logger.info(message)

# 全局日志管理器实例
logger_manager = LoggerManager()
logger = logger_manager.get_logger()