@echo off
echo === REVERT TO COMMIT 1675cd3 ===
echo.

echo This will revert your repository to commit: 1675cd37e4cc7fbd78c1b2b6a59979733cf2a247
echo.
echo WARNING: This will permanently change your repository to that state.
echo.

set /p confirm="Are you sure you want to proceed? (y/n): "

if /i "%confirm%"=="y" (
    echo.
    echo 1. Creating backup branch of current state...
    git branch backup-before-revert-%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%
    
    echo.
    echo 2. Deleting problematic music-catalog-2 branch...
    git branch -D music-catalog-2 2>nul
    
    echo.
    echo 3. Resetting to commit 1675cd3...
    git reset --hard 1675cd37e4cc7fbd78c1b2b6a59979733cf2a247
    
    echo.
    echo 4. Force pushing to GitHub...
    echo Note: This will overwrite the remote repository
    set /p push="Do you want to push this to GitHub? (y/n): "
    
    if /i "%push%"=="y" (
        git push --force-with-lease origin main
        echo.
        echo SUCCESS: Repository reverted and pushed to GitHub!
    ) else (
        echo.
        echo Repository reverted locally. You can push later with: git push --force-with-lease origin main
    )
    
    echo.
    echo === REVERT COMPLETE ===
    echo Your repository is now at commit 1675cd3
    echo Backup branch created: backup-before-revert-[timestamp]
    echo.
    echo Next steps:
    echo 1. Test your website at http://localhost:3000
    echo 2. If it looks good, you're done!
    echo 3. If not, you can restore from the backup branch
    echo.
) else (
    echo Revert cancelled.
)

pause 