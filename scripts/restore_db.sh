#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cp "$PROJECT_ROOT/django-backend/data/backup/embeddings.sqlite3.bak" "$PROJECT_ROOT/django-backend/data/embeddings.sqlite3" && \
cp "$PROJECT_ROOT/django-backend/data/backup/db.sqlite3.bak" "$PROJECT_ROOT/django-backend/data/db.sqlite3" && \
cp "$PROJECT_ROOT/django-backend/data/backup/revisions.sqlite3.bak" "$PROJECT_ROOT/django-backend/data/revisions.sqlite3"
