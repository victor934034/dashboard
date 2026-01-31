# 🚀 Antigravity n8n Workflow Builder Guide

## 📋 Overview

This guide helps you create high-quality n8n workflows using the n8n-MCP server and n8n-skills. You have access to powerful tools that understand 1,084+ n8n nodes, 2,709 workflow templates, and can validate and deploy workflows directly to your n8n instance.

---

## 🎯 Your n8n Environment

### Available Tools
- **n8n-MCP Server**: Bridge between AI and n8n with 20 specialized tools
- **n8n-Skills**: 7 expert skills for workflow creation
- **Template Library**: 2,709 pre-built workflows
- **Node Database**: 1,084 nodes (537 core + 547 community)

### n8n Instance Configuration
```
URL: https://vendas-n8n.zdc13k.easypanel.host/
API URL: https://vendas-n8n.zdc13k.easypanel.host/api/v1
```

---

## 🛠️ Workflow Creation Process

### Step 1: Define the Workflow Goal
Before creating any workflow, clearly define:
- **Trigger**: What starts the workflow? (Webhook, Schedule, Manual, etc.)
- **Actions**: What should happen?
- **Data Flow**: How does data move between nodes?
- **Output**: What's the final result?

### Step 2: Search for Similar Templates
Use `search_templates` to find existing workflows:

```typescript
// Example: Find webhook processing templates
search_templates({
  searchMode: "by_task",
  task: "webhook_processing"
})

// Example: Find templates using specific nodes
search_templates({
  searchMode: "by_nodes",
  nodeTypes: ["n8n-nodes-base.httpRequest", "n8n-nodes-base.googleSheets"]
})
```

### Step 3: Search for Required Nodes
Use `search_nodes` to find the right nodes:

```typescript
// Example: Find database nodes
search_nodes({
  query: "database postgres mysql",
  mode: "OR",
  includeExamples: true
})

// Example: Find AI nodes
search_nodes({
  query: "openai chatgpt ai",
  source: "all"
})
```

### Step 4: Get Node Configuration Details
Use `get_node` to understand node properties:

```typescript
// Get detailed node information
get_node({
  nodeType: "n8n-nodes-base.httpRequest",
  detail: "standard",
  mode: "info"
})

// Search for specific properties
get_node({
  nodeType: "n8n-nodes-base.googleSheets",
  mode: "search_properties",
  propertyQuery: "auth"
})
```

### Step 5: Build the Workflow
Create nodes and connections following these patterns:

#### Pattern 1: Webhook Processing
```json
{
  "nodes": [
    {
      "id": "webhook",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [250, 300],
      "parameters": {
        "path": "your-webhook-path",
        "httpMethod": "POST",
        "responseMode": "onReceived"
      }
    },
    {
      "id": "process",
      "name": "Process Data",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [450, 300],
      "parameters": {
        "jsCode": "// Access webhook data from $json.body\nconst data = $json.body;\nreturn [{json: {processed: data}}];"
      }
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{"node": "Process Data", "type": "main", "index": 0}]]
    }
  }
}
```

#### Pattern 2: HTTP API Integration
```json
{
  "nodes": [
    {
      "id": "http",
      "name": "HTTP Request",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [250, 300],
      "parameters": {
        "method": "POST",
        "url": "https://api.example.com/endpoint",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {"name": "key", "value": "={{ $json.value }}"}
          ]
        }
      }
    }
  ]
}
```

#### Pattern 3: Database Operations
```json
{
  "nodes": [
    {
      "id": "postgres",
      "name": "Postgres",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2,
      "position": [250, 300],
      "parameters": {
        "operation": "executeQuery",
        "query": "SELECT * FROM users WHERE id = $1",
        "queryParameters": "={{ [$json.userId] }}"
      }
    }
  ]
}
```

### Step 6: Validate the Workflow
Use `validate_workflow` before deployment:

```typescript
validate_workflow({
  workflow: workflowObject,
  options: {
    profile: "runtime",
    validateNodes: true,
    validateConnections: true,
    validateExpressions: true
  }
})
```

### Step 7: Deploy to n8n
Use `n8n_create_workflow` or `n8n_deploy_template`:

```typescript
// Create from scratch
n8n_create_workflow({
  name: "My Workflow",
  nodes: [...],
  connections: {...}
})

// Deploy from template
n8n_deploy_template({
  templateId: 1234,
  autoFix: true,
  autoUpgradeVersions: true
})
```

---

## 🎓 Best Practices

### 1. Expression Syntax
```javascript
// ✅ CORRECT: Access webhook data
$json.body.fieldName

// ✅ CORRECT: Access previous node data
$node["Node Name"].json.field

// ✅ CORRECT: Use built-in functions
{{ $now.toFormat('yyyy-MM-dd') }}

// ❌ WRONG: Missing $json.body for webhooks
$json.fieldName  // This won't work for webhook data!
```

### 2. Code Node Patterns
```javascript
// ✅ CORRECT: Return format
return [{json: {result: "value"}}];

// ✅ CORRECT: Access all items
for (const item of $input.all()) {
  console.log(item.json);
}

// ✅ CORRECT: HTTP request with $helpers
const response = await $helpers.httpRequest({
  method: 'POST',
  url: 'https://api.example.com',
  body: {data: $json.value}
});

// ❌ WRONG: Don't use expressions in Code nodes
// Use JavaScript directly instead
```

### 3. Error Handling
```json
{
  "continueOnFail": true,
  "retryOnFail": true,
  "maxTries": 3,
  "waitBetweenTries": 1000
}
```

### 4. Credentials Management
- Never hardcode credentials
- Use n8n credential system
- Reference credentials by name in node configuration

---

## 📚 Common Workflow Patterns

### Pattern 1: Webhook → Process → Response
**Use Case**: API endpoint that processes data and returns result

**Nodes**:
1. Webhook (trigger)
2. Code/Function (process)
3. Respond to Webhook (response)

### Pattern 2: Schedule → Fetch → Transform → Store
**Use Case**: Daily data sync from API to database

**Nodes**:
1. Schedule Trigger
2. HTTP Request (fetch)
3. Code (transform)
4. Database node (store)

### Pattern 3: Webhook → IF → Branch A/B → Merge
**Use Case**: Conditional processing based on input

**Nodes**:
1. Webhook
2. IF node
3. Branch A nodes
4. Branch B nodes
5. Merge node (optional)

### Pattern 4: Trigger → AI Agent → Tool Nodes → Response
**Use Case**: AI-powered automation with tool calling

**Nodes**:
1. Trigger (Webhook/Chat)
2. AI Agent
3. Tool nodes (HTTP, Database, etc.)
4. Response node

### Pattern 5: Manual → Loop → Process Each → Aggregate
**Use Case**: Batch processing of items

**Nodes**:
1. Manual Trigger
2. Split In Batches / Loop Over Items
3. Process node
4. Aggregate node

---

## 🔧 n8n-MCP Tools Reference

### Core Tools (Always Available)

#### 1. `search_nodes`
Find nodes by keyword
```typescript
search_nodes({
  query: "webhook http api",
  mode: "OR",
  source: "all",
  includeExamples: true,
  limit: 20
})
```

#### 2. `get_node`
Get detailed node information
```typescript
get_node({
  nodeType: "n8n-nodes-base.webhook",
  detail: "standard",
  mode: "info"
})
```

#### 3. `validate_node`
Validate node configuration
```typescript
validate_node({
  nodeType: "n8n-nodes-base.httpRequest",
  config: {
    method: "POST",
    url: "https://api.example.com"
  },
  mode: "full"
})
```

#### 4. `validate_workflow`
Validate complete workflow
```typescript
validate_workflow({
  workflow: {...},
  options: {
    profile: "runtime",
    validateNodes: true,
    validateConnections: true,
    validateExpressions: true
  }
})
```

#### 5. `search_templates`
Find workflow templates
```typescript
search_templates({
  searchMode: "keyword",
  query: "chatbot",
  limit: 10
})
```

#### 6. `get_template`
Get template details
```typescript
get_template({
  templateId: 1234,
  mode: "full"
})
```

#### 7. `tools_documentation`
Get help on MCP tools
```typescript
tools_documentation({
  topic: "search_nodes",
  depth: "full"
})
```

### n8n Management Tools (Requires API Configuration)

#### 8. `n8n_health_check`
Check n8n instance status
```typescript
n8n_health_check({
  mode: "diagnostic"
})
```

#### 9. `n8n_list_workflows`
List all workflows
```typescript
n8n_list_workflows({
  active: true,
  limit: 100
})
```

#### 10. `n8n_get_workflow`
Get workflow by ID
```typescript
n8n_get_workflow({
  id: "workflow-id",
  mode: "full"
})
```

#### 11. `n8n_create_workflow`
Create new workflow
```typescript
n8n_create_workflow({
  name: "My Workflow",
  nodes: [...],
  connections: {...}
})
```

#### 12. `n8n_update_full_workflow`
Update entire workflow
```typescript
n8n_update_full_workflow({
  id: "workflow-id",
  nodes: [...],
  connections: {...}
})
```

#### 13. `n8n_update_partial_workflow`
Update workflow incrementally
```typescript
n8n_update_partial_workflow({
  id: "workflow-id",
  operations: [
    {type: "addNode", node: {...}},
    {type: "updateNode", nodeName: "...", updates: {...}}
  ]
})
```

#### 14. `n8n_delete_workflow`
Delete workflow
```typescript
n8n_delete_workflow({
  id: "workflow-id"
})
```

#### 15. `n8n_validate_workflow`
Validate workflow in n8n
```typescript
n8n_validate_workflow({
  id: "workflow-id"
})
```

#### 16. `n8n_deploy_template`
Deploy template to n8n
```typescript
n8n_deploy_template({
  templateId: 1234,
  autoFix: true,
  autoUpgradeVersions: true
})
```

#### 17. `n8n_test_workflow`
Test workflow execution
```typescript
n8n_test_workflow({
  workflowId: "workflow-id",
  triggerType: "webhook",
  data: {...}
})
```

#### 18. `n8n_executions`
Manage workflow executions
```typescript
n8n_executions({
  action: "list",
  workflowId: "workflow-id",
  limit: 10
})
```

#### 19. `n8n_autofix_workflow`
Auto-fix common errors
```typescript
n8n_autofix_workflow({
  id: "workflow-id",
  applyFixes: true
})
```

#### 20. `n8n_workflow_versions`
Manage workflow versions
```typescript
n8n_workflow_versions({
  mode: "list",
  workflowId: "workflow-id"
})
```

---

## 🚨 Common Pitfalls & Solutions

### 1. Webhook Data Access
**Problem**: Can't access webhook data
**Solution**: Use `$json.body` not `$json`
```javascript
// ✅ CORRECT
const data = $json.body.fieldName;

// ❌ WRONG
const data = $json.fieldName;
```

### 2. Expression vs Code Node
**Problem**: Using expressions in Code nodes
**Solution**: Use JavaScript directly
```javascript
// ✅ CORRECT in Code node
const value = $json.field;

// ❌ WRONG in Code node
const value = {{ $json.field }};  // Don't use {{ }} in Code nodes!
```

### 3. Return Format in Code Nodes
**Problem**: Incorrect return format
**Solution**: Always return array of objects with `json` property
```javascript
// ✅ CORRECT
return [{json: {result: "value"}}];

// ❌ WRONG
return {result: "value"};
```

### 4. Node Type Format
**Problem**: Wrong nodeType format
**Solution**: Use correct prefix
```javascript
// ✅ CORRECT for MCP tools
"n8n-nodes-base.httpRequest"

// ✅ CORRECT for workflow JSON
"nodes-base.httpRequest"
```

### 5. Missing Dependencies
**Problem**: Property requires another property
**Solution**: Check property dependencies
```json
{
  "sendBody": true,
  "contentType": "json",  // Required when sendBody is true
  "bodyParameters": {...}
}
```

---

## 📖 Integration Examples

### Example 1: Google Sheets + Webhook
```json
{
  "name": "Webhook to Google Sheets",
  "nodes": [
    {
      "id": "webhook",
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [250, 300],
      "parameters": {
        "path": "submit-form",
        "httpMethod": "POST"
      }
    },
    {
      "id": "sheets",
      "name": "Google Sheets",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4,
      "position": [450, 300],
      "parameters": {
        "operation": "append",
        "sheetId": "your-sheet-id",
        "range": "Sheet1!A:Z",
        "options": {}
      },
      "credentials": {
        "googleSheetsOAuth2Api": {
          "id": "1",
          "name": "Google Sheets account"
        }
      }
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{"node": "Google Sheets", "type": "main", "index": 0}]]
    }
  }
}
```

### Example 2: AI Chatbot with Tools
```json
{
  "name": "AI Chatbot with Database",
  "nodes": [
    {
      "id": "chat",
      "name": "Chat Trigger",
      "type": "@n8n/n8n-nodes-langchain.chatTrigger",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "id": "agent",
      "name": "AI Agent",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 1,
      "position": [450, 300],
      "parameters": {
        "promptType": "define",
        "text": "You are a helpful assistant with access to a database."
      }
    },
    {
      "id": "tool",
      "name": "Database Tool",
      "type": "@n8n/n8n-nodes-langchain.toolWorkflow",
      "typeVersion": 1,
      "position": [450, 450],
      "parameters": {
        "name": "search_database",
        "description": "Search the database for information"
      }
    }
  ],
  "connections": {
    "Chat Trigger": {
      "main": [[{"node": "AI Agent", "type": "main", "index": 0}]]
    },
    "Database Tool": {
      "ai_tool": [[{"node": "AI Agent", "type": "ai_tool", "index": 0}]]
    }
  }
}
```

---

## 🎯 Workflow Creation Checklist

Before deploying any workflow:

- [ ] Clear goal and trigger defined
- [ ] All required nodes identified
- [ ] Node configurations validated
- [ ] Connections properly defined
- [ ] Error handling configured
- [ ] Credentials properly referenced
- [ ] Expressions tested
- [ ] Workflow validated with `validate_workflow`
- [ ] Test execution successful
- [ ] Documentation added (notes in nodes)

---

## 📚 Additional Resources

- **n8n Documentation**: https://docs.n8n.io
- **n8n Community**: https://community.n8n.io
- **n8n Templates**: https://n8n.io/workflows
- **n8n-MCP GitHub**: https://github.com/czlonkowski/n8n-mcp
- **n8n-Skills GitHub**: https://github.com/czlonkowski/n8n-skills

---

## 🆘 Getting Help

When asking for help with workflow creation:

1. **Describe the goal**: What are you trying to achieve?
2. **Show the error**: Include validation errors or execution errors
3. **Share the workflow**: Provide the workflow JSON
4. **Mention the nodes**: Which nodes are you using?
5. **Include data samples**: Show example input/output data

---

**Remember**: Always test workflows in development before deploying to production! 🚀
