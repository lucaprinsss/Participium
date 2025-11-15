"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentRoleEntity = void 0;
const typeorm_1 = require("typeorm");
const departmentEntity_1 = require("./departmentEntity");
const roleEntity_1 = require("./roleEntity");
const userEntity_1 = require("./userEntity");
/**
 * DepartmentRole entity - represents the join table between departments and roles
 * Defines valid "positions" by linking departments to roles
 */
let DepartmentRoleEntity = class DepartmentRoleEntity {
    id;
    departmentId;
    roleId;
    department;
    role;
    users;
};
exports.DepartmentRoleEntity = DepartmentRoleEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], DepartmentRoleEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "department_id" }),
    __metadata("design:type", Number)
], DepartmentRoleEntity.prototype, "departmentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "role_id" }),
    __metadata("design:type", Number)
], DepartmentRoleEntity.prototype, "roleId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => departmentEntity_1.DepartmentEntity, (department) => department.departmentRoles, {
        onDelete: "CASCADE"
    }),
    (0, typeorm_1.JoinColumn)({ name: "department_id" }),
    __metadata("design:type", departmentEntity_1.DepartmentEntity)
], DepartmentRoleEntity.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => roleEntity_1.RoleEntity, (role) => role.departmentRoles, {
        onDelete: "CASCADE"
    }),
    (0, typeorm_1.JoinColumn)({ name: "role_id" }),
    __metadata("design:type", roleEntity_1.RoleEntity)
], DepartmentRoleEntity.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => userEntity_1.userEntity, (user) => user.departmentRole),
    __metadata("design:type", Array)
], DepartmentRoleEntity.prototype, "users", void 0);
exports.DepartmentRoleEntity = DepartmentRoleEntity = __decorate([
    (0, typeorm_1.Entity)("department_roles"),
    (0, typeorm_1.Unique)(["departmentId", "roleId"])
], DepartmentRoleEntity);
