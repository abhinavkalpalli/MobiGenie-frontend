export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface Phone {
  _id: string;
  name: string;
  brand: string;
  slug: string;
  image: string;
  price: {
    original: number;
    current: number;
    currency: string;
    discount: number;
  };
  specs: {
    ram: number;
    storage: number;
    processor: string;
    display: {
      size: number;
      type: string;
      refreshRate: number;
    };
    camera: {
      rear: { main: number };
      front: number;
    };
    battery: {
      capacity: number;
      charging: number;
    };
    connectivity: {
      network: string;
      nfc: boolean;
    };
    os: string;
  };
  tags: string[];
  rating: number;
  reviewCount: number;
  availability: string;
}

export interface Session {
  _id: string;
  userId: string;
  title: string;
  status: string;
  messageCount: number;
  lastMessage: { content: string; at: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  sessionId: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  parsedQuery: ParsedQuery | null;
  suggestedPhones: {
    phoneId: Phone | string;
    name: string;
    price: number;
    image: string;
    matchScore: number;
  }[];
  createdAt: string;
}

export interface ParsedQuery {
  queryType: string;
  originalQuery: string;
  maxPrice: number | null;
  minPrice: number | null;
  ram: number | null;
  battery: number | null;
  camera: number | null;
  network: string | null;
  brand: string | null;
  storage: number | null;
}

// Chat message displayed in UI
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  phones?: Phone[];
  parsed?: ParsedQuery;
  isStreaming?: boolean;
  isError?: boolean;
  recommendedIds?: string[];
}
