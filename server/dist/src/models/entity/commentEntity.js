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
exports.commentEntity = void 0;
const typeorm_1 = require("typeorm");
const reportEntity_1 = require("./reportEntity");
const userEntity_1 = require("./userEntity");
let commentEntity = class commentEntity {
    id;
    reportId;
    report;
    authorId;
    author;
    content;
    createdAt;
};
exports.commentEntity = commentEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], commentEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], commentEntity.prototype, "reportId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => reportEntity_1.reportEntity, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "report_id" }),
    __metadata("design:type", reportEntity_1.reportEntity)
], commentEntity.prototype, "report", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], commentEntity.prototype, "authorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => userEntity_1.userEntity),
    (0, typeorm_1.JoinColumn)({ name: "author_id" }),
    __metadata("design:type", userEntity_1.userEntity)
], commentEntity.prototype, "author", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], commentEntity.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], commentEntity.prototype, "createdAt", void 0);
exports.commentEntity = commentEntity = __decorate([
    (0, typeorm_1.Entity)("comments")
], commentEntity);
