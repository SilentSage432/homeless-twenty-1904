"use client";

import { useId, useRef, type CSSProperties } from "react";
import {
  Autocomplete,
  GoogleMap,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";
import {
  GOOGLE_MAPS_API_KEY,
  GOOGLE_MAPS_LIBRARIES,
  GOOGLE_MAPS_LOADER_ID,
} from "@/lib/maps";

const MAP_CONTAINER_STYLE: CSSProperties = { width: "100%", height: "12rem" };

export type LocationSelection = {
  location: string;
  latitude: number | null;
  longitude: number | null;
  mapUrl: string | null;
};

type FieldProps = {
  label?: string;
  value: string;
  latitude: number | null;
  longitude: number | null;
  required?: boolean;
  disabled?: boolean;
  hint?: string;
  onChange: (value: string) => void;
  onSelect: (selection: LocationSelection) => void;
};

/**
 * Location input backed by Google Places Autocomplete with a live map preview.
 * Degrades to a plain address input when the API key is missing or the loader
 * fails, so the form always stays usable.
 */
export function LocationAutocompleteField(props: FieldProps) {
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <PlainLocationInput
        {...props}
        hint={
          props.hint ??
          "Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable autocomplete & map preview."
        }
      />
    );
  }
  return <MapsLocationField {...props} />;
}

function PlainLocationInput({
  label = "Location",
  value,
  required,
  disabled,
  hint,
  onChange,
}: FieldProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="admin-label">
        {label}
        {required ? <span className="text-crimson"> *</span> : null}
      </label>
      <input
        id={id}
        type="text"
        required={required}
        disabled={disabled}
        value={value}
        placeholder="Street, city, or landmark"
        onChange={(e) => onChange(e.target.value)}
        className="admin-input focus-ring"
      />
      {hint ? (
        <p className="mt-1.5 text-xs text-slate-weathered/90">{hint}</p>
      ) : null}
    </div>
  );
}

function MapsLocationField({
  label = "Location",
  value,
  latitude,
  longitude,
  required,
  disabled,
  hint,
  onChange,
  onSelect,
}: FieldProps) {
  const id = useId();
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAPS_LOADER_ID,
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const hasCoords =
    typeof latitude === "number" && typeof longitude === "number";

  function handleLoad(instance: google.maps.places.Autocomplete) {
    autocompleteRef.current = instance;
  }

  function handlePlaceChanged() {
    const ac = autocompleteRef.current;
    if (!ac) return;
    const place = ac.getPlace();
    const address = place.formatted_address ?? place.name ?? value;
    const lat = place.geometry?.location?.lat() ?? null;
    const lng = place.geometry?.location?.lng() ?? null;
    const mapUrl =
      place.url ??
      (lat != null && lng != null
        ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}${
            place.place_id ? `&query_place_id=${place.place_id}` : ""
          }`
        : null);

    onChange(address);
    onSelect({ location: address, latitude: lat, longitude: lng, mapUrl });
  }

  if (loadError) {
    return (
      <PlainLocationInput
        label={label}
        value={value}
        latitude={latitude}
        longitude={longitude}
        required={required}
        disabled={disabled}
        hint="Google Maps failed to load — enter the address manually."
        onChange={onChange}
        onSelect={onSelect}
      />
    );
  }

  return (
    <div>
      <label htmlFor={id} className="admin-label">
        {label}
        {required ? <span className="text-crimson"> *</span> : null}
      </label>

      {isLoaded ? (
        <Autocomplete
          onLoad={handleLoad}
          onPlaceChanged={handlePlaceChanged}
          fields={["formatted_address", "geometry", "name", "url", "place_id"]}
        >
          <input
            id={id}
            type="text"
            required={required}
            disabled={disabled}
            value={value}
            placeholder="Search an address or landmark"
            onChange={(e) => onChange(e.target.value)}
            className="admin-input focus-ring"
          />
        </Autocomplete>
      ) : (
        <input
          id={id}
          type="text"
          required={required}
          disabled
          value={value}
          placeholder="Loading map search…"
          onChange={(e) => onChange(e.target.value)}
          className="admin-input focus-ring"
        />
      )}

      {hint ? (
        <p className="mt-1.5 text-xs text-slate-weathered/90">{hint}</p>
      ) : null}

      {isLoaded && hasCoords ? (
        <div className="mt-3 overflow-hidden rounded-sm border border-charcoal/15">
          <GoogleMap
            mapContainerStyle={MAP_CONTAINER_STYLE}
            center={{ lat: latitude as number, lng: longitude as number }}
            zoom={14}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              gestureHandling: "cooperative",
            }}
          >
            <Marker
              position={{ lat: latitude as number, lng: longitude as number }}
            />
          </GoogleMap>
        </div>
      ) : null}
    </div>
  );
}
