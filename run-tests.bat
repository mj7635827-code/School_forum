@echo off
echo 🧪 School Forum System - Test Suite Runner
echo ==========================================

echo.
echo Select test type to run:
echo 1. Smoke Tests (Quick health check)
echo 2. Unit Tests (Individual component tests)
echo 3. Integration Tests (API and database tests)
echo 4. Security Tests (Vulnerability scans)
echo 5. Performance Tests (Load testing)
echo 6. All Tests (Complete test suite)
echo.

set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" (
    echo Running Smoke Tests...
    node tests/setup/test-runner.js smoke
) else if "%choice%"=="2" (
    echo Running Unit Tests...
    node tests/setup/test-runner.js unit
) else if "%choice%"=="3" (
    echo Running Integration Tests...
    node tests/setup/test-runner.js integration
) else if "%choice%"=="4" (
    echo Running Security Tests...
    node tests/setup/test-runner.js security
) else if "%choice%"=="5" (
    echo Running Performance Tests...
    node tests/setup/test-runner.js performance
) else if "%choice%"=="6" (
    echo Running All Tests...
    node tests/setup/test-runner.js all
) else (
    echo Invalid choice. Running smoke tests by default...
    node tests/setup/test-runner.js smoke
)

echo.
echo Test execution completed!
pause