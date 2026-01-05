# Participium

**Participium** is a citizen reporting platform that enables residents to report urban issues (potholes, broken street lights, waste management, etc.) and allows municipal staff to manage, assign, and resolve these reports efficiently.

## Features

- **Web-based reporting**: Citizens can submit reports with photos and location data through the web interface.
- **Telegram Bot Integration**: Users can link their Telegram accounts to receive notifications and potentially submit reports via Telegram for enhanced accessibility.
- **Role-based access**: Supports multiple user roles including citizens, municipal staff, directors, and external maintainers.
- **Geospatial features**: Utilizes PostGIS for location-based queries and mapping.
- **Photo uploads**: Supports image attachments for detailed report documentation.

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

#### Configure Environment Variables

For security reasons, the `.env` files containing secrets are not included in the repository. You need to create them manually.

**1. Development Configuration:**

Create a `.env` file in the *server folder* with the following content, and update the variables with your real credentials:

```dotenv
# Database Configuration
# Example of a local connection URL
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_db_name

# Server Configuration
PORT=3001
NODE_ENV=development

# Email Configuration
# For Gmail, use an App Password, not your login password
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Telegram Bot Configuration
# Get the token from @BotFather on Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
# Enables or disables the Telegram bot functionality
TELEGRAM_BOT_ENABLED=false
```

Only one environment should own the Telegram polling session at a time. Keep `TELEGRAM_BOT_ENABLED=false` for local development and set it to `true` only on the deployment (or single dev machine) that must process Telegram updates.

**2. Test Configuration:**

Create a `.env.test` file in the project root with the following content:

```dotenv
# Database Configuration (Test)
# Be sure these values match your test docker-compose
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}
DB_USER=participium_test
DB_PASSWORD=test_password_123
DB_HOST=localhost
DB_PORT=5433
DB_NAME=participium_db_test

# Server Configuration
PORT=3001
NODE_ENV=test

# Session Configuration
# For the tests, you can use any random string, but do not commit the real one if used elsewhere
SESSION_SECRET=your_random_session_secret

# Logging
LOG_LEVEL=error
```

#### Start development server:

```bash
npm run dev
```

The backend will start on **`http://localhost:3001`**

**API Documentation (Swagger):** [`http://localhost:3001/api-docs`](http://localhost:3001/api-docs)

**OpenAPI Specification:** [`server/openapi.yaml`](server/openapi.yaml)


#### Photo Storage

**How it works:**
- Every photo uploaded via the app is saved inside the backend container, in `/app/uploads/reports/{reportId}/`.
- There is **no synchronization** with your local filesystem and **no cloud storage**: all images live only in the container.
- The backend automatically serves images via the API endpoint:
`http://localhost:3001/uploads/reports/{reportId}/{filename}`

**Usage:**
- To display a photo in the frontend, use the above URL format (replace `{reportId}` and `{filename}` with actual values).
- No extra configuration is needed: the backend handles all file management and access.

**Notes:**
- If you remove the backend container, all uploaded photos will be deleted unless because no Docker volume is set up for persistence.

### 4. Default Users

The database is pre-populated with default users for testing and development purposes:

**Quick Access:**
- **Admin:** `admin` / `admin`
- **Officer:** `officer` / `officer`
- **Directors:** `director_*` / `director`
- **Staff:** `staff_*` / `staff`
- **External Maintainers:** `enelx`, `acea`, `hera`, `atm` / `password`
- **Citizens:** `user`, `user2` / `password`

**Complete user list with roles and departments:** [`server/src/docs/default-users.md`](server/src/docs/default-users.md)

**Login via API (example):**
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
 
 **Telegram linking:** The `users` table now includes `telegram_link_confirmed` to ensure Telegram accounts are usable for reports only after the user confirms linking from the web app.

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