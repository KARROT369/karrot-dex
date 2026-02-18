cd C:\temp\karrotwork\karrot-shrine

# Add all files
git add .

# Set git config if not already set
git config user.email "karrot@shrine.local" --replace-all 2>$null
git config user.name "Karrot Shrine" --replace-all 2>$null

# Commit
git commit -m "Initial commit: Recursive AI Shrine with Poe personality

Features:
- Recursive AI with self-awareness
- Edgar Allan Poe poetry integration
- Shrine UI with ember effects
- Suggestion portal with hash IDs
- ASCII prophecy easter egg
- Riddle and poem generators

API endpoints:
- POST /api/ask - Main AI conversation
- GET /api/poem, /api/riddle - Content
- POST /api/suggest - Submit ideas
- POST /api/prophecy - ASCII prophecy

The Karrot grows in cracks..."

# Add remote (if token exists in environment)
$token = $env:GITHUB_TOKEN
if ($token) {
    git remote add origin "https://$token@github.com/KARROT369/karrot-shrine.git" 2>$null
    git push -u origin main --force
    Write-Host "Pushed to GitHub successfully!"
} else {
    Write-Host "No GITHUB_TOKEN found. Please set it and push manually:"
    Write-Host "  git remote add origin https://github.com/KARROT369/karrot-shrine.git"
    Write-Host "  git push -u origin main"
}
