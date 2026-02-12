#!/usr/bin/env bash
set -e

# Check for VHS
if ! command -v vhs &> /dev/null; then
    echo "Error: VHS is not installed."
    echo "Install with: brew install charmbracelet/tap/vhs"
    exit 1
fi

# Find and process all tape files
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
TAPES_DIR="$ROOT_DIR/tapes"

if [ ! -d "$TAPES_DIR" ]; then
    echo "Error: tapes directory not found at $TAPES_DIR"
    exit 1
fi

# Count tapes
TAPE_COUNT=$(find "$TAPES_DIR" -name "*.tape" | wc -l | tr -d ' ')

if [ "$TAPE_COUNT" -eq 0 ]; then
    echo "No tape files found in $TAPES_DIR"
    exit 0
fi

echo "Found $TAPE_COUNT tape files"

# Process each tape
PROCESSED=0
find "$TAPES_DIR" -name "*.tape" | while read -r tape; do
    PROCESSED=$((PROCESSED + 1))
    echo "[$PROCESSED/$TAPE_COUNT] Processing: $tape"
    vhs "$tape"
done

echo "Done! Screenshots generated in docs/screenshots/"
