from django.core.management.base import BaseCommand
from django.db import transaction
from note.models import LocalMessage, NoteEmbedding, NoteChunk
import traceback
import time
from concurrent.futures import ThreadPoolExecutor, as_completed


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
        parser.add_argument(
            '--max-workers',
            type=int,
            default=5,
            help='Max worker threads for parallel processing of batches',
        )
        
    def handle(self, *args, **kwargs):
        # Process args
        chunks_only = kwargs.get('chunks_only', False)
        embeddings_only = kwargs.get('embeddings_only', False)
        force = kwargs.get('force', False)
        specific_note_id = kwargs.get('note_id')
        batch_size = kwargs.get('batch_size', 50)
        max_workers = kwargs.get('max_workers', 2)
        
        # Setup vector tables
        if not embeddings_only:
            self.stdout.write("Setting up chunk vector table...")
            NoteChunk.setup_vector_table()
        
        if not chunks_only:
            self.stdout.write("Setting up note embedding vector table...")
            NoteEmbedding.setup_vector_table()
        
        # Initialize aggregate counters
        total_processed_embeddings = 0
        total_processed_chunks = 0
        total_skipped_rtl = 0
        total_skipped_existing_embeddings = 0
        total_skipped_existing_chunks = 0
        total_failed_embeddings = 0
        total_failed_chunks = 0
        
        if specific_note_id:
            try:
                note = LocalMessage.objects.get(id=specific_note_id)
                self.stdout.write(f"Processing specific note ID: {specific_note_id}")

                # Pre-fetch info for the single note
                has_embedding = NoteEmbedding.objects.filter(note_id=note.id).exists() if not embeddings_only else False
                has_chunks = NoteChunk.objects.filter(note_id=note.id).exists() if not chunks_only else False
                note_has_rtl = NoteEmbedding.hasRTL(note.text)

                with transaction.atomic():
                    note_counters = self._process_single_note_logic(
                        note, chunks_only, embeddings_only, force,
                        has_embedding, has_chunks, note_has_rtl,
                        1, 1 # index, total for logging
                    )
                
                total_processed_embeddings += note_counters['processed_embeddings']
                total_processed_chunks += note_counters['processed_chunks']
                total_skipped_rtl += note_counters['skipped_rtl']
                total_skipped_existing_embeddings += note_counters['skipped_existing_embeddings']
                total_skipped_existing_chunks += note_counters['skipped_existing_chunks']
                total_failed_embeddings += note_counters['failed_embeddings']
                total_failed_chunks += note_counters['failed_chunks']

            except LocalMessage.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"Note with ID {specific_note_id} not found"))
                return
        else:
            all_note_ids = list(LocalMessage.objects.values_list('id', flat=True))
            total_notes = len(all_note_ids)
            self.stdout.write(f"Found {total_notes} total notes")

            if total_notes == 0:
                self.stdout.write("No notes to process.")
            else:
                num_batches = (total_notes + batch_size - 1) // batch_size
                
                with ThreadPoolExecutor(max_workers=max_workers) as executor:
                    futures = []
                    for i in range(num_batches):
                        batch_start_index = i * batch_size
                        batch_end_index = min(batch_start_index + batch_size, total_notes)
                        current_batch_ids = all_note_ids[batch_start_index:batch_end_index]
                        
                        futures.append(executor.submit(
                            self._process_batch,
                            current_batch_ids,
                            chunks_only,
                            embeddings_only,
                            force,
                            i + 1, 
                            num_batches,
                            batch_start_index,
                            total_notes
                        ))
                    
                    for future in as_completed(futures):
                        try:
                            batch_counters = future.result()
                            total_processed_embeddings += batch_counters['processed_embeddings']
                            total_processed_chunks += batch_counters['processed_chunks']
                            total_skipped_rtl += batch_counters['skipped_rtl']
                            total_skipped_existing_embeddings += batch_counters['skipped_existing_embeddings']
                            total_skipped_existing_chunks += batch_counters['skipped_existing_chunks']
                            total_failed_embeddings += batch_counters['failed_embeddings']
                            total_failed_chunks += batch_counters['failed_chunks']
                        except Exception as e:
                            self.stdout.write(self.style.ERROR(f"Error processing a batch: {e}\n{traceback.format_exc()}"))
        
        # Print summary
        self.stdout.write(self.style.SUCCESS("\nFinished processing notes:\n"))
        
        if not chunks_only:
            self.stdout.write(self.style.SUCCESS(
                f"Note Embeddings:\n"
                f"- Successfully processed: {total_processed_embeddings}\n"
                f"- Skipped (already had embedding): {total_skipped_existing_embeddings}\n"
                f"- Skipped (RTL characters): {total_skipped_rtl}\n"
                f"- Failed: {total_failed_embeddings}"
            ))
        
        if not embeddings_only:
            self.stdout.write(self.style.SUCCESS(
                f"\nNote Chunks:\n"
                f"- Successfully processed: {total_processed_chunks}\n"
                f"- Skipped (already had chunks): {total_skipped_existing_chunks}\n"
                # RTL skips for chunks are included in the `total_skipped_rtl` count
                f"- Failed: {total_failed_chunks}"
            ))

    def _process_single_note_logic(self, note, chunks_only, embeddings_only, force,
                                   has_embedding, has_chunks, note_has_rtl,
                                   current_index_display, total_display): # For logging
        """Processes a single note and returns a dictionary of counters."""
        single_note_counters = {
            'processed_embeddings': 0, 'processed_chunks': 0,
            'skipped_rtl': 0,
            'skipped_existing_embeddings': 0, 'skipped_existing_chunks': 0,
            'failed_embeddings': 0, 'failed_chunks': 0
        }

        # Log prefix for this note, can be enhanced if part of a batch
        log_prefix = f"({current_index_display}/{total_display}) Note {note.id}:"
        self.stdout.write(f"Processing {log_prefix}")

        # If note is RTL, skip both embedding and chunks processing for this note
        if note_has_rtl:
            single_note_counters['skipped_rtl'] += 1
            if not chunks_only:
                 self.stdout.write(f"  {log_prefix} Skipping embedding (RTL characters found)")
            if not embeddings_only:
                 self.stdout.write(f"  {log_prefix} Skipping chunks (RTL characters found)")
            return single_note_counters # Early exit for RTL notes

        # Process note embeddings
        if not chunks_only:
            try:
                if has_embedding and not force:
                    single_note_counters['skipped_existing_embeddings'] += 1
                    self.stdout.write(f"  {log_prefix} Skipping embedding (already exists)")
                else:
                    if force and has_embedding:
                        NoteEmbedding.objects.filter(note_id=note.id).delete()
                        self.stdout.write(f"  {log_prefix} Deleted existing embedding (force mode)")
                    
                    embedding = NoteEmbedding.create_for_note(note)
                    if embedding:
                        single_note_counters['processed_embeddings'] += 1
                        self.stdout.write(f"  {log_prefix} Created embedding")
                    else:
                        # This case means create_for_note returned None for a non-RTL note
                        # (e.g. content became empty after cleaning).
                        single_note_counters['failed_embeddings'] += 1 
                        self.stdout.write(f"  {log_prefix} Failed to create embedding (unable to create, non-RTL)")
            except Exception as e:
                single_note_counters['failed_embeddings'] += 1
                self.stdout.write(self.style.ERROR(
                    f"  {log_prefix} Failed to process embedding: {str(e)}\n"
                    f"    Traceback: {traceback.format_exc()}"
                ))
        
        # Process note chunks (only if not RTL)
        if not embeddings_only:
            try:
                if has_chunks and not force:
                    single_note_counters['skipped_existing_chunks'] += 1
                    self.stdout.write(f"  {log_prefix} Skipping chunks (already exist)")
                else:
                    if force and has_chunks:
                        existing_chunks_qs = NoteChunk.objects.filter(note_id=note.id)
                        num_deleted = existing_chunks_qs.count()
                        existing_chunks_qs.delete()
                        self.stdout.write(f"  {log_prefix} Deleted {num_deleted} existing chunks (force mode)")
                    
                    # Generate new chunks
                    # Assuming note.split_into_chunks() creates NoteChunk instances (possibly unsaved or saved without embedding)
                    # And chunk.create_embedding() calculates and saves the embedding for the chunk.
                    # This part needs to be transactional if split_into_chunks or create_embedding saves.
                    # The entire _process_single_note_logic is called within a transaction.
                    
                    chunk_instances = note.split_into_chunks() # This should return NoteChunk instances
                    self.stdout.write(f"  {log_prefix} Generated {len(chunk_instances)} chunks")
                    
                    if len(chunk_instances) > 1:
                        for chunk_obj in chunk_instances:
                            chunk_obj.create_embedding() # This method should save the chunk with its embedding
                        self.stdout.write(f"  {log_prefix} Created embeddings for all {len(chunk_instances)} chunks")
                    elif len(chunk_instances) == 1:
                        # If there's only one chunk, it might not need its own embedding if it's same as note.
                        # Original code skipped embedding for single chunk notes.
                        # We still save the chunk itself if split_into_chunks does so.
                        # Let's assume split_into_chunks saves the chunk text, and create_embedding adds vector.
                        # This matches original logic.
                        if chunk_instances[0].pk is None : # If split_into_chunks returns unsaved objects
                             chunk_instances[0].save()
                        self.stdout.write(f"  {log_prefix} Skipping chunk embeddings (single chunk note)")
                    else: # No chunks generated
                        self.stdout.write(f"  {log_prefix} No chunks generated")

                    single_note_counters['processed_chunks'] += 1 # Count if chunking process was run
            except Exception as e:
                single_note_counters['failed_chunks'] += 1
                self.stdout.write(self.style.ERROR(
                    f"  {log_prefix} Failed to process chunks for note: {str(e)}\n"
                    f"    Traceback: {traceback.format_exc()}"
                ))
        
        return single_note_counters

    def _process_batch(self, batch_ids, chunks_only, embeddings_only, force, 
                       batch_num, total_batches, overall_start_index, total_notes_count):
        """Processes a batch of notes and returns aggregated counters for the batch."""
        batch_counters = {
            'processed_embeddings': 0, 'processed_chunks': 0,
            'skipped_rtl': 0,
            'skipped_existing_embeddings': 0, 'skipped_existing_chunks': 0,
            'failed_embeddings': 0, 'failed_chunks': 0
        }
        
        self.stdout.write(f"Processing batch {batch_num}/{total_batches} (Notes {overall_start_index + 1} to {overall_start_index + len(batch_ids)} of {total_notes_count})")
        
        # Load the batch of notes
        batch_notes = LocalMessage.objects.filter(id__in=batch_ids).order_by('id') # Order for consistent logging if desired
        
        with transaction.atomic():
            # Pre-fetch existing embeddings and chunks for this batch to reduce queries inside loop
            existing_embedding_ids_batch = set()
            if not chunks_only: # Only fetch if we care about embeddings
                existing_embedding_ids_batch = set(NoteEmbedding.objects.filter(
                    note_id__in=batch_ids
                ).values_list('note_id', flat=True))
            
            existing_chunk_note_ids_batch = set()
            if not embeddings_only: # Only fetch if we care about chunks
                existing_chunk_note_ids_batch = set(NoteChunk.objects.filter(
                    note_id__in=batch_ids
                ).values_list('note_id', flat=True).distinct())

            # Pre-calculate RTL status for notes in the batch
            # This avoids calling NoteEmbedding.hasRTL repeatedly for the same text
            note_rtl_status_map = {note.id: NoteEmbedding.hasRTL(note.text) for note in batch_notes}
            
            for i, note in enumerate(batch_notes):
                current_overall_index = overall_start_index + i + 1 # 1-indexed for display

                has_embedding_for_note = note.id in existing_embedding_ids_batch
                has_chunks_for_note = note.id in existing_chunk_note_ids_batch
                current_note_has_rtl = note_rtl_status_map[note.id]
                
                note_counters = self._process_single_note_logic(
                    note, 
                    chunks_only, 
                    embeddings_only, 
                    force,
                    has_embedding_for_note,
                    has_chunks_for_note,
                    current_note_has_rtl,
                    current_overall_index, # Pass overall index for logging
                    total_notes_count      # Pass total notes for logging
                )
                
                # Aggregate counters from this note
                for key in batch_counters:
                    batch_counters[key] += note_counters.get(key, 0)
        
        # Optional: short delay after a batch if needed, though ThreadPoolExecutor manages concurrency
        # time.sleep(0.1) 
        return batch_counters