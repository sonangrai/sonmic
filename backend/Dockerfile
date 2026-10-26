FROM python:3.12-slim

# yt-dlp uses Node to unlock YouTube formats (js_runtimes in main.py); Debian's nodejs is too old.
COPY --from=node:22-slim /usr/local/bin/node /usr/local/bin/node

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

# Mount a persistent volume at /data, or users and sessions are lost on every redeploy.
ENV SONMIC_DB_PATH=/data/sonmic.db
RUN mkdir -p /data

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]
