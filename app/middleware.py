"""
AI Director Assistant - 中间件模块
"""

import time
from flask import request, g
from app.utils.logger import logger
from app.utils.cache import cache_manager
from app.utils.monitor import app_monitor
from app.utils.helpers import Utils

def setup_middlewares(app):
    """设置中间件"""
    
    @app.before_request
    def before_request():
        """请求前处理"""
        g.start_time = time.time()
        
        # 记录请求开始
        logger.info(f"请求开始: {request.method} {request.path}")
        
        # 检查缓存
        if request.method == 'GET' and request.path.startswith('/api/'):
            cached_response = cache_manager.get_cached_api_response(
                request.path, 
                dict(request.args)
            )
            if cached_response:
                logger.info(f"返回缓存响应: {request.path}")
                return cached_response
    
    @app.after_request
    def after_request(response):
        """请求后处理"""
        # 计算响应时间
        if hasattr(g, 'start_time'):
            response_time = time.time() - g.start_time
            
            # 记录请求完成
            logger.info(f"请求完成: {request.method} {request.path} - {response.status_code} ({response_time:.3f}s)")
            
            # 记录监控指标
            app_monitor.record_request(
                request.method,
                request.path,
                response.status_code,
                response_time
            )
            
            # 缓存成功的GET响应
            if (request.method == 'GET' and 
                response.status_code == 200 and 
                request.path.startswith('/api/')):
                cache_manager.cache_api_response(
                    request.path,
                    dict(request.args),
                    response
                )
            
            # 如果涉及脚本修改，清除相关缓存
            if request.path.startswith('/api/scripts') and request.method in ['POST', 'PUT', 'DELETE']:
                cache_manager.invalidate_script_cache()
                cache_manager.invalidate_stats_cache()
        
        # 添加安全头
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        
        return response
    
    @app.teardown_request
    def teardown_request(exception=None):
        """请求清理"""
        if exception:
            logger.error(f"请求异常: {request.method} {request.path} - {str(exception)}")
            app_monitor.record_request(
                request.method,
                request.path,
                500,
                0
            )

def setup_error_handlers(app):
    """设置错误处理器"""
    
    @app.errorhandler(404)
    def handle_404(error):
        """处理404错误"""
        logger.warning(f"404错误: {request.method} {request.path}")
        return Utils.create_error_response("资源不存在", 404)
    
    @app.errorhandler(500)
    def handle_500(error):
        """处理500错误"""
        logger.error(f"500错误: {request.method} {request.path} - {str(error)}")
        return Utils.create_error_response("服务器内部错误", 500)
    
    @app.errorhandler(429)
    def handle_429(error):
        """处理请求频率限制"""
        logger.warning(f"429错误: {request.method} {request.path}")
        return Utils.create_error_response("请求过于频繁，请稍后再试", 429)
    
    @app.errorhandler(413)
    def handle_413(error):
        """处理文件过大"""
        logger.warning(f"413错误: {request.method} {request.path}")
        return Utils.create_error_response("文件过大", 413)

def setup_cors_headers(app):
    """设置CORS头"""
    
    @app.after_request
    def add_cors_headers(response):
        """添加CORS头"""
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        response.headers['Access-Control-Max-Age'] = '86400'
        
        return response

def setup_request_limiter(app, max_requests=100, window=60):
    """设置请求限制器"""
    from collections import defaultdict, deque
    import time
    
    request_counts = defaultdict(lambda: deque(maxlen=max_requests))
    
    @app.before_request
    def check_rate_limit():
        """检查请求频率"""
        client_ip = request.remote_addr or 'unknown'
        current_time = time.time()
        
        # 清理过期的请求记录
        while (request_counts[client_ip] and 
               current_time - request_counts[client_ip][0] > window):
            request_counts[client_ip].popleft()
        
        # 检查是否超过限制
        if len(request_counts[client_ip]) >= max_requests:
            logger.warning(f"请求频率超限: {client_ip}")
            return Utils.create_error_response("请求过于频繁，请稍后再试", 429)
        
        # 记录当前请求
        request_counts[client_ip].append(current_time)

def setup_all_middlewares(app):
    """设置所有中间件"""
    setup_middlewares(app)
    setup_error_handlers(app)
    setup_cors_headers(app)
    setup_request_limiter(app)