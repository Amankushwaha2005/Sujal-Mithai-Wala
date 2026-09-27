@echo off
REM Start Sujal Mithai Wala Java server (website + admin)
cd /d "%~dp0"
if not exist backend\lib\gson-2.11.0.jar (
  echo Missing backend\lib\gson-2.11.0.jar
  exit /b 1
)
if not exist backend\out mkdir backend\out
echo Compiling Java backend...
javac -encoding UTF-8 -cp "backend\lib\gson-2.11.0.jar;backend\lib\postgresql-42.7.4.jar" -d backend\out backend\src\smw\*.java
if errorlevel 1 exit /b 1
echo Starting http://127.0.0.1:8080/
java -cp "backend\out;backend\lib\gson-2.11.0.jar;backend\lib\postgresql-42.7.4.jar" smw.App "%cd%"
