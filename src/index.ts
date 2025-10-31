#!/usr/bin/env node

// ABOUTME: MCP server entry point - registers tools and handles requests
// ABOUTME: Connects Claude Code agents to Mattermost for collaboration

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { MattermostClient } from './mattermost.js';
import { loadConfig } from './config.js';
import {
  PostMessageArgs,
  SearchMessagesArgs,
  GetRecentMessagesArgs
} from './types.js';

const DEFAULT_LIMIT = 10;

async function main() {
  // Load and validate configuration
  const config = loadConfig();

  // Initialize Mattermost client
  const mattermostClient = new MattermostClient(config);
  await mattermostClient.initialize();

  // Create MCP server
  const server = new Server(
    {
      name: 'mattermost-collaboration',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'post_message',
        description: 'Post a message to the #claude-chat Mattermost channel with your agent identity',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'The message content to post'
            },
            identity: {
              type: 'string',
              description: 'Your agent identity in format: {project}-{human}-bot (e.g., "pars-craig-bot")'
            }
          },
          required: ['text', 'identity']
        }
      },
      {
        name: 'search_messages',
        description: 'Search messages in #claude-chat using Mattermost\'s keyword search',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (supports Mattermost search syntax)'
            },
            limit: {
              type: 'number',
              description: `Maximum number of results to return (default: ${DEFAULT_LIMIT})`,
              default: DEFAULT_LIMIT
            }
          },
          required: ['query']
        }
      },
      {
        name: 'get_recent_messages',
        description: 'Get recent messages from #claude-chat channel',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: `Number of recent messages to retrieve (default: ${DEFAULT_LIMIT})`,
              default: DEFAULT_LIMIT
            }
          }
        }
      }
    ]
  }));

  // Register tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      switch (request.params.name) {
        case 'post_message': {
          const args = request.params.arguments as unknown as PostMessageArgs;
          const message = await mattermostClient.postMessage(args.text, args.identity);
          return {
            content: [
              {
                type: 'text',
                text: `Posted as ${message.username}: ${message.text.substring(0, 100)}${message.text.length > 100 ? '...' : ''}`
              }
            ]
          };
        }

        case 'search_messages': {
          const args = request.params.arguments as unknown as SearchMessagesArgs;
          const limit = args.limit ?? DEFAULT_LIMIT;
          const messages = await mattermostClient.searchMessages(args.query, limit);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(messages, null, 2)
              }
            ]
          };
        }

        case 'get_recent_messages': {
          const args = request.params.arguments as unknown as GetRecentMessagesArgs;
          const limit = args.limit ?? DEFAULT_LIMIT;
          const messages = await mattermostClient.getRecentMessages(limit);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(messages, null, 2)
              }
            ]
          };
        }

        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${errorMessage}`
          }
        ],
        isError: true
      };
    }
  });

  // Start server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Mattermost MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
