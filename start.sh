#!/bin/bash

# AI Contract Negotiation Assistant - Startup Script with Hot Reload
echo "=========================================="
echo "AI Contract Negotiation Assistant"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Load environment variables from .env file
if [ -f "$SCRIPT_DIR/.env" ]; then
    export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)
    echo -e "${GREEN}Environment variables loaded from .env${NC}"
else
    echo -e "${RED}.env file not found!${NC}"
    exit 1
fi

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$pid" ]; then
        echo -e "${YELLOW}Killing process on port $port (PID: $pid)${NC}"
        kill -9 $pid 2>/dev/null
        sleep 1
    fi
}

# Function to check if PostgreSQL is running
check_postgres() {
    if command -v pg_isready &> /dev/null; then
        pg_isready -q
        return $?
    else
        psql -U postgres -c "SELECT 1" &>/dev/null
        return $?
    fi
}

# Function to wait for PostgreSQL
wait_for_postgres() {
    echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
    local max_attempts=30
    local attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if check_postgres; then
            echo -e "${GREEN}PostgreSQL is ready!${NC}"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    echo -e "${RED}PostgreSQL is not available after $max_attempts seconds${NC}"
    return 1
}

# Clean up ports - NOT using port 5000
echo -e "\n${CYAN}[1/9] Cleaning up ports...${NC}"
kill_port 5001
kill_port 5173
kill_port 5174
echo -e "${GREEN}Ports cleaned!${NC}"

# Check if PostgreSQL is running
echo -e "\n${CYAN}[2/9] Checking PostgreSQL...${NC}"
if ! check_postgres; then
    echo -e "${YELLOW}Starting PostgreSQL...${NC}"
    if command -v brew &> /dev/null; then
        brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null
    elif command -v pg_ctl &> /dev/null; then
        pg_ctl start -D /usr/local/var/postgres 2>/dev/null
    elif command -v systemctl &> /dev/null; then
        sudo systemctl start postgresql 2>/dev/null
    fi
    sleep 3
fi

if ! wait_for_postgres; then
    echo -e "${RED}Please ensure PostgreSQL is installed and running${NC}"
    echo "Install with: brew install postgresql@14"
    echo "Start with: brew services start postgresql@14"
    exit 1
fi

# Create database if it doesn't exist
echo -e "\n${CYAN}[3/9] Creating database...${NC}"
createdb contract_negotiation_db 2>/dev/null || echo "Database may already exist"
echo -e "${GREEN}Database ready!${NC}"

# Navigate to backend directory
cd "$SCRIPT_DIR/backend"

# Install backend dependencies including nodemon for hot reload
echo -e "\n${CYAN}[4/9] Installing backend dependencies...${NC}"
npm install
# Install nodemon globally or locally for hot reload
npm install --save-dev nodemon 2>/dev/null
echo -e "${GREEN}Backend dependencies installed!${NC}"

# Generate Prisma client and push schema
echo -e "\n${CYAN}[5/9] Setting up database schema...${NC}"
npx prisma generate
npx prisma db push --accept-data-loss
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to push database schema. Retrying...${NC}"
    npx prisma db push --accept-data-loss --force-reset
fi
echo -e "${GREEN}Database schema ready!${NC}"

# Seed the database
echo -e "\n${CYAN}[6/9] Seeding database with sample data...${NC}"
npm run db:seed
echo -e "${GREEN}Database seeded with 15+ items per feature!${NC}"

# Navigate to frontend directory
cd "$SCRIPT_DIR/frontend"

# Install frontend dependencies
echo -e "\n${CYAN}[7/9] Installing frontend dependencies...${NC}"
npm install
echo -e "${GREEN}Frontend dependencies installed!${NC}"

# Go back to backend and start with nodemon
cd "$SCRIPT_DIR/backend"

echo -e "\n${CYAN}[8/9] Starting backend server with hot reload...${NC}"
# Start backend with nodemon for auto-reload on file changes
npx nodemon --watch src --ext js,json src/index.js &
BACKEND_PID=$!
echo -e "${GREEN}Backend server started on http://localhost:5001${NC}"
echo -e "${BLUE}Watching backend/src for changes...${NC}"

# Wait for backend to be ready
sleep 3

# Navigate to frontend directory
cd "$SCRIPT_DIR/frontend"

# Display startup information
echo -e "\n${CYAN}[9/9] Starting frontend server with hot reload...${NC}"
echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}   APPLICATION STARTED WITH HOT RELOAD!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${CYAN}Frontend:${NC} http://localhost:5173"
echo -e "${CYAN}Backend:${NC}  http://localhost:5001"
echo ""
echo -e "${BLUE}File Watching Active:${NC}"
echo -e "  - Backend:  ${YELLOW}backend/src/**/*.js${NC} (auto-restart)"
echo -e "  - Frontend: ${YELLOW}frontend/src/**/*${NC} (hot module reload)"
echo ""
echo -e "${PURPLE}AI Tools Available:${NC}"
echo -e "  - Risk Clause Highlighter"
echo -e "  - Standard Terms Comparer"
echo -e "  - Plain Language Translator"
echo -e "  - Precedent Finder"
echo -e "  - NDA Generator"
echo -e "  - Terms of Service Builder"
echo -e "  - Lease Analyzer"
echo ""
echo -e "${CYAN}Login credentials:${NC}"
echo -e "  Email:    ${YELLOW}admin@contractai.com${NC}"
echo -e "  Password: ${YELLOW}password123${NC}"
echo ""
echo -e "${RED}Press Ctrl+C to stop all servers${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}Shutting down...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill_port 5001
    kill_port 5173
    kill_port 5174
    echo -e "${GREEN}Servers stopped.${NC}"
    exit 0
}

# Cleanup on exit
trap cleanup EXIT INT TERM

# Start frontend with Vite (has built-in HMR)
npm run dev
