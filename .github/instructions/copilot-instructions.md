---
applyTo: '**'
---

I have a notes app.
- The app is written in django 5. using SQlite to store data, and minio, to store note attachments.
- I have session-based authentication
- I use django rest framework
- I use next js for front end. Though I am planning to migrate to react because I don't use server side features of it.
- Also use react bootstrap 5 for the front end.
- notes are parsed and shown as markdown
- It has several features such as:
  * editing a note
  * adding note category
  * dark mode toggle. This is being handled using boostrap. So don't use dark, light variant
  * linking to other notes, backlinking from them.
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