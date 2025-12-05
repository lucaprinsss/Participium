# Participium - Database Structure (v4.3)

This document describes the database schema (Version 4.3) designed for the **Participium** application.

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
- **Automatic Assignment Workflow**

---

## Custom Data Types (ENUMs)

To ensure data integrity and consistency, the following enumerated types have been defined.

> **Note:** The `user_role` ENUM has been removed in V3. User roles are now managed through the relational tables `departments`, `roles`, and `department_roles`.

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
Represents the lifecycle states of a report.

| Value | Description |
|-------|-------------|
| `Pending Approval` | Initial state, waiting for organization staff review |
| `Assigned` | Approved and assigned to technical staff |
| `In Progress` | Technical staff is working on the issue |
| `Suspended` | Temporarily paused |
| `Rejected` | Report rejected by organization staff |
| `Resolved` | Issue has been fixed |

**Note:** External maintenance is not a separate status. When a report is delegated to an external maintainer, the `external_assignee_id` field is populated while the status remains 'In Progress'.

## Tables

### 1. `companies`
Stores information about external maintenance companies that handle specific report categories.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique company identifier |
| `name` | `VARCHAR(255)` | NOT NULL, UNIQUE | Company name (e.g., "Enel X", "Acea") |
| `category` | `report_category` | NOT NULL | Report category the company specializes in |
| `created_at` | `TIMESTAMPTZ` | DEFAULT CURRENT_TIMESTAMP | Company registration date |

**Notes:**
- **NEW in V4.3**: Separates company entities from user accounts
- Each company specializes in one report category, but multiple companies can handle the same category
- External maintainer users reference this table via `users.company_id`
- MUST be created BEFORE users table because of foreign key dependency

---

### 2. `users`
Stores information for all system actors (citizens, operators, administrators).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique user identifier |
| `username` | `VARCHAR(50)` | NOT NULL, UNIQUE | Username for login |
| `first_name` | `VARCHAR(100)` | NOT NULL | User's first name |
| `last_name` | `VARCHAR(100)` | NOT NULL | User's last name |
| `password_hash` | `VARCHAR(255)` | NOT NULL | Hashed password |
| `department_role_id` | `INT` | **FOREIGN KEY** → `department_roles(id)`, NOT NULL | User's position (department + role combination) |
| `email` | `VARCHAR(255)` | NOT NULL, UNIQUE | Email address (used for notifications) |
| `personal_photo_url` | `TEXT` | NULLABLE | URL to user's profile photo |
| `telegram_username` | `VARCHAR(100)` | NULLABLE, UNIQUE | Telegram username for bot integration |
| `email_notifications_enabled` | `BOOLEAN` | NOT NULL, DEFAULT true | Flag to enable/disable email notifications |
| `company_id` | `INT` | **FOREIGN KEY** → `companies(id)`, NULLABLE | Reference to external company (only for External Maintainer role) |
| `is_verified` | `BOOLEAN` | NOT NULL, DEFAULT false | Indicates if the user's email has been verified |
| `verification_code` | `VARCHAR(6)` | NULLABLE | 6-digit verification code sent via email (null after verification) |
| `verification_code_expires_at` | `TIMESTAMPTZ` | NULLABLE | Expiration timestamp for the verification code (30 minutes from generation) |
| `created_at` | `TIMESTAMPTZ` | DEFAULT CURRENT_TIMESTAMP | Registration date |

**Indexes:**
- Primary key on `id`
- Unique index on `username`
- Unique index on `email`
- Unique index on `telegram_username` (where not null)
- Foreign key index on `department_role_id`

**Notes:**
- In V3, user roles are no longer stored as an ENUM but are managed through the `department_role_id` foreign key
- Each user is assigned to a specific "position" which is a combination of department and role
- Citizens are assigned to the 'Organization' department with 'Citizen' role
- **V4.1**: External maintainers are now regular users with the 'External Maintainer' role in the 'External Service Providers' department
- **V4.2**: Email verification system added. New users must verify their email within 30 minutes using a 6-digit code. Users cannot use the system until `is_verified` is true. Pre-existing users (admin, external maintainers) are automatically verified
- **V4.3**: Added `company_id` foreign key to link external maintainers to their companies. The `companies` table now stores company data separately from user accounts

---

### 3. `reports`
Central table containing all citizen-submitted reports.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique report identifier |
| `reporter_id` | `INT` | **FOREIGN KEY** → `users(id)`, NOT NULL | ID of the citizen who created the report |
| `title` | `TEXT` | NOT NULL | Report title/summary |
| `description` | `TEXT` | NOT NULL | Detailed description of the issue |
| `category` | `report_category` | NOT NULL | Issue category (see ENUM) |
| `location` | `GEOGRAPHY(Point, 4326)` | NOT NULL | GPS coordinates (longitude/latitude) of the issue |
| `address` | `VARCHAR(500)` | NULLABLE | Human-readable address of the report location |
| `is_anonymous` | `BOOLEAN` | NOT NULL, DEFAULT false | Flag to hide reporter's name from public view |
| `status` | `report_status` | NOT NULL, DEFAULT 'Pending Approval' | Current report status (see ENUM) |
| `rejection_reason` | `TEXT` | NULLABLE | Required text if `status` is 'Rejected' |
| `assignee_id` | `INT` | **FOREIGN KEY** → `users(id)`, NULLABLE | ID of internal technical staff member assigned to manage the case |
| `external_assignee_id` | `INT` | **FOREIGN KEY** → `users(id)`, NULLABLE | ID of external maintainer assigned to perform the intervention (if delegated externally) |
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
- Foreign key index on `external_assignee_id`
- Spatial index on `location` (automatically created by PostGIS)

**Notes:**
- The `assignee_id` field references the internal technical staff member responsible for managing the report
- The `external_assignee_id` field references an external maintainer (user with 'External Maintainer' role) if the intervention is delegated externally
- Both fields can coexist: internal staff can delegate to external maintainer while maintaining responsibility
- When `external_assignee_id` is set, the report status should typically be 'In Progress' (the external assignment is tracked via the field, not the status)

---

### 4. `photos`
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

### 5. `comments`
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

### 6. `notifications`
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

### 7. `messages`
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

### 8. `departments`
Stores municipality departments that handle different types of reports.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique department identifier |
| `name` | `VARCHAR(100)` | NOT NULL, UNIQUE | Department name (e.g., "Water and Sewer Services Department", "Public Infrastructure and Accessibility Department") |

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
- `External Service Providers` (for external maintainer companies)

---

### 9. `roles`
Stores permission levels and job roles that can be assigned to users across departments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique role identifier |
| `name` | `VARCHAR(100)` | NOT NULL, UNIQUE | Role name (e.g., "Department Director", "Water Network staff member", "Civil Engineer") |
| `description` | `TEXT` | NULLABLE | Role description |

**Indexes:**
- Primary key on `id`
- Unique index on `name`

**System roles:**
- `Citizen` - Standard citizen user
- `Administrator` - System Administrator with full access
- `Municipal Public Relations Officer` - Reviews and approves/rejects citizen reports

**Department-specific roles:**
- `Department Director` - Director of a department (applicable to all technical departments)
- `Water Network staff member` - Manages water network maintenance
- `Sewer System staff member` - Manages sewer system maintenance
- `Road Maintenance staff member` - Maintains road infrastructure
- `Accessibility staff member` - Ensures accessibility compliance
- `Electrical staff member` - Manages electrical systems
- `Recycling Program staff member` - Coordinates recycling programs
- `Traffic management staff member` - Manages traffic systems
- `Parks Maintenance staff member` - Maintains parks and green areas
- `Customer Service staff member` - Provides customer service
- `Building Maintenance staff member` - Maintains building facilities
- `Support Officer` - Provides general support services
- `External Maintainer` - External company contractor specialized in specific report categories

---

### 10. `department_roles`
Defines valid "positions" by linking departments to roles. This table represents which role types are applicable within each department (e.g., a "Water Network staff member" role exists within the "Water and Sewer Services Department").

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique position identifier |
| `department_id` | `INT` | **FOREIGN KEY** → `departments(id)` ON DELETE CASCADE, NOT NULL | Department |
| `role_id` | `INT` | **FOREIGN KEY** → `roles(id)` ON DELETE CASCADE, NOT NULL | Role within the department |

**Constraints:**
- **UNIQUE** constraint `uq_department_role` on `(department_id, role_id)` to prevent duplicate department-role combinations

**Indexes:**
- Primary key on `id`
- Foreign key index on `department_id`
- Foreign key index on `role_id`
- Unique index on `(department_id, role_id)`

**Notes:**
- This is NOT a user assignment table; it defines valid position types
- Users are assigned to positions via the `users.department_role_id` foreign key
- The Admin UI can use this table to show only valid roles when filtering by department

---

### 11. `category_role_mapping`
**NEW in V4:** Maps report categories to specific technical roles for automatic assignment.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique mapping identifier |
| `category` | `report_category` | NOT NULL, UNIQUE | Report category (from ENUM) |
| `role_id` | `INT` | **FOREIGN KEY** → `roles(id)`, NOT NULL | Technical role responsible for this category |
| `created_at` | `TIMESTAMPTZ` | DEFAULT CURRENT_TIMESTAMP | Mapping creation date |

**Indexes:**
- Primary key on `id`
- Unique index on `category`
- Foreign key index on `role_id`

---

### 12. `company_categories`
**NEW in V4.3:** Maps external maintainer companies to the report categories they can handle. This is a future enhancement table (not yet implemented in current init.sql).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique mapping identifier |
| `company_id` | `INT` | **FOREIGN KEY** → `companies(id)` ON DELETE CASCADE, NOT NULL | Company ID |
| `category` | `report_category` | NOT NULL | Report category the company can handle |
| `created_at` | `TIMESTAMPTZ` | DEFAULT CURRENT_TIMESTAMP | Mapping creation date |

**Constraints:**
- **UNIQUE** constraint `uq_company_category` on `(company_id, category)` to prevent duplicate mappings

**Indexes:**
- Primary key on `id`
- Index on `company_id`
- Index on `category`
- Unique index on `(company_id, category)`

**Notes:**
- **PLANNED FEATURE**: This table will enable filtering external maintainers by category
- Currently, each company has one category in the `companies` table
- Future implementation will allow companies to be associated with multiple categories
- Will be used by the `/api/users/external-maintainers?categoryId=X` endpoint to return only qualified external maintainers

---

## Entity Relationships

```
companies (1) ──────────< (N) users [company_id] (for External Maintainers)
companies (1) ──────────< (N) company_categories [company_id] (future)

users (1) ──────────────< (N) reports [reporter_id]
users (1) ──────────────< (N) reports [assignee_id] (internal staff)
users (1) ──────────────< (N) reports [external_assignee_id] (external maintainers)
users (1) ──────────────< (N) comments [author_id]
users (1) ──────────────< (N) notifications [user_id]
users (1) ──────────────< (N) messages [sender_id]

reports (1) ────────────< (N) photos
reports (1) ────────────< (N) comments
reports (1) ────────────< (N) notifications
reports (1) ────────────< (N) messages

departments (1) ────────────< (N) department_roles [department_id]

roles (1) ──────────────< (N) department_roles [role_id]
roles (1) ──────────────< (N) category_role_mapping [role_id]

department_roles (1) ───< (N) users [department_role_id]
```

**Key Relationship:**
- Each user has ONE `department_role_id` that references a specific position in `department_roles`
- Each position in `department_roles` defines a valid combination of department and role
- Multiple users can share the same position (e.g., multiple "Water Network staff members" in the same department)

---

## Default Data

The initialization script populates the following default data:

### Departments (9 total)
1. **Organization** - For system-level roles (Admin, Citizen)
2. **Water and Sewer Services Department**
3. **Public Infrastructure and Accessibility Department**
4. **Public Lighting Department**
5. **Waste Management Department**
6. **Mobility and Traffic Management Department**
7. **Parks, Green Areas and Recreation Department**
8. **General Services Department**
9. **External Service Providers** - For external maintainer companies




**Pre-populated Position Combinations (22 total):**

**Organization Department:**
- Citizen
- Administrator
- Municipal Public Relations Officer

**Water and Sewer Services Department:**
- Department Director
- Water Network staff member
- Sewer System staff member

**Public Infrastructure and Accessibility Department:**
- Department Director
- Road Maintenance staff member
- Accessibility staff member

**Public Lighting Department:**
- Department Director
- Electrical staff member

**Waste Management Department:**
- Department Director
- Recycling Program staff member

**Mobility and Traffic Management Department:**
- Department Director
- Traffic management staff member

**Parks, Green Areas and Recreation Department:**
- Department Director
- Parks Maintenance staff member

**General Services Department:**
- Department Director
- Customer Service staff member
- Building Maintenance staff member
- Support Officer

---


### Default Administrator User
- **Username:** `admin`
- **Password:** `admin`
- **Email:** `admin@participium.local`
- **Position:** Organization / Administrator
- **Name:** System Administrator

### Default Companies (V4.3)
Pre-populated external maintenance companies:

1. **Enel X** - Specializes in `Public Lighting`
2. **Acea** - Specializes in `Water Supply - Drinking Water`
3. **Hera** - Specializes in `Waste`
4. **ATM** - Specializes in `Road Signs and Traffic Lights`

### Default External Maintainer Users (V4.3)
Pre-populated external maintainer users in the 'External Service Providers' department, each linked to their respective company:

1. **Enel X Support Team** (Company: Enel X)
   - Username: `enelx` | Password: `maintainer123`
   - Email: `interventions@enelx.com`
   - Category: `Public Lighting`

2. **Acea Water Services** (Company: Acea)
   - Username: `acea` | Password: `maintainer123`
   - Email: `water@acea.it`
   - Category: `Water Supply - Drinking Water`

3. **Hera Waste Management** (Company: Hera)
   - Username: `hera` | Password: `maintainer123`
   - Email: `waste@hera.it`
   - Category: `Waste`

4. **ATM Traffic Management** (Company: ATM)
   - Username: `atm` | Password: `maintainer123`
   - Email: `traffic@atm.it`
   - Category: `Road Signs and Traffic Lights`

**Note:** All external maintainer passwords should be changed in production!

---

## Automatic Assignment Workflow

**NEW in V4:** The system supports automatic assignment of approved reports:

1. **Citizen submits report** → Status: "Pending Approval"
2. **Municipal Public Relations Officer reviews** → Can optionally modify category
3. **Officer approves report** → System uses `category_role_mapping` to find responsible department
4. **System assigns to technical staff** → Finds available staff member in that department
5. **Status changes to "Assigned"** → Technical staff receives the task

**V4.2 Enhancement - External Maintainer Assignment:**
- Technical office staff can manually assign reports to external maintainers
- External maintainers are users with the 'External Maintainer' role
- External maintainers can log in, view assigned reports, update status, and add internal comments

**V4.3 Enhancement - Company Management:**
- External maintainers are linked to companies via `users.company_id` foreign key
- Each company specializes in one category (stored in `companies.category`)
- The `companies` table stores company information separately from user accounts
- Future implementation will add `company_categories` table for many-to-many category mapping
- The `/api/users/external-maintainers?categoryId=X` endpoint will filter external maintainers by their company's category

## Database Initialization

The database is initialized using the [`init.sql`](server/src/database/init.sql ) script.

The [`docker-compose.yml`](server/docker-compose.yml ) file automatically runs [`init.sql`](server/src/database/init.sql ) when the database container is first created:

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11 | Initial schema design |
| 1.1 | 2025-11-08 | Updated user roles - expanded from 4 to 10 roles with specific municipal responsibilities |
| 2.0 | 2025-01-12 | Added geolocation support with PostGIS for citizen reports |
| 3.0 | 2025-11-17 | **Major refactoring:** Replaced ENUM-based roles with relational role system. Added `departments`, `roles`, and `department_roles` tables. Changed `users.role` to `users.department_role_id` for flexible role-department assignments. Pre-populated 8 departments and 24+ roles covering various municipal services. |
| 4.0 | 2025-11-22 | **Added automatic assignment:** Added `category_role_mapping` table to map report categories to departments. Reduced role count from 24 to 15 (consolidated similar roles). |
| 4.1 | 2025-12-02 | **Integrated external maintainers as users (PT24, PT25, PT26):** Removed separate `external_maintainers` table. External maintainers are now regular users with 'External Maintainer' role. Added `company_name` field to `users` table. Removed `external_maintainer_id` and `single_assignment` constraint from `reports` table. External maintainers can now authenticate, update report status, and exchange internal comments with technical staff. |
| 4.2 | 2025-12-02 | **Added email verification system (PT27) and dual assignment tracking:** Added `is_verified`, `verification_code`, and `verification_code_expires_at` fields to `users` table. New citizens must verify their email with a 6-digit code valid for 30 minutes before accessing the system. Pre-existing users are automatically marked as verified. Added `external_assignee_id` to `reports` table to maintain both internal staff assignee and external maintainer references, preserving the full chain of responsibility. |
| 4.3 | 2025-12-05 | **Separated company entities from user accounts:** Created `companies` table to store external maintenance company information separately. Replaced `users.company_name` VARCHAR field with `users.company_id` foreign key. Each company specializes in one report category. Pre-populated 4 companies (Enel X, Acea, Hera, ATM). External maintainer users now reference companies via foreign key. Documented planned `company_categories` table for future many-to-many category mapping. |


