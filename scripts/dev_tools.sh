#!/bin/bash

set -a
source ./.env.dev
set +a

COMPOSE_CMD="docker compose -f ./docker-compose.dev.yml -p notes-dev"

if [ "$1" == "run" ]; then
    $COMPOSE_CMD up 
elif [ "$1" == "migrate" ]; then
    $COMPOSE_CMD exec backend python manage.py migrate
    $COMPOSE_CMD exec backend python manage.py migrate --database=embeddings
    $COMPOSE_CMD exec backend python manage.py migrate --database=revisions
elif [ "$1" == "reset_admin_pw" ]; then
    $COMPOSE_CMD exec backend python manage.py changepassword admin
elif [ -z "$1" ]; then
    echo "Usage: ./dev_tools.sh [run|migrate|reset_admin_pw|<any manage.py command>]"
else
    # Pass through any other command to manage.py
    $COMPOSE_CMD exec backend python manage.py "$@"
fi