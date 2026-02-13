"""
AI Director Assistant - API路由模块
"""

from flask import Blueprint, request, jsonify, current_app
from app.utils.helpers import Utils, ValidationError, APIError
from app.models.database import DatabaseManager
import requests
import json

api_bp = Blueprint('api', __name__)

# 数据库实例将在请求时从应用上下文中获取
def get_db():
    """获取数据库实例"""
    if 'database' in current_app.extensions:
        return current_app.extensions['database']
    return DatabaseManager()

@api_bp.route('/proxy', methods=['POST'])
def proxy_to_dashscope():
    """代理到DashScope API"""
    try:
        # 获取请求数据
        data = request.get_json()
        if not data:
            return Utils.create_error_response("请求数据不能为空")
        
        # 验证必需字段
        if 'model' not in data:
            return Utils.create_error_response("缺少model参数")
        if 'input' not in data:
            return Utils.create_error_response("缺少input参数")
        
        # 获取API密钥
        api_key = get_db().get_setting('apikey')
        if not api_key:
            error_response = Utils.create_error_response("API密钥未配置")
            return jsonify(error_response[0]), 400
        
        # 验证API密钥格式
        Utils.validate_api_key(api_key)
        
        # 构建请求头
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
            'X-DashScope-Sync': 'enable'
        }
        
        # 转发到DashScope API
        response = requests.post(
            current_app.config['DASHSCOPE_API_URL'],
            headers=headers,
            json=data,
            timeout=30
        )
        
        # 返回响应
        return response.content, response.status_code, dict(response.headers)
        
    except ValidationError as e:
        return Utils.create_error_response(str(e))
    except requests.exceptions.Timeout:
        return Utils.create_error_response("请求超时")
    except requests.exceptions.ConnectionError:
        return Utils.create_error_response("网络连接失败")
    except requests.exceptions.RequestException as e:
        return Utils.create_error_response(f"API请求失败: {str(e)}")
    except Exception as e:
        Utils.log_error(e, "代理API请求")
        return Utils.create_error_response("服务器内部错误")

@api_bp.route('/settings/apikey/check', methods=['GET'])
def check_api_key():
    """检查API密钥状态"""
    try:
        api_key = get_db().get_setting('apikey')
        response = Utils.create_success_response({
            'exists': bool(api_key),
            'configured': bool(api_key),
            'length': len(api_key) if api_key else 0
        })
        return jsonify(response)
    except Exception as e:
        Utils.log_error(e, "检查API密钥")
        return Utils.create_error_response("检查失败")

@api_bp.route('/settings/apikey', methods=['POST'])
def update_api_key():
    """更新API密钥"""
    try:
        data = request.get_json()
        api_key = data['apikey'].strip()
        Utils.validate_api_key(api_key)
        success = get_db().set_setting('apikey', api_key)
        if success:
            response = Utils.create_success_response(message="API密钥更新成功")
            return jsonify(response)
        else:
            error_response = Utils.create_error_response("API密钥保存失败")
            return jsonify(error_response[0]), error_response[1]
    except ValidationError as e:
        error_response = Utils.create_error_response(str(e))
        return jsonify(error_response[0]), error_response[1]
    except Exception as e:
        Utils.log_error(e, "更新API密钥")
        return Utils.create_error_response("更新失败")

@api_bp.route('/scripts', methods=['GET'])
def get_scripts():
    """获取脚本列表"""
    try:
        # 验证参数
        limit = request.args.get('limit', 50, type=int)
        if limit < 1 or limit > 100:
            return Utils.create_error_response("limit参数必须在1-100之间")
        
        # 获取脚本
        scripts = get_db().get_all_scripts(limit)
        
        response = Utils.create_success_response({
            'scripts': scripts,
            'count': len(scripts),
            'limit': limit
        })
        return jsonify(response)
        
    except Exception as e:
        Utils.log_error(e, "获取脚本列表")
        return Utils.create_error_response("获取失败")

@api_bp.route('/scripts', methods=['POST'])
def create_script():
    """创建新脚本"""
    try:
        data = request.get_json()
        if not data:
            return Utils.create_error_response("缺少必要字段")
        
        # 验证必需字段
        required_fields = ['theme', 'script_type', 'platform', 'content']
        missing_fields = []
        for field in required_fields:
            if field not in data:
                missing_fields.append(field)
            elif not data[field] or (isinstance(data[field], str) and not data[field].strip()):
                missing_fields.append(f"{field} (空值)")
        
        if missing_fields:
            if any('空值' in field for field in missing_fields):
                return Utils.create_error_response("字段不能为空")
            else:
                return Utils.create_error_response("缺少必要字段")
        
        # 验证数据
        Utils.validate_script_data(data)
        
        # 清理输入
        theme = Utils.sanitize_input(data['theme'])
        script_type = Utils.sanitize_input(data['script_type'])
        platform = Utils.sanitize_input(data['platform'])
        content = data['content'].strip()
        metadata = data.get('metadata', {})
        
        # 创建脚本
        script_id = get_db().create_script(theme, script_type, platform, content, metadata)
        
        if script_id:
            response = Utils.create_success_response({
                'id': script_id,
                'message': '脚本创建成功'
            })
            return jsonify(response)
        else:
            return Utils.create_error_response("脚本创建失败")
            
    except ValidationError as e:
        return Utils.create_error_response(str(e))
    except Exception as e:
        Utils.log_error(e, "创建脚本")
        return Utils.create_error_response("创建失败")

@api_bp.route('/scripts/<int:script_id>', methods=['PUT'])
def update_script(script_id):
    """更新脚本"""
    try:
        data = request.get_json()
        if not data:
            return Utils.create_error_response("请求数据不能为空")
        
        # 验证数据
        update_data = {}
        if 'theme' in data:
            update_data['theme'] = Utils.sanitize_input(data['theme'])
        if 'script_type' in data:
            update_data['script_type'] = Utils.sanitize_input(data['script_type'])
        if 'platform' in data:
            update_data['platform'] = Utils.sanitize_input(data['platform'])
        if 'content' in data:
            if len(data['content'].strip()) < 10:
                return Utils.create_error_response("脚本内容太短")
            update_data['content'] = data['content'].strip()
        if 'is_favorite' in data:
            update_data['is_favorite'] = bool(data['is_favorite'])
        if 'metadata' in data:
            update_data['metadata'] = data['metadata']
        
        if not update_data:
            return Utils.create_error_response("没有可更新的字段")
        
        # 更新脚本
        success = get_db().update_script(script_id, **update_data)
        
        if success:
            response = Utils.create_success_response(message="脚本更新成功")
            return jsonify(response)
        else:
            error_response = Utils.create_error_response("脚本更新失败")
            return jsonify(error_response[0]), error_response[1]
            
    except ValidationError as e:
        return Utils.create_error_response(str(e))
    except Exception as e:
        Utils.log_error(e, "更新脚本")
        return Utils.create_error_response("更新失败")

@api_bp.route('/scripts/<int:script_id>', methods=['DELETE'])
def delete_script(script_id):
    """删除脚本"""
    try:
        success = get_db().delete_script(script_id)
        
        if success:
            response = Utils.create_success_response(message="脚本删除成功")
            return jsonify(response)
        else:
            error_response = Utils.create_error_response("脚本不存在或删除失败")
            return jsonify(error_response[0]), error_response[1]
            
    except Exception as e:
        Utils.log_error(e, "删除脚本")
        return Utils.create_error_response("删除失败")

@api_bp.route('/scripts/<int:script_id>/favorite', methods=['POST'])
def toggle_favorite(script_id):
    """切换收藏状态"""
    try:
        success = get_db().toggle_favorite(script_id)
        
        if success:
            response = Utils.create_success_response(message="收藏状态更新成功")
            return jsonify(response)
        else:
            error_response = Utils.create_error_response("脚本不存在")
            return jsonify(error_response[0]), error_response[1]
            
    except Exception as e:
        Utils.log_error(e, "切换收藏")
        return Utils.create_error_response("操作失败")

@api_bp.route('/health', methods=['GET'])
def health_check():
    """健康检查"""
    try:
        health_status = Utils.check_backend_health()
        
        if health_status['status'] == 'healthy':
            response = Utils.create_success_response(health_status)
            return jsonify(response)
        else:
            error_response = Utils.create_error_response("服务异常", 503, health_status)
            return jsonify(error_response[0]), error_response[1]
            
    except Exception as e:
        Utils.log_error(e, "健康检查")
        return Utils.create_error_response("检查失败", 503)

@api_bp.route('/stats', methods=['GET'])
def get_stats():
    """获取统计信息"""
    try:
        # 获取所有脚本进行统计
        scripts = get_db().get_all_scripts(10000)
        
        # 基础统计
        total_scripts = len(scripts)
        favorite_scripts = sum(1 for s in scripts if s.get('is_favorite', False))
        
        # 按类型统计
        type_stats = {}
        for script in scripts:
            script_type = script.get('script_type', 'unknown')
            type_stats[script_type] = type_stats.get(script_type, 0) + 1
        
        # 按平台统计
        platform_stats = {}
        for script in scripts:
            platform = script.get('platform', 'unknown')
            platform_stats[platform] = platform_stats.get(platform, 0) + 1
        
        response = Utils.create_success_response({
            'total_scripts': total_scripts,
            'favorite_scripts': favorite_scripts,
            'type_distribution': type_stats,
            'platform_distribution': platform_stats
        })
        return jsonify(response)
        
    except Exception as e:
        Utils.log_error(e, "获取统计信息")
        return Utils.create_error_response("统计信息获取失败")

# ===== 前端兼容路由 =====
@api_bp.route('/history', methods=['GET'])
def get_history():
    """获取历史记录（前端兼容）"""
    try:
        scripts = get_db().get_all_scripts(limit=100)
        # 转换为前端期望的格式
        history = []
        for s in scripts:
            history.append({
                'id': s.get('id'),
                'theme': s.get('theme', ''),
                'content': s.get('content', ''),
                'created_at': s.get('created_at', ''),
                'is_favorite': s.get('is_favorite', False),
                'script_type': s.get('script_type', ''),
                'platform': s.get('platform', '')
            })
        return jsonify(history)
    except Exception as e:
        Utils.log_error(e, "获取历史记录")
        return Utils.create_error_response("获取历史记录失败")

@api_bp.route('/scripts/save', methods=['POST'])
def save_script_frontend():
    """保存脚本（前端兼容）"""
    try:
        data = request.get_json()
        if not data:
            return Utils.create_error_response("缺少数据")
        
        # 提取必要字段
        theme = data.get('theme', '未命名脚本')
        content = data.get('content', '')
        script_type = data.get('script_type', 'standard')
        platform = data.get('platform', 'web')
        metadata = data.get('metadata', {})
        
        # 创建脚本
        script_id = db.create_script(theme, script_type, platform, content, metadata)
        
        if script_id:
            response = Utils.create_success_response({
                'id': script_id,
                'message': '脚本保存成功'
            })
            return jsonify(response)
        else:
            return Utils.create_error_response("脚本保存失败")
            
    except Exception as e:
        Utils.log_error(e, "保存脚本")
        return Utils.create_error_response("保存失败")

@api_bp.route('/scripts/favorite', methods=['POST'])
def toggle_favorite_frontend():
    """切换收藏状态（前端兼容）"""
    try:
        data = request.get_json()
        if not data or 'id' not in data:
            return Utils.create_error_response("缺少脚本ID")
        
        script_id = data['id']
        success = db.toggle_favorite(script_id)
        
        if success:
            response = Utils.create_success_response({'message': '收藏状态更新成功'})
            return jsonify(response)
        else:
            return Utils.create_error_response("脚本不存在")
            
    except Exception as e:
        Utils.log_error(e, "切换收藏")
        return Utils.create_error_response("操作失败")

@api_bp.route('/scripts/delete', methods=['POST'])
def delete_script_frontend():
    """删除脚本（前端兼容）"""
    try:
        data = request.get_json()
        if not data or 'id' not in data:
            return Utils.create_error_response("缺少脚本ID")
        
        script_id = data['id']
        success = db.delete_script(script_id)
        
        if success:
            response = Utils.create_success_response({'message': '脚本删除成功'})
            return jsonify(response)
        else:
            return Utils.create_error_response("脚本不存在或删除失败")
            
    except Exception as e:
        Utils.log_error(e, "删除脚本")
        return Utils.create_error_response("删除失败")