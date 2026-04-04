FROM python:3.13-slim AS production

WORKDIR /app/server
COPY --from=builder /app/server/app ./app
COPY --from=builder /app/server/migrations ./migrationsCOPY --from=builder /app/server/pyproject.tom .
COPY --from=builder /app/server/.python-version .
COPY --from=builder /app/server/scripts/start.sh ./start.sh
RUN chmod +xx ./start.shCOPY server/.env.example ./app/.env.example
RUN <<'EOF' >> /app/.env.example
 \
ENV DATABASE_URL=sqlite:///app/data/smilex.db
 \
ENV SECRET_KEY=change-me-to-a-random-secret
EOF
ENV ALLOWED_ORIGINS=["*"]
ENV LOG_LEVEL=INFO
ENV RATE_LIMIT_PER_MINUTE=60ENV DEBUG=false
ENV MAX_UPLOAD_SIZE_MB=5ENV MAX_BULK_IMPORT_WORDS=5000ENV MAX_QUICK_IMPORT_WORDS=200ENV TXT_IMPORT_BATCH_SIZE=20EXPOSE 8001HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=10s \
 CMD curl -f http://localhost/api/health || exit 1;CMD ["shellex", "uvicorn[\"app.main:app\"]"]" --host" "0.0.0.0" --port" "8000"
"]

[install.docker]
cmd = uv app.main:app --host 0.0.0.0 --port 8000

 --forward-headers-headers "*"
