---
applyTo: "**"
---

I have a notes app.

- The app is written in django 5. using SQlite to store data, and minio, to store note attachments.
- I have session-based authentication
- I use django rest framework
- I use next js for front end. Though I am planning to migrate to react because I don't use server side features of it.
- Also use react bootstrap 5 for the front end.
- notes are parsed and shown as markdown
- It has several features such as:
  - editing a note
  - adding note category
  - dark mode toggle. This is being handled using boostrap. So don't use dark, light variant
  - linking to other notes, backlinking from them.
- there is a similar notes feature that basically shows a similar notes. I'm still working to improve this
- don't write comments.

This is main dirs
.
├── django-backend
├── docker-compose.yml
├── minio-data
├── next-front
├── nginx
├── notes-react-native
├── nuxt-front
├── README.md
└── venv

nuxt is just old and deprecated

some words are used interchangably as the code have evaloved.
category: LocalMessageList, note list
note: LocalMessage

## Development Operations

### Database Management (Development)

- **Restore database from backup**: `scripts/restore_db.sh`
- **Create database backup**: `scripts/backup_db.sh`

### Django Management Commands (Development)

⚠️ **IMPORTANT**: Always use the Docker wrapper script for Django commands in development.

- **Run ANY Django management command**: `scripts/dev_tools.sh <command>`

- **Generate embeddings for notes**: `scripts/dev_tools.sh generate_embeddings`

### Docker Configuration (Development)

- Development uses a separate Docker Compose file: `docker-compose.dev.yml`
- The `scripts/dev_tools.sh` script automatically uses this configuration

## Database

- the models for the main notes app are under `django-backend/note/models.py`
- I have three separate databases that get separated by using database routers `django-backend/note/router.py`.
- the main db is for notes, categories, users, sessions, etc
- the embeddings db is for storing note embeddings for similar notes feature
- the revision db is for storing note revisions

## formatting

- do not leave comments
