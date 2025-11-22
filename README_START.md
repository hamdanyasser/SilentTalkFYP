# SilentTalk FYP - Quick Start

## Running the Project

From your terminal, run these commands:

```bash
# Navigate to project root
cd ~/SilentTalkFYP

# Make scripts executable (first time only)
chmod +x *.sh

# Apply bug fixes (first time only - safe to run multiple times)
./apply-fixes.sh

# Start all services
./start-all-services.sh
```

## Access the Application

Once services are running, open these URLs in your browser:

- **Frontend Application:** http://localhost:3001
- **Backend API (Swagger):** http://localhost:5000/swagger
- **ML Service (Docs):** http://localhost:8002/docs

## Stop All Services

When you're done:

```bash
cd ~/SilentTalkFYP
./stop-all-services.sh
```

## What Gets Started?

The `start-all-services.sh` script automatically:
1. ✅ Starts PostgreSQL database (Docker)
2. ✅ Starts MongoDB database (Docker)
3. ✅ Starts ML Service on port 8002
4. ✅ Starts Backend API on port 5000
5. ✅ Starts Frontend on port 3001
6. ✅ Verifies all services are healthy

## Troubleshooting

If you encounter issues:

- **Check logs:** Each service creates a log file in its directory
  - ML Service: `ml-service/ml-service.log`
  - Backend: `server/backend.log`
  - Frontend: `client/frontend.log`

- **Port conflicts:** Run `./stop-all-services.sh` first, then start again

- **Detailed help:** See `QUICK_START_GUIDE.md` for comprehensive instructions

## First Time Setup Notes

- Docker Desktop must be running
- Bug fixes have already been applied
- All configuration files are set up correctly
- No trained ML model yet (expected - sign recognition won't work until trained)

That's it! 🚀
