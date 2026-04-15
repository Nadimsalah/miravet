# Quick MCP Setup

## One-Command Setup

```bash
pnpm setup:mcp
```

This will:
1. Prompt you for your Hostinger API token
2. Create `.cursor/mcp.json` configuration
3. Set up the MCP server for Cursor

## Manual Setup

1. **Get your API token** from https://hpanel.hostinger.com/ → Account Settings → API

2. **Create `.cursor/mcp.json`**:
   ```json
   {
     "mcpServers": {
       "hostinger-mcp": {
         "command": "npx",
         "args": ["hostinger-api-mcp@latest"],
         "env": {
           "API_TOKEN": "your_token_here"
         }
       }
     }
   }
   ```

3. **Restart Cursor**

4. **Start using it!**
   - "Deploy this app to Hostinger"
   - "Check my server status"
   - "List my domains"

For full documentation, see [HOSTINGER_MCP_SETUP.md](./HOSTINGER_MCP_SETUP.md)
