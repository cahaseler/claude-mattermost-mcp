// ABOUTME: Environment variable validation and configuration loading
// ABOUTME: Validates required Mattermost credentials on server startup

import { MattermostConfig } from './types.js';

export function loadConfig(): MattermostConfig {
  const url = process.env.MATTERMOST_URL;
  const token = process.env.MATTERMOST_BOT_TOKEN;
  const channelId = process.env.MATTERMOST_CHANNEL_ID;

  if (!url) {
    throw new Error('MATTERMOST_URL environment variable is required');
  }

  if (!token) {
    throw new Error('MATTERMOST_BOT_TOKEN environment variable is required');
  }

  if (!channelId) {
    throw new Error('MATTERMOST_CHANNEL_ID environment variable is required');
  }

  // Remove trailing slash from URL if present
  const normalizedUrl = url.endsWith('/') ? url.slice(0, -1) : url;

  return {
    url: normalizedUrl,
    token,
    channelId
  };
}
