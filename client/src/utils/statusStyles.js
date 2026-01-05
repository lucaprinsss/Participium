export const MARKER_ASSETS = {
  blue: "/marker/marker_blue.png",
  green: "/marker/marker_green.png",
  orange: "/marker/marker_orange.png",
  yellow: "/marker/marker_yellow.png",
  red: "/marker/marker_red.png",
  grey: "/marker/marker_grey.png",
  black: "/marker/marker_black.png",
};

export const STATUS_COLOR_MAP = {
  Assigned: "#1f6feb",
  "In Progress": "#f97316",
  "Pending Approval": "#fbbf24",
  Resolved: "#22c55e",
  Suspended: "#94a3b8",
  Rejected: "#111827",
};

const FALLBACK_STATUS = "Assigned";

export const getStatusColor = (status) => {
  if (!status) return STATUS_COLOR_MAP[FALLBACK_STATUS];
  return STATUS_COLOR_MAP[status] || STATUS_COLOR_MAP[FALLBACK_STATUS];
};

export const STATUS_LEGEND_ITEMS = [
  {
    label: "Assigned",
    color: getStatusColor("Assigned"),
    icon: MARKER_ASSETS.blue,
  },
  {
    label: "In Progress",
    color: getStatusColor("In Progress"),
    icon: MARKER_ASSETS.orange,
  },
  {
    label: "Pending Approval",
    color: getStatusColor("Pending Approval"),
    icon: MARKER_ASSETS.yellow,
  },
  {
    label: "Resolved",
    color: getStatusColor("Resolved"),
    icon: MARKER_ASSETS.green,
  },
  {
    label: "Suspended",
    color: getStatusColor("Suspended"),
    icon: MARKER_ASSETS.grey,
  },
  {
    label: "Rejected",
    color: getStatusColor("Rejected"),
    icon: MARKER_ASSETS.black,
  },
];
