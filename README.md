# Participium

**Participium** is a citizen reporting platform that enables residents to report urban issues (potholes, broken street lights, waste management, etc.) and allows municipal staff to manage, assign, and resolve these reports efficiently.

## Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Docker** and **Docker Compose**

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/Participium.git
cd Participium
```

### 2. Start the Database

From the **server directory**, start the PostgreSQL container:

```bash
cd server
docker-compose up -d
```

This will:
- Start **PostgreSQL 15** with **PostGIS** extension on port `5433`
- Automatically execute [`server/src/database/init.sql`](server/src/database/init.sql) to create tables and enums
- Create the database `participium_db` with user `user` / password `password`

**Check if the database is running:**

```bash
docker ps
```

You should see a container named `participium_db`.

### 3. Setup Backend (Server)

From the server directory install dependencies:

```bash
npm install
```

#### Configure environment variables:

Create a `.env` file in the `server/` directory:

```env
PORT=3001
DB_HOST=localhost
DB_PORT=5433
DB_USER=user
DB_PASSWORD=password
DB_NAME=participium_db
```

#### Start development server:

```bash
npm run dev
```

The backend will start on **`http://localhost:3001`**

**API Documentation (Swagger):** [`http://localhost:3001/api-docs`](http://localhost:3001/api-docs)

**OpenAPI Specification:** [`server/openapi.yaml`](server/openapi.yaml)

#### Configure Storage Provider:

Participium supports two storage options for uploaded photos:

**Local Storage (Default - Development):**
```bash
npm run storage:local
```
Photos are stored in `server/uploads/reports/`

**Cloudflare R2 (Production):**
```bash
npm run storage:r2
```
Photos are uploaded to Cloudflare R2 (requires configuration)

**Check current storage configuration:**
```bash
npm run storage:status
```

**Setup Cloudflare R2:** See [`server/CLOUDFLARE_R2_SETUP.md`](server/CLOUDFLARE_R2_SETUP.md) for detailed instructions.

**Typical Workflow:**
- **Development:** Use `npm run storage:local` for local file storage
- **Production:** Configure R2 credentials and run `npm run storage:r2` before deployment


### 4. Default Administrator Account

The database is initialized with a default administrator account:

**Credentials:**
- **Username:** `admin`
- **Password:** `admin`

**Login via API:**
```bash
curl -X POST http://localhost:3001/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

### 5. Setup Frontend (Client)

Navigate to the client directory and install dependencies:

```bash
cd ../client
npm install
```

#### Start development server:

```bash
npm run dev
```

The frontend will start on **`http://localhost:5173`**


## Testing

The backend includes unit and E2E tests with a separate test database.

### Run All Tests

```bash
npm run test:all
```

### Run E2E Tests

E2E tests use a Docker test database (port 5433) with pre-loaded test data:

```bash
npm run test:e2e
```

This command automatically:
- Starts the test database container
- Waits for initialization
- Runs E2E tests
- Stops the database

### Run Tests with Coverage

```bash
npm run test:coverage
```

View coverage report: `server/coverage/index.html`


## Database Management

### Reset Database (deletes all data)

If you need to reinitialize the database from scratch:

**From the root directory:**

```bash
docker compose down -v && docker compose up -d
```

**Explanation:**
- `docker compose down -v` - Stops containers and **deletes volumes** (all data)
- `docker compose up -d` - Restarts containers if they esist otherwise creates new ones and starts them
- PostgreSQL automatically runs `init.sql` on empty database

### View Database Logs

```bash
docker-compose logs -f db
```

### Database Schema

The database uses PostgreSQL with PostGIS for geolocation features.

**Detailed schema documentation:** [`server/src/docs/database.md`](server/src/docs/database.md)


## Deployment

For production environments or a quick full-stack startup without manual setup, use the root-level Docker orchestration. This creates a containerized environment with the Database, Backend, and a production-build of the Frontend served by Nginx.

### 1. Build and Start Containers

From the **project root directory** (where the main `docker-compose.yml` is located), run:

```bash
docker compose up --build -d
```

This command will automatically:
- Build the Backend image (compiling TypeScript).
- Build the Frontend image (Vite build) and serve it via Nginx.
- Start the PostgreSQL/PostGIS database.
- Create an internal network connecting all services.

### Access the Application
Once the containers are running, the application is accessible at:
- **Web Interface (Frontend)**: http://localhost (Served on standard HTTP port 80)
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api-docs

### Stop the Application
To stop the containers and remove the networks (data in the database volume will be preserved):

```bash
docker compose down
```

If you need to completely remove all data (including the database volume):

```bash
docker compose down -v
```