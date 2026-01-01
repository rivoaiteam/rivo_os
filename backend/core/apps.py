from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        # Pre-warm database connection pool on server start
        # This moves the ~1.5s SSL connection delay from first request to startup
        import sys
        if 'runserver' in sys.argv or 'gunicorn' in sys.argv[0] if sys.argv else False:
            try:
                from django.db import connection
                with connection.cursor() as cursor:
                    cursor.execute('SELECT 1')
            except Exception:
                pass  # Silently fail if DB not available
