#!/bin/bash
# Consolidates all individual schema files into schema_full.sql
# Run after adding or modifying any schema file.

set -e

SCHEMA_DIR="$(dirname "$0")/../supabase/schemas"
OUTPUT="$(dirname "$0")/../supabase/schema_full.sql"

echo "-- ============================================" > "$OUTPUT"
echo "-- Fitted Agency — Full Schema (auto-generated)" >> "$OUTPUT"
echo "-- Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> "$OUTPUT"
echo "-- DO NOT EDIT — regenerate with scripts/build-schema.sh" >> "$OUTPUT"
echo "-- ============================================" >> "$OUTPUT"
echo "" >> "$OUTPUT"

for f in "$SCHEMA_DIR"/*.sql; do
  echo "" >> "$OUTPUT"
  echo "-- ---- $(basename "$f") ----" >> "$OUTPUT"
  echo "" >> "$OUTPUT"
  cat "$f" >> "$OUTPUT"
done

echo ""
echo "✓ Schema consolidated to $OUTPUT"
echo "  Files included: $(ls "$SCHEMA_DIR"/*.sql | wc -l | tr -d ' ')"
