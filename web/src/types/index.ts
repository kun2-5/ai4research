// Concept card from the wiki
export interface Concept {
  id: string;
  name: string;
  aliases: string[];
  chineseEquivalent?: string;
  description?: string;
  relatedConcepts: string[];
  linkedPapers: string[];
}

// Literature entry with tier classification
export interface Literature {
  id: string;
  title: string;
  authors?: string[];
  year?: number;
  tier: "Core" | "Important" | "Relevant" | "Peripheral";
  abstract?: string;
  concepts: string[];
  path: string;
}

// Knowledge graph node
export interface GraphNode {
  id: string;
  label: string;
  type: "concept" | "paper" | "author";
  tier?: string;
}

// Knowledge graph edge
export interface GraphEdge {
  source: string;
  target: string;
  label?: string;
}

// Chat message
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: { title: string; id: string }[];
}

// Navigation item
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: string;
}
