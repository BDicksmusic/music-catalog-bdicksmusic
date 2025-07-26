@echo off
echo === QUICK RESET TO COMMIT 19f2a3 ===
echo.

echo Creating backup branch...
git branch backup-before-revert

echo.
echo Deleting problematic branch...
git branch -D music-catalog-2

echo.
echo Resetting to commit 19f2a3...
git reset --hard 19f2a331161275e40f5242c6cb131652bfa66857

echo.
echo Current status:
git status

echo.
echo === RESET COMPLETE ===
echo Your repository is now at commit 19f2a3
echo.
echo To push to GitHub, run: git push --force-with-lease origin main
echo.
pause 