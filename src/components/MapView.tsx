import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Language } from "../types";

interface MapMarker {
  id: string;
  title: string;
  category: "attraction" | "food" | "stay" | "activity" | "user";
  coordinates: { lat: number; lng: number };
  description?: string;
  priceEstimate?: number;
  timeSlot?: string;
}

interface MapViewProps {
  markers: MapMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  language: Language;
  height?: string;
}

export const MapView: React.FC<MapViewProps> = ({
  markers,
  center = { lat: 32.2432, lng: 77.1892 }, // Default Manali
  zoom = 12,
  language,
  height = "h-72"
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    // Initialize Map if not already created
    if (!mapInstanceRef.current) {
      const map = L.map(container, {
        zoomControl: true,
        scrollWheelZoom: false
      }).setView([center.lat, center.lng], zoom);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView([center.lat, center.lng], zoom);
    }

    const map = mapInstanceRef.current;

    // Remove existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Create custom SVG markers for different categories
    markers.forEach((m) => {
      if (!m.coordinates || !m.coordinates.lat || !m.coordinates.lng) return;

      let color = "#2563eb"; // Blue for attractions/general
      if (m.category === "food") color = "#f59e0b"; // Amber
      if (m.category === "stay") color = "#10b981"; // Emerald
      if (m.category === "activity") color = "#8b5cf6"; // Purple
      if (m.category === "user") color = "#ef4444"; // Red for User Location

      const customIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div style="
            background-color: ${color};
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            font-weight: bold;
          ">
            ${m.category === "food" ? "🍴" : m.category === "stay" ? "🏨" : m.category === "user" ? "📍" : "🚩"}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const popupContent = `
        <div style="font-family: sans-serif; padding: 4px; max-width: 200px;">
          <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold; color: #0f172a;">${m.title}</h4>
          ${m.description ? `<p style="margin: 0 0 6px 0; font-size: 12px; color: #475569;">${m.description}</p>` : ""}
          ${m.priceEstimate !== undefined ? `<div style="font-size: 12px; font-weight: bold; color: #16a34a;">Est. ₹${m.priceEstimate}</div>` : ""}
        </div>
      `;

      L.marker([m.coordinates.lat, m.coordinates.lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(popupContent);
    });

    // Fit bounds if multiple markers exist
    if (markers.length > 1) {
      const validMarkers = markers.filter(m => m.coordinates?.lat && m.coordinates?.lng);
      if (validMarkers.length > 0) {
        const group = L.featureGroup(
          validMarkers.map(m => L.marker([m.coordinates.lat, m.coordinates.lng]))
        );
        map.fitBounds(group.getBounds().pad(0.2));
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [markers, center.lat, center.lng, zoom]);

  return (
    <div className={`relative w-full ${height} rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs z-10`}>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
