# Revert to Specific Commit Script
# This will revert your repository to commit ad05cc28ab4b189e6ef83ef3f1431e83d4473241

Write-Host "=== REVERT TO COMMIT ad05cc2 ===" -ForegroundColor Green
Write-Host ""

$targetCommit = "ad05cc28ab4b189e6ef83ef3f1431e83d4473241"

Write-Host "Target commit: $targetCommit" -ForegroundColor Yellow
Write-Host "This will revert your repository to this exact state." -ForegroundColor Yellow
Write-Host ""

# Verify the commit exists
Write-Host "Verifying commit exists..." -ForegroundColor Cyan
$commitExists = git rev-parse --verify $targetCommit 2>$null
if (-not $commitExists) {
    Write-Host "ERROR: Commit $targetCommit not found!" -ForegroundColor Red
    Write-Host "Please check the commit hash and try again." -ForegroundColor Red
    pause
    exit 1
}

Write-Host "Commit verified successfully!" -ForegroundColor Green
Write-Host ""

$confirm = Read-Host "Are you sure you want to proceed? (y/n)"

if ($confirm -eq "y" -or $confirm -eq "Y") {
    Write-Host ""
    Write-Host "1. Creating backup branch..." -ForegroundColor Yellow
    $backupBranch = "backup-before-revert-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    git branch $backupBranch
    Write-Host "Backup branch created: $backupBranch" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "2. Deleting problematic music-catalog-2 branch..." -ForegroundColor Yellow
    git branch -D music-catalog-2 -ErrorAction SilentlyContinue
    Write-Host "Problematic branch deleted." -ForegroundColor Green
    
    Write-Host ""
    Write-Host "3. Resetting to commit $targetCommit..." -ForegroundColor Yellow
    git reset --hard $targetCommit
    Write-Host "Repository reset successfully!" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "4. Current status:" -ForegroundColor Yellow
    git status
    
    Write-Host ""
    $pushToGitHub = Read-Host "Do you want to push this to GitHub? (y/n)"
    
    if ($pushToGitHub -eq "y" -or $pushToGitHub -eq "Y") {
        Write-Host ""
        Write-Host "5. Force pushing to GitHub..." -ForegroundColor Yellow
        git push --force-with-lease origin main
        Write-Host "SUCCESS: Repository reverted and pushed to GitHub!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "Repository reverted locally only." -ForegroundColor Cyan
        Write-Host "To push later, run: git push --force-with-lease origin main" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "=== REVERT COMPLETE ===" -ForegroundColor Green
    Write-Host "Your repository is now at commit $targetCommit" -ForegroundColor Cyan
    Write-Host "Backup branch: $backupBranch" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Test your website at http://localhost:3000" -ForegroundColor White
    Write-Host "2. If it looks good, you're done!" -ForegroundColor White
    Write-Host "3. If not, restore from: git checkout $backupBranch" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "Revert cancelled." -ForegroundColor Yellow
}

pause 