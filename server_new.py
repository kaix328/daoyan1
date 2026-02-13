"""
AI Director Assistant - 主服务器文件（重构版）
"""

from app import create_app
from app.config import Config

def main():
    """主函数"""
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

if __name__ == '__main__':
    main()