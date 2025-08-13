# Exa MCP Server

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

An enterprise-grade **Model Context Protocol (MCP) server** that provides comprehensive access to [Exa's](https://exa.ai) AI-powered search capabilities. Transform your AI applications with neural search that understands meaning and context, perfect for finding high-quality, relevant content across the web.

## Features

### Core Search Capabilities
- **Neural Search** - AI-powered semantic search that understands meaning and context
- **Keyword Search** - Traditional search with precise keyword matching
- **Content Extraction** - Extract full text content from web pages
- **Similarity Matching** - Find similar content using advanced AI similarity algorithms

### Advanced Features
- **Smart Filtering** - Filter by domains, dates, content categories, and more
- **Rich Metadata** - Get relevance scores, publication dates, authors, and summaries
- **Flexible Configuration** - Customize search parameters for different use cases
- **High Performance** - Optimized for speed and reliability
- **Error Handling** - Comprehensive error handling and logging

### Content Categories
Filter search results by specific content types:
- 🏢 Companies and LinkedIn profiles
- 📚 Research papers and academic content
- 📰 News articles and media
- 💻 GitHub repositories and technical content
- 🐦 Social media posts (Twitter)
- 🎬 Entertainment content (movies, songs)
- 📋 Personal sites and PDFs

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Exa API Key** - [Get your free key at exa.ai](https://exa.ai)
- **Claude Desktop** (for MCP integration) - [Download here](https://claude.ai/desktop)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Rchintalapati0111/exa_mcp_server.git
   cd exa_mcp_server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up your Exa API key**
   ```bash
   export EXA_API_KEY="your_exa_api_key_here"
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Test the server**
   ```bash
   # Start the server
   npm start
   
   # In another terminal, test the tools
   echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | npm start
   ```

## 🔧 Configuration

### Claude Desktop Integration

Add the following to your Claude Desktop configuration file:

**Location:** 
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "exa-search": {
      "command": "node",
      "args": ["/path/to/your/exa_mcp_server/build/index.js"],
      "env": {
        "EXA_API_KEY": "your_exa_api_key_here"
      }
    }
  }
}
```

### Development Mode

For development with auto-reload:

```bash
# Install tsx globally (recommended)
npm install -g tsx

# Run in development mode
npm run dev
```

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `EXA_API_KEY` | ✅ | Your Exa API key | - |
| `NODE_ENV` | ❌ | Environment mode | `production` |

## 🛠️ Available Tools

### 1. `exa_search`
**AI-powered web search with neural understanding**

```typescript
// Basic search
{
  "query": "latest developments in quantum computing",
  "num_results": 10,
  "type": "neural"
}

// Advanced search with filters
{
  "query": "machine learning research papers",
  "num_results": 20,
  "type": "neural",
  "category": "research paper",
  "start_published_date": "2024-01-01",
  "include_domains": ["arxiv.org", "nature.com"],
  "include_summary": true
}
```

**Parameters:**
- `query` (required): Search query string
- `num_results`: Number of results (1-100, default: 10)
- `type`: "neural" or "keyword" (default: "neural")
- `include_domains`: Array of domains to include
- `exclude_domains`: Array of domains to exclude
- `start_published_date`/`end_published_date`: Date range (YYYY-MM-DD)
- `category`: Content type filter
- `include_text`: Include full text content
- `include_summary`: Include AI-generated summaries
- `use_autoprompt`: Let Exa enhance your query (default: true)

### 2. `exa_get_contents`
**Extract full text content from web pages**

```typescript
// Extract content from URLs
{
  "urls": [
    "https://example.com/article1",
    "https://example.com/article2"
  ],
  "text_length_limit": 5000
}

// Extract content from Exa result IDs
{
  "ids": ["result_id_1", "result_id_2"],
  "include_html": true
}
```

**Parameters:**
- `urls` OR `ids` (required): URLs or Exa result IDs
- `text_length_limit`: Max characters per page (100-50000, default: 5000)
- `include_html`: Include HTML content alongside text

### 3. `exa_find_similar`
**Find web pages similar to a given URL**

```typescript
{
  "url": "https://openai.com/blog/chatgpt",
  "num_results": 15,
  "category": "news",
  "include_text": true
}
```

**Parameters:**
- `url` (required): Reference URL for similarity search
- `num_results`: Number of similar results (1-100, default: 10)
- `include_domains`/`exclude_domains`: Domain filters
- `category`: Content type filter
- `include_text`: Include content in results

## 📖 Usage Examples

### Basic Web Search
```bash
# Neural search for AI topics
echo '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "exa_search",
    "arguments": {
      "query": "artificial intelligence breakthroughs 2024",
      "num_results": 5,
      "include_summary": true
    }
  }
}' | npm start
```

### Research Paper Discovery
```bash
# Find recent ML research papers
echo '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "exa_search",
    "arguments": {
      "query": "transformer architecture improvements",
      "category": "research paper",
      "include_domains": ["arxiv.org"],
      "start_published_date": "2024-01-01",
      "num_results": 10
    }
  }
}' | npm start
```

### Content Extraction
```bash
# Extract content from specific URLs
echo '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "exa_get_contents",
    "arguments": {
      "urls": ["https://example.com/article"],
      "text_length_limit": 3000
    }
  }
}' | npm start
```

## 🏗️ Development

### Project Structure
```
exa_mcp_server/
├── src/
│   └── index.ts              # Main server implementation
├── .gitignore               # Properly excluding build files
├── README.md                # Comprehensive documentation ✅
├── claude_desktop_config.json # Example configuration
├── package-lock.json        # Dependency lock file
├── package.json             # Project configuration
└── tsconfig.json           # TypeScript configuration
```

### Building
```bash
# Clean build
npm run build

# Development with watch mode
npm run dev

# Type checking
npx tsc --noEmit
```

### Code Quality
```bash
# Linting
npm run lint

# Formatting
npm run format

# Run tests
npm test
```

### Adding New Features

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** with proper TypeScript types
4. **Add tests** for new functionality
5. **Update documentation** as needed
6. **Submit a pull request**

## 🐛 Troubleshooting

### Common Issues

**❌ "EXA_API_KEY environment variable is required"**
```bash
# Solution: Set your API key
export EXA_API_KEY="your_actual_api_key"
```

**❌ "Network error" or "Connection refused"**
- Check your internet connection
- Verify your API key is valid
- Ensure you haven't exceeded rate limits

**❌ "Unknown tool" error**
- Restart Claude Desktop after configuration changes
- Verify the server is running correctly
- Check the MCP configuration file path

**❌ TypeScript compilation errors**
```bash
# Clean and rebuild
rm -rf build/
npm run build
```

### Debug Mode

Enable verbose logging:
```bash
NODE_ENV=development npm start
```

### Performance Tips

1. **Use appropriate `num_results`** - Don't request more results than needed
2. **Filter domains** - Use `include_domains` for faster, focused searches
3. **Limit text content** - Adjust `text_length_limit` based on your needs
4. **Cache results** - Store frequently accessed content locally

## 📊 API Limits & Pricing

- **Rate Limits:** Exa API has generous rate limits for most use cases
- **Pricing:** Check [exa.ai pricing](https://exa.ai/pricing) for current rates
- **Free Tier:** Available for development and testing


### Development Setup
```bash
# Clone and setup
git clone https://github.com/Rchintalapati0111/exa_mcp_server.git
cd exa_mcp_server
npm install

# Set up pre-commit hooks
npm run prepare
```



