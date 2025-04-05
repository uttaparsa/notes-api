from django.core.management.base import BaseCommand
from django.db import transaction
from note.models import LocalMessage, NoteEmbedding, NoteChunk
import traceback
import time


class Command(BaseCommand):
    help = 'Generate embeddings and chunks for notes that have no embeddings and contain only right-to-left characters'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--chunks-only',
            action='store_true',
            help='Only generate chunks, skip note embeddings',
        )
        parser.add_argument(
            '--embeddings-only',
            action='store_true',
            help='Only generate note embeddings, skip chunks',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force regeneration of embeddings and chunks even if they already exist',
        )
        parser.add_argument(
            '--note-id',
            type=int,
            help='Process only a specific note by ID',
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=50,
            help='Number of notes to process in each transaction batch',
        )
        
    def handle(self, *args, **kwargs):
        # Process args
        chunks_only = kwargs.get('chunks_only', False)
        embeddings_only = kwargs.get('embeddings_only', False)
        force = kwargs.get('force', False)
        specific_note_id = kwargs.get('note_id')
        batch_size = kwargs.get('batch_size', 50)
        
        # Setup vector tables
        if not embeddings_only:
            self.stdout.write("Setting up chunk vector table...")
            NoteChunk.setup_vector_table()
        
        if not chunks_only:
            self.stdout.write("Setting up note embedding vector table...")
            NoteEmbedding.setup_vector_table()
        
        # Get notes to process
        if specific_note_id:
            try:
                all_notes = [LocalMessage.objects.get(id=specific_note_id)]
                total = 1
                self.stdout.write(f"Processing specific note ID: {specific_note_id}")
            except LocalMessage.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"Note with ID {specific_note_id} not found"))
                return
        else:
            # Use a more efficient query to get IDs only
            all_note_ids = list(LocalMessage.objects.values_list('id', flat=True))
            total = len(all_note_ids)
            self.stdout.write(f"Found {total} total notes")
        
        # Initialize counters
        processed_embeddings = 0
        processed_chunks = 0
        skipped_hasRTL = 0
        skipped_existing_embeddings = 0
        skipped_existing_chunks = 0
        failed_embeddings = 0
        failed_chunks = 0
        
        # Process notes in batches
        if specific_note_id:
            # Process single note without batching
            self._process_note(
                all_notes[0], 
                chunks_only, 
                embeddings_only, 
                force,
                1, 
                total,
                processed_embeddings,
                processed_chunks,
                skipped_hasRTL,
                skipped_existing_embeddings,
                skipped_existing_chunks,
                failed_embeddings,
                failed_chunks
            )
        else:
            # Process in batches using transactions
            for batch_start in range(0, total, batch_size):
                batch_end = min(batch_start + batch_size, total)
                batch_ids = all_note_ids[batch_start:batch_end]
                
                self.stdout.write(f"Processing batch {batch_start//batch_size + 1}/{(total+batch_size-1)//batch_size}: notes {batch_start+1}-{batch_end}")
                
                # Load the batch of notes
                batch_notes = LocalMessage.objects.filter(id__in=batch_ids).select_related()
                
                # Process batch with transaction
                with transaction.atomic():
                    # Pre-fetch existing embeddings and chunks to reduce queries
                    existing_embedding_ids = set(NoteEmbedding.objects.filter(
                        note_id__in=batch_ids
                    ).values_list('note_id', flat=True))
                    
                    existing_chunk_note_ids = set(NoteChunk.objects.filter(
                        note_id__in=batch_ids
                    ).values_list('note_id', flat=True).distinct())
                    
                    # Process each note in the batch
                    for i, note in enumerate(batch_notes, 1):
                        overall_index = batch_start + i
                        result = self._process_note(
                            note, 
                            chunks_only, 
                            embeddings_only, 
                            force,
                            overall_index, 
                            total,
                            processed_embeddings,
                            processed_chunks,
                            skipped_hasRTL,
                            skipped_existing_embeddings,
                            skipped_existing_chunks,
                            failed_embeddings,
                            failed_chunks,
                            existing_embedding_ids=existing_embedding_ids,
                            existing_chunk_note_ids=existing_chunk_note_ids
                        )
                        
                        # Update counters with results from processing
                        processed_embeddings = result['processed_embeddings']
                        processed_chunks = result['processed_chunks']
                        skipped_hasRTL = result['skipped_hasRTL']
                        skipped_existing_embeddings = result['skipped_existing_embeddings']
                        skipped_existing_chunks = result['skipped_existing_chunks']
                        failed_embeddings = result['failed_embeddings']
                        failed_chunks = result['failed_chunks']
                
                # Add a small delay between batches
                time.sleep(0.1)
        
        # Print summary
        self.stdout.write(self.style.SUCCESS(
            f"\nFinished processing notes:\n"
        ))
        
        if not chunks_only:
            self.stdout.write(self.style.SUCCESS(
                f"Note Embeddings:\n"
                f"- Successfully processed: {processed_embeddings}\n"
                f"- Skipped (already had embedding): {skipped_existing_embeddings}\n"
                f"- Skipped (hasRTL): {skipped_hasRTL}\n"
                f"- Failed: {failed_embeddings}"
            ))
        
        if not embeddings_only:
            self.stdout.write(self.style.SUCCESS(
                f"\nNote Chunks:\n"
                f"- Successfully processed: {processed_chunks}\n"
                f"- Skipped (already had chunks): {skipped_existing_chunks}\n"
                f"- Failed: {failed_chunks}"
            ))
    
    def _process_note(self, note, chunks_only, embeddings_only, force, 
                     index, total, processed_embeddings, processed_chunks,
                     skipped_hasRTL, skipped_existing_embeddings, 
                     skipped_existing_chunks, failed_embeddings, failed_chunks,
                     existing_embedding_ids=None, existing_chunk_note_ids=None):
        """Process a single note and return updated counters"""
        
        self.stdout.write(f"Processing {index}/{total}: Note {note.id}")
        
        # Process note embeddings
        if not chunks_only:
            try:
                # Check if embedding already exists
                has_embedding = False
                if existing_embedding_ids is not None:
                    has_embedding = note.id in existing_embedding_ids
                else:
                    has_embedding = NoteEmbedding.objects.filter(note_id=note.id).exists()
                
                if has_embedding and not force:
                    skipped_existing_embeddings += 1
                    self.stdout.write(f"  - Skipping embedding (already exists)")
                elif NoteEmbedding.hasRTL(note.text):
                    self.stdout.write(f"  - Skipping embedding (RTL characters found)")
                    skipped_hasRTL += 1
                else:
                    # Create embedding using the class method
                    embedding = NoteEmbedding.create_for_note(note)
                    if embedding:
                        processed_embeddings += 1
                        self.stdout.write(f"  - Created embedding for note {note.id}")
                    else:
                        skipped_hasRTL += 1
                        self.stdout.write(f"  - Skipping embedding (unable to create)")
            except Exception as e:
                failed_embeddings += 1
                self.stdout.write(self.style.ERROR(
                    f"  - Failed to process embedding for note {note.id}: {str(e)}\n"
                    f"    Traceback: {traceback.format_exc()}"
                ))
        
        # Process note chunks
        if not embeddings_only:
            try:
                # Check if chunks already exist
                has_chunks = False
                if existing_chunk_note_ids is not None:
                    has_chunks = note.id in existing_chunk_note_ids
                else:
                    has_chunks = NoteChunk.objects.filter(note_id=note.id).exists()
                
                if has_chunks and not force:
                    skipped_existing_chunks += 1
                    self.stdout.write(f"  - Skipping chunks (already exist)")
                elif NoteEmbedding.hasRTL(note.text):
                    self.stdout.write(f"  - Skipping chunks (RTL characters found)")
                    # We're using the same check as embeddings
                else:
                    # Delete existing chunks if force is True
                    if force and has_chunks:
                        existing_chunks = NoteChunk.objects.filter(note_id=note.id)
                        num_chunks = existing_chunks.count()
                        self.stdout.write(f"  - Deleting {num_chunks} existing chunks")
                        existing_chunks.delete()
                    
                    # Generate new chunks
                    chunks = note.split_into_chunks()
                    self.stdout.write(f"  - Generated {len(chunks)} chunks for note {note.id}")
                    
                    # Create embeddings for each chunk only if there's more than one chunk
                    if len(chunks) > 1:
                        for chunk in chunks:
                            chunk.create_embedding()
                        self.stdout.write(f"  - Created embeddings for all chunks of note {note.id}")
                    else:
                        self.stdout.write(f"  - Skipping chunk embeddings (single chunk note)")
                    
                    processed_chunks += 1
            except Exception as e:
                failed_chunks += 1
                self.stdout.write(self.style.ERROR(
                    f"  - Failed to process chunks for note {note.id}: {str(e)}\n"
                    f"    Traceback: {traceback.format_exc()}"
                ))
        
        # Return updated counters
        return {
            'processed_embeddings': processed_embeddings,
            'processed_chunks': processed_chunks,
            'skipped_hasRTL': skipped_hasRTL,
            'skipped_existing_embeddings': skipped_existing_embeddings,
            'skipped_existing_chunks': skipped_existing_chunks,
            'failed_embeddings': failed_embeddings,
            'failed_chunks': failed_chunks
        }