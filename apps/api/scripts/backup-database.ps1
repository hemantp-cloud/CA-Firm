# Database Backup Script
# Run this BEFORE migration to create a full backup

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "backup_before_migration_$timestamp.sql"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DATABASE BACKUP SCRIPT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Load environment variables
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*?)\s*=\s*(.*?)\s*$') {
            $name = $matches[1]
            $value = $matches[2]
            Set-Item -Path "env:$name" -Value $value
        }
    }
    Write-Host "✓ Environment variables loaded" -ForegroundColor Green
} else {
    Write-Host "✗ .env file not found!" -ForegroundColor Red
    exit 1
}

# Check if DATABASE_URL exists
if (-not $env:DATABASE_URL) {
    Write-Host "✗ DATABASE_URL not found in environment!" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Database URL found" -ForegroundColor Green
Write-Host ""

# Extract database connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database
if ($env:DATABASE_URL -match 'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)(\?.*)?$') {
    $dbUser = $matches[1]
    $dbPassword = $matches[2]
    $dbHost = $matches[3]
    $dbPort = $matches[4]
    $dbName = $matches[5]
    
    Write-Host "Database Details:" -ForegroundColor Yellow
    Write-Host "  Host: $dbHost" -ForegroundColor Gray
    Write-Host "  Port: $dbPort" -ForegroundColor Gray
    Write-Host "  Database: $dbName" -ForegroundColor Gray
    Write-Host "  User: $dbUser" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "✗ Could not parse DATABASE_URL!" -ForegroundColor Red
    Write-Host "  Format should be: postgresql://user:password@host:port/database" -ForegroundColor Yellow
    exit 1
}

# Create backup using pg_dump
Write-Host "Creating backup..." -ForegroundColor Yellow
Write-Host "  Backup file: $backupFile" -ForegroundColor Gray
Write-Host ""

# Set password environment variable for pg_dump
$env:PGPASSWORD = $dbPassword

try {
    # Run pg_dump
    $pgDumpPath = "pg_dump"  # Assumes pg_dump is in PATH
    
    & $pgDumpPath `
        --host=$dbHost `
        --port=$dbPort `
        --username=$dbUser `
        --dbname=$dbName `
        --file=$backupFile `
        --format=plain `
        --verbose `
        --no-owner `
        --no-acl
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "✓ BACKUP COMPLETED SUCCESSFULLY!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Backup file: $backupFile" -ForegroundColor Cyan
        
        # Get file size
        $fileSize = (Get-Item $backupFile).Length / 1MB
        Write-Host "File size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "To restore this backup, run:" -ForegroundColor Yellow
        Write-Host "  psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $backupFile" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "✗ BACKUP FAILED!" -ForegroundColor Red
        Write-Host "  Exit code: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "✗ ERROR: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure PostgreSQL client tools are installed:" -ForegroundColor Yellow
    Write-Host "  Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Gray
    exit 1
} finally {
    # Clear password from environment
    Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
}
