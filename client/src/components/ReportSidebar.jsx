import React, { useState } from "react";
import { Dropdown } from "react-bootstrap";
import { FaCalendarAlt, FaUser, FaHardHat, FaBuilding, FaUserPlus, FaChevronDown, FaMapPin, FaMapMarkerAlt, FaMapMarkedAlt } from "react-icons/fa";
import { getAllExternals } from "../api/municipalityUserApi";
import { assignToExternalUser } from "../api/reportApi";

const ReportSidebar = ({ 
  report, 
  currentUserId, 
  onReportUpdated, 
  onStatusUpdate,
  showMap, 
  setShowMap,
  mapCoordinates,
  showToast // NUOVA PROP RICEVUTA
}) => {
  const [externalUsers, setExternalUsers] = useState([]);
  const [loadingExternal, setLoadingExternal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Helper date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Intl.DateTimeFormat("it-IT", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    }).format(new Date(dateString));
  };

  const getReporterName = () => {
    if (report.isAnonymous || report.is_anonymous) return "Anonymous User";
    if (report.reporter) return `${report.reporter.first_name} ${report.reporter.last_name}`;
    return "Unknown User";
  };

  const isCurrentInternalAssignee =
    currentUserId &&
    report.assignee &&
    ((typeof report.assignee === "object" && Number(report.assignee.id) === Number(currentUserId)) ||
    (typeof report.assignee === "number" && Number(report.assignee) === Number(currentUserId)));

  // External Assignment Logic
  const handleDropdownToggle = async (isOpen) => {
    setIsDropdownOpen(isOpen);
    if (isOpen && externalUsers.length === 0) {
      setLoadingExternal(true);
      try {
        const users = await getAllExternals(report.category);
        setExternalUsers(users || []);
      } catch (err) {
        console.error("Failed to load external users", err);
        showToast("Failed to load external users.", "error"); // Toast per errore
      } finally {
        setLoadingExternal(false);
      }
    }
  };

  const handleAssignToExternal = async (externalUser) => {
    // Prima di assegnare, chiudiamo il dropdown
    setIsDropdownOpen(false); 
    
    try {
      await assignToExternalUser(report.id, externalUser.id);
      
      if (onReportUpdated) {
        onReportUpdated(report.id, {
          status: "Assigned",
          externalAssigneeId: externalUser.id,
        });
      }
      if (onStatusUpdate) await onStatusUpdate();
      
      showToast(`Assigned to ${externalUser.first_name} ${externalUser.last_name} (${externalUser.id})`, "success");

    } catch (err) {
      console.error("Failed to assign", err);
      // SOSTITUZIONE: alert("Failed to assign to external user.");
      showToast("Failed to assign to external user. Report can't be reassigned if it is resolved or already in progress.", "error"); 
    }
  };

  const formatLocation = () => {
    if (mapCoordinates) return `${mapCoordinates[0].toFixed(5)}, ${mapCoordinates[1].toFixed(5)}`;
    return "N/A";
  };

  return (
    <div className="rdm-sidebar">
      {/* Timeline */}
      <div className="rdm-info-card">
        <h4 className="rdm-card-label">Timeline</h4>
        <div className="rdm-info-row">
          <div className="rdm-icon-box">
            <FaCalendarAlt />
          </div>
          <div>
            <span className="rdm-label">Created</span>
            <div className="rdm-value">{formatDate(report.createdAt)}</div>
          </div>
        </div>
      </div>

      {/* Involved Parties */}
      <div className="rdm-info-card">
        <h4 className="rdm-card-label">Involved Parties</h4>
        <div className="rdm-info-row">
          <div className="rdm-icon-box">
            <FaUser />
          </div>
          <div>
            <span className="rdm-label">Reporter</span>
            <div className="rdm-value highlight">{getReporterName()}</div>
          </div>
        </div>
        <div className="rdm-info-row">
          <div className="rdm-icon-box assignee">
            <FaHardHat />
          </div>
          <div>
            <span className="rdm-label">Technician ID:</span>
            <div className="rdm-value highlight">
              {report.assignee ? report.assignee.id : <span className="text-muted">Not assigned</span>}
            </div>
          </div>
        </div>
        <div className="rdm-info-row">
          <div className="rdm-icon-box external">
            <FaBuilding />
          </div>
          <div>
            <span className="rdm-label">External ID:</span>
            <div className="rdm-value highlight">
              {report.externalAssigneeId ? report.externalAssigneeId : <span className="text-muted">Not assigned</span>}
            </div>
          </div>
        </div>

        {/* Dropdown Assignment */}
        {isCurrentInternalAssignee && (
          <div className="mt-3 pt-3 border-top animate-fadeIn">
            <span className="rdm-label mb-2">Delegate Task</span>
            <Dropdown onToggle={handleDropdownToggle} className="rdm-dropdown-container">
              <Dropdown.Toggle
                className={`rdm-btn-external-assign w-100 d-flex justify-content-between align-items-center ${isDropdownOpen ? "active" : ""}`}
                variant="outline-dark"
              >
                <span className="d-flex align-items-center gap-2"><FaUserPlus /> Assign to External</span>
                <FaChevronDown className={`rdm-chevron ${isDropdownOpen ? "rotate" : ""}`} />
              </Dropdown.Toggle>
              <Dropdown.Menu className="rdm-dropdown-menu shadow-lg border-0">
                {loadingExternal ? (
                  <div className="rdm-loading-state">Loading...</div>
                ) : externalUsers.length > 0 ? (
                  <>
                     <div className="rdm-dropdown-header">Select External Maintainer</div>
                     <div className="rdm-dropdown-scroll-area">
                        {externalUsers.map((extUser) => (
                          <Dropdown.Item key={extUser.id} onClick={() => handleAssignToExternal(extUser)} className="rdm-dropdown-item">
                             <div className="d-flex align-items-center w-100">
                                <div className="rdm-avatar-circle me-3 flex-shrink-0">
                                    {extUser.first_name.charAt(0)}{extUser.last_name.charAt(0)}
                                </div>
                                <div className="flex-grow-1 overflow-hidden me-2">
                                    <div className="rdm-user-name text-truncate">{extUser.first_name} {extUser.last_name}</div>
                                    {extUser.company_name && (
                                      <div className="rdm-company-name text-truncate"><FaBuilding className="me-1" size={10} />{extUser.company_name}</div>
                                    )}
                                </div>
                                <div className="rdm-dropdown-id-badge">ID #{extUser.id}</div>
                             </div>
                          </Dropdown.Item>
                        ))}
                     </div>
                  </>
                ) : (
                  <div className="rdm-empty-state">No users found.</div>
                )}
              </Dropdown.Menu>
            </Dropdown>
          </div>
        )}
      </div>

      {/* Location Data */}
      <div className="rdm-info-card">
        <h4 className="rdm-card-label">Location Data</h4>
        <div className="rdm-info-row">
          <div className="rdm-icon-box location"><FaMapPin /></div>
          <div className="flex-grow-1">
            <span className="rdm-label">Address</span>
            <div className="rdm-value address-text">{report.address || <span className="text-muted fst-italic">N/A</span>}</div>
          </div>
        </div>
        <div className="rdm-info-row">
          <div className="rdm-icon-box location"><FaMapMarkerAlt /></div>
          <div>
            <span className="rdm-label">Coordinates</span>
            <div className="rdm-value font-monospace">{formatLocation()}</div>
          </div>
        </div>
        <button
          className={`rdm-btn-map-toggle ${showMap ? "active" : ""}`}
          onClick={() => setShowMap(!showMap)}
          disabled={!mapCoordinates}
        >
          <FaMapMarkedAlt className="me-2" />
          {showMap ? "Hide Map" : "Show Map"}
        </button>
      </div>
    </div>
  );
};

export default ReportSidebar;