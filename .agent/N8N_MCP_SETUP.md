# n8n MCP Server Configuration for Antigravity

## Installation Status

✅ **n8n-skills installed**: `.agent/skills/n8n-skills/`
✅ **EspoCRM skill created**: `.agent/skills/espocrm-integration/`
✅ **Antigravity.md guide created**: Root directory

## MCP Server Setup

To use the n8n-MCP server with Antigravity, you need to configure it in your MCP settings.

### Option 1: Hosted Service (Recommended)

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "npx",
      "args": ["-y", "n8n-mcp@latest"]
    }
  }
}
```

### Option 2: Local Installation

```bash
npm install -g n8n-mcp
```

Then configure:

```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "n8n-mcp"
    }
  }
}
```

### Option 3: With n8n API Access

For full workflow management capabilities:

```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "npx",
      "args": ["-y", "n8n-mcp@latest"],
      "env": {
        "N8N_API_URL": "https://dashboard-n8n-dashboard.zdc13k.easypanel.host/api/v1",
        "N8N_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Getting n8n API Key

1. Open your n8n instance: https://dashboard-n8n-dashboard.zdc13k.easypanel.host/
2. Go to **Settings** → **API**
3. Click **Create API Key**
4. Copy the key and add to MCP configuration

## Available Skills

### 1. n8n Expression Syntax
**Location**: `.agent/skills/n8n-skills/n8n-expression-syntax/`
- Teaches correct n8n expression syntax
- Core variables ($json, $node, $now, $env)
- Common mistakes catalog

### 2. n8n MCP Tools Expert
**Location**: `.agent/skills/n8n-skills/n8n-mcp-tools-expert/`
- Expert guide for using n8n-mcp tools
- Tool selection guide
- Validation profiles
- Smart parameters

### 3. n8n Workflow Patterns
**Location**: `.agent/skills/n8n-skills/n8n-workflow-patterns/`
- 5 proven architectural patterns
- Workflow creation checklist
- Real examples from templates

### 4. n8n Validation Expert
**Location**: `.agent/skills/n8n-skills/n8n-validation-expert/`
- Interpret validation errors
- Auto-sanitization behavior
- False positives guide

### 5. n8n Node Configuration
**Location**: `.agent/skills/n8n-skills/n8n-node-configuration/`
- Operation-aware node configuration
- Property dependency rules
- AI connection types

### 6. n8n Code JavaScript
**Location**: `.agent/skills/n8n-skills/n8n-code-javascript/`
- Write effective JavaScript in Code nodes
- Data access patterns
- Built-in functions
- Top 5 error patterns

### 7. n8n Code Python
**Location**: `.agent/skills/n8n-skills/n8n-code-python/`
- Python in Code nodes
- Important limitations
- Standard library reference

### 8. EspoCRM Integration
**Location**: `.agent/skills/espocrm-integration/`
- EspoCRM REST API
- n8n integration patterns
- Webhook configuration
- Entity management

## Usage

Once configured, you can use the n8n-MCP tools by simply asking questions like:

- "Search for webhook nodes in n8n"
- "Create a workflow that processes form submissions"
- "Show me how to use the HTTP Request node"
- "Validate this workflow configuration"
- "Deploy a template to my n8n instance"

The skills will automatically activate when relevant!

## Troubleshooting

### MCP Server Not Found
- Ensure you have Node.js installed
- Try running `npx -y n8n-mcp@latest` manually to test

### API Connection Issues
- Verify your n8n instance is accessible
- Check API key is correct
- Ensure API is enabled in n8n settings

### Skills Not Activating
- Check skills are in `.agent/skills/` directory
- Verify SKILL.md files have proper YAML frontmatter
- Restart your IDE/editor

## Next Steps

1. Configure MCP server in your settings
2. Get n8n API key from your instance
3. Start creating workflows using the guide in `Antigravity.md`
4. Use skills automatically when working with n8n

---

**Ready to build amazing n8n workflows! 🚀**
