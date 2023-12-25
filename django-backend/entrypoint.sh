#!/bin/sh


python manage.py migrate

export PYTHONPATH="${PYTHONPATH}:$/usr/src/app"

exec "$@"
