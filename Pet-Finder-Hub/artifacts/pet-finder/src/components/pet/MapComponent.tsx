import { Ad } from "@/lib/api";
import { MapContainer, TileLayer, Marker, Popup, AttributionControl, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Link } from "wouter";

interface MapComponentProps {
  ads: Ad[];
  center?: [number, number];
  zoom?: number;
  interactive?: boolean;
  onLocationSelect?: (lat: number, lng: number) => void;
  selectedLocation?: [number, number];
  disablePopup?: boolean;
}

const VLADIMIR_CENTER: [number, number] = [56.1280, 40.4070];

const createIcon = (type: "lost" | "found", animalType: "cat" | "dog" | "other") => {
  const bgColor = type === "lost" ? "bg-destructive text-white" : "bg-success text-white";
  const emoji = animalType === "cat" ? "🐱" : animalType === "dog" ? "🐶" : "🐾";
  
  return L.divIcon({
    className: "custom-div-icon",
    html: `
      <div class="relative flex items-center justify-center w-10 h-10 -ml-5 -mt-10">
        <div class="absolute inset-0 ${bgColor} rounded-full shadow-lg border-2 border-white flex items-center justify-center text-lg shadow-black/30">
          ${emoji}
        </div>
        <div class="absolute -bottom-1.5 w-3 h-3 ${bgColor} rotate-45 border-r-2 border-b-2 border-white"></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

const selectionIcon = L.divIcon({
  className: "custom-div-icon",
  html: `
    <div class="relative flex items-center justify-center w-10 h-10 -ml-5 -mt-10">
      <div class="absolute inset-0 bg-primary text-white rounded-full shadow-lg border-2 border-white flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
      <div class="absolute -bottom-1.5 w-3 h-3 bg-primary rotate-45 border-r-2 border-b-2 border-white"></div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 40]
});

function LocationSelector({ onSelect }: { onSelect?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      if (onSelect) {
        onSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  
  return null;
}

export function MapComponent({ 
  ads, 
  center = VLADIMIR_CENTER, 
  zoom = 13, 
  interactive = true,
  onLocationSelect,
  selectedLocation,
  disablePopup = false
}: MapComponentProps) {
  
  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-inner border border-border z-0 bg-muted">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={interactive}
        dragging={interactive}
        className="w-full h-full"
        attributionControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <AttributionControl prefix={false} />
        
        {ads.map(ad => (
          <Marker 
            key={ad.id} 
            position={[ad.lat, ad.lng]}
            icon={createIcon(ad.type, ad.animal_type)}
          >
            {!disablePopup && (
              <Popup>
                <div className="text-center p-1">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-2 ${ad.type === 'lost' ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
                    {ad.type === 'lost' ? 'ПРОПАЛ' : 'НАЙДЕН'}
                  </span>
                  <h4 className="font-bold text-sm mb-1">{ad.title}</h4>
                  <p className="text-xs text-muted-foreground mb-3">{ad.district} район</p>
                  <Link href={`/card/${ad.id}`} className="block w-full py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors">
                    Подробнее
                  </Link>
                </div>
              </Popup>
            )}
          </Marker>
        ))}

        {selectedLocation && (
          <Marker position={selectedLocation} icon={selectionIcon} />
        )}

        <LocationSelector onSelect={onLocationSelect} />
      </MapContainer>
    </div>
  );
}