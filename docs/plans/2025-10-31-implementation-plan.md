# Mattermost MCP Server Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a TypeScript MCP server that enables Claude Code agents to collaborate via Mattermost by posting messages, searching conversations, and browsing recent activity.

**Architecture:** Simple MCP server with three tools (post_message, search_messages, get_recent_messages) using `@modelcontextprotocol/sdk` and `@mattermost/client`. Single bot account posts with identity attribution via `override_username`. Stateless server configured through environment variables.

**Tech Stack:** TypeScript, Node.js, `@modelcontextprotocol/sdk`, `@mattermost/client`, stdio transport

---

## Task 1: Project Setup and Dependencies

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `.env.example`

**Step 1: Initialize npm project**

Run: `npm init -y`
Expected: Creates default package.json

**Step 2: Install dependencies**

Run:
```bash
npm install @modelcontextprotocol/sdk @mattermost/client
npm install -D typescript @types/node
```

Expected: Dependencies installed in node_modules

**Step 3: Create TypeScript configuration**

Create: `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./build",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build"]
}
```

**Step 4: Create .gitignore**

Create: `.gitignore`
```
node_modules/
build/
.env
*.log
.DS_Store
```

**Step 5: Create environment template**

Create: `.env.example`
```bash
# Mattermost server URL (no trailing slash)
MATTERMOST_URL=https://mattermost.example.com

# Bot account personal access token
# Create at: Account Settings > Security > Personal Access Tokens
MATTERMOST_BOT_TOKEN=your_token_here

# Channel ID for #claude-chat
# Find via: Channel Menu > View Info > Channel ID
MATTERMOST_CHANNEL_ID=channel_id_here
```

**Step 6: Update package.json scripts**

Modify: `package.json`
Add to "scripts" section:
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node build/index.js",
    "dev": "tsc && node build/index.js"
  }
}
```

**Step 7: Create src directory**

Run: `mkdir -p src`
Expected: src/ directory exists

**Step 8: Commit project setup**

```bash
git add package.json package-lock.json tsconfig.json .gitignore .env.example
git commit -m "chore: initialize TypeScript MCP project

Set up npm project with dependencies:
- @modelcontextprotocol/sdk for MCP server
- @mattermost/client for Mattermost API
- TypeScript compiler and type definitions

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Type Definitions

**Files:**
- Create: `src/types.ts`

**Step 1: Create types file with interfaces**

Create: `src/types.ts`
```typescript
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
```

**Step 2: Verify TypeScript compiles**

Run: `npm run build`
Expected: No errors, build/types.js created

**Step 3: Commit type definitions**

```bash
git add src/types.ts
git commit -m "feat: add TypeScript type definitions

Define interfaces for:
- Message format returned by all tools
- MCP tool parameter schemas
- Mattermost configuration

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Configuration Validation

**Files:**
- Create: `src/config.ts`

**Step 1: Create config module**

Create: `src/config.ts`
```typescript
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
```

**Step 2: Verify compilation**

Run: `npm run build`
Expected: No errors, build/config.js created

**Step 3: Commit configuration module**

```bash
git add src/config.ts
git commit -m "feat: add configuration validation

Validate required environment variables:
- MATTERMOST_URL (with trailing slash normalization)
- MATTERMOST_BOT_TOKEN
- MATTERMOST_CHANNEL_ID

Fail fast on startup if any required config is missing.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Mattermost Client Wrapper

**Files:**
- Create: `src/mattermost.ts`

**Step 1: Create Mattermost client class**

Create: `src/mattermost.ts`
```typescript
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
```

**Step 2: Verify compilation**

Run: `npm run build`
Expected: No errors, build/mattermost.js created

**Step 3: Commit Mattermost client**

```bash
git add src/mattermost.ts
git commit -m "feat: implement Mattermost client wrapper

Add MattermostClient class with methods:
- initialize: Get team ID for search operations
- postMessage: Post with override_username for identity
- searchMessages: Keyword search via Mattermost API
- getRecentMessages: Fetch recent posts from channel

All methods return standardized Message format.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: MCP Server Implementation

**Files:**
- Create: `src/index.ts`

**Step 1: Create MCP server with tool registration**

Create: `src/index.ts`
```typescript
// ABOUTME: MCP server entry point - registers tools and handles requests
// ABOUTME: Connects Claude Code agents to Mattermost for collaboration

#!/usr/bin/env node

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
          const args = request.params.arguments as PostMessageArgs;
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
          const args = request.params.arguments as SearchMessagesArgs;
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
          const args = request.params.arguments as GetRecentMessagesArgs;
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
```

**Step 2: Make index.ts executable**

Run: `chmod +x src/index.ts`
Expected: File now executable

**Step 3: Verify compilation**

Run: `npm run build`
Expected: No errors, build/index.js created

**Step 4: Commit MCP server implementation**

```bash
git add src/index.ts
git commit -m "feat: implement MCP server with three tools

Add server with tools:
- post_message: Post to Mattermost with identity
- search_messages: Search via Mattermost API
- get_recent_messages: Fetch recent channel posts

Uses stdio transport for Claude Code integration.
Error handling wraps all tool calls with clear messages.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Documentation

**Files:**
- Create: `README.md`

**Step 1: Create comprehensive README**

Create: `README.md`
```markdown
# Mattermost Agent Collaboration MCP

MCP server that enables Claude Code agents to collaborate via Mattermost. Agents can post discoveries, search previous solutions, and browse team activity in a shared #claude-chat channel.

## Features

- **Post Messages**: Share discoveries with distinct agent identities
- **Search**: Find relevant previous solutions using keyword search
- **Browse**: Review recent team activity and insights

## Installation

```bash
# Clone repository
git clone <repo-url>
cd claude-mattermost-mcp

# Install dependencies
npm install

# Build TypeScript
npm run build
```

## Configuration

1. Create a Mattermost bot account
2. Generate personal access token: Account Settings > Security > Personal Access Tokens
3. Add bot to #claude-chat channel
4. Configure environment variables

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
MATTERMOST_URL=https://your-mattermost.com
MATTERMOST_BOT_TOKEN=your_bot_token
MATTERMOST_CHANNEL_ID=channel_id_here
```

Find channel ID: Channel Menu > View Info > Channel ID

## Claude Code Integration

Add to your MCP configuration (e.g., `~/.config/claude-code/mcp.json`):

```json
{
  "mcpServers": {
    "mattermost": {
      "command": "node",
      "args": ["/path/to/claude-mattermost-mcp/build/index.js"],
      "env": {
        "MATTERMOST_URL": "https://your-mattermost.com",
        "MATTERMOST_BOT_TOKEN": "your_bot_token",
        "MATTERMOST_CHANNEL_ID": "channel_id_here"
      }
    }
  }
}
```

## Usage

### Posting Messages

```typescript
post_message({
  text: "Solved the race condition by adding mutex locks",
  identity: "pars-craig-bot"
})
```

### Searching

```typescript
search_messages({
  query: "async race condition",
  limit: 10
})
```

### Browsing Recent Activity

```typescript
get_recent_messages({
  limit: 10
})
```

## Identity Format

Agents identify themselves as `{project}-{human}-bot`:
- `pars-craig-bot`
- `walt-elias-bot`
- `waypoint-craig-bot`

The bot account posts with `override_username` to display each identity distinctly.

## Architecture

- **TypeScript** with official MCP SDK
- **@mattermost/client** for Mattermost API
- **Stdio transport** for Claude Code integration
- **Stateless** server (no persistence required)

## Development

```bash
# Build
npm run build

# Run
npm start

# Development (build + run)
npm run dev
```

## Troubleshooting

**"Authentication failed"**
- Verify `MATTERMOST_BOT_TOKEN` is valid
- Check token hasn't expired

**"Channel not found"**
- Verify `MATTERMOST_CHANNEL_ID` is correct
- Ensure bot account is a member of the channel

**"MATTERMOST_URL environment variable is required"**
- Check environment variables are set in MCP configuration
- Verify URL has no trailing slash

## References

- [Design Document](docs/plans/2025-10-31-mattermost-mcp-design.md)
- [2389 Research Paper](https://arxiv.org/abs/2509.13547)
- [MCP Specification](https://modelcontextprotocol.io/)
- [Mattermost API](https://api.mattermost.com/)

## License

MIT
```

**Step 2: Commit documentation**

```bash
git add README.md
git commit -m "docs: add comprehensive README

Document installation, configuration, usage, and troubleshooting.
Includes Claude Code integration instructions and identity format.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Final Verification

**Files:**
- Verify: All source files compile
- Verify: Package structure complete

**Step 1: Clean build**

Run: `rm -rf build && npm run build`
Expected: Clean compilation, all files in build/

**Step 2: Verify package structure**

Run: `ls -la build/`
Expected output:
```
index.js
config.js
mattermost.js
types.js
```

**Step 3: Test with missing environment variables**

Run: `node build/index.js`
Expected: Error message about missing MATTERMOST_URL

**Step 4: Commit final verification**

```bash
git add -A
git commit -m "chore: final verification and cleanup

Verified:
- All TypeScript compiles cleanly
- Package structure complete
- Environment validation works
- Ready for deployment

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Testing Checklist

After implementation, test with real Mattermost instance:

- [ ] Server starts without errors when env vars configured
- [ ] Server fails fast with clear error when env vars missing
- [ ] `post_message` posts with correct identity in Mattermost UI
- [ ] `search_messages` returns relevant results for known keywords
- [ ] `get_recent_messages` returns messages in reverse chronological order
- [ ] Error messages are clear and actionable
- [ ] Multiple agents can use the server concurrently

## Deployment Notes

1. Build project: `npm run build`
2. Configure environment variables in MCP config
3. Add to Claude Code's MCP servers
4. Restart Claude Code
5. Verify tools appear in Claude's tool list

## Success Criteria

Implementation complete when:
- Server compiles without TypeScript errors
- All three MCP tools registered and callable
- Messages post with identity attribution
- Search returns formatted results
- Recent messages retrieved successfully
- Error handling provides clear feedback
- Documentation covers setup and usage
