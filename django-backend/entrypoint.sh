#!/bin/sh


export PYTHONPATH="${PYTHONPATH}:$/usr/src/app"

python manage.py migrate --database=default

python manage.py migrate --database=revisions

python manage.py check_email &

exec "$@"
