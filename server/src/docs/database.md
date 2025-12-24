# Participium - Database Structure (v5.0)

This document describes the database schema (Version 5.0) designed for the **Participium** application.

* **Database System:** PostgreSQL (v15+)
* **Required Extensions:** `postgis` (for geolocation data)

---

## Overview

Participium is a citizen reporting system that allows users to submit reports about urban issues (potholes, broken street lights, etc.). The database is designed to support:

- **User Management** (citizens, staff, administrators) with **multiple roles per user**
- **Report Lifecycle** (submission, approval, assignment, resolution)
- **Media Attachments** (photos)
- **Communication** (comments, messages, notifications, Telegram integration)
- **Geolocation** (using PostGIS for spatial data)
- **Automatic Assignment Workflow**

---

## Custom Data Types (ENUMs)

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

---

## Tables

### 1. `departments`
Stores municipality departments that handle different types of reports.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique department identifier |
| `name` | `VARCHAR(100)` | NOT NULL, UNIQUE | Department name |

**Pre-populated Departments (9 total):**
1. Organization (for system roles like Citizen and Administrator)
2. Water and Sewer Services Department
3. Public Infrastructure and Accessibility Department
4. Public Lighting Department
5. Waste Management Department
6. Mobility and Traffic Management Department
7. Parks, Green Areas and Recreation Department
8. General Services Department
9. External Service Providers

---

### 2. `roles`
Stores permission levels and job roles that can be assigned to users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique role identifier |
| `name` | `VARCHAR(100)` | NOT NULL, UNIQUE | Role name |
| `description` | `TEXT` | NULLABLE | Role description |

**System Roles:**
- Citizen, Administrator, Municipal Public Relations Officer

**Technical Roles:**
- Department Director, Water Network staff member, Sewer System staff member, Road Maintenance staff member, Accessibility staff member, Electrical staff member, Recycling Program staff member, Traffic management staff member, Parks Maintenance staff member, Customer Service staff member, Building Maintenance staff member, Support Officer, External Maintainer

---

### 3. `department_roles`
Defines valid "positions" by linking departments to roles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique position identifier |
| `department_id` | `INT` | **FOREIGN KEY** -> `departments(id)` ON DELETE CASCADE | Department |
| `role_id` | `INT` | **FOREIGN KEY** -> `roles(id)` ON DELETE CASCADE | Role within the department |

**Constraints:**
- UNIQUE on `(department_id, role_id)` to prevent duplicate combinations

---

### 4. `companies`
Stores external maintenance companies.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique company identifier |
| `name` | `VARCHAR(255)` | NOT NULL, UNIQUE | Company name |
| `category` | `report_category` | NOT NULL | Report category the company specializes in |
| `created_at` | `TIMESTAMPTZ` | DEFAULT CURRENT_TIMESTAMP | Registration date |

**Pre-populated Companies:**
- Enel X (Public Lighting), Acea (Water Supply), Hera (Waste), ATM (Road Signs)

---

### 5. `users`
Stores information for all system actors.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique user identifier |
| `username` | `VARCHAR(50)` | NOT NULL, UNIQUE | Username for login |
| `first_name` | `VARCHAR(100)` | NOT NULL | User's first name |
| `last_name` | `VARCHAR(100)` | NOT NULL | User's last name |
| `password_hash` | `VARCHAR(255)` | NOT NULL | Hashed password |
| `email` | `VARCHAR(255)` | NOT NULL, UNIQUE | Email address |
| `personal_photo_url` | `TEXT` | NULLABLE | URL to user's profile photo |
| `telegram_username` | `VARCHAR(100)` | NULLABLE, UNIQUE | Telegram username for bot integration |
| `telegram_link_code` | `VARCHAR(6)` | NULLABLE | 6-digit code for linking Telegram account |
| `telegram_link_code_expires_at` | `TIMESTAMPTZ` | NULLABLE | Expiration timestamp for the Telegram link code |
| `email_notifications_enabled` | `BOOLEAN` | NOT NULL, DEFAULT true | Flag to enable/disable email notifications |
| `company_id` | `INT` | **FOREIGN KEY** → `companies(id)`, NULLABLE | Reference to external company (only for External Maintainer role) |
| `is_verified` | `BOOLEAN` | NOT NULL, DEFAULT false | Indicates if the user's email has been verified |
| `verification_code` | `VARCHAR(6)` | NULLABLE | 6-digit verification code sent via email (null after verification) |
| `verification_code_expires_at` | `TIMESTAMPTZ` | NULLABLE | Expiration timestamp for the verification code (30 minutes from generation) |
| `created_at` | `TIMESTAMPTZ` | DEFAULT CURRENT_TIMESTAMP | Registration date |

**Note:** User roles are now managed through the `user_roles` table (many-to-many relationship).


**Indexes:**
- Primary key on `id`
- Unique index on `username`
- Unique index on `email`
- Unique index on `telegram_username` (where not null)
- Index on `telegram_link_code` (where not null)
- Foreign key index on `department_role_id`

**Notes:**
- In V3, user roles are no longer stored as an ENUM but are managed through the `department_role_id` foreign key
- Each user is assigned to a specific "position" which is a combination of department and role
- Citizens are assigned to the 'Organization' department with 'Citizen' role
- **V4.1**: External maintainers are now regular users with the 'External Maintainer' role in the 'External Service Providers' department
- **V4.2**: Email verification system added. New users must verify their email within 30 minutes using a 6-digit code. Users cannot use the system until `is_verified` is true. Pre-existing users (admin, external maintainers) are automatically verified
- **V4.3**: Added `company_id` foreign key to link external maintainers to their companies. The `companies` table now stores company data separately from user accounts
- **V4.4**: Added Telegram integration fields. Users can link their Telegram account using a temporary 6-digit code that expires after 10 minutes. The `telegram_username` is used for bot notifications, while `telegram_link_code` facilitates the linking process.

---

### 6. `user_roles` (NEW in V5.0)
Join table for many-to-many relationship between users and department_roles.
Enables a single user to have multiple roles (PT10).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique assignment identifier |
| `user_id` | `INT` | **FOREIGN KEY** -> `users(id)` ON DELETE CASCADE | User ID |
| `department_role_id` | `INT` | **FOREIGN KEY** -> `department_roles(id)` ON DELETE CASCADE | Position ID |
| `created_at` | `TIMESTAMPTZ` | DEFAULT CURRENT_TIMESTAMP | Assignment date |

**Constraints:**
- UNIQUE on `(user_id, department_role_id)` - a user cannot have the same role twice

**Indexes:**
- `idx_user_roles_user_id` on `user_id`
- `idx_user_roles_department_role_id` on `department_role_id`

---

### 7. `reports`
Central table containing all citizen-submitted reports.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique report identifier |
| `reporter_id` | `INT` | **FOREIGN KEY** -> `users(id)`, NOT NULL | Reporter ID |
| `title` | `TEXT` | NOT NULL | Report title |
| `description` | `TEXT` | NOT NULL | Issue description |
| `category` | `report_category` | NOT NULL | Issue category |
| `location` | `GEOGRAPHY(Point, 4326)` | NOT NULL | GPS coordinates |
| `address` | `VARCHAR(500)` | NULLABLE | Human-readable address |
| `is_anonymous` | `BOOLEAN` | NOT NULL, DEFAULT false | Hide reporter identity |
| `status` | `report_status` | NOT NULL, DEFAULT 'Pending Approval' | Current status |
| `rejection_reason` | `TEXT` | NULLABLE | Required if status is 'Rejected' |
| `assignee_id` | `INT` | **FOREIGN KEY** -> `users(id)`, NULLABLE | Internal staff assignee |
| `external_assignee_id` | `INT` | **FOREIGN KEY** -> `users(id)`, NULLABLE | External maintainer assignee |
| `created_at` | `TIMESTAMPTZ` | DEFAULT CURRENT_TIMESTAMP | Submission date |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT CURRENT_TIMESTAMP | Last update date |

---

### 8. `photos`
Stores photos attached to reports (1-3 per report).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique photo identifier |
| `report_id` | `INT` | **FOREIGN KEY** -> `reports(id)` ON DELETE CASCADE | Report ID |
| `storage_url` | `TEXT` | NOT NULL | Image URL |
| `created_at` | `TIMESTAMPTZ` | DEFAULT CURRENT_TIMESTAMP | Upload date |

---

### 9. `comments`
Internal comments from staff operators.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique comment identifier |
| `report_id` | `INT` | **FOREIGN KEY** -> `reports(id)` ON DELETE CASCADE | Report ID |
| `author_id` | `INT` | **FOREIGN KEY** -> `users(id)` | Staff member ID |
| `content` | `TEXT` | NOT NULL | Comment text |
| `created_at` | `TIMESTAMPTZ` | DEFAULT CURRENT_TIMESTAMP | Creation date |

---

### 10. `notifications`
In-app notifications for citizens.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique notification identifier |
| `user_id` | `INT` | **FOREIGN KEY** -> `users(id)` ON DELETE CASCADE | Recipient ID |
| `report_id` | `INT` | **FOREIGN KEY** -> `reports(id)` ON DELETE CASCADE, NULLABLE | Related report |
| `content` | `TEXT` | NOT NULL | Notification text |
| `is_read` | `BOOLEAN` | NOT NULL, DEFAULT false | Read status |
| `created_at` | `TIMESTAMPTZ` | DEFAULT CURRENT_TIMESTAMP | Creation date |

---

### 11. `messages`
Bidirectional messaging between citizens and operators.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique message identifier |
| `report_id` | `INT` | **FOREIGN KEY** -> `reports(id)` ON DELETE CASCADE | Report (chat room) |
| `sender_id` | `INT` | **FOREIGN KEY** -> `users(id)` | Sender ID |
| `content` | `TEXT` | NOT NULL | Message text |
| `created_at` | `TIMESTAMPTZ` | DEFAULT CURRENT_TIMESTAMP | Send date |

---

### 12. `category_role_mapping`
Maps report categories to technical roles for automatic assignment.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `SERIAL` | **PRIMARY KEY** | Unique mapping identifier |
| `category` | `report_category` | NOT NULL, UNIQUE | Report category |
| `role_id` | `INT` | **FOREIGN KEY** -> `roles(id)` | Responsible role |
| `created_at` | `TIMESTAMPTZ` | DEFAULT CURRENT_TIMESTAMP | Creation date |

---

## Entity Relationships

```
departments (1) ────────< (N) department_roles [department_id]
roles (1) ──────────────< (N) department_roles [role_id]

department_roles (1) ───< (N) user_roles [department_role_id]
users (1) ──────────────< (N) user_roles [user_id]

companies (1) ──────────< (N) users [company_id]

users (1) ──────────────< (N) reports [reporter_id]
users (1) ──────────────< (N) reports [assignee_id]
users (1) ──────────────< (N) reports [external_assignee_id]

reports (1) ────────────< (N) photos
reports (1) ────────────< (N) comments
reports (1) ────────────< (N) notifications
reports (1) ────────────< (N) messages
```

**Key Relationship (V5.0):**
- Each user can have MULTIPLE positions via `user_roles` table
- Each position in `department_roles` defines a valid department + role combination
- This enables flexible staff assignment (e.g., a user can be both Water Network staff member AND Electrical staff member)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11 | Initial schema design |
| 2.0 | 2025-11-12 | Added geolocation support with PostGIS |
| 3.0 | 2025-11-17 | Replaced ENUM-based roles with relational system |
| 4.0 | 2025-11-22 | Added `category_role_mapping` for automatic assignment |
| 4.1 | 2025-12-02 | Integrated external maintainers as users |
| 4.2 | 2025-12-02 | Added email verification system |
| 4.3 | 2025-12-05 | Separated company entities from user accounts |
| 4.4 | 2025-12-22 | **Added Telegram integration:** Added `telegram_link_code` and `telegram_link_code_expires_at` fields to `users` table. Users can link their Telegram accounts using a temporary 6-digit code that expires after 10 minutes. Added corresponding indexes for efficient querying. |
| 5.0 | 2025-12-24 | **Multi-role support (PT10):** Added `user_roles` table for many-to-many user-role relationship. Removed `department_role_id` from `users` table. Users can now have multiple roles simultaneously. |
