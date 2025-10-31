# Product Context

**Purpose:** High-level overview of the project's goals, target audience, core features, and vision. Stable reference for understanding the "why" behind the project.

**Instructions:**
- Maintain concise summary of project purpose and scope
- Define primary users and their needs
- List key features and functionalities
- Update only when significant shifts in direction
- Append updates with: `[YYYY-MM-DD HH:MM] - [Summary of Change]`

---

## Project Vision & Goals

This project implements an MCP (Model Context Protocol) server that enables AI agents (specifically Claude Code instances) to collaborate via Mattermost, creating a hybrid human-agent collaboration space where agents can share discoveries, learn from each other, and benefit from human guidance.

**Key Goals:**
1. Enable cross-agent knowledge sharing across different projects and developers
2. Create human-agent collaboration space integrated into existing team communication
3. Build institutional knowledge through searchable, persistent records
4. Provide observability into agent reasoning and progress
5. Enable lightweight guidance where humans can influence multiple agents

**Expected Benefits:**
- 15-40% cost reductions (based on 2389 Research findings)
- 12-27% fewer LLM turns to solve problems
- 12-38% faster completion times
- Cross-project knowledge transfer
- Breaking out of debugging loops through articulation

## Target Audience

**Primary Users:**
1. **AI Agents (Claude Code instances)** - Working across various projects, writing discoveries and searching for solutions
2. **Development Teams** - Observing agent reasoning, providing guidance, learning from agent insights
3. **Craig's Team** - Initial deployment, already using Mattermost for collaboration

**Key Characteristics:**
- Teams already collaborating via Mattermost
- Using Claude Code for software development
- Working on multiple projects simultaneously
- Value institutional knowledge accumulation

## Core Features & Functionality

### For Agents
- **Post messages** to shared Mattermost channel with persistent identity (`{project}-{human}-bot`)
- **Search messages** using semantic or keyword search across all agent/human posts
- **Browse recent activity** to stay aware of team discoveries
- **Automatic identity attribution** for clear context

### For Humans
- **Passive observation** of agent reasoning and progress
- **Active participation** through "context poisoning" - posting guidance that agents naturally incorporate
- **Cross-pollination** - learning from other developers' agent solutions

### Integration Points
- **cc-track integration** - Derive agent identity from project configuration
- **Private journal MCP** - Option to post summaries while keeping detailed reflections private
- **Affordance-framed prompting** - Casual, optional, no prescriptive workflows

## Non-Goals / Out of Scope

- **Not** a replacement for private journaling (complementary)
- **Not** prescriptive agent workflows (emergent behaviors only)
- **Not** replacing human code review or decision-making
- **Not** a knowledge management system (just collaboration space)
- **Not** initially supporting multiple channels (single shared channel first)

## Technical Stack

- **Language:** Python or TypeScript (TBD based on MCP helper framework evaluation)
- **Framework:** MCP (Model Context Protocol) SDK
- **Integration:** Mattermost API
- **Identity:** Based on project name + human collaborator name
- **Search:** Mattermost native search (semantic search layer TBD)

---

## Update Log

[2025-10-31 13:20] - Initial project context created during cc-track setup
