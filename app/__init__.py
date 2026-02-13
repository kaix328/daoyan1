"""
AI Director Assistant - 主应用初始化模块
"""

from flask import Flask, jsonify
from flask_cors import CORS
from app.config import Config
from app.models.database import DatabaseManager
from app.routes.api import api_bp
from app.routes.export import export_bp
from app.utils.helpers import Utils, ValidationError
import os

def create_app(db_file=None):
    """创建Flask应用实例
    
    Args:
        db_file: 数据库文件路径（可选）
    """
    
    # 验证配置
    try:
        Config.validate_config()
    except Exception as e:
        print(f"⚠️ 配置验证警告: {e}")
    
    # 创建Flask应用
    app = Flask(
        __name__,
        static_folder=Config.STATIC_FOLDER,
        template_folder=Config.TEMPLATES_FOLDER
    )
    
    # 配置应用
    app.config.from_object(Config)
    
    # 启用CORS
    CORS(app)
    
    # 注册蓝图
    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(export_bp, url_prefix='/api/export')
    
    # 初始化数据库
    with app.app_context():
        db = DatabaseManager(db_file=db_file) if db_file else DatabaseManager()
        print("✅ 数据库初始化完成")
    
    # 错误处理
    @app.errorhandler(404)
    def not_found(error):
        return Utils.create_error_response("资源不存在", 404)
    
    @app.errorhandler(500)
    def internal_error(error):
        Utils.log_error(error, "服务器内部错误")
        return Utils.create_error_response("服务器内部错误", 500)
    
    @app.errorhandler(ValidationError)
    def validation_error(error):
        return Utils.create_error_response(str(error))
    
    # 根路由
    @app.route('/')
    def index():
        return jsonify({
            'name': 'AI Director Assistant',
            'version': '1.0.0',
            'status': 'running',
            'timestamp': Utils.get_current_timestamp()
        })
    
    # 健康检查
    @app.route('/health')
    def health_check():
        health_status = Utils.check_backend_health()
        
        if health_status['status'] == 'healthy':
            return Utils.create_success_response(health_status)
        else:
            return Utils.create_error_response("服务异常", 503, health_status)
    
    return app

if __name__ == '__main__':
    # 创建应用
    app = create_app()
    
    # 打印配置
    Config.print_config()
    
    # 启动应用
    print(f"🚀 AI Director Assistant 启动中...")
    print(f"📱 访问地址: http://{Config.FLASK_HOST}:{Config.FLASK_PORT}")
    
    app.run(
        host=Config.FLASK_HOST,
        port=Config.FLASK_PORT,
        debug=Config.FLASK_DEBUG
    )