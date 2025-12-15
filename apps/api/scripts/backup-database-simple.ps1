# Database Backup Script - Simple Version
# Run this BEFORE migration

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "backup_$timestamp.sql"

Write-Host "Creating database backup..." -ForegroundColor Cyan
Write-Host "Backup file: $backupFile" -ForegroundColor Yellow
Write-Host ""

# Note: This requires pg_dump to be installed
# If you're using Supabase, you can also backup from their dashboard

Write-Host "IMPORTANT: Manual backup required!" -ForegroundColor Red
Write-Host ""
Write-Host "Option 1: Using Supabase Dashboard" -ForegroundColor Yellow
Write-Host "  1. Go to your Supabase project" -ForegroundColor Gray
Write-Host "  2. Click 'Database' -> 'Backups'" -ForegroundColor Gray
Write-Host "  3. Create a manual backup" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 2: Using pg_dump (if installed)" -ForegroundColor Yellow
Write-Host "  Run this command manually:" -ForegroundColor Gray
Write-Host "  pg_dump <DATABASE_URL> > $backupFile" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Enter when backup is complete..." -ForegroundColor Cyan
Read-Host

Write-Host "Proceeding with migration..." -ForegroundColor Green
