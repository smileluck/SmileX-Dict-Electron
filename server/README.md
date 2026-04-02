# SmileX Dict 后端服务

## 环境要求

- Python 3.11+
- pip

## 安装依赖

### 使用虚拟环境（推荐）

```bash
# 创建虚拟环境
python -m venv .venv

# 激活虚拟环境
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# 安装依赖
pip install -r requirements.txt
# 或者使用 pyproject.toml
pip install -e .
```

### 直接安装

```bash
pip install fastapi uvicorn passlib[bcrypt] python-jose[cryptography] sqlalchemy pydantic python-multipart bcrypt==4.0.1
```

**重要**: 必须安装 `bcrypt==4.0.1`，因为 bcrypt 5.0.0 与 passlib 1.7.4 不兼容。

## 启动服务

```bash
python main.py
```

服务将在 `http://127.0.0.1:8001` 启动

## API文档

访问 http://127.0.0.1:8001/docs 查看Swagger UI文档

## 环境变量

在生产环境中，建议设置以下环境变量：

```bash
# JWT密钥（必须设置）
export SECRET_KEY="your-very-secure-random-secret-key-here"

# 或者创建 .env 文件
echo "SECRET_KEY=your-very-secure-random-secret-key-here" > .env
```

生成安全的SECRET_KEY：

```python
import secrets
print(secrets.token_urlsafe(32))
```

## 数据库

默认使用SQLite数据库 `smilex.db`，首次运行会自动创建表结构。

## 已知问题

### bcrypt版本兼容性

**问题**: bcrypt 5.0.0 与 passlib 1.7.4 不兼容，导致密码哈希失败。

**解决**: 使用 bcrypt==4.0.1

```bash
pip install bcrypt==4.0.1
```

### bcrypt 72字节限制

**问题**: bcrypt有72字节的密码长度限制。

**解决**: 代码已自动处理，超过72字节的密码会被截断。

## 测试

### 测试注册

```bash
curl -X POST "http://127.0.0.1:8001/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'
```

### 测试登录

```bash
curl -X POST "http://127.0.0.1:8001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'
```

## 安全建议

1. **必须修改SECRET_KEY**: 生产环境不要使用默认密钥
2. **使用HTTPS**: 生产环境必须启用HTTPS
3. **密码强度**: 建议要求包含大小写字母、数字和特殊字符
4. **登录限制**: 考虑添加登录失败次数限制
5. **定期更新**: 保持依赖包更新到最新版本
