// ABOUTME: Wrapper around @mattermost/client for MCP tool implementations
// ABOUTME: Handles authentication, posting with identity, search, and recent messages

import { Client4 } from '@mattermost/client';
import { Message, MattermostConfig } from './types.js';

export class MattermostClient {
  private client: Client4;
  private channelId: string;
  private teamId: string | null = null;

  constructor(config: MattermostConfig) {
    this.client = new Client4();
    this.client.setUrl(config.url);
    this.client.setToken(config.token);
    this.channelId = config.channelId;
  }

  async initialize(): Promise<void> {
    // Get team ID for the channel (needed for search)
    const channel = await this.client.getChannel(this.channelId);
    this.teamId = channel.team_id;
  }

  async postMessage(text: string, identity: string): Promise<Message> {
    const post = await this.client.createPost({
      channel_id: this.channelId,
      message: text,
      props: {
        override_username: identity
      }
    });

    return {
      username: identity,
      text: post.message,
      timestamp: new Date(post.create_at).toISOString(),
      message_id: post.id
    };
  }

  async searchMessages(query: string, limit: number): Promise<Message[]> {
    if (!this.teamId) {
      throw new Error('Client not initialized');
    }

    const results = await this.client.searchPosts(
      this.teamId,
      query,
      false // is_or_search
    );

    // Extract posts from results and format
    const posts = Object.values(results.posts).slice(0, limit);

    return posts.map(post => {
      const overrideUsername = post.props?.override_username;
      return {
        username: typeof overrideUsername === 'string' ? overrideUsername : post.user_id,
        text: post.message,
        timestamp: new Date(post.create_at).toISOString(),
        message_id: post.id
      };
    });
  }

  async getRecentMessages(limit: number): Promise<Message[]> {
    const posts = await this.client.getPosts(
      this.channelId,
      0,    // page
      limit
    );

    // Posts come in reverse chronological order
    const postArray = posts.order.map(id => posts.posts[id]);

    return postArray.map(post => {
      const overrideUsername = post.props?.override_username;
      return {
        username: typeof overrideUsername === 'string' ? overrideUsername : post.user_id,
        text: post.message,
        timestamp: new Date(post.create_at).toISOString(),
        message_id: post.id
      };
    });
  }
}
