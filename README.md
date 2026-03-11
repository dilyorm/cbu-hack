# Bank Asset Management Platform

Smart Banking Office Asset Management Platform developed for a hackathon.

## Features

- **Asset Management**: Full system to track and manage bank office assets.
- **QR Code Generation**: Automatically generate QR codes for each managed asset.
- **Reporting (PDF)**: Export asset reports directly to PDF.
- **AI Integration**: Gemini API integration for intelligent assistance.
- **Authentication**: Secure JWT-based user authentication.
- **Storage**: Optional support for AWS S3 to store asset images.

## Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- Headless UI & Heroicons
- Recharts (for analytics and dashboards)
- React Router

### Backend
- Java 17
- Spring Boot 3.2.x
- Spring Security with JWT
- PostgreSQL
- Flyway for database migrations
- SpringDoc OpenAPI (Swagger for API documentation)
- Google ZXing (QR code generation)
- OpenPDF (PDF document generation)
- AWS S3 SDK (Optional cloud storage)

### Infrastructure
- Docker & Docker Compose

## Quick Start (Docker)

The easiest way to run the application is using Docker Compose. It will spin up the database, backend, and frontend containers automatically.

1. Ensure you have [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed on your machine.
2. Clone this repository.
3. Start the application:
   ```bash
   docker-compose up --build
   ```

### Accessible Services:
- **Frontend App**: `http://localhost:3000`
- **Backend API**: `http://localhost:8080`
- **PostgreSQL Database**: `localhost:5432`

## Local Development

If you prefer to run the components separately for development:

### Database
You will need a running PostgreSQL instance with a database named `bank_assets`.
Or you can use the docker-compose file just for the DB:
```bash
docker-compose up postgres
```

### Backend
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Build and run using Maven (ensure Java 17 is installed):
   ```bash
   ./mvnw spring-boot:run
   ```

### Frontend
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Check the `docker-compose.yml` file for variables that you can configure via a `.env` file or straight through standard environment configuration:
- `JWT_SECRET`, `JWT_EXPIRATION`: For security tokens.
- `GEMINI_ENABLED`, `GEMINI_API_KEY`: To enable and configure Gemini AI features.
- `S3_ENABLED`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`: To use S3 for image storage.
