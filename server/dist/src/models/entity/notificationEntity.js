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
exports.notificationEntity = void 0;
const typeorm_1 = require("typeorm");
const userEntity_1 = require("./userEntity");
const reportEntity_1 = require("./reportEntity");
let notificationEntity = class notificationEntity {
    id;
    userId;
    user;
    reportId;
    report;
    content;
    isRead;
    createdAt;
};
exports.notificationEntity = notificationEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], notificationEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], notificationEntity.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => userEntity_1.userEntity, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "user_id" }),
    __metadata("design:type", userEntity_1.userEntity)
], notificationEntity.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], notificationEntity.prototype, "reportId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => reportEntity_1.reportEntity, { onDelete: "CASCADE", nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "report_id" }),
    __metadata("design:type", reportEntity_1.reportEntity)
], notificationEntity.prototype, "report", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], notificationEntity.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], notificationEntity.prototype, "isRead", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], notificationEntity.prototype, "createdAt", void 0);
exports.notificationEntity = notificationEntity = __decorate([
    (0, typeorm_1.Entity)("notifications")
], notificationEntity);
