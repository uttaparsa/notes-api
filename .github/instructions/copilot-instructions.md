---
applyTo: "**"
---

I have a notes app.

- The app is written in django 5. using SQlite to store data, and minio, to store note attachments.
- I have session-based authentication
- I use django rest framework
- I use next js for front end(more info under `.github/instructions/next-front.instructions.md`). Though I am planning to migrate to react because I don't use server side features of it.
- Also use react bootstrap 5 for the front end.
- notes are parsed and shown as markdown
- It has several features such as:
  - editing a note
  - adding note category(each note should belong to only one category)
  - dark mode toggle. This is being handled using boostrap. So don't use dark, light variant
  - linking to other notes, backlinking from them.
  - file collections - separate from notes, collections organize files with thumbnail previews in feed
- there is a similar notes feature that basically shows a similar notes. I'm still working to improve this
- don't write comments.
- there is a workspaces feature that lets you group categories into workspaces and allows you to focus on certain categories at a time.
  - each category can belong to 0 to many workspaces

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

## File Collections

File collections are a separate content type from notes that organize files without text content:

- **Model**: `FileCollection` in `django-backend/note/models.py`
  - Fields: name, description, category (LocalMessageList), user, files (ManyToMany to File), importance, archived
  - No revisions (unlike notes)
- **Display**: Collections appear in the unified feed alongside notes in chronological order
  - Shows thumbnail preview of first 4 files
  - Displays file count and category name
  - Clicking opens dedicated file manager page at `/collection/{id}`
- **File Manager**: Grid view page for managing collection files
  - Upload files (drag-and-drop supported)
  - Remove files from collection (doesn't delete file itself)
  - View file thumbnails for images, icons for other types
- **File Sharing**: Files stored in MinIO can be:
  - Referenced in notes via markdown
  - Added to multiple collections
  - Shared across collections and notes (same physical file, multiple references)
  - Files stored at `uploads/{user_id}/{random_str}_{filename}` regardless of collection
- **API Endpoints**:
  - `/api/note/collections/` - list/create collections
  - `/api/note/collections/{id}/` - get/update/delete collection
  - `/api/note/collections/{id}/files/` - manage files in collection
  - `/api/note/feed/` - unified feed with notes and collections
  - `/api/note/feed/{slug}/` - category-specific unified feed

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
