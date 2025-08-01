#!/bin/bash

# --- Your existing commands ---
echo "Adding template remote and fetching..."
git remote add template https://github.com/eronwolf/GameJamAITemplate.git
git fetch template

echo "Cherry-picking config file..."
git cherry-pick e7ad4ce73745d340beb83ef5f8af0f53b0a9f0e8

REPO_ROOT=$(git rev-parse --show-toplevel)
FILE_PATH="$REPO_ROOT/next.config.prod.js"

if [ ! -f "$FILE_PATH" ]; then
    echo "❌ Error: $FILE_PATH not found. The cherry-pick may have failed."
    exit 1
fi

REPO_NAME=$(basename "$REPO_ROOT")

TEMP_FILE="$FILE_PATH.tmp"
sed "s#GameJamAITemplate#$REPO_NAME#g" "$FILE_PATH" > "$TEMP_FILE" && mv "$TEMP_FILE" "$FILE_PATH"

echo "✅ Success! Updated '$FILE_PATH' to use repository name: '$REPO_NAME'"