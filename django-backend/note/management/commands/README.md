# File Deduplication Feature

## Overview

Files are now deduplicated based on SHA-256 hash to prevent storing duplicate files in MinIO and the database.

## How It Works

### Automatic Deduplication on Upload

- When a file is uploaded, its SHA-256 hash is computed
- If a file with the same hash already exists for the user, the existing file is reused
- No duplicate files are stored in MinIO
- The response includes a `duplicate: true` flag when a duplicate is detected

### Database Schema

- `File.file_hash`: SHA-256 hash of file content (indexed for fast lookups)
- Hash is computed once during upload and stored permanently

## Management Commands

### Compute Hashes for Existing Files

```bash
./script dev_tools.sh compute_file_hashes
```

This command:

- Processes all files without a hash
- Downloads each file from MinIO
- Computes and stores the SHA-256 hash
- Shows progress and statistics

Options:

- `--force`: Recompute hashes even if they already exist

Example:

```bash
./script dev_tools.sh compute_file_hashes --force
```

## API Changes

### File Upload Response

The upload endpoint now returns:

```json
{
  "url": "/api/note/files/...",
  "file_id": 123,
  "file_name": "document",
  "file": { ... },
  "duplicate": false
}
```

The `duplicate` field indicates whether an existing file was reused (`true`) or a new file was uploaded (`false`).

## Benefits

1. **Storage Efficiency**: Eliminates duplicate files in MinIO
2. **Cost Savings**: Reduces storage costs
3. **Faster Uploads**: Duplicate files are detected instantly without uploading to MinIO
4. **Bandwidth Savings**: No need to transfer duplicate content
