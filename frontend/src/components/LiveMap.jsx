import React, { useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { URGENCY_MAP_COLORS, capitalize } from "../utils/helpers";
import { UrgencyBadge } from "./Badges";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export default function LiveMap({ needs, volunteers, user, onMatchClick, height = 500, showFilters = true }) {
  const [filter, setFilter] = useState("all");
  const [showVols, setShowVols] = useState(true);
  const isAdmin = user?.role === "admin";

  const center = [28.65, 77.23];
  const filteredNeeds = (filter === "all" ? needs : needs.filter((n) => n.urgency === filter))
    .filter((n) => n.location && n.location.lat && n.location.lng);

  return (
    <div className="live-map-container">
      {showFilters && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="filter-row" style={{ margin: 0, gap: 12 }}>
            {["all", "critical", "high", "medium", "low"].map((u) => (
              <button 
                key={u} 
                className={`urgency-badge urgency-${u === "all" ? "medium" : u}`} 
                onClick={() => setFilter(u)} 
                style={{ 
                  cursor: "pointer",
                  fontSize: "10px",
                  fontWeight: 800,
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  border: "1.5px solid transparent",
                  opacity: filter === u ? 1 : 0.4,
                  transform: filter === u ? "scale(1.05)" : "scale(1)",
                  borderColor: filter === u ? "rgba(255,255,255,0.4)" : "transparent",
                  boxShadow: filter === u ? "0 4px 12px rgba(0,0,0,0.1)" : "none"
                }}
              >
                {capitalize(u)}
              </button>
            ))}
          </div>
          <button 
            className="urgency-badge" 
            onClick={() => setShowVols(!showVols)} 
            style={{ 
              cursor: "pointer",
              background: showVols ? "var(--accent-blue-dim)" : "var(--bg-input)",
              color: showVols ? "var(--accent-blue)" : "var(--text-muted)",
              borderColor: "var(--border)"
            }}
          >
            {showVols ? "Hide" : "Show"} Responders
          </button>
        </div>
      )}

      <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)", height, background: "var(--bg-secondary)" }}>
        <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filteredNeeds.map((need) => (
            <CircleMarker
              key={need.id}
              center={[need.location.lat, need.location.lng]}
              radius={12}
              fillColor={URGENCY_MAP_COLORS[need.urgency]}
              color={URGENCY_MAP_COLORS[need.urgency]}
              weight={2}
              opacity={0.8}
              fillOpacity={0.4}
            >
              <Tooltip permanent={false}>{need.title}</Tooltip>
              <Popup>
                <div style={{ minWidth: 180, padding: 4 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 6 }}>{need.title}</div>
                  <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                    <UrgencyBadge urgency={need.urgency} />
                  </div>
                  <p style={{ fontSize: 11, marginBottom: 10, color: "var(--text-secondary)" }}>{need.description.slice(0, 80)}...</p>
                  
                  {isAdmin && need.status !== "completed" && need.status !== "rejected" && (
                    <button 
                      className="btn btn-primary btn-sm" 
                      style={{ width: "100%", marginTop: "8px" }}
                      onClick={() => onMatchClick(need.id)}
                    >
                      ⚡ Smart Match
                    </button>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          ))}
          {showVols && volunteers.filter((v) => v.location && v.location.lat && v.location.lng).map((vol) => (
            <CircleMarker
              key={vol.id}
              center={[vol.location.lat, vol.location.lng]}
              radius={8}
              fillColor="var(--accent-blue)"
              color="#ffffff"
              weight={2}
              opacity={vol.availability ? 1 : 0.4}
              fillOpacity={vol.availability ? 0.8 : 0.3}
            >
              <Popup>
                <div style={{ padding: 4 }}>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>{vol.name}</div>
                  <div style={{ fontSize: 11, color: vol.availability ? "var(--accent-green)" : "var(--text-muted)", fontWeight: 700, margin: "2px 0" }}>
                    {vol.availability ? "Ready" : "Busy"}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
