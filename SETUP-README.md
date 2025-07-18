# Sen AI - Development Environment Setup

This directory contains batch files to easily manage the Sen AI development environment on Windows.

## Quick Start

### Option 1: Simple Setup (Recommended)
Double-click `setup.bat` to start all servers automatically.

### Option 2: Enhanced Setup (With Dependency Management)
Double-click `setup-enhanced.bat` for a more comprehensive setup that includes:
- Dependency checking
- Optional dependency installation/updates
- Better error handling
- Detailed status messages

## Batch Files

### `setup.bat`
- **Purpose**: Quick start all three servers
- **What it does**:
  - Starts Frontend (Next.js) on port 3000
  - Starts Backend (Python Flask) on port 5000  
  - Starts Auth Backend (Node.js) on port 8000
- **Usage**: Double-click or run from command line

### `setup-enhanced.bat`
- **Purpose**: Comprehensive development environment setup
- **What it does**:
  - Checks for required dependencies (Node.js, Python)
  - Optionally installs/updates npm and pip packages
  - Starts all three servers with detailed logging
  - Provides clear status messages and error handling
- **Usage**: Double-click or run from command line

### `stop-servers.bat`
- **Purpose**: Stop all running Sen AI servers
- **What it does**:
  - Kills processes running on ports 3000, 5000, and 8000
  - Cleans up any remaining Node.js/Python processes
  - Provides confirmation of stopped services
- **Usage**: Double-click or run from command line

## Server Information

| Service | Technology | Port | URL |
|---------|------------|------|-----|
| Frontend | Next.js | 3000 | http://localhost:3000 |
| Backend | Python Flask | 5000 | http://localhost:5000 |
| Auth Backend | Node.js Express | 8000 | http://localhost:8000 |

## Prerequisites

Before running the setup scripts, ensure you have:

1. **Node.js** (v16 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **Python** (v3.8 or higher)
   - Download from: https://python.org/
   - Verify installation: `python --version`

3. **Dependencies Installed** (or use enhanced setup to install automatically):
   - Frontend: `cd frontend && npm install`
   - Auth Backend: `cd auth-backend && npm install`
   - Backend: `cd backend && pip install -r requirements.txt`

## Usage Instructions

### Starting Development Environment

1. Navigate to the Sen_AI root directory
2. Run one of the setup scripts:
   ```bash
   # Quick start
   setup.bat
   
   # Or enhanced setup with dependency management
   setup-enhanced.bat
   ```
3. Wait for all servers to start (each opens in its own window)
4. Access the application at http://localhost:3000

### Stopping Development Environment

1. Run the stop script:
   ```bash
   stop-servers.bat
   ```
2. Or manually close the individual server windows

### Manual Server Management

If you prefer to start servers individually:

```bash
# Frontend
cd frontend
npm run dev

# Backend  
cd backend
python run.py

# Auth Backend
cd auth-backend
npm start
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   - Run `stop-servers.bat` to kill existing processes
   - Or manually kill processes using Task Manager

2. **Dependencies Not Found**
   - Use `setup-enhanced.bat` to install dependencies
   - Or manually install as described in Prerequisites

3. **Scripts Won't Run**
   - Ensure you're running from the Sen_AI root directory
   - Check that all three subdirectories (frontend, backend, auth-backend) exist

4. **Python/Node.js Not Found**
   - Verify installations with `python --version` and `node --version`
   - Add to PATH if necessary

### Getting Help

If you encounter issues:
1. Check the individual server windows for error messages
2. Ensure all prerequisites are installed
3. Try running `setup-enhanced.bat` for better error diagnostics
4. Run servers manually to isolate issues

## Development Workflow

1. **Start**: Run `setup.bat` or `setup-enhanced.bat`
2. **Develop**: Make changes to your code (hot reload is enabled)
3. **Test**: Access http://localhost:3000 to test changes
4. **Stop**: Run `stop-servers.bat` when finished

The setup automatically enables hot reload for all services, so your changes will be reflected immediately without restarting servers.
