# Hostinger MCP Server Setup

This guide will help you set up the Hostinger MCP (Model Context Protocol) server for direct API integration with your Hostinger account.

## What is MCP?

MCP (Model Context Protocol) allows AI assistants like Cursor to directly interact with your Hostinger account through their API, enabling automated deployments, server management, and more.

## Setup Instructions

### Step 1: Get Your Hostinger API Token

1. **Log in to Hostinger**
   - Go to https://hpanel.hostinger.com/
   - Log in with your credentials

2. **Navigate to API Settings**
   - Go to **Account Settings** → **API** (or Developer Settings)
   - If you don't see API settings, you may need to enable API access in your hosting plan

3. **Generate API Token**
   - Click **Generate New Token** or **Create API Key**
   - Give it a descriptive name (e.g., "Cursor MCP Integration")
   - Copy the token immediately (you won't be able to see it again)

### Step 2: Configure MCP Server

#### Option A: Using Project Configuration (Recommended)

1. **Edit the MCP configuration file**
   ```bash
   # Open the file
   .cursor/mcp.json
   ```

2. **Replace `ENTER_TOKEN_HERE` with your actual API token**
   ```json
   {
     "mcpServers": {
       "hostinger-mcp": {
         "command": "npx",
         "args": [
           "hostinger-api-mcp@latest"
         ],
         "env": {
           "API_TOKEN": "your_actual_token_here"
         }
       }
     }
   }
   ```

#### Option B: Using Cursor Global Settings

If you prefer to configure it globally in Cursor:

1. Open Cursor Settings
2. Go to **Features** → **MCP Servers** (or search for "MCP")
3. Add the server configuration:
   - **Name**: `hostinger-mcp`
   - **Command**: `npx`
   - **Args**: `hostinger-api-mcp@latest`
   - **Environment Variables**:
     - `API_TOKEN`: Your Hostinger API token

### Step 3: Verify Installation

1. **Restart Cursor** to load the MCP server configuration

2. **Test the connection**
   - The MCP server should automatically install when first used
   - You can verify it's working by asking Cursor to interact with your Hostinger account

## Using the MCP Server

Once configured, you can use natural language commands to:

- **Deploy your application**
  - "Deploy this app to my Hostinger account"
  - "Push the latest build to Hostinger"

- **Manage servers**
  - "List my Hostinger domains"
  - "Check my server status"
  - "Restart my Node.js app"

- **Manage files**
  - "Upload files to my Hostinger server"
  - "Check server logs"

- **Environment management**
  - "Update environment variables on Hostinger"
  - "Set production environment variables"

## Security Best Practices

1. **Never commit your API token to Git**
   - The `.cursor/mcp.json` file should be in `.gitignore` (already configured)
   - Use environment variables or Cursor's secure storage

2. **Use environment variables (Alternative)**
   
   Instead of hardcoding the token, you can use an environment variable:
   
   ```json
   {
     "mcpServers": {
       "hostinger-mcp": {
         "command": "npx",
         "args": [
           "hostinger-api-mcp@latest"
         ],
         "env": {
           "API_TOKEN": "${HOSTINGER_API_TOKEN}"
         }
       }
     }
   }
   ```
   
   Then set the environment variable:
   ```bash
   export HOSTINGER_API_TOKEN="your_token_here"
   ```

3. **Rotate tokens regularly**
   - Generate new tokens periodically
   - Revoke old tokens that are no longer needed

## Troubleshooting

### MCP Server Not Found

If you get an error that the MCP server isn't found:

```bash
# Try installing it manually first
npx hostinger-api-mcp@latest --help
```

### Authentication Errors

- Verify your API token is correct
- Check that the token hasn't expired
- Ensure your Hostinger account has API access enabled

### Connection Issues

- Check your internet connection
- Verify Hostinger API is accessible
- Check Cursor's MCP server logs (View → Output → MCP)

## Integration with Deployment Workflows

The MCP server can work alongside the existing deployment methods:

- **GitHub Actions**: Still works for automated CI/CD
- **Manual Scripts**: Can be used for local deployments
- **MCP Server**: Enables AI-assisted deployments and management

You can use all three methods together for maximum flexibility!

## Additional Resources

- [Hostinger API Documentation](https://developers.hostinger.com/)
- [MCP Protocol Documentation](https://modelcontextprotocol.io/)
- [Cursor MCP Guide](https://docs.cursor.com/mcp)

## Support

If you encounter issues:

1. Check the MCP server logs in Cursor
2. Verify your API token is valid
3. Ensure your Hostinger plan supports API access
4. Contact Hostinger support for API-related issues
