"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportStatus = void 0;
/**
 * Possible statuses for a report
 */
var ReportStatus;
(function (ReportStatus) {
    ReportStatus["PENDING_APPROVAL"] = "Pending Approval";
    ReportStatus["ASSIGNED"] = "Assigned";
    ReportStatus["IN_PROGRESS"] = "In Progress";
    ReportStatus["SUSPENDED"] = "Suspended";
    ReportStatus["REJECTED"] = "Rejected";
    ReportStatus["RESOLVED"] = "Resolved";
})(ReportStatus || (exports.ReportStatus = ReportStatus = {}));
