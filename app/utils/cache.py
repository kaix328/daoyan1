"""
AI Director Assistant - 缓存管理模块
"""

import time
import json
import hashlib
from functools import wraps
from app.utils.logger import logger

class CacheManager:
    """缓存管理器"""
    
    def __init__(self, max_size=1000, default_ttl=3600):
        self.cache = {}
        self.max_size = max_size
        self.default_ttl = default_ttl
        self.hits = 0
        self.misses = 0
    
    def _generate_key(self, *args, **kwargs):
        """生成缓存键"""
        key_data = str(args) + str(sorted(kwargs.items()))
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def get(self, key):
        """获取缓存值"""
        if key not in self.cache:
            self.misses += 1
            return None
        
        value, expiry = self.cache[key]
        
        if time.time() > expiry:
            del self.cache[key]
            self.misses += 1
            return None
        
        self.hits += 1
        return value
    
    def set(self, key, value, ttl=None):
        """设置缓存值"""
        if ttl is None:
            ttl = self.default_ttl
        
        expiry = time.time() + ttl
        
        # 如果缓存已满，清理最旧的条目
        if len(self.cache) >= self.max_size:
            oldest_key = min(self.cache.keys(), key=lambda k: self.cache[k][1])
            del self.cache[oldest_key]
        
        self.cache[key] = (value, expiry)
    
    def delete(self, key):
        """删除缓存"""
        if key in self.cache:
            del self.cache[key]
            return True
        return False
    
    def clear(self):
        """清空缓存"""
        self.cache.clear()
        self.hits = 0
        self.misses = 0
    
    def get_stats(self):
        """获取缓存统计"""
        total_requests = self.hits + self.misses
        hit_rate = (self.hits / total_requests * 100) if total_requests > 0 else 0
        
        return {
            'size': len(self.cache),
            'hits': self.hits,
            'misses': self.misses,
            'hit_rate': round(hit_rate, 2),
            'max_size': self.max_size,
            'default_ttl': self.default_ttl
        }
    
    def cache_function(self, ttl=None, key_prefix=''):
        """函数缓存装饰器"""
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                # 生成缓存键
                cache_key = self._generate_key(key_prefix, *args, **kwargs)
                
                # 尝试从缓存获取
                cached_result = self.get(cache_key)
                if cached_result is not None:
                    logger.info(f"缓存命中: {func.__name__}")
                    return cached_result
                
                # 执行函数
                result = func(*args, **kwargs)
                
                # 缓存结果
                self.set(cache_key, result, ttl)
                logger.info(f"缓存设置: {func.__name__}")
                
                return result
            
            # 添加缓存清理方法
            wrapper.cache_clear = lambda: self.clear()
            wrapper.cache_stats = lambda: self.get_stats()
            
            return wrapper
        return decorator

class ResponseCache:
    """响应缓存管理器"""
    
    def __init__(self):
        self.api_cache = CacheManager(max_size=500, default_ttl=1800)  # 30分钟
        self.script_cache = CacheManager(max_size=200, default_ttl=600)   # 10分钟
        self.stats_cache = CacheManager(max_size=50, default_ttl=300)     # 5分钟
    
    def cache_api_response(self, endpoint, params, response):
        """缓存API响应"""
        cache_key = f"api:{endpoint}:{hashlib.md5(str(params).encode()).hexdigest()}"
        self.api_cache.set(cache_key, response, ttl=1800)
        logger.info(f"API响应已缓存: {endpoint}")
    
    def get_cached_api_response(self, endpoint, params):
        """获取缓存的API响应"""
        cache_key = f"api:{endpoint}:{hashlib.md5(str(params).encode()).hexdigest()}"
        return self.api_cache.get(cache_key)
    
    def cache_script_list(self, limit, scripts):
        """缓存脚本列表"""
        cache_key = f"scripts:list:{limit}"
        self.script_cache.set(cache_key, scripts, ttl=600)
        logger.info(f"脚本列表已缓存: limit={limit}")
    
    def get_cached_script_list(self, limit):
        """获取缓存的脚本列表"""
        cache_key = f"scripts:list:{limit}"
        return self.script_cache.get(cache_key)
    
    def cache_stats(self, stats):
        """缓存统计信息"""
        cache_key = "stats:general"
        self.stats_cache.set(cache_key, stats, ttl=300)
        logger.info("统计信息已缓存")
    
    def get_cached_stats(self):
        """获取缓存的统计信息"""
        cache_key = "stats:general"
        return self.stats_cache.get(cache_key)
    
    def invalidate_script_cache(self):
        """使脚本缓存失效"""
        self.script_cache.clear()
        logger.info("脚本缓存已清除")
    
    def invalidate_stats_cache(self):
        """使统计缓存失效"""
        self.stats_cache.clear()
        logger.info("统计缓存已清除")
    
    def get_cache_stats(self):
        """获取缓存统计信息"""
        return {
            'api_cache': self.api_cache.get_stats(),
            'script_cache': self.script_cache.get_stats(),
            'stats_cache': self.stats_cache.get_stats()
        }

# 全局缓存管理器实例
cache_manager = ResponseCache()