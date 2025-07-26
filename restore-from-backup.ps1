# Advanced Backup Restoration Script
# This script helps restore from old backups and make them the new website

Write-Host "=== ADVANCED BACKUP RESTORATION ===" -ForegroundColor Green
Write-Host ""

# Function to list available backups
function Show-AvailableBackups {
    Write-Host "Available backup files:" -ForegroundColor Yellow
    
    $backupFiles = @(
        @{Name="index-optimized.html"; Path="public/index-optimized.html"; Description="Clean, optimized version (1183 lines)"},
        @{Name="music-catalog.html"; Path="public/music-catalog.html"; Description="Modular version with templates (1218 lines)"},
        @{Name="music-catalog-modular.html"; Path="public/music-catalog-modular.html"; Description="Modular version (if exists)"}
    )
    
    for ($i = 0; $i -lt $backupFiles.Count; $i++) {
        $file = $backupFiles[$i]
        if (Test-Path $file.Path) {
            Write-Host "$($i + 1). $($file.Name) - $($file.Description)" -ForegroundColor Cyan
        }
    }
    
    Write-Host ""
    Write-Host "4. Restore from Git backup branch" -ForegroundColor Cyan
    Write-Host "5. Create backup of current state" -ForegroundColor Cyan
    Write-Host "6. List Git branches" -ForegroundColor Cyan
}

# Function to restore from file backup
function Restore-FromFile {
    param($SourcePath, $Description)
    
    Write-Host "Restoring from $Description..." -ForegroundColor Yellow
    
    if (Test-Path $SourcePath) {
        # Create backup of current state
        $backupDir = "backup-current-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        Copy-Item "public/index.html" -Destination "$backupDir/index-current.html" -ErrorAction SilentlyContinue
        
        # Restore the backup
        Copy-Item $SourcePath -Destination "public/index.html" -Force
        Write-Host "SUCCESS: Restored $Description as main index.html" -ForegroundColor Green
        
        # Create backup of restored version
        $restoredDir = "backup-restored-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        New-Item -ItemType Directory -Path $restoredDir -Force | Out-Null
        Copy-Item "public/index.html" -Destination "$restoredDir/index-restored.html"
        
        Write-Host "Backup created in: $backupDir" -ForegroundColor Cyan
        Write-Host "Restored version saved in: $restoredDir" -ForegroundColor Cyan
        
        return $true
    } else {
        Write-Host "ERROR: $SourcePath not found!" -ForegroundColor Red
        return $false
    }
}

# Function to show Git branches
function Show-GitBranches {
    Write-Host "Available Git branches:" -ForegroundColor Yellow
    git branch -a
    Write-Host ""
    Write-Host "To restore from a Git branch:" -ForegroundColor Cyan
    Write-Host "1. git checkout [branch-name]" -ForegroundColor White
    Write-Host "2. Copy the files you want" -ForegroundColor White
    Write-Host "3. git checkout main" -ForegroundColor White
    Write-Host "4. Paste the files back" -ForegroundColor White
}

# Main execution
Show-AvailableBackups

$choice = Read-Host "Which option? (1-6)"

switch ($choice) {
    "1" {
        $success = Restore-FromFile "public/index-optimized.html" "optimized version"
    }
    "2" {
        $success = Restore-FromFile "public/music-catalog.html" "modular version"
    }
    "3" {
        $success = Restore-FromFile "public/music-catalog-modular.html" "modular version"
    }
    "4" {
        Write-Host "Git branch restoration requires manual steps:" -ForegroundColor Yellow
        Write-Host "1. Run: git branch -a" -ForegroundColor White
        Write-Host "2. Run: git checkout [backup-branch-name]" -ForegroundColor White
        Write-Host "3. Copy the files you want" -ForegroundColor White
        Write-Host "4. Run: git checkout main" -ForegroundColor White
        Write-Host "5. Paste the files back" -ForegroundColor White
        $success = $true
    }
    "5" {
        $backupDir = "backup-current-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        Copy-Item "public/index.html" -Destination "$backupDir/index-backup.html"
        Write-Host "Backup created in: $backupDir" -ForegroundColor Green
        $success = $true
    }
    "6" {
        Show-GitBranches
        $success = $true
    }
    default {
        Write-Host "Invalid choice. Please run the script again." -ForegroundColor Red
        $success = $false
    }
}

if ($success) {
    Write-Host ""
    Write-Host "=== RESTORATION COMPLETE ===" -ForegroundColor Green
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Test your website at http://localhost:3000" -ForegroundColor White
    Write-Host "2. If it looks good, commit the changes" -ForegroundColor White
    Write-Host "3. If not, try another backup option" -ForegroundColor White
}

Write-Host ""
pause 