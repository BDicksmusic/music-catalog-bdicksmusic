@echo off
echo === REVERT TO COMMIT f940ae9 ===
echo.

echo This will revert your repository to commit: f940ae92135fd5822ebe06b80ddca0aa02930124
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
    echo 3. Resetting to commit f940ae9...
    git reset --hard f940ae92135fd5822ebe06b80ddca0aa02930124
    
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
    echo Your repository is now at commit f940ae9
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