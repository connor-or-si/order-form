
// This file simulates fetching part data from a SharePoint Excel sheet
// In a real implementation, this would connect to SharePoint API or a webhook that provides Excel data

export interface Part {
  id: string;
  name: string;
  description: string;
}

// Mock data to simulate parts from SharePoint
const mockParts: Part[] = [
  { id: "P001", name: "Aluminum Bracket", description: "Heavy duty aluminum bracket" },
  { id: "P002", name: "Steel Coupling", description: "Industrial grade steel coupling" },
  { id: "P003", name: "Copper Fitting", description: "Standard copper fitting for plumbing" },
  { id: "P004", name: "Titanium Bolt Set", description: "High tensile strength titanium bolts" },
  { id: "P005", name: "Plastic Washer Pack", description: "Durable plastic washers" },
  { id: "P006", name: "Rubber Gasket", description: "Heat resistant rubber gasket" },
  { id: "P007", name: "Carbon Fiber Panel", description: "Lightweight carbon fiber panel" },
  { id: "P008", name: "Glass Panel", description: "Tempered glass panel" },
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
