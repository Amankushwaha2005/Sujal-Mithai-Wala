#!/bin/bash
# Linux VPS start script for Sujal Mithai Wala
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

if ! command -v java >/dev/null 2>&1; then
  echo "Java missing. Install: apt-get install -y openjdk-21-jdk  (or openjdk-17-jdk)"
  exit 1
fi
if ! command -v javac >/dev/null 2>&1; then
  echo "javac missing. Install: apt-get install -y openjdk-21-jdk"
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "PostgreSQL missing. Install and create DB:"
  echo "  apt-get update"
  echo "  apt-get install -y postgresql postgresql-contrib"
  echo "  sudo -u postgres psql -c \"CREATE USER sujal WITH PASSWORD 'sujal123';\""
  echo "  sudo -u postgres psql -c \"CREATE DATABASE sujal_mithai OWNER sujal;\""
  exit 1
fi

if command -v systemctl >/dev/null 2>&1; then
  systemctl start postgresql >/dev/null 2>&1 || systemctl start postgresql@* >/dev/null 2>&1 || true
fi

if command -v sudo >/dev/null 2>&1; then
  sudo -u postgres psql -v ON_ERROR_STOP=0 -c "CREATE USER sujal WITH PASSWORD 'sujal123';" >/dev/null 2>&1 || true
  sudo -u postgres psql -v ON_ERROR_STOP=0 -c "CREATE DATABASE sujal_mithai OWNER sujal;" >/dev/null 2>&1 || true
  sudo -u postgres psql -v ON_ERROR_STOP=0 -c "ALTER USER sujal WITH PASSWORD 'sujal123';" >/dev/null 2>&1 || true
  sudo -u postgres psql -v ON_ERROR_STOP=0 -c "GRANT ALL PRIVILEGES ON DATABASE sujal_mithai TO sujal;" >/dev/null 2>&1 || true
fi

if [ ! -f backend/lib/gson-2.11.0.jar ] || [ ! -f backend/lib/postgresql-42.7.4.jar ]; then
  echo "Missing JARs in backend/lib (gson + postgresql JDBC)."
  exit 1
fi

mkdir -p backend/out
echo "Compiling Java backend..."
javac -encoding UTF-8 \
  -cp "backend/lib/gson-2.11.0.jar:backend/lib/postgresql-42.7.4.jar" \
  -d backend/out \
  backend/src/smw/*.java

export SMW_BIND="${SMW_BIND:-0.0.0.0}"
export SMW_PORT="${SMW_PORT:-8080}"
export SMW_DB_HOST="${SMW_DB_HOST:-127.0.0.1}"
export SMW_DB_PORT="${SMW_DB_PORT:-5432}"
export SMW_DB_NAME="${SMW_DB_NAME:-sujal_mithai}"
export SMW_DB_USER="${SMW_DB_USER:-sujal}"
export SMW_DB_PASS="${SMW_DB_PASS:-sujal123}"
unset LOCALAPPDATA || true

echo "Starting http://0.0.0.0:${SMW_PORT}/  (open your VPS IP on this port)"
exec java -cp "backend/out:backend/lib/gson-2.11.0.jar:backend/lib/postgresql-42.7.4.jar" \
  smw.App "$ROOT"
