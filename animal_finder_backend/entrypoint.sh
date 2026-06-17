#!/bin/sh
set -e

if [ "$DB_ENGINE" = "postgres" ]; then
    echo "Waiting for PostgreSQL..."
    while ! nc -z "$DB_HOST" "$DB_PORT"; do
        sleep 0.5
    done
    echo "PostgreSQL ready"
fi

python manage.py migrate --noinput

python manage.py loaddata fixtures/initial_data.json 2>/dev/null || true

python manage.py create_initial_users 2>/dev/null || true

exec "$@"