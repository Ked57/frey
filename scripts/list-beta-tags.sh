#!/bin/bash

# Script to list available beta tags for manual release workflow
# Usage: ./scripts/list-beta-tags.sh

echo "🔍 Fetching available beta tags..."
git fetch origin --tags

echo ""
echo "📋 Available beta tags:"
echo "======================"

# Get all beta tags and sort them
beta_tags=$(git tag -l | grep beta | sort -V)

if [ -z "$beta_tags" ]; then
    echo "❌ No beta tags found!"
    echo ""
    echo "💡 To create beta tags, push commits to master branch."
    echo "   The CI workflow will automatically create beta releases."
    exit 1
fi

# Display beta tags with numbers
counter=1
while IFS= read -r tag; do
    echo "$counter. $tag"
    ((counter++))
done <<< "$beta_tags"

echo ""
echo "📝 To promote a beta tag to stable:"
echo "   1. Go to Actions → Manual Release"
echo "   2. Enter the beta tag (e.g., v1.1.0-beta.1)"
echo "   3. Or enter 'latest' for the most recent beta"
echo ""
echo "🎯 Latest beta tag: $(echo "$beta_tags" | tail -1)"
echo ""
echo "📦 Note: Semantic release runs from packages/frey/ directory"
echo "   CHANGELOG.md and .releaserc.json are located there"
