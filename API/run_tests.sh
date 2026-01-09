#!/bin/bash
# Quick test runner script for LLM utilities

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== LLM Utils Test Suite ===${NC}\n"

# Activate virtual environment
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
fi

source venv/bin/activate

# Install dependencies if needed
if ! python -c "import pytest" 2>/dev/null; then
    echo -e "${YELLOW}Installing test dependencies...${NC}"
    pip install -q -r requirements.txt
fi

# Parse command line arguments
case "$1" in
    "unit")
        echo -e "${BLUE}Running unit tests only...${NC}\n"
        python -m pytest tests/unit/ -v -m unit
        ;;
    "integration")
        echo -e "${BLUE}Running integration tests...${NC}"
        echo -e "${YELLOW}Note: Set OPENAI_API_KEY in .env to run actual tests${NC}\n"
        python -m pytest tests/integration/llm-integration/ -v -m integration
        ;;
    "coverage")
        echo -e "${BLUE}Running tests with coverage report...${NC}\n"
        python -m pytest tests/unit/ --cov=utils.llm --cov-report=term-missing --cov-report=html
        echo -e "\n${GREEN}Coverage report generated in htmlcov/index.html${NC}"
        ;;
    "all")
        echo -e "${BLUE}Running all tests...${NC}\n"
        python -m pytest tests/ -v
        ;;
    "quick")
        echo -e "${BLUE}Running quick test summary...${NC}\n"
        python -m pytest tests/ -q
        ;;
    *)
        echo -e "${BLUE}Usage:${NC}"
        echo "  $0 unit          - Run unit tests only (fast, no API keys needed)"
        echo "  $0 integration   - Run integration tests (requires API keys)"
        echo "  $0 coverage      - Run with coverage report"
        echo "  $0 all           - Run all tests with verbose output"
        echo "  $0 quick         - Quick test summary"
        echo ""
        echo -e "${BLUE}Running default (quick mode)...${NC}\n"
        python -m pytest tests/ -q
        ;;
esac

echo -e "\n${GREEN}Done!${NC}"

