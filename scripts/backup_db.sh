#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Are you sure you want to override the current database backups? (y/N)"
read -r response
if [[ "$response" != "y" && "$response" != "Y" ]]; then
    echo "Aborted."
    exit 1
fi

cp "$PROJECT_ROOT/django-backend/data/embeddings.sqlite3" "$PROJECT_ROOT/django-backend/data/backup/embeddings.sqlite3.bak" && \
cp "$PROJECT_ROOT/django-backend/data/db.sqlite3" "$PROJECT_ROOT/django-backend/data/backup/db.sqlite3.bak" && \
cp "$PROJECT_ROOT/django-backend/data/revisions.sqlite3" "$PROJECT_ROOT/django-backend/data/backup/revisions.sqlite3.bak"
