# Exa MCP Server API Documentation

## Environment Setup

```bash
export EXA_API_KEY=your_exa_api_key_here
```

## MCP Configuration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "exa": {
      "command": "node",
      "args": ["path/to/exa-mcp-server.js"],
      "env": {
        "EXA_API_KEY": "your_exa_api_key_here"
      }
    }
  }
}
```

## API Reference

### Tools Overview

| Tool | Description | Use Case |
|------|-------------|----------|
| `exa_search` | AI-powered web search | Finding relevant content, research, discovery |
| `exa_get_contents` | Extract full page content | Getting detailed text from specific URLs |
| `exa_find_similar` | Find similar web pages | Content discovery, competitive research |

---

## 🔍 exa_search

Search the web using Exa's AI-powered neural search. Perfect for finding high-quality, contextually relevant content.

### Parameters

#### Required
- **`query`** (string): The search query. Use natural language for neural search or keywords for traditional search.
  - Min length: 1, Max length: 500

#### Optional
- **`num_results`** (number, default: 10): Number of results to return
  - Range: 1-100

- **`type`** (string, default: "neural"): Search type
  - Options: `"neural"`, `"keyword"`
  - `"neural"`: AI-powered semantic search
  - `"keyword"`: Traditional keyword search

- **`use_autoprompt`** (boolean, default: true): Let Exa automatically enhance the search query for better results

#### Filtering Options

- **`include_domains`** (array): List of domains to include in search
  - Example: `["reddit.com", "github.com"]`
  - Max items: 20

- **`exclude_domains`** (array): List of domains to exclude from search
  - Max items: 20

- **`category`** (string): Filter results by content category
  - Options: `"company"`, `"research paper"`, `"news"`, `"linkedin company"`, `"github"`, `"tweet"`, `"movie"`, `"song"`, `"personal site"`, `"pdf"`

#### Date Filtering

- **`start_crawl_date`** (string): Start date for content crawling
  - Format: `YYYY-MM-DD`

- **`end_crawl_date`** (string): End date for content crawling
  - Format: `YYYY-MM-DD`

- **`start_published_date`** (string): Start date for published content
  - Format: `YYYY-MM-DD`

- **`end_published_date`** (string): End date for published content
  - Format: `YYYY-MM-DD`

#### Content Options

- **`include_text`** (boolean, default: false): Include text content in search results
- **`text_length_limit`** (number, default: 1000): Maximum characters of text content to include per result
  - Range: 100-10,000
- **`include_summary`** (boolean, default: false): Include AI-generated summaries in results

### Example Usage

#### Basic Search
```json
{
  "tool": "exa_search",
  "arguments": {
    "query": "latest developments in artificial intelligence",
    "num_results": 5
  }
}
```

#### Advanced Search with Filters
```json
{
  "tool": "exa_search",
  "arguments": {
    "query": "machine learning research papers",
    "num_results": 10,
    "type": "neural",
    "category": "research paper",
    "include_domains": ["arxiv.org", "papers.nips.cc"],
    "start_published_date": "2024-01-01",
    "include_text": true,
    "include_summary": true,
    "text_length_limit": 2000
  }
}
```

### Response Format

```
Found 5 results for "artificial intelligence":

1. **The Future of AI: Trends and Predictions**
   🔗 URL: https://example.com/ai-future
   📊 Relevance Score: 0.892
   ✍️  Author: Jane Smith
   📅 Published: 2024-03-15
   📝 Summary: An overview of emerging AI trends...
   📄 Content: Artificial intelligence continues to evolve...
   🔍 Key Highlights: neural networks | machine learning | automation

💡 Enhanced query used: "latest developments artificial intelligence 2024 trends"
```

---

## 📄 exa_get_contents

Extract full text content from web pages using their URLs or Exa result IDs. Perfect for getting detailed content after finding relevant pages.

### Parameters

#### Required (one of)
- **`ids`** (array): List of Exa result IDs to get content for
  - Max items: 100

- **`urls`** (array): List of URLs to get content for
  - Max items: 100
  - Must be valid URLs

#### Optional
- **`text_length_limit`** (number, default: 5000): Maximum characters of text content to return per page
  - Range: 100-50,000

- **`include_html`** (boolean, default: false): Include HTML content alongside text

### Example Usage

#### Get Content by URLs
```json
{
  "tool": "exa_get_contents",
  "arguments": {
    "urls": [
      "https://example.com/article1",
      "https://example.com/article2"
    ],
    "text_length_limit": 10000,
    "include_html": false
  }
}
```

#### Get Content by Exa IDs
```json
{
  "tool": "exa_get_contents",
  "arguments": {
    "ids": ["exa_id_1", "exa_id_2"],
    "text_length_limit": 5000
  }
}
```

### Response Format

```
Retrieved content for 2 page(s):

1. **The Future of AI: Trends and Predictions**
   🔗 URL: https://example.com/ai-future
   📊 Content Length: 15,432 characters
   ✍️  Author: Jane Smith
   📅 Published: 2024-03-15
   📄 Preview: Artificial intelligence continues to evolve at a rapid pace...

   📝 **Full Content:**
   [Full text content of the article...]

────────────────────────────────────────────────────────────────────────────────
```

---

## 🔗 exa_find_similar

Find web pages similar to a given URL using Exa's AI similarity matching. Great for content discovery and competitive research.

### Parameters

#### Required
- **`url`** (string): The URL to find similar content for
  - Must be a valid URL format

#### Optional
- **`num_results`** (number, default: 10): Number of similar results to return
  - Range: 1-100

#### Filtering Options
- **`include_domains`** (array): List of domains to include in similarity search
  - Max items: 20

- **`exclude_domains`** (array): List of domains to exclude from similarity search
  - Max items: 20

- **`category`** (string): Filter similar results by content category
  - Options: `"company"`, `"research paper"`, `"news"`, `"linkedin company"`, `"github"`, `"tweet"`, `"movie"`, `"song"`, `"personal site"`, `"pdf"`

#### Date Filtering
- **`start_crawl_date`** (string): Start date for content crawling (YYYY-MM-DD)
- **`end_crawl_date`** (string): End date for content crawling (YYYY-MM-DD)
- **`start_published_date`** (string): Start date for published content (YYYY-MM-DD)
- **`end_published_date`** (string): End date for published content (YYYY-MM-DD)

#### Content Options
- **`include_text`** (boolean, default: false): Include text content in similarity results
- **`text_length_limit`** (number, default: 1000): Maximum characters of text content to include per result
  - Range: 100-10,000

### Example Usage

#### Basic Similarity Search
```json
{
  "tool": "exa_find_similar",
  "arguments": {
    "url": "https://example.com/ai-article",
    "num_results": 8
  }
}
```

#### Advanced Similarity Search
```json
{
  "tool": "exa_find_similar",
  "arguments": {
    "url": "https://techcrunch.com/ai-startup-news",
    "num_results": 15,
    "category": "news",
    "include_domains": ["techcrunch.com", "venturebeat.com", "wired.com"],
    "start_published_date": "2024-01-01",
    "include_text": true,
    "text_length_limit": 1500
  }
}
```

### Response Format

```
Found 8 pages similar to "https://example.com/ai-article":

1. **Machine Learning Breakthroughs in 2024**
   🔗 URL: https://similar-site.com/ml-breakthroughs
   📊 Similarity Score: 0.856
   ✍️  Author: John Doe
   📅 Published: 2024-02-20
   📄 Content: Recent advances in machine learning have shown...

2. **Deep Learning Applications in Healthcare**
   🔗 URL: https://healthtech.com/deep-learning
   📊 Similarity Score: 0.789
   📄 Content: Healthcare systems are increasingly adopting...
```

---

## Error Handling

The server provides comprehensive error handling with descriptive messages:

### Common Error Types

- **Validation Errors**: Invalid parameters, missing required fields
- **API Errors**: Exa API-specific errors with status codes
- **Network Errors**: Connection issues, timeouts
- **Format Errors**: Invalid URL formats, date formats

### Error Response Format

```json
{
  "content": [{
    "type": "text",
    "text": "❌ Error calling exa_search: Query is required and must be a non-empty string"
  }],
  "isError": true
}
```

### Date Format Validation

All date parameters must follow the `YYYY-MM-DD` format:
- ✅ Valid: `"2024-03-15"`
- ❌ Invalid: `"03/15/2024"`, `"2024-3-15"`, `"March 15, 2024"`

---

## Best Practices

### Search Optimization

1. **Use Neural Search for Semantic Queries**: When looking for conceptual or thematic content
   ```json
   {
     "query": "sustainable energy solutions for small businesses",
     "type": "neural"
   }
   ```

2. **Use Keyword Search for Specific Terms**: When searching for exact matches
   ```json
   {
     "query": "React useState hook tutorial",
     "type": "keyword"
   }
   ```

3. **Leverage Autoprompt**: Let Exa enhance your queries automatically
   ```json
   {
     "query": "climate change",
     "use_autoprompt": true
   }
   ```

### Content Retrieval

1. **Start with Search, Then Get Content**: Use `exa_search` to find relevant pages, then `exa_get_contents` for full text
2. **Set Appropriate Text Limits**: Balance between completeness and response size
3. **Use Domain Filtering**: Focus searches on trusted sources

### Similarity Matching

1. **Perfect for Competitive Research**: Find similar companies, products, or content
2. **Content Discovery**: Explore related topics and themes
3. **Quality Control**: Use category filters to maintain content quality

---

## Rate Limits & Quotas

- Consult your Exa API plan for specific rate limits
- The server respects Exa's API limitations
- Consider implementing caching for frequently accessed content