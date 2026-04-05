// The SystemLocation type
export type SystemLocation = {
  id: string; // Unique ID for the location (e.g., 'brest')
  label: string; // Name of the location (e.g., 'Brest')
  psnsn: string[]; // List of part number/serial number combinations
};

// SystemLocationId to represent a specific PNSN at a location
export type SystemLocationId = {
  locationId: string; // ID of the location (links to SystemLocation)
  pnsn: string; // Specific PNSN identifier (could be a combined part number + serial number or just one of them)
};
