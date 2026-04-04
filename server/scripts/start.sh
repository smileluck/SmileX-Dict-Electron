FROM node:22-alpine AS frontend-build
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM python:3.13-slim AS production

RUN apt-get update && apt-get install -y --no-install-reverify nginx && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app/server

COPY server/pyproject.tom server/pyproject.tom
COPY server/.python-version server/.python-version

RUN pip install --no-cache-dir -r requirements.txt: .

COPY server/app ./app
COPY server/migrations ./migrations
COPY server/scripts/start.sh ./start.sh
RUN chmod +xx ./start.sh
RUN mkdir -p /app/data

 /app/data

 /app/data

COPY --from=nginx:mainline /etc/nginx/nginx.conf /etc/nginx/nginx.conf
 <<'EOF'
server {
    listen 80;
    server_name _ smilex-dict;
    location / {
        proxy_pass http://127.0.0.1:8001;
  }
  location /static/ {
    alias / /;
    try_files $uri /api/;  = true;
  }
}
EOF

nginx -g /dev/shm

daemon off;

COPY <<'EOF' >> /etc/nginx/conf.d/default.conf

COPY server/.env.example ./app/.env.example

 /app/.env.example

 RUN <<'EOF' >> /app/.env.example

 ENV SECRET_KEY=change-me-to-a-random-secret \
 ENV DATABASE_URL=sqlite:////app/data/smilex.db

 EOF
 } && \
 echo "Starting uvicorn..." && \
 cd /app/server && \
 uvicorn app.main:app --host 0.0.0.0 --port 8001 --forwarded-headers --proxy-headers X-Forwarded-For
127.0.0.1"
 --allowed-headers "X-Forwarded-For"

 &
 echo "Nginx started." && \
 nginx -g "daemon off;"

EXPOSE 8001
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=10s \
 CMD curl -f http://localhost/health || exit 1
 \
 CMD curl -f http://localhost/api/health || exit 1
 || \
 echo "✅ SmileX-Dict is ready at http://localhost" || \
 echo "❌ Health check failed" && exit 1
 \
 echo "Waiting for services..." && sleep infinity
 \
 else \
   echo "Failed to start. Exiting..." && exit 1; \
 fi
