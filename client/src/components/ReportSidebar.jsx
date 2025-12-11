import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import { Dropdown } from "react-bootstrap";
import { FaCalendarAlt, FaUser, FaHardHat, FaBuilding, FaUserPlus, FaChevronDown, FaMapPin, FaMapMarkerAlt, FaMapMarkedAlt } from "react-icons/fa";
import { getAllExternals } from "../api/municipalityUserApi";
import { assignToExternalUser } from "../api/reportApi";

const ReportSidebar = ({
  report,
  currentUserId,
  onReportUpdated,
  showMap,
  setShowMap,
  mapCoordinates,
  isCitizen,
  showToast
}) => {
  const [externalUsers, setExternalUsers] = useState([]);
  const [loadingExternal, setLoadingExternal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // FIX S3776: Usato useCallback per stabilizzare l'handler
  const fetchExternalUsers = useCallback(async () => {
    setLoadingExternal(true);
    try {
      const users = await getAllExternals(report.category);
      setExternalUsers(users || []);
    } catch (err) {
      console.error("Failed to load external users", err);
      showToast("Failed to load external users.", "error");
    } finally {
      setLoadingExternal(false);
    }
  }, [report.category, showToast]);

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
      await fetchExternalUsers();
    }
  };

  const handleAssignToExternal = async (externalUser) => {
    setIsDropdownOpen(false);

    try {
      await assignToExternalUser(report.id, externalUser.id);

      if (onReportUpdated) {
        onReportUpdated(report.id, {
          status: "Assigned",
          externalAssigneeId: externalUser.id,
          externalAssignee: {
            id: externalUser.id,
            first_name: externalUser.first_name,
            last_name: externalUser.last_name,
            username: externalUser.username,
          }
        });
      }

      showToast(`Assigned to ${externalUser.first_name} ${externalUser.last_name} (ID: ${externalUser.id})`, "success");

    } catch (err) {
      console.error("Failed to assign", err);
      showToast("Failed to assign to external user. Report can't be reassigned if it is resolved or already in progress.", "error");
    }
  };

  const formatLocation = () => {
    if (mapCoordinates) return `${mapCoordinates[0].toFixed(5)}, ${mapCoordinates[1].toFixed(5)}`;
    return "N/A";
  };

  const getExternalAssigneeName = () => {
    if (report.externalAssigneeId) {
      return `ID #${report.externalAssigneeId}`;
    }
    return <span className="text-muted">Not assigned</span>;
  };

  const getInternalAssigneeName = () => {
    if (report.assignee) {
      const assigneeId = report.assignee.id || report.assignee;

      if (assigneeId) {
        return `ID #${assigneeId}`;
      }
    }
    return <span className="text-muted">Not assigned</span>;
  }

  // RISOLTO S3358: Estraggo la logica ternaria annidata in una funzione di rendering locale
  const renderDropdownContent = () => {
    if (loadingExternal) {
      return <div className="rdm-loading-state">Loading...</div>;
    }

    if (externalUsers.length > 0) {
      return (
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
      );
    }

    return <div className="rdm-empty-state">No users found.</div>;
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

        {/* Info Updated (Placeholder) */}
        {report.updatedAt && report.updatedAt !== report.createdAt && (
          <div className="rdm-info-row mt-2 pt-2 border-top">
            <div className="rdm-icon-box">
              <FaCalendarAlt />
            </div>
            <div>
              <span className="rdm-label">Last Updated</span>
              <div className="rdm-value">{formatDate(report.updatedAt)}</div>
            </div>
          </div>
        )}
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
            <span className="rdm-label">Technician:</span>
            <div className="rdm-value highlight">
              {getInternalAssigneeName()}
            </div>
          </div>
        </div>
        <div className="rdm-info-row">
          <div className="rdm-icon-box external">
            <FaBuilding />
          </div>
          <div>
            <span className="rdm-label">External:</span>
            <div className="rdm-value highlight">
              {getExternalAssigneeName()}
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
                {/* Utilizzo della funzione estratta per risolvere S3358 */}
                {renderDropdownContent()}
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

        {/* MODIFICA: Mostra il pulsante solo se l'utente NON è un Citizen E le coordinate sono disponibili */}
        {(!isCitizen && mapCoordinates) && ( // FIX S7735
          <button
            className={`rdm-btn-map-toggle ${showMap ? "active" : ""}`}
            onClick={() => setShowMap(!showMap)}
            disabled={!mapCoordinates}
          >
            <FaMapMarkedAlt className="me-2" />
            {showMap ? "Hide Map" : "Show Map"}
          </button>
        )}
      </div>
    </div>
  );
};

// VALIDAZIONE PROPS
ReportSidebar.propTypes = {
  report: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string,
    isAnonymous: PropTypes.bool,
    is_anonymous: PropTypes.bool,
    reporter: PropTypes.shape({
      first_name: PropTypes.string,
      last_name: PropTypes.string,
    }),
    assignee: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.number,
    ]),
    externalAssigneeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    category: PropTypes.string.isRequired,
    address: PropTypes.string,
  }).isRequired,
  currentUserId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onReportUpdated: PropTypes.func.isRequired,
  showMap: PropTypes.bool.isRequired,
  setShowMap: PropTypes.func.isRequired,
  mapCoordinates: PropTypes.arrayOf(PropTypes.number),
  isCitizen: PropTypes.bool.isRequired,
  showToast: PropTypes.func.isRequired,
};

export default ReportSidebar;