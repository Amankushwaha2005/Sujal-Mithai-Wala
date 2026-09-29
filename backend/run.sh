#!/bin/bash
# Run from the backend folder. The website files live in the parent folder.
cd "$(dirname "$0")/.."
exec bash ./start-vps.sh
