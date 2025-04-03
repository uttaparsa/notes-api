class RevisionRouter:
    """
    Router to send all revision-related operations to a separate database
    """
    def db_for_read(self, model, **hints):
        if model._meta.db_table == 'note_revision':
            return 'revisions'
        return None

    def db_for_write(self, model, **hints):
        if model._meta.db_table == 'note_revision':
            return 'revisions'
        return None

    def allow_relation(self, obj1, obj2, **hints):
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if model_name == 'noterevision':
            return db == 'revisions'
        return None
    
    
class EmbeddingRouter:
    """
    Router to send all embedding-related operations to a separate database
    """
    def db_for_read(self, model, **hints):
        if model._meta.db_table == 'note_embeddings' or model._meta.db_table == 'note_chunks':
            return 'embeddings'
        return None

    def db_for_write(self, model, **hints):
        if model._meta.db_table == 'note_embeddings' or model._meta.db_table == 'note_chunks':
            return 'embeddings'
        return None

    def allow_relation(self, obj1, obj2, **hints):
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if model_name == 'noteembedding' or model_name == 'notechunk':
            return db == 'embeddings'
        return None