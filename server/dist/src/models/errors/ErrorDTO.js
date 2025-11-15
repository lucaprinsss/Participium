"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.instanceOfErrorDTO = instanceOfErrorDTO;
exports.ErrorDTOFromJSON = ErrorDTOFromJSON;
exports.ErrorDTOFromJSONTyped = ErrorDTOFromJSONTyped;
exports.ErrorDTOToJSON = ErrorDTOToJSON;
exports.ErrorDTOToJSONTyped = ErrorDTOToJSONTyped;
/**
 * Check if a given object implements the ErrorDTO interface.
 */
function instanceOfErrorDTO(value) {
    if (!("code" in value) || value["code"] === undefined)
        return false;
    return true;
}
function ErrorDTOFromJSON(json) {
    return ErrorDTOFromJSONTyped(json, false);
}
function ErrorDTOFromJSONTyped(json, ignoreDiscriminator) {
    if (json == null) {
        return json;
    }
    return {
        code: json["code"],
        name: json["name"] == null ? undefined : json["name"],
        message: json["message"] == null ? undefined : json["message"]
    };
}
function ErrorDTOToJSON(json) {
    return ErrorDTOToJSONTyped(json, false);
}
function ErrorDTOToJSONTyped(value, ignoreDiscriminator = false) {
    if (value == null) {
        return value;
    }
    return {
        code: value["code"],
        name: value["name"],
        message: value["message"]
    };
}
