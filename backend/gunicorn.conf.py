# Gunicorn configuration for Supabase PostgreSQL
import os

# Use 2 workers for dev - keeps connections warm while allowing concurrency
workers = 2
threads = 4  # More threads per worker to handle concurrent requests
worker_class = 'gthread'

# Binding
bind = '127.0.0.1:8000'

# Timeouts
timeout = 30
keepalive = 120

# Preload app so all workers share initial setup
preload_app = True

# Recycling to prevent memory leaks
max_requests = 1000
max_requests_jitter = 100

# Pre-warm database connections when each worker starts
def post_fork(server, worker):
    """Warm up database connection for each worker."""
    from django.db import connection
    # Force Django to establish its own connection
    from core.models import SystemSettings
    try:
        # Actually query the database to establish connection
        SystemSettings.objects.first()
        server.log.info(f"Worker {worker.pid}: Database connection pre-warmed")
    except Exception as e:
        server.log.warning(f"Worker {worker.pid}: Pre-warm failed: {e}")
