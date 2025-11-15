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
exports.reportEntity = void 0;
const typeorm_1 = require("typeorm");
const userEntity_1 = require("./userEntity");
let reportEntity = class reportEntity {
    id;
    reporterId;
    reporter;
    title;
    description;
    category;
    location;
    isAnonymous;
    status;
    rejectionReason;
    assigneeId;
    assignee;
    createdAt;
    updatedAt;
};
exports.reportEntity = reportEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], reportEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], reportEntity.prototype, "reporterId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => userEntity_1.userEntity),
    (0, typeorm_1.JoinColumn)({ name: "reporter_id" }),
    __metadata("design:type", userEntity_1.userEntity)
], reportEntity.prototype, "reporter", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], reportEntity.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], reportEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: [
            "Water Supply - Drinking Water",
            "Architectural Barriers",
            "Sewer System",
            "Public Lighting",
            "Waste",
            "Road Signs and Traffic Lights",
            "Roads and Urban Furnishings",
            "Public Green Areas and Playgrounds",
            "Other"
        ]
    }),
    __metadata("design:type", String)
], reportEntity.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "geography", spatialFeatureType: "Point", srid: 4326 }),
    __metadata("design:type", String)
], reportEntity.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], reportEntity.prototype, "isAnonymous", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ["Pending Approval", "Assigned", "In Progress", "Suspended", "Rejected", "Resolved"],
        default: "Pending Approval"
    }),
    __metadata("design:type", String)
], reportEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], reportEntity.prototype, "rejectionReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], reportEntity.prototype, "assigneeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => userEntity_1.userEntity, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "assignee_id" }),
    __metadata("design:type", userEntity_1.userEntity)
], reportEntity.prototype, "assignee", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], reportEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], reportEntity.prototype, "updatedAt", void 0);
exports.reportEntity = reportEntity = __decorate([
    (0, typeorm_1.Entity)("reports")
], reportEntity);
