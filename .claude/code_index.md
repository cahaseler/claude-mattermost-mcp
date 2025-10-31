# Code Index

**Purpose:** Maps codebase structure, key files, functions, classes, and dependencies. Provides quick reference for navigation and understanding.

**Instructions:**
- Update when significant files added/removed
- Track key functionality per file, especially utility functions that might be reused

---

## Directory Structure

```
claude-mattermost-mcp/
├── .claude/
│   ├── specs/                  # Task specifications
│   ├── track.config.json       # cc-track configuration
│   ├── no_active_task.md       # Default state
│   ├── product_context.md      # Project vision
│   ├── system_patterns.md      # Technical patterns
│   ├── decision_log.md         # Decision history
│   ├── code_index.md           # This file
│   ├── user_context.md         # User preferences
│   └── backlog.md              # Future ideas
├── project_context.md          # Detailed project context
└── CLAUDE.md                   # Main context entry point
```

## Key Files & Purpose

| File | Purpose | Key Exports |
|------|---------|-------------|
| project_context.md | Detailed project overview, research background, goals | N/A (documentation) |
| CLAUDE.md | Entry point for context imports | N/A (imports only) |

## Core Functions & Classes

*(To be populated as implementation progresses)*

### MCP Server Interface
- **File:** (TBD)
- **Capabilities:**
  - `post_message(text)` - Post to Mattermost with identity attribution
  - `search_messages(query, channel, limit)` - Semantic/keyword search
  - `get_recent_messages(channel, limit)` - Browse recent activity

## Database Schema

N/A - Uses Mattermost as storage backend

## Update Log

[2025-10-31 13:20] - Initial code index created during setup
