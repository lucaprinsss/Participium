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
exports.userEntity = void 0;
const typeorm_1 = require("typeorm");
const departmentRoleEntity_1 = require("./departmentRoleEntity");
let userEntity = class userEntity {
    id;
    username;
    firstName;
    lastName;
    passwordHash;
    departmentRoleId;
    departmentRole;
    email;
    personalPhotoUrl;
    telegramUsername;
    emailNotificationsEnabled;
    createdAt;
};
exports.userEntity = userEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], userEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, unique: true }),
    __metadata("design:type", String)
], userEntity.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], userEntity.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], userEntity.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, select: false }),
    __metadata("design:type", String)
], userEntity.prototype, "passwordHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "department_role_id" }),
    __metadata("design:type", Number)
], userEntity.prototype, "departmentRoleId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => departmentRoleEntity_1.DepartmentRoleEntity, (departmentRole) => departmentRole.users, {
        eager: true
    }),
    (0, typeorm_1.JoinColumn)({ name: "department_role_id" }),
    __metadata("design:type", departmentRoleEntity_1.DepartmentRoleEntity)
], userEntity.prototype, "departmentRole", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, unique: true }),
    __metadata("design:type", String)
], userEntity.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], userEntity.prototype, "personalPhotoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, unique: true, nullable: true }),
    __metadata("design:type", String)
], userEntity.prototype, "telegramUsername", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], userEntity.prototype, "emailNotificationsEnabled", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], userEntity.prototype, "createdAt", void 0);
exports.userEntity = userEntity = __decorate([
    (0, typeorm_1.Entity)("users")
], userEntity);
