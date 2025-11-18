# Participium - Database Structure (v3)

This document describes the database schema (Version 3.0) designed for the **Participium** application.

* **Database System:** PostgreSQL (v15+)
* **Required Extensions:** `postgis` (for geolocation data)

---

## Overview

Participium is a citizen reporting system that allows users to submit reports about urban issues (potholes, broken street lights, etc.). The database is designed to support:

- **User Management** (citizens, staff, administrators)
- **Report Lifecycle** (submission, approval, assignment, resolution)
- **Media Attachments** (photos)
- **Communication** (comments, messages, notifications)
- **Geolocation** (using PostGIS for spatial data)

---

## Custom Data Types (ENUMs)

To ensure data integrity and consistency, the following enumerated types have been defined.

### `report_category`
Predefined categories for citizen reports.

| Value |
|-------|
| `Water Supply - Drinking Water` |
| `Architectural Barriers` |
| `Sewer System` |
| `Public Lighting` |
| `Waste` |
| `Road Signs and Traffic Lights` |
| `Roads and Urban Furnishings` |
| `Public Green Areas and Playgrounds` |
| `Other` |

### `report_status`
Represents the 6 states of a report's lifecycle.

| Value | Description |
|-------|-------------|
| `Pending Approval` | Initial state, waiting for organization staff review |
| `Assigned` | Approved and assigned to technical staff |
| `In Progress` | Technical staff is working on the issue |
| `Suspended` | Temporarily paused |
| `Rejected` | Report rejected by organization staff |
| `Resolved` | Issue has been fixed |

---

## Tables

### 1. `users`
Stores information for all system actors (citizens, operators, administrators).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique user identifier |
| `username` | `VARCHAR(50)` | NOT NULL, UNIQUE | Username for login |
| `first_name` | `VARCHAR(100)` | NOT NULL | User's first name |
| `last_name` | `VARCHAR(100)` | NOT NULL | User's last name |
| `password_hash` | `VARCHAR(255)` | NOT NULL | Hashed password |
| `department_role_id` | `INT` | **FOREIGN KEY** → `department_roles(id)`, NOT NULL | Reference to the user's position (department + role combination) |
| `email` | `VARCHAR(255)` | NOT NULL, UNIQUE | Email address (used for notifications) |
| `personal_photo_url` | `TEXT` | NULLABLE | URL to user's profile photo |
| `telegram_username` | `VARCHAR(100)` | NULLABLE, UNIQUE | Telegram username for bot integration |
| `email_notifications_enabled` | `BOOLEAN` | NOT NULL, DEFAULT true | Flag to enable/disable email notifications |
| `created_at` | `TIMESTAMPTZ` | DEFAULT CURRENT_TIMESTAMP | Registration date |

**Indexes:**
- Primary key on `id`
- Unique index on `username`
- Unique index on `email`
- Unique index on `telegram_username` (where not null)
- Foreign key index on `department_role_id`

**Notes:**
- In V3, the `role` ENUM column has been replaced with `department_role_id` to support flexible role-department combinations
- Application logic assigns new users to the "Citizen" role within the "Organization" department by default

---

### 2. `reports`
Central table containing all citizen-submitted reports.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique report identifier |
| `reporter_id` | `INT` | **FOREIGN KEY** → `users(id)`, NOT NULL | ID of the citizen who created the report |
| `title` | `TEXT` | NOT NULL | Report title/summary |
| `description` | `TEXT` | NOT NULL | Detailed description of the issue |
| `category` | `report_category` | NOT NULL | Issue category (see ENUM) |
| `location` | `GEOGRAPHY(Point, 4326)` | NOT NULL | GPS coordinates (longitude/latitude) of the issue |
| `is_anonymous` | `BOOLEAN` | NOT NULL, DEFAULT false | Flag to hide reporter's name from public view |
| `status` | `report_status` | NOT NULL, DEFAULT 'Pending Approval' | Current report status (see ENUM) |
| `rejection_reason` | `TEXT` | NULLABLE | Required text if `status` is 'Rejected' |
| `assignee_id` | `INT` | **FOREIGN KEY** → `users(id)`, NULLABLE | ID of technical staff member assigned to the case |
| `created_at` | `TIMESTAMPTZ` | DEFAULT CURRENT_TIMESTAMP | Report submission date |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT CURRENT_TIMESTAMP | Date of last status change |

**Additional Constraints:**
- `check_rejection_reason`: Ensures `rejection_reason` is provided when status is 'Rejected'
  ```sql
  CHECK ( (status <> 'Rejected') OR (rejection_reason IS NOT NULL) )
  ```

**Indexes:**
- Primary key on `id`
- Foreign key index on `reporter_id`
- Foreign key index on `assignee_id`
- Spatial index on `location` (automatically created by PostGIS)

---

### 3. `photos`
Stores URLs of photos attached to a report (minimum 1, maximum 3 photos per report).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique photo identifier |
| `report_id` | `INT` | **FOREIGN KEY** → `reports(id)` ON DELETE CASCADE, NOT NULL | Report to which the photo is attached |
| `storage_url` | `TEXT` | NOT NULL | URL to the image (e.g., S3, Firebase Storage) |
| `created_at` | `TIMESTAMPTZ` | DEFAULT CURRENT_TIMESTAMP | Photo upload date |

**Indexes:**
- Primary key on `id`
- Foreign key index on `report_id`

**Business Rules:**
- Each report must have between 1 and 3 photos (enforced at application level)

---

### 4. `comments`
Internal comments from staff operators related to report management (not visible to citizens).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique comment identifier |
| `report_id` | `INT` | **FOREIGN KEY** → `reports(id)` ON DELETE CASCADE, NOT NULL | Report to which the comment refers |
| `author_id` | `INT` | **FOREIGN KEY** → `users(id)`, NOT NULL | Staff member (technical or organization) who wrote the comment |
| `content` | `TEXT` | NOT NULL | Comment text |
| `created_at` | `TIMESTAMPTZ` | DEFAULT CURRENT_TIMESTAMP | Comment creation date |

**Indexes:**
- Primary key on `id`
- Foreign key index on `report_id`
- Foreign key index on `author_id`

---

### 5. `notifications`
In-app notifications for citizens (e.g., "Your report has been approved").

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique notification identifier |
| `user_id` | `INT` | **FOREIGN KEY** → `users(id)` ON DELETE CASCADE, NOT NULL | Recipient (citizen) of the notification |
| `report_id` | `INT` | **FOREIGN KEY** → `reports(id)` ON DELETE CASCADE, NULLABLE | Report related to the notification |
| `content` | `TEXT` | NOT NULL | Notification text (e.g., "Your report status is now 'Resolved'") |
| `is_read` | `BOOLEAN` | NOT NULL, DEFAULT false | Flag indicating if the notification has been read |
| `created_at` | `TIMESTAMPTZ` | DEFAULT CURRENT_TIMESTAMP | Notification creation date |

**Indexes:**
- Primary key on `id`
- Foreign key index on `user_id`
- Foreign key index on `report_id`
- Composite index on `(user_id, is_read)` for efficient querying of unread notifications

---

### 6. `messages`
Bidirectional messaging between a citizen and an operator, related to a specific report.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique message identifier |
| `report_id` | `INT` | **FOREIGN KEY** → `reports(id)` ON DELETE CASCADE, NOT NULL | Report that serves as the "chat room" |
| `sender_id` | `INT` | **FOREIGN KEY** → `users(id)`, NOT NULL | Sender (can be citizen or operator) |
| `content` | `TEXT` | NOT NULL | Message text |
| `created_at` | `TIMESTAMPTZ` | DEFAULT CURRENT_TIMESTAMP | Message send date |

**Indexes:**
- Primary key on `id`
- Foreign key index on `report_id`
- Foreign key index on `sender_id`
- Composite index on `(report_id, created_at)` for efficient message thread retrieval

---

### 7. `departments`
Stores municipality departments that handle different types of reports.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique department identifier |
| `name` | `VARCHAR(100)` | NOT NULL, UNIQUE | Department name (e.g., "Water and Sewer Services Department", "Public Lighting Department") |

**Indexes:**
- Primary key on `id`
- Unique index on `name`

**Pre-populated Departments:**
- `Organization` (for system roles like Citizen and Administrator)
- `Water and Sewer Services Department`
- `Public Infrastructure and Accessibility Department`
- `Public Lighting Department`
- `Waste Management Department`
- `Mobility and Traffic Management Department`
- `Parks, Green Areas and Recreation Department`
- `General Services Department`

---

### 8. `roles`
Stores permission levels and job roles that can be assigned to users across departments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique role identifier |
| `name` | `VARCHAR(100)` | NOT NULL, UNIQUE | Role name (e.g., "Department Director", "Water Network staff member", "Traffic Engineer") |
| `description` | `TEXT` | NULLABLE | Role description |

**Indexes:**
- Primary key on `id`
- Unique index on `name`

**Pre-populated Roles:**
System roles:
- `Citizen` - Standard citizen user
- `Administrator` - System Administrator with full access

Municipality roles include:
- `Department Director` - Director of a department
- Department-specific staff roles (e.g., `Water Network staff member`, `Electrical Engineer`, `Parks Maintenance staff member`)
- Technical roles (e.g., `Civil Engineer`, `Traffic Signal Technician`)
- Support roles (e.g., `Customer Service staff member`, `Support Officer`)

---

### 9. `department_roles`
Junction table that defines valid role-department combinations (positions). This table represents the available positions within the municipality organization structure, not individual user assignments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique position identifier |
| `department_id` | `INT` | **FOREIGN KEY** → `departments(id)` ON DELETE CASCADE, NOT NULL | Department |
| `role_id` | `INT` | **FOREIGN KEY** → `roles(id)` ON DELETE CASCADE, NOT NULL | Role within the department |

**Constraints:**
- **UNIQUE** constraint on `(department_id, role_id)` to prevent duplicate department/role pairs

**Indexes:**
- Primary key on `id`
- Foreign key index on `department_id`
- Foreign key index on `role_id`
- Unique index on `(department_id, role_id)`

**Purpose:**
This table defines which roles are valid within each department. For example:
- The "Water and Sewer Services Department" can have roles like "Department Director", "Water Network staff member", "Sewer System staff member"
- The "Public Lighting Department" can have roles like "Department Director", "Electrical Engineer", "Electrical Technician"

Users are then assigned to one of these positions via the `users.department_role_id` foreign key.

---

### 10. `category_department_mapping`
Maps report categories to responsible departments for automatic report assignment and routing.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique mapping identifier |
| `category` | `report_category` | NOT NULL, UNIQUE | Report category (references the ENUM type) |
| `department_id` | `INT` | **FOREIGN KEY** → `departments(id)`, NOT NULL | Department responsible for this category |
| `created_at` | `TIMESTAMPTZ` | DEFAULT CURRENT_TIMESTAMP | Mapping creation date |

**Indexes:**
- Primary key on `id`
- Unique index on `category`
- Foreign key index on `department_id`

**Purpose:**
This table enables automatic routing of citizen reports to the appropriate technical department based on the report category. Each category maps to exactly one department.

**Pre-populated Mappings:**
| Category | Department |
|----------|------------|
| `Water Supply - Drinking Water` | Water and Sewer Services Department |
| `Sewer System` | Water and Sewer Services Department |
| `Architectural Barriers` | Public Infrastructure and Accessibility Department |
| `Roads and Urban Furnishings` | Public Infrastructure and Accessibility Department |
| `Public Lighting` | Public Lighting Department |
| `Waste` | Waste Management Department |
| `Road Signs and Traffic Lights` | Mobility and Traffic Management Department |
| `Public Green Areas and Playgrounds` | Parks, Green Areas and Recreation Department |
| `Other` | General Services Department |

---

## Entity Relationships

```
users (1) ──────────────< (N) reports [reporter_id]
users (1) ──────────────< (N) reports [assignee_id]
users (1) ──────────────< (N) comments [author_id]
users (1) ──────────────< (N) notifications [user_id]
users (1) ──────────────< (N) messages [sender_id]
users (N) ──────────────> (1) department_roles [department_role_id]

reports (1) ────────────< (N) photos
reports (1) ────────────< (N) comments
reports (1) ────────────< (N) notifications
reports (1) ────────────< (N) messages

departments (1) ────────< (N) department_roles [department_id]
departments (1) ────────< (N) category_department_mapping [department_id]

roles (1) ──────────────< (N) department_roles [role_id]

department_roles (1) ───< (N) users [department_role_id]
department_roles (N) ───> (1) departments
department_roles (N) ───> (1) roles

category_department_mapping (N) ───> (1) departments
```

**Key Relationship Changes in V3:**
- In V3, `department_roles` defines valid positions (department + role combinations)
- Users reference a position through `users.department_role_id` → `department_roles.id`
- This allows the admin UI to filter available roles based on the selected department when creating/editing municipality users
- `category_department_mapping` enables automatic routing of reports to the appropriate department based on category

---

## Database Initialization

The database is initialized using the [`init.sql`](server/src/database/init.sql ) script.

The [`docker-compose.yml`](server/docker-compose.yml ) file automatically runs [`init.sql`](server/src/database/init.sql ) when the database container is first created:

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11 | Initial schema design |
| 1.1 | 2025-11-08 | Updated user roles - expanded from 4 to 10 roles with specific municipal responsibilities |
| 2.0 | 2025-01-20 | Added geolocation support with PostGIS for citizen reports |
| 3.0 | 2025-11-17 | **Major refactoring:** Replaced ENUM-based roles with relational role system. Added `departments`, `roles`, and `department_roles` tables. Changed `users.role` to `users.department_role_id` for flexible role-department assignments. Pre-populated 8 departments and 24+ roles covering various municipal services. |

