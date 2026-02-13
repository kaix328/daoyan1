"""
测试运行脚本
"""

import pytest
import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def run_all_tests():
    """运行所有测试"""
    print("🧪 开始运行所有测试...")
    
    # 运行测试并生成覆盖率报告
    pytest_args = [
        "-v",  # 详细输出
        "--tb=short",  # 简短错误信息
        "--cov=app",  # 覆盖率统计
        "--cov-report=html",  # HTML报告
        "--cov-report=term-missing",  # 终端显示缺失的行
        "tests/"  # 测试目录
    ]
    
    result = pytest.main(pytest_args)
    
    if result == 0:
        print("✅ 所有测试通过！")
    else:
        print("❌ 部分测试失败")
    
    return result

def run_specific_test(test_file):
    """运行指定测试文件"""
    print(f"🧪 运行测试文件: {test_file}")
    
    pytest_args = [
        "-v",
        "--tb=short",
        f"tests/{test_file}"
    ]
    
    result = pytest.main(pytest_args)
    
    if result == 0:
        print(f"✅ {test_file} 测试通过！")
    else:
        print(f"❌ {test_file} 测试失败")
    
    return result

def run_with_coverage():
    """运行测试并生成详细覆盖率报告"""
    print("📊 运行测试并生成覆盖率报告...")
    
    pytest_args = [
        "-v",
        "--tb=short",
        "--cov=app",
        "--cov-report=html:htmlcov",
        "--cov-report=term-missing",
        "--cov-fail-under=80",  # 覆盖率低于80%时失败
        "tests/"
    ]
    
    result = pytest.main(pytest_args)
    
    if result == 0:
        print("✅ 测试通过，覆盖率达标！")
        print("📈 覆盖率报告已生成: htmlcov/index.html")
    else:
        print("❌ 测试失败或覆盖率不达标")
    
    return result

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="运行AI Director Assistant测试")
    parser.add_argument("--file", "-f", help="指定测试文件")
    parser.add_argument("--coverage", "-c", action="store_true", help="生成覆盖率报告")
    parser.add_argument("--all", "-a", action="store_true", help="运行所有测试")
    
    args = parser.parse_args()
    
    if args.file:
        result = run_specific_test(args.file)
    elif args.coverage:
        result = run_with_coverage()
    else:
        result = run_all_tests()
    
    sys.exit(result)