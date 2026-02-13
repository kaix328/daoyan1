"""
AI Director Assistant - 增强版API路由模块（带完整错误处理）
"""

from flask import Blueprint, request, jsonify, current_app
from app.utils.helpers import Utils, ValidationError, APIError
from app.utils.validators import (
    handle_errors, validate_json_input, sanitize_input_data,
    validate_length, create_validation_error, require_api_key
)
from app.models.database import DatabaseManager
import requests
import json
import time

api_bp = Blueprint('api', __name__)

# 初始化数据库
db = DatabaseManager()

@api_bp.route('/proxy', methods=['POST'])
@handle_errors
def proxy_to_dashscope():
    """代理到DashScope API"""
    start_time = time.time()
    
    # 获取请求数据
    data = request.get_json()
    if not data:
        raise ValidationError("请求数据不能为空")
    
    # 验证输入数据
    data = sanitize_input_data(data)
    
    # 获取API密钥
    api_key = db.get_setting('apikey')
    if not api_key:
        raise ValidationError("API密钥未配置，请先设置API密钥")
    
    # 验证API密钥格式
    Utils.validate_api_key(api_key)
    
    # 构建请求头
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
        'X-DashScope-Sync': 'enable'
    }
    
    # 验证请求数据
    if 'model' not in data:
        raise ValidationError("缺少model参数")
    
    if 'input' not in data:
        raise ValidationError("缺少input参数")
    
    # 转发到DashScope API
    try:
        response = requests.post(
            current_app.config['DASHSCOPE_API_URL'],
            headers=headers,
            json=data,
            timeout=30
        )
        
        # 记录响应时间
        response_time = time.time() - start_time
        current_app.logger.info(f"API调用完成，耗时: {response_time:.2f}s")
        
        # 检查响应状态
        if response.status_code != 200:
            error_msg = f"DashScope API返回错误: {response.status_code}"
            try:
                error_data = response.json()
                if 'message' in error_data:
                    error_msg = error_data['message']
            except:
                pass
            raise APIError(error_msg)
        
        # 返回响应
        return response.content, response.status_code, dict(response.headers)
        
    except requests.exceptions.Timeout:
        raise APIError("请求超时，请稍后重试")
    except requests.exceptions.ConnectionError:
        raise APIError("网络连接失败，请检查网络连接")
    except requests.exceptions.RequestException as e:
        raise APIError(f"API请求失败: {str(e)}")

@api_bp.route('/settings/apikey/check', methods=['GET'])
@handle_errors
def check_api_key():
    """检查API密钥状态"""
    api_key = db.get_setting('apikey')
    
    response = Utils.create_success_response({
        'exists': bool(api_key),
        'configured': bool(api_key),
        'length': len(api_key) if api_key else 0
    })
    return jsonify(response)

@api_bp.route('/settings/apikey', methods=['POST'])
@handle_errors
@validate_json_input(['apikey'])
def update_api_key(data):
    """更新API密钥"""
    api_key = data['apikey'].strip()
    
    # 验证API密钥格式
    Utils.validate_api_key(api_key)
    
    # 保存API密钥
    success = db.set_setting('apikey', api_key)
    
    if success:
        response = Utils.create_success_response(message="API密钥更新成功")
        return jsonify(response)
    else:
        raise APIError("API密钥保存失败")

@api_bp.route('/scripts', methods=['GET'])
@handle_errors
def get_scripts():
    """获取脚本列表"""
    # 验证参数
    limit = request.args.get('limit', 50, type=int)
    if limit < 1 or limit > 100:
        raise ValidationError("limit参数必须在1-100之间")
    
    # 获取脚本
    scripts = db.get_all_scripts(limit)
    
    response = Utils.create_success_response({
        'scripts': scripts,
        'count': len(scripts),
        'limit': limit
    })
    return jsonify(response)

@api_bp.route('/scripts', methods=['POST'])
@handle_errors
@validate_json_input(['theme', 'script_type', 'platform', 'content'])
def create_script(data):
    """创建新脚本"""
    # 清理和验证数据
    data = sanitize_input_data(data)
    
    # 验证字段长度
    validate_length(data['theme'], 1, 100, "主题")
    validate_length(data['script_type'], 1, 50, "脚本类型")
    validate_length(data['platform'], 1, 50, "平台")
    validate_length(data['content'], 10, 50000, "内容")
    
    # 创建脚本
    script_id = db.create_script(
        theme=data['theme'],
        script_type=data['script_type'],
        platform=data['platform'],
        content=data['content'],
        metadata=data.get('metadata', {})
    )
    
    if script_id:
        response = Utils.create_success_response({
            'id': script_id,
            'message': "脚本创建成功"
        })
        return jsonify(response)
    else:
        raise APIError("脚本创建失败")

@api_bp.route('/scripts/<int:script_id>', methods=['PUT'])
@handle_errors
@validate_json_input()
def update_script(data, script_id):
    """更新脚本"""
    # 清理输入数据
    data = sanitize_input_data(data)
    
    # 验证更新字段
    update_data = {}
    if 'theme' in data:
        validate_length(data['theme'], 1, 100, "主题")
        update_data['theme'] = data['theme']
    if 'script_type' in data:
        validate_length(data['script_type'], 1, 50, "脚本类型")
        update_data['script_type'] = data['script_type']
    if 'platform' in data:
        validate_length(data['platform'], 1, 50, "平台")
        update_data['platform'] = data['platform']
    if 'content' in data:
        validate_length(data['content'], 10, 50000, "内容")
        update_data['content'] = data['content']
    if 'is_favorite' in data:
        update_data['is_favorite'] = bool(data['is_favorite'])
    if 'metadata' in data:
        update_data['metadata'] = data['metadata']
    
    if not update_data:
        raise ValidationError("没有可更新的字段")
    
    # 更新脚本
    success = db.update_script(script_id, **update_data)
    
    if success:
        response = Utils.create_success_response(message="脚本更新成功")
        return jsonify(response)
    else:
        raise APIError("脚本更新失败")

@api_bp.route('/scripts/<int:script_id>', methods=['DELETE'])
@handle_errors
def delete_script(script_id):
    """删除脚本"""
    success = db.delete_script(script_id)
    
    if success:
        response = Utils.create_success_response(message="脚本删除成功")
        return jsonify(response)
    else:
        raise ValidationError("脚本不存在或删除失败")

@api_bp.route('/scripts/<int:script_id>/favorite', methods=['POST'])
@handle_errors
def toggle_favorite(script_id):
    """切换收藏状态"""
    success = db.toggle_favorite(script_id)
    
    if success:
        response = Utils.create_success_response(message="收藏状态更新成功")
        return jsonify(response)
    else:
        raise ValidationError("脚本不存在")

@api_bp.route('/health', methods=['GET'])
@handle_errors
def health_check():
    """健康检查"""
    health_status = Utils.check_backend_health()
    
    if health_status['status'] == 'healthy':
        response = Utils.create_success_response(health_status)
        return jsonify(response)
    else:
        raise APIError("服务异常", details=health_status)

@api_bp.route('/stats', methods=['GET'])
@handle_errors
def get_stats():
    """获取统计信息"""
    try:
        # 获取所有脚本进行统计
        scripts = db.get_all_scripts(10000)
        
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
        raise APIError(f"统计信息获取失败: {str(e)}")