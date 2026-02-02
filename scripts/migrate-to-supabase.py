#!/usr/bin/env python3
"""
Supabase 数据库迁移脚本
将 Neon 备份数据导入到 Supabase
"""

import os
import subprocess
import sys
from pathlib import Path

# Supabase 连接信息
SUPABASE_HOST = "db.uyrwtzcyufimvzakpqts.supabase.co"
SUPABASE_PORT = "5432"  # 使用 direct connection 端口
SUPABASE_USER = "postgres"
SUPABASE_PASSWORD = "lisikai948930"
SUPABASE_DB = "postgres"

# 备份文件路径
BACKUP_FILE = Path(__file__).parent.parent / "neon_backup.sql"

def main():
    if not BACKUP_FILE.exists():
        print(f"❌ 备份文件不存在: {BACKUP_FILE}")
        sys.exit(1)

    print(f"📦 备份文件: {BACKUP_FILE}")
    print(f"📊 文件大小: {BACKUP_FILE.stat().st_size / 1024:.1f}KB")
    print()

    # 构建连接字符串
    connection_string = f"postgresql://{SUPABASE_USER}:{SUPABASE_PASSWORD}@{SUPABASE_HOST}:{SUPABASE_PORT}/{SUPABASE_DB}"

    print("🔗 连接信息:")
    print(f"  - 主机: {SUPABASE_HOST}")
    print(f"  - 端口: {SUPABASE_PORT}")
    print(f"  - 用户: {SUPABASE_USER}")
    print(f"  - 数据库: {SUPABASE_DB}")
    print()

    # 先测试连接
    print("🧪 测试连接...")
    test_cmd = [
        "/opt/homebrew/opt/libpq/bin/psql",
        connection_string,
        "-c",
        "SELECT 1 AS connection_test;"
    ]

    try:
        result = subprocess.run(test_cmd, capture_output=True, text=True, timeout=10)
        if result.returncode != 0:
            print(f"❌ 连接失败: {result.stderr}")
            print()
            print("💡 可能的解决方案:")
            print("  1. 检查网络连接")
            print("  2. 检查 Supabase 数据库是否已初始化")
            print("  3. 检查密码是否正确")
            print("  4. 尝试从 Supabase Dashboard 复制完整连接字符串")
            sys.exit(1)
        print("✅ 连接成功!")
        print()
    except subprocess.TimeoutExpired:
        print("❌ 连接超时")
        sys.exit(1)

    # 导入数据
    print("📥 导入数据...")
    import_cmd = [
        "/opt/homebrew/opt/libpq/bin/psql",
        connection_string,
        "-f",
        str(BACKUP_FILE)
    ]

    try:
        result = subprocess.run(import_cmd, capture_output=True, text=True, timeout=300)

        if result.returncode != 0:
            print(f"❌ 导入失败:")
            print(result.stderr)
            sys.exit(1)

        print("✅ 数据导入完成!")
        print()

        # 验证导入结果
        print("🔍 验证数据...")
        verify_cmd = [
            "/opt/homebrew/opt/libpq/bin/psql",
            connection_string,
            "-c",
            """
            SELECT 'Agents' as table_name, COUNT(*) as count FROM "Agent"
            UNION ALL
            SELECT 'Tasks', COUNT(*) FROM "Task"
            UNION ALL
            SELECT 'Wallets', COUNT(*) FROM "Wallet"
            UNION ALL
            SELECT 'Transactions', COUNT(*) FROM "Transaction";
            """
        ]

        result = subprocess.run(verify_cmd, capture_output=True, text=True)
        print(result.stdout)

        print("✅ 迁移完成!")
        print()
        print("📋 下一步:")
        print("  1. 验证 Prisma 连接: pnpm prisma db pull")
        print("  2. 重新生成 Prisma Client: pnpm prisma generate")
        print("  3. 启动开发服务器: pnpm dev")

    except subprocess.TimeoutExpired:
        print("❌ 导入超时 (数据量过大或网络过慢)")
        sys.exit(1)

if __name__ == "__main__":
    main()
