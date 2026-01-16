# Convex POC

A proof-of-concept for building autonomous coding agents using the Claude Agent SDK integrated with Convex for persistent state management. This project demonstrates multi-agent coordination patterns where specialized agents (Planner, Coder, Reviewer) collaborate to complete coding tasks autonomously.

## Quick Start

See the complete multi-agent workflow demonstration in the [examples/](./examples/) directory. The email validation utility example shows how to execute a practical coding task through the full Planner→Coder→Reviewer pipeline.

[**Run the Example →](./examples/README.md)

## What This Project Demonstrates

This POC showcases a working multi-agent orchestration system with:

- **SequentialOrchestrator**: Coordinates a three-agent pipeline for autonomous coding tasks
- **Agent Specialization**: Distinct roles for Planner, Coder, and Reviewer agents
- **State Management**: Filesystem-based artifact passing for inspection and debugging
- **Optional Convex Integration**: Persistent state tracking for multi-session workflows
- **Clean Patterns**: Reusable TypeScript patterns for agent coordination

### The Workflow

```
PlannerAgent → CoderAgent → ReviewerAgent
     ↓              ↓              ↓
  plan.json     code.json    review.json
```

Each agent produces a JSON artifact that can be inspected for debugging and validation:
- **plan.json** - Task decomposition with execution steps
- **code.json** - File changes and implementation details
- **review.json** - Validation feedback with issues and approval status

## Example Task: Email Validation Utility

The demonstration example (in [examples/real-example.ts](./examples/real-example.ts)) executes a practical task through the multi-agent workflow:

**Task**: Create a TypeScript utility function for validating email addresses with regex

**What it demonstrates**:
- Concrete task definition with clear requirements
- Sequential workflow execution through all three agents
- Artifact inspection and verification utilities
- Expected output structure for each agent

**Features**:
- Agent collaboration and handoff patterns
- Filesystem-based state passing
- Error boundaries with continueOnError flag
- Optional Convex workflow tracking

**To run**: See the complete guide in [examples/README.md](./examples/README.md)

## Project Structure

```
convex-poc/
├── src/
│   ├── agents/              # Agent implementations (Planner, Coder, Reviewer)
│   ├── orchestrator/        # SequentialOrchestrator and state management
│   └── types/              # TypeScript type definitions
├── examples/               # Workflow demonstrations
│   ├── real-example.ts     # Complete email validation example
│   ├── verify-output.ts    # Artifact validation utilities
│   ├── expected-artifacts/ # Example output structures
│   └── README.md           # Detailed execution guide
└── .planning/              # Project planning and phase documentation
```

## Technical Stack

- **TypeScript/Node** - Primary development environment
- **Claude Agent SDK** - Agent session management
- **Convex** - Optional persistent state management (self-hosted via Docker)
- **SequentialOrchestrator** - Multi-agent coordination pattern

## Documentation

- **Examples & Tutorials**: [examples/README.md](./examples/README.md)
- **Project Context**: [.planning/PROJECT.md](./.planning/PROJECT.md)
- **Development Roadmap**: [.planning/ROADMAP.md](./.planning/ROADMAP.md)

## Prerequisites

- Node.js (v18 or higher)
- Anthropic API key from [console.anthropic.com](https://console.anthropic.com/)
- (Optional) Convex backend for state tracking

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd convex-poc

# Install dependencies
npm install

# Build the project
npm run build
```

## License

MIT
