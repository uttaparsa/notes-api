#!/bin/sh


export PYTHONPATH="${PYTHONPATH}:$/usr/src/app"

python manage.py migrate

exec "$@"
