@echo off
echo === RESTORE FROM OLD BACKUP ===
echo.

echo Available backup options:
echo.
echo 1. index-optimized.html (Clean, optimized version - 1183 lines)
echo 2. music-catalog.html (Modular version with templates - 1218 lines)
echo 3. music-catalog-modular.html (If exists)
echo 4. Restore from Git backup branch
echo 5. Create new backup of current state first
echo.
set /p choice="Which option? (1-5): "

if "%choice%"=="1" (
    echo.
    echo Restoring from index-optimized.html...
    if exist "public\index-optimized.html" (
        copy "public\index-optimized.html" "public\index.html"
        echo SUCCESS: Restored optimized version as main index.html
    ) else (
        echo ERROR: index-optimized.html not found!
        pause
        exit /b 1
    )
) else if "%choice%"=="2" (
    echo.
    echo Restoring from music-catalog.html...
    if exist "public\music-catalog.html" (
        copy "public\music-catalog.html" "public\index.html"
        echo SUCCESS: Restored modular version as main index.html
    ) else (
        echo ERROR: music-catalog.html not found!
        pause
        exit /b 1
    )
) else if "%choice%"=="3" (
    echo.
    echo Restoring from music-catalog-modular.html...
    if exist "public\music-catalog-modular.html" (
        copy "public\music-catalog-modular.html" "public\index.html"
        echo SUCCESS: Restored modular version as main index.html
    ) else (
        echo ERROR: music-catalog-modular.html not found!
        pause
        exit /b 1
    )
) else if "%choice%"=="4" (
    echo.
    echo This will restore from a Git backup branch.
    echo You'll need to run Git commands manually.
    echo.
    echo Commands to run:
    echo git branch -a
    echo git checkout [backup-branch-name]
    echo git checkout -b restored-website
    echo git checkout main
    echo git merge restored-website
    echo.
    pause
    exit /b 0
) else if "%choice%"=="5" (
    echo.
    echo Creating backup of current state...
    if not exist "backup-current" mkdir "backup-current"
    copy "public\index.html" "backup-current\index-backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%.html"
    echo Backup created in backup-current folder
    echo Now run this script again and choose option 1, 2, or 3
    pause
    exit /b 0
) else (
    echo Invalid choice. Please run the script again.
    pause
    exit /b 1
)

echo.
echo Creating backup of restored version...
if not exist "backup-restored" mkdir "backup-restored"
copy "public\index.html" "backup-restored\index-restored-%date:~-4,4%%date:~-10,2%%date:~-7,2%.html"

echo.
echo === RESTORATION COMPLETE ===
echo Your website has been restored from backup!
echo.
echo Files created:
echo - backup-restored\index-restored-[date].html (your restored version)
echo.
echo Next steps:
echo 1. Test your website at http://localhost:3000
echo 2. If it looks good, commit the changes
echo 3. If not, you can try another backup option
echo.
pause 