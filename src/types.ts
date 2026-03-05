export type ModelType = "asknow" | "postgen";

export type Platform = "facebook" | "linkedin" | "twitter";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  model: ModelType;
  timestamp: Date;
  platforms?: Platform[];
  posts?: Record<Platform, string>;
  isLoading?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}
