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

### Running Scripts

All scripts are located in the `scripts/` directory and must be run using the `./script` wrapper from the project root:

**Format**: `./script <script_name>.sh [params]`

### Database Management

- **Restore database**: `./script restore_db.sh`
- **Backup database**: `./script backup_db.sh`

### Django Management Commands

**Always use the dev_tools.sh wrapper for any `manage.py` commands.**

**Format**: `./script dev_tools.sh <manage.py_command> [params]`

Common commands:

- Migrations: `./script dev_tools.sh migrate`
- Generate embeddings: `./script dev_tools.sh generate_embeddings`
- Any other manage.py command: `./script dev_tools.sh <command>`

### Docker Configuration (Development)

- Development uses a separate Docker Compose file: `docker-compose.dev.yml`

## Database

- the models for the main notes app are under `django-backend/note/models.py`
- I have three separate databases that get separated by using database routers `django-backend/note/router.py`.
- the main db is for notes, categories, users, sessions, etc
- the embeddings db is for storing note embeddings for similar notes feature
- the revision db is for storing note revisions

## formatting

- do not leave comments
