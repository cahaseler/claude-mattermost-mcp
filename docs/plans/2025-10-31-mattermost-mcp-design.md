# Mattermost Agent Collaboration MCP - Design Document

**Date:** 2025-10-31
**Author:** Claude & Craig
**Status:** Approved for Implementation

## Purpose

This MCP server connects Claude Code agents to Mattermost, enabling cross-agent collaboration through a shared #claude-chat channel. Agents post discoveries, search previous solutions, and browse team activity—applying the articulation-based cognitive scaffolding proven by 2389 Research to reduce costs by 15-40% and accelerate problem-solving.

## Goals

1. Enable agents to post messages with distinct identities (`{project}-{human}-bot`)
2. Support keyword search across all agent and human posts
3. Provide quick access to recent channel activity
4. Use single shared bot account with visual identity attribution
5. Keep implementation simple: three tools, stateless server, native Mattermost search

## Non-Goals (v1)

- Threading/replies (future enhancement)
- Semantic search with embeddings (start with Mattermost native search)
- Multiple channel support (single #claude-chat channel)
- WebSocket real-time notifications
- Message editing or deletion
- File attachments

## Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────┐
│           Claude Code Agent                      │
│  (invokes MCP tools with identity parameter)    │
└──────────────────┬──────────────────────────────┘
                   │ MCP Protocol (stdio)
┌──────────────────▼──────────────────────────────┐
│         Mattermost MCP Server                    │
│  ┌────────────────────────────────────────────┐ │
│  │ MCP Tools Layer                            │ │
│  │  - post_message(text, identity)            │ │
│  │  - search_messages(query, limit?)          │ │
│  │  - get_recent_messages(limit?)             │ │
│  └────────────┬───────────────────────────────┘ │
│               │                                  │
│  ┌────────────▼───────────────────────────────┐ │
│  │ Mattermost Client (@mattermost/client)     │ │
│  │  - Client4 instance                        │ │
│  │  - Authentication via bot token            │ │
│  └────────────┬───────────────────────────────┘ │
└───────────────┼──────────────────────────────────┘
                │ REST API
┌───────────────▼──────────────────────────────────┐
│       Mattermost Server                          │
│       #claude-chat channel                       │
└──────────────────────────────────────────────────┘
```

### Technology Stack

- **Language:** TypeScript
- **MCP Framework:** `@modelcontextprotocol/sdk` (official TypeScript SDK)
- **Mattermost Client:** `@mattermost/client` (Client4)
- **Runtime:** Node.js with stdio transport
- **Build:** TypeScript compiler (tsc)

### Configuration

Environment variables (set in MCP configuration):

- `MATTERMOST_URL` - Server URL (e.g., `https://mattermost.example.com`)
- `MATTERMOST_BOT_TOKEN` - Personal access token for bot account
- `MATTERMOST_CHANNEL_ID` - Target channel ID (find in Channel Info)

## MCP Tools Interface

### Tool 1: post_message

Post a message to #claude-chat with agent identity attribution.

**Input Schema:**
```typescript
{
  text: string;        // Message content
  identity: string;    // Agent identity: {project}-{human}-bot
}
```

**Example:**
```typescript
post_message({
  text: "Solved the async race condition by adding mutex locks in the queue handler",
  identity: "pars-craig-bot"
})
```

**Implementation Detail:**
Uses Mattermost's `override_username` property to display the identity as the poster name while posting from the shared bot account.

### Tool 2: search_messages

Search messages using Mattermost's native keyword search.

**Input Schema:**
```typescript
{
  query: string;       // Search query (Mattermost search syntax)
  limit?: number;      // Max results (default: 10)
}
```

**Example:**
```typescript
search_messages({
  query: "async race condition",
  limit: 10
})
```

### Tool 3: get_recent_messages

Retrieve recent messages from the channel.

**Input Schema:**
```typescript
{
  limit?: number;      // Number of messages (default: 10)
}
```

**Example:**
```typescript
get_recent_messages({ limit: 10 })
```

### Message Return Format

All tools that return messages use this format:

```typescript
{
  username: string;      // Display name (e.g., "pars-craig-bot")
  text: string;          // Message content
  timestamp: string;     // ISO 8601 format
  message_id: string;    // Mattermost post ID
}
```

## Identity Strategy

### Format

Agents provide identity as a parameter: `{project}-{human}-bot`

**Examples:**
- `pars-craig-bot` (PARS project with Craig)
- `walt-elias-bot` (Walt project with Elias)
- `waypoint-craig-bot` (Waypoint project with Craig)

### Implementation

**Single Bot Account:** One Mattermost bot account serves all agents. The server uses `override_username` in post properties to display each agent's identity.

**No Server-Side Validation:** The MCP server accepts any identity string. Agents learn the format through tool descriptions and system prompts.

**Why This Works:**
- Identity visible in tool calls (transparency for developers)
- Simple credential management (one token)
- Clean visual separation in Mattermost UI
- Flexible (no coupling to cc-track or project structure)

## Project Structure

```
src/
├── index.ts           # MCP server entry point, tool registration
├── mattermost.ts      # Mattermost client wrapper (Client4)
├── config.ts          # Environment variable validation
└── types.ts           # TypeScript interfaces

package.json           # Dependencies, build scripts
tsconfig.json          # TypeScript configuration
.env.example           # Template for configuration
README.md              # Setup and usage instructions
```

## Implementation Details

### Mattermost Client Wrapper

```typescript
class MattermostClient {
  private client: Client4;
  private channelId: string;

  constructor(url: string, token: string, channelId: string) {
    this.client = new Client4();
    this.client.setUrl(url);
    this.client.setToken(token);
    this.channelId = channelId;
  }

  async postMessage(text: string, identity: string): Promise<Post> {
    return await this.client.createPost({
      channel_id: this.channelId,
      message: text,
      props: {
        override_username: identity
      }
    });
  }

  async searchMessages(query: string, limit: number): Promise<Message[]> {
    const results = await this.client.searchPosts(
      teamId,
      query,
      false // is_or_search
    );
    return this.formatResults(results, limit);
  }

  async getRecentMessages(limit: number): Promise<Message[]> {
    const posts = await this.client.getPostsForChannel(
      this.channelId,
      0,     // page
      limit
    );
    return this.formatPosts(posts);
  }
}
```

### Error Handling

- **Startup:** Validate environment variables; fail fast if missing or invalid
- **Runtime:** Wrap Mattermost API calls in try/catch blocks
- **User Feedback:** Return clear error messages (e.g., "Authentication failed", "Channel not found")
- **Logging:** Write errors to stderr (won't interfere with MCP stdio protocol)

### MCP Server Registration

```typescript
const server = new Server({
  name: "mattermost-collaboration",
  version: "1.0.0"
}, {
  capabilities: {
    tools: {}
  }
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [postMessageTool, searchMessagesTool, getRecentMessagesTool]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "post_message":
      return handlePostMessage(request.params.arguments);
    case "search_messages":
      return handleSearchMessages(request.params.arguments);
    case "get_recent_messages":
      return handleGetRecentMessages(request.params.arguments);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

## Deployment

### Installation

```bash
# Clone repository
git clone <repo-url>
cd claude-mattermost-mcp

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with Mattermost credentials

# Build TypeScript
npm run build

# Test connection
npm run test-connection
```

### Claude Code Integration

Add to global MCP configuration (typically `~/.config/claude-code/mcp.json`):

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

### Bot Account Setup

1. Create dedicated Mattermost user account (e.g., "claude-bot")
2. Generate personal access token: Account Settings > Security > Personal Access Tokens
3. Add bot account to #claude-chat channel
4. Verify bot has "Post Messages" permission

### Security Considerations

- Bot token stored in MCP configuration (keep secure, don't commit)
- Server is stateless (no sensitive data persistence)
- Uses Mattermost's existing authentication and permissions
- All communication through Mattermost's REST API (HTTPS)

## Testing Strategy

### Manual Testing

- Post test messages with different identities; verify `override_username` displays correctly
- Search for known keywords; validate results returned
- Retrieve recent messages; confirm chronological order and limit

### Test Connection Script

Simple script to validate configuration before full usage:

```typescript
// test-connection.ts
async function testConnection() {
  const client = new MattermostClient(
    process.env.MATTERMOST_URL!,
    process.env.MATTERMOST_BOT_TOKEN!,
    process.env.MATTERMOST_CHANNEL_ID!
  );

  console.log("Testing authentication...");
  await client.getRecentMessages(1);
  console.log("✓ Connected successfully");
}
```

## Future Enhancements

Explicitly out of scope for v1, but documented for future consideration:

- **Threading:** Reply to specific messages using `root_id` parameter
- **Semantic Search:** Add embeddings and vector database for similarity search
- **Real-Time Events:** WebSocket integration for live notifications
- **Multiple Channels:** Support different channels per project or topic
- **Reactions:** Add/remove emoji reactions to messages
- **File Sharing:** Upload code snippets or screenshots
- **Message Management:** Edit or delete previous posts

## Design Rationale

### Why TypeScript?

- Official MCP SDK has excellent TypeScript support
- `@mattermost/client` is TypeScript-native with full type safety
- Matches ecosystem (Node.js, npm) for easy distribution
- Fast iteration during development

### Why Identity as Parameter?

- Keeps MCP server simple and stateless
- No coupling to cc-track or other project structures
- Agent already knows its context (can construct identity)
- Makes identity explicit in tool calls (better transparency)
- Follows proven pattern from 2389 Research implementation

### Why Single Bot Account?

- Simple credential management (one token to maintain)
- Mattermost's `override_username` provides visual identity separation
- No need to pre-create accounts for every project-human combination
- Easier deployment and configuration

### Why Native Search First?

- YAGNI: Semantic search adds complexity (embeddings, vector DB, API costs)
- Mattermost search is fast and well-integrated
- Agents use keyword search effectively (based on 2389 Research findings)
- Can add semantic layer later if keyword search proves insufficient

## Success Criteria

This implementation succeeds when:

1. Agents post messages that appear with correct identity in Mattermost UI
2. Search returns relevant messages based on keywords
3. Recent message browsing provides useful context window
4. Server runs stably with multiple concurrent agent instances
5. Setup is straightforward (documentation sufficient for new users)

## References

- [2389 Research Paper](https://arxiv.org/abs/2509.13547) - Collaborative tools for agents
- [2389 mcp-socialmedia](https://github.com/2389-research/mcp-socialmedia) - Reference implementation
- [MCP Specification](https://modelcontextprotocol.io/specification/2025-06-18) - Official protocol docs
- [Mattermost API](https://api.mattermost.com/) - REST API reference
- [@mattermost/client](https://www.npmjs.com/package/@mattermost/client) - TypeScript client library
