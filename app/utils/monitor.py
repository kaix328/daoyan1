"""
AI Director Assistant - 监控和指标模块
"""

import time
import psutil
import threading
from datetime import datetime, timedelta
from collections import deque
from app.utils.logger import logger

class SystemMonitor:
    """系统监控器"""
    
    def __init__(self, max_history=100):
        self.max_history = max_history
        self.cpu_history = deque(maxlen=max_history)
        self.memory_history = deque(maxlen=max_history)
        self.disk_history = deque(maxlen=max_history)
        self.network_history = deque(maxlen=max_history)
        self.is_monitoring = False
        self.monitor_thread = None
    
    def start_monitoring(self, interval=5):
        """开始系统监控"""
        if self.is_monitoring:
            return
        
        self.is_monitoring = True
        self.monitor_thread = threading.Thread(target=self._monitor_loop, args=(interval,))
        self.monitor_thread.daemon = True
        self.monitor_thread.start()
        logger.info("系统监控已启动")
    
    def stop_monitoring(self):
        """停止系统监控"""
        self.is_monitoring = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=1)
        logger.info("系统监控已停止")
    
    def _monitor_loop(self, interval):
        """监控循环"""
        while self.is_monitoring:
            try:
                # 收集系统指标
                timestamp = datetime.now()
                
                # CPU使用率
                cpu_percent = psutil.cpu_percent(interval=1)
                self.cpu_history.append({
                    'timestamp': timestamp,
                    'value': cpu_percent
                })
                
                # 内存使用率
                memory = psutil.virtual_memory()
                self.memory_history.append({
                    'timestamp': timestamp,
                    'value': memory.percent,
                    'available': memory.available,
                    'total': memory.total
                })
                
                # 磁盘使用率
                disk = psutil.disk_usage('/')
                self.disk_history.append({
                    'timestamp': timestamp,
                    'value': disk.percent,
                    'free': disk.free,
                    'total': disk.total
                })
                
                # 网络IO
                network = psutil.net_io_counters()
                self.network_history.append({
                    'timestamp': timestamp,
                    'bytes_sent': network.bytes_sent,
                    'bytes_recv': network.bytes_recv,
                    'packets_sent': network.packets_sent,
                    'packets_recv': network.packets_recv
                })
                
                # 检查告警条件
                self._check_alerts(cpu_percent, memory.percent, disk.percent)
                
                time.sleep(interval - 1)  # 减去CPU监控的1秒
                
            except Exception as e:
                logger.error(f"监控循环出错: {e}")
                time.sleep(interval)
    
    def _check_alerts(self, cpu_percent, memory_percent, disk_percent):
        """检查告警条件"""
        # CPU告警
        if cpu_percent > 80:
            logger.warning(f"CPU使用率过高: {cpu_percent}%")
        
        # 内存告警
        if memory_percent > 85:
            logger.warning(f"内存使用率过高: {memory_percent}%")
        
        # 磁盘告警
        if disk_percent > 90:
            logger.warning(f"磁盘使用率过高: {disk_percent}%")
    
    def get_current_stats(self):
        """获取当前系统状态"""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            network = psutil.net_io_counters()
            
            return {
                'cpu': {
                    'percent': cpu_percent,
                    'count': psutil.cpu_count(),
                    'freq': psutil.cpu_freq().current if psutil.cpu_freq() else None
                },
                'memory': {
                    'percent': memory.percent,
                    'available': memory.available,
                    'total': memory.total,
                    'used': memory.used
                },
                'disk': {
                    'percent': disk.percent,
                    'free': disk.free,
                    'total': disk.total,
                    'used': disk.used
                },
                'network': {
                    'bytes_sent': network.bytes_sent,
                    'bytes_recv': network.bytes_recv,
                    'packets_sent': network.packets_sent,
                    'packets_recv': network.packets_recv
                },
                'boot_time': datetime.fromtimestamp(psutil.boot_time()).isoformat(),
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"获取系统状态失败: {e}")
            return None
    
    def get_history_stats(self, hours=1):
        """获取历史统计数据"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        def filter_history(history):
            return [item for item in history if item['timestamp'] > cutoff_time]
        
        return {
            'cpu': self._calculate_stats(filter_history(self.cpu_history)),
            'memory': self._calculate_stats(filter_history(self.memory_history)),
            'disk': self._calculate_stats(filter_history(self.disk_history)),
            'period': f"{hours}小时",
            'data_points': len(self.cpu_history)
        }
    
    def _calculate_stats(self, data):
        """计算统计数据"""
        if not data:
            return None
        
        values = [item['value'] for item in data]
        
        return {
            'min': min(values),
            'max': max(values),
            'avg': sum(values) / len(values),
            'current': values[-1],
            'data_points': len(values)
        }

class ApplicationMonitor:
    """应用监控器"""
    
    def __init__(self):
        self.request_count = 0
        self.error_count = 0
        self.response_times = deque(maxlen=1000)
        self.api_calls = {}
        self.start_time = datetime.now()
    
    def record_request(self, method, path, status_code, response_time):
        """记录请求"""
        self.request_count += 1
        
        if status_code >= 400:
            self.error_count += 1
        
        self.response_times.append({
            'timestamp': datetime.now(),
            'method': method,
            'path': path,
            'status_code': status_code,
            'response_time': response_time
        })
    
    def record_api_call(self, endpoint, success, response_time):
        """记录API调用"""
        if endpoint not in self.api_calls:
            self.api_calls[endpoint] = {
                'count': 0,
                'errors': 0,
                'total_time': 0,
                'avg_time': 0
            }
        
        call_info = self.api_calls[endpoint]
        call_info['count'] += 1
        call_info['total_time'] += response_time
        call_info['avg_time'] = call_info['total_time'] / call_info['count']
        
        if not success:
            call_info['errors'] += 1
    
    def get_metrics(self):
        """获取应用指标"""
        uptime = (datetime.now() - self.start_time).total_seconds()
        
        # 计算响应时间统计
        if self.response_times:
            response_time_values = [rt['response_time'] for rt in self.response_times]
            avg_response_time = sum(response_time_values) / len(response_time_values)
            max_response_time = max(response_time_values)
            min_response_time = min(response_time_values)
        else:
            avg_response_time = max_response_time = min_response_time = 0
        
        # 计算错误率
        error_rate = (self.error_count / self.request_count * 100) if self.request_count > 0 else 0
        
        return {
            'uptime': uptime,
            'request_count': self.request_count,
            'error_count': self.error_count,
            'error_rate': round(error_rate, 2),
            'avg_response_time': round(avg_response_time, 3),
            'max_response_time': round(max_response_time, 3),
            'min_response_time': round(min_response_time, 3),
            'api_calls': self.api_calls,
            'start_time': self.start_time.isoformat()
        }
    
    def get_health_status(self):
        """获取健康状态"""
        metrics = self.get_metrics()
        
        # 健康检查逻辑
        issues = []
        
        if metrics['error_rate'] > 5:
            issues.append("错误率过高")
        
        if metrics['avg_response_time'] > 2:
            issues.append("平均响应时间过长")
        
        if metrics['request_count'] == 0:
            issues.append("无请求处理")
        
        # 检查API调用错误
        for endpoint, stats in metrics['api_calls'].items():
            if stats['count'] > 0 and (stats['errors'] / stats['count']) > 0.1:
                issues.append(f"API {endpoint} 错误率过高")
        
        return {
            'status': 'healthy' if not issues else 'unhealthy',
            'issues': issues,
            'metrics': metrics
        }

# 全局监控器实例
system_monitor = SystemMonitor()
app_monitor = ApplicationMonitor()