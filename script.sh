#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to perform backup
backup() {
    echo -e "${YELLOW}Backing up databases...${NC}"
    bash "$SCRIPT_DIR/scripts/backup_db.sh"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Backup completed successfully!${NC}"
    else
        echo -e "${RED}Backup failed!${NC}"
        exit 1
    fi
}

# Function to perform restore
restore() {
    if [ "$1" != "skip-confirm" ]; then
        echo -e "${YELLOW}WARNING: This will restore databases from backup and overwrite current data!${NC}"
        read -p "Are you sure you want to continue? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            echo -e "${YELLOW}Restore cancelled.${NC}"
            exit 0
        fi
    fi
    echo -e "${YELLOW}Restoring databases...${NC}"
    bash "$SCRIPT_DIR/scripts/restore_db.sh"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Restore completed successfully!${NC}"
    else
        echo -e "${RED}Restore failed!${NC}"
        exit 1
    fi
}

# Check if command-line argument is provided
if [ $# -gt 0 ]; then
    case "$1" in
        backup)
            backup
            ;;
        restore)
            restore
            ;;
        *)
            echo -e "${RED}Invalid argument. Use: $0 [backup|restore]${NC}"
            exit 1
            ;;
    esac
    exit 0
fi

# Display menu
echo "================================"
echo "Database Management Script"
echo "================================"
echo "1. Backup databases"
echo "2. Restore databases"
echo "3. Exit"
echo "================================"
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        backup
        ;;
    2)
        restore
        ;;
    3)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice. Please select 1, 2, or 3.${NC}"
        exit 1
        ;;
esac
