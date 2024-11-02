#!/bin/sh


export PYTHONPATH="${PYTHONPATH}:$/usr/src/app"

python manage.py migrate

python manage.py check_email &

exec "$@"
