#!/bin/bash

# Development Server Management Script
# Handles both Python FastAPI backend and Next.js frontend with health checks

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PYTHON_PORT=8000
FRONTEND_PORT=9002
PYTHON_DIR="agent_logic"
PYTHON_MAIN="main.py"
MAX_RETRIES=30
RETRY_DELAY=2

# PID files for tracking processes
PYTHON_PID_FILE="/tmp/agentic_health_python.pid"
FRONTEND_PID_FILE="/tmp/agentic_health_frontend.pid"

# Logging
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Kill process on port
kill_port() {
    local port=$1
    local pids=$(lsof -Pi :$port -sTCP:LISTEN -t 2>/dev/null || true)
    if [ ! -z "$pids" ]; then
        warning "Killing processes on port $port: $pids"
        echo $pids | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Health check for Python server
check_python_health() {
    local retries=0
    while [ $retries -lt $MAX_RETRIES ]; do
        if curl -s http://localhost:$PYTHON_PORT/ >/dev/null 2>&1; then
            return 0
        fi
        retries=$((retries + 1))
        sleep $RETRY_DELAY
    done
    return 1
}

# Health check for Frontend server
check_frontend_health() {
    local retries=0
    while [ $retries -lt $MAX_RETRIES ]; do
        if curl -s http://localhost:$FRONTEND_PORT >/dev/null 2>&1; then
            return 0
        fi
        retries=$((retries + 1))
        sleep $RETRY_DELAY
    done
    return 1
}

# Start Python server
start_python() {
    log "Starting Python FastAPI server..."
    
    # Check if already running
    if check_port $PYTHON_PORT; then
        warning "Port $PYTHON_PORT is already in use"
        if [ "$1" != "--force" ]; then
            error "Use --force to kill existing process and restart"
            return 1
        fi
        kill_port $PYTHON_PORT
    fi
    
    # Check if Python directory exists
    if [ ! -d "$PYTHON_DIR" ]; then
        error "Python directory '$PYTHON_DIR' not found"
        return 1
    fi
    
    # Check if main.py exists
    if [ ! -f "$PYTHON_DIR/$PYTHON_MAIN" ]; then
        error "Python main file '$PYTHON_DIR/$PYTHON_MAIN' not found"
        return 1
    fi
    
    # Check Python dependencies
    log "Checking Python dependencies..."
    cd $PYTHON_DIR
    if [ -f "requirements.txt" ]; then
        python -m pip install -r requirements.txt --quiet
    fi
    
    # Start the server in background
    log "Launching Python server on port $PYTHON_PORT..."
    nohup python $PYTHON_MAIN > /tmp/python_server.log 2>&1 &
    local python_pid=$!
    echo $python_pid > $PYTHON_PID_FILE
    cd ..
    
    # Health check
    log "Waiting for Python server to be ready..."
    if check_python_health; then
        success "Python server is running (PID: $python_pid)"
        return 0
    else
        error "Python server failed to start or health check failed"
        cat /tmp/python_server.log
        return 1
    fi
}

# Start Frontend server
start_frontend() {
    log "Starting Next.js frontend server..."
    
    # Check if already running
    if check_port $FRONTEND_PORT; then
        warning "Port $FRONTEND_PORT is already in use"
        if [ "$1" != "--force" ]; then
            error "Use --force to kill existing process and restart"
            return 1
        fi
        kill_port $FRONTEND_PORT
    fi
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        error "package.json not found in current directory"
        return 1
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log "Installing Node.js dependencies..."
        npm install
    fi
    
    # Start the server in background
    log "Launching frontend server on port $FRONTEND_PORT..."
    nohup npm run dev > /tmp/frontend_server.log 2>&1 &
    local frontend_pid=$!
    echo $frontend_pid > $FRONTEND_PID_FILE
    
    # Health check
    log "Waiting for frontend server to be ready..."
    if check_frontend_health; then
        success "Frontend server is running (PID: $frontend_pid)"
        return 0
    else
        error "Frontend server failed to start or health check failed"
        cat /tmp/frontend_server.log
        return 1
    fi
}

# Stop servers
stop_servers() {
    log "Stopping development servers..."
    
    # Stop Python server
    if [ -f $PYTHON_PID_FILE ]; then
        local python_pid=$(cat $PYTHON_PID_FILE)
        if kill -0 $python_pid 2>/dev/null; then
            log "Stopping Python server (PID: $python_pid)"
            kill $python_pid
            rm -f $PYTHON_PID_FILE
        fi
    fi
    kill_port $PYTHON_PORT
    
    # Stop Frontend server
    if [ -f $FRONTEND_PID_FILE ]; then
        local frontend_pid=$(cat $FRONTEND_PID_FILE)
        if kill -0 $frontend_pid 2>/dev/null; then
            log "Stopping Frontend server (PID: $frontend_pid)"
            kill $frontend_pid
            rm -f $FRONTEND_PID_FILE
        fi
    fi
    kill_port $FRONTEND_PORT
    
    success "All servers stopped"
}

# Status check
status() {
    log "Checking server status..."
    
    echo "Python Server (port $PYTHON_PORT):"
    if check_port $PYTHON_PORT; then
        if curl -s http://localhost:$PYTHON_PORT/ >/dev/null 2>&1; then
            success "  ✓ Running and healthy"
        else
            warning "  ⚠ Running but health check failed"
        fi
    else
        error "  ✗ Not running"
    fi
    
    echo "Frontend Server (port $FRONTEND_PORT):"
    if check_port $FRONTEND_PORT; then
        if curl -s http://localhost:$FRONTEND_PORT >/dev/null 2>&1; then
            success "  ✓ Running and accessible"
        else
            warning "  ⚠ Running but not accessible"
        fi
    else
        error "  ✗ Not running"
    fi
}

# Run tests
test_servers() {
    log "Running server tests..."
    
    # Test Python server
    if check_port $PYTHON_PORT; then
        log "Testing Python server endpoints..."
        
        # Test health endpoint
        if curl -s http://localhost:$PYTHON_PORT/ | grep -q "ok"; then
            success "  ✓ Health endpoint working"
        else
            error "  ✗ Health endpoint failed"
        fi
        
        # Test ML pipeline endpoint (if available)
        if curl -s http://localhost:$PYTHON_PORT/docs >/dev/null 2>&1; then
            success "  ✓ API docs accessible"
        else
            warning "  ⚠ API docs not accessible"
        fi
    else
        error "Python server not running - cannot test"
    fi
    
    # Test Frontend server
    if check_port $FRONTEND_PORT; then
        log "Testing Frontend server..."
        
        if curl -s http://localhost:$FRONTEND_PORT >/dev/null 2>&1; then
            success "  ✓ Frontend accessible"
        else
            error "  ✗ Frontend not accessible"
        fi
    else
        error "Frontend server not running - cannot test"
    fi
}

# Main command handling
case "${1:-start}" in
    "start")
        log "Starting development environment..."
        start_python ${2:-}
        start_frontend ${2:-}
        status
        success "Development environment ready!"
        echo ""
        echo "🚀 Servers running:"
        echo "   Python API: http://localhost:$PYTHON_PORT"
        echo "   Frontend:   http://localhost:$FRONTEND_PORT"
        echo ""
        echo "📝 Logs:"
        echo "   Python:   tail -f /tmp/python_server.log"
        echo "   Frontend: tail -f /tmp/frontend_server.log"
        ;;
    "stop")
        stop_servers
        ;;
    "restart")
        stop_servers
        sleep 2
        start_python --force
        start_frontend --force
        status
        ;;
    "status")
        status
        ;;
    "test")
        test_servers
        ;;
    "logs")
        case "${2:-both}" in
            "python")
                tail -f /tmp/python_server.log
                ;;
            "frontend")
                tail -f /tmp/frontend_server.log
                ;;
            "both"|*)
                echo "=== Python Server Logs ==="
                tail -n 20 /tmp/python_server.log 2>/dev/null || echo "No Python logs found"
                echo ""
                echo "=== Frontend Server Logs ==="
                tail -n 20 /tmp/frontend_server.log 2>/dev/null || echo "No Frontend logs found"
                ;;
        esac
        ;;
    "help"|"-h"|"--help")
        echo "Development Server Management Script"
        echo ""
        echo "Usage: $0 [command] [options]"
        echo ""
        echo "Commands:"
        echo "  start [--force]  Start both servers (default)"
        echo "  stop             Stop both servers"
        echo "  restart          Restart both servers"
        echo "  status           Check server status"
        echo "  test             Run server health tests"
        echo "  logs [python|frontend|both]  Show server logs"
        echo "  help             Show this help message"
        echo ""
        echo "Options:"
        echo "  --force          Force restart if ports are in use"
        ;;
    *)
        error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac