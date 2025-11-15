"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createErrorDTO = createErrorDTO;
exports.mapUserEntityToUserResponse = mapUserEntityToUserResponse;
function createErrorDTO(code, message, name) {
    return removeNullAttributes({
        code,
        name,
        message
    });
}
/**
 * Maps a userEntity to UserResponse DTO
 * Excludes sensitive information like password hash
 */
function mapUserEntityToUserResponse(entity) {
    if (!entity) {
        return null;
    }
    // Extract role name from the department_role relation
    const roleName = entity.departmentRole?.role?.name;
    const departmentName = entity.departmentRole?.department?.name;
    return removeNullAttributes({
        id: entity.id,
        username: entity.username,
        email: entity.email,
        first_name: entity.firstName,
        last_name: entity.lastName,
        department_name: departmentName,
        role_name: roleName
    });
}
function removeNullAttributes(dto) {
    const filtered = Object.entries(dto).filter(([_, value]) => value !== null &&
        value !== undefined &&
        (!Array.isArray(value) || value.length > 0));
    return Object.fromEntries(filtered);
}
