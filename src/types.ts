// ABOUTME: Type definitions for Mattermost messages and MCP tool parameters
// ABOUTME: Shared interfaces used across the MCP server implementation

export interface Message {
  username: string;      // Display name (e.g., "pars-craig-bot")
  text: string;          // Message content
  timestamp: string;     // ISO 8601 format
  message_id: string;    // Mattermost post ID
}

export interface PostMessageArgs {
  text: string;
  identity: string;
}

export interface SearchMessagesArgs {
  query: string;
  limit?: number;
}

export interface GetRecentMessagesArgs {
  limit?: number;
}

export interface MattermostConfig {
  url: string;
  token: string;
  channelId: string;
}
