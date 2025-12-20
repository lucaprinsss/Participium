# Participium - Default Users

This document lists all pre-populated users in the database (from `seed.sql` v5.0).

> **SECURITY WARNING**: These are default credentials for development/testing purposes only.

---

## Quick Reference

| Username     | Password   | Role(s)                            | Department/Company |
| ------------ | ---------- | ---------------------------------- | ------------------ |
| `admin`      | `admin`    | Administrator                      | Organization       |
| `officer`    | `officer`  | Municipal Public Relations Officer | Organization       |
| `multirole`  | `password` | Water Network + Electrical         | Multi-Department   |
| `director_*` | `director` | Department Director                | Various            |
| `staff_*`    | `staff`    | Technical Staff                    | Various            |
| `enelx`      | `password` | External Maintainer                | Enel X             |
| `acea`       | `password` | External Maintainer                | Acea               |
| `hera`       | `password` | External Maintainer                | Hera               |
| `atm`        | `password` | External Maintainer                | ATM                |
| `user`       | `password` | Citizen                            | Organization       |
| `user2`      | `password` | Citizen                            | Organization       |

---

## System Administrator

| Field      | Value                   |
| ---------- | ----------------------- |
| Username   | `admin`                 |
| Password   | `admin`                 |
| Email      | admin@participium.local |
| Role       | Administrator           |
| Department | Organization            |

---

## Multi-Role User (PT10 Demo)

This user demonstrates the new multi-role functionality.

| Field       | Value                                               |
| ----------- | --------------------------------------------------- |
| Username    | `multirole`                                         |
| Password    | `password`                                          |
| Email       | multirole@participium.local                         |
| Roles       | Water Network staff member, Electrical staff member |
| Departments | Water and Sewer Services, Public Lighting           |

---

## Municipal Public Relations Officer

| Field      | Value                              |
| ---------- | ---------------------------------- |
| Username   | `officer`                          |
| Password   | `officer`                          |
| Email      | officer@participium.local          |
| Role       | Municipal Public Relations Officer |
| Department | Organization                       |

---

## Department Directors

**Default Password**: `director`

| Username            | Email                               | Department                              |
| ------------------- | ----------------------------------- | --------------------------------------- |
| `director_water`    | director.water@participium.local    | Water and Sewer Services                |
| `director_infra`    | director.infra@participium.local    | Public Infrastructure and Accessibility |
| `director_lighting` | director.lighting@participium.local | Public Lighting                         |
| `director_waste`    | director.waste@participium.local    | Waste Management                        |
| `director_traffic`  | director.traffic@participium.local  | Mobility and Traffic Management         |
| `director_parks`    | director.parks@participium.local    | Parks, Green Areas and Recreation       |
| `director_services` | director.services@participium.local | General Services                        |

---

## Technical Staff Members

**Default Password**: `staff`

| Username         | Email                            | Role                            | Category                      |
| ---------------- | -------------------------------- | ------------------------------- | ----------------------------- |
| `staff_water`    | staff.water@participium.local    | Water Network staff member      | Water Supply                  |
| `staff_sewer`    | staff.sewer@participium.local    | Sewer System staff member       | Sewer System                  |
| `staff_access`   | staff.access@participium.local   | Accessibility staff member      | Architectural Barriers        |
| `staff_road`     | staff.road@participium.local     | Road Maintenance staff member   | Roads and Urban Furnishings   |
| `staff_lighting` | staff.lighting@participium.local | Electrical staff member         | Public Lighting               |
| `staff_waste`    | staff.waste@participium.local    | Recycling Program staff member  | Waste                         |
| `staff_traffic`  | staff.traffic@participium.local  | Traffic management staff member | Road Signs and Traffic Lights |
| `staff_parks`    | staff.parks@participium.local    | Parks Maintenance staff member  | Public Green Areas            |
| `staff_support`  | staff.support@participium.local  | Support Officer                 | Other                         |

---

## External Maintainers

**Default Password**: `password`

| Username | Email                   | Company | Specialization                |
| -------- | ----------------------- | ------- | ----------------------------- |
| `enelx`  | interventions@enelx.com | Enel X  | Public Lighting               |
| `acea`   | water@acea.it           | Acea    | Water Supply                  |
| `hera`   | waste@hera.it           | Hera    | Waste                         |
| `atm`    | traffic@atm.it          | ATM     | Road Signs and Traffic Lights |

---

## Test Citizens

**Default Password**: `password`

| Username | Email          |
| -------- | -------------- |
| `user`   | user@test.com  |
| `user2`  | user2@test.com |

---

## User Count Summary

| Category             | Count  |
| -------------------- | ------ |
| System Administrator | 1      |
| Multi-Role User      | 1      |
| Municipal Officer    | 1      |
| Department Directors | 7      |
| Technical Staff      | 9      |
| External Maintainers | 4      |
| Test Citizens        | 2      |
| **Total**            | **25** |

---

**Database Version**: v5.0 (Multi-Role Support)
