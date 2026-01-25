#!/bin/bash

set -a
source ./.env.dev
set +a

if [ "$1" == "run" ]; then
    docker compose -f ./docker-compose.dev.yml up 
elif [ "$1" == "migrate" ]; then
    docker compose -f ./docker-compose.dev.yml exec backend python manage.py migrate
    docker compose -f ./docker-compose.dev.yml exec backend python manage.py migrate --database=embeddings
    docker compose -f ./docker-compose.dev.yml exec backend python manage.py migrate --database=revisions
elif [ "$1" == "reset_admin_pw" ]; then
    docker compose -f ./docker-compose.dev.yml exec backend python manage.py changepassword admin
else
    echo "Usage: ./dev_tools.sh [run|migrate|reset_admin_pw]"
fi