
// This file simulates fetching part data from a SharePoint Excel sheet
// In a real implementation, this would connect to SharePoint API or a webhook that provides Excel data

export interface Part {
  id: string;
  name: string;
}

// Mock data to simulate parts from SharePoint
const mockParts: Part[] = [
  { id: "PH40180240", name: "Paco Thermopad .0440 18 x 24 NONE 50"},
  { id: "PFC01301907C1ED", name: "PacoClutch .0110 13 x 19 7C1ED 200"},
  { id: "PFC01701907C1ED", name: "PacoClutch .0110 17 x 19 7C1ED 200"},
  { id: "PFC01902507C1ED", name: "PacoClutch .0110 19 x 25 7C1ED 200"},
  { id: "PFC0190250", name: "PacoClutch .0110 19 x 25 NONE 200"},
  { id: "PFC02202507C1ED", name: "PacoClutch .0110 22 x 25 7C1ED 200"},
  { id: "PFC0220250", name: "PacoClutch .0110 22 x 25 NONE 200"},
  { id: "PFU0180240-S", name: "Pacoflex Ultra .0060 18 x 24 -S 200"},
  { id: "PMT0200260-S", name: "PacoMT .0010 20 x 26 -S 600"},
  { id: "PP50180240", name: "Pacopad .0550 18 x 24 NONE 200"},
  { id: "PS00180240", name: "Pacoplus .0120 18 x 24 NONE 200"},
  { id: "PQP0200260", name: "PacoQuick .0050 20 x 26 NONE 200"},
  { id: "PT501201801C140", name: "Pacotherm(Tripak) .0550 12 x 18 1C140 400"},
  { id: "PT501601801C140", name: "Pacotherm(Tripak) .0550 16 x 18 1C140 200"},
  { id: "PT501802401C140", name: "Pacotherm(Tripak) .0550 18 x 24 1C140 200"},
  { id: "PT50180240", name: "Pacotherm(Tripak) .0550 18 x 24 NONE 200"},
  { id: "PT50190250", name: "Pacotherm(Tripak) .0550 19 x 25 NONE 200"},
  { id: "PT502102401C140", name: "Pacotherm(Tripak) .0550 21 x 24 1C140 200"},
  { id: "PT50220250", name: "Pacotherm(Tripak) .0550 22 x 25 NONE 200"}
];

export const fetchParts = async (): Promise<Part[]> => {
  // Simulate API call delay
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockParts), 600);
  });
};

export const getPartById = (id: string): Part | undefined => {
  return mockParts.find(part => part.id === id);
};

export const getPartByName = (name: string): Part | undefined => {
  return mockParts.find(part => part.name === name);
};
