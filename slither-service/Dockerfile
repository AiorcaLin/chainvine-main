# Slither Analysis Service
# 轻量级 Docker 镜像，包含 Slither + solc + FastAPI 服务
FROM python:3.11-slim

# 系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python 依赖
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# 安装常用 solc 版本
RUN solc-select install 0.4.26 0.5.17 0.6.12 0.7.6 0.8.0 0.8.19 0.8.20 0.8.24 0.8.26 0.8.28 \
    && solc-select use 0.8.28

# 应用代码
COPY app.py /app/app.py
WORKDIR /app

# 创建合约临时目录
RUN mkdir -p /tmp/contracts

EXPOSE 8545

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8545"]
