#!/usr/bin/env node

/**
 * Exa MCP Server - Enhanced Version
 * 
 * An MCP server that provides access to Exa's AI-powered search capabilities.
 * Exa offers neural search that understands meaning and context, perfect for
 * finding high-quality, relevant content across the web.
 * 
 * Features:
 * - Neural and keyword search
 * - Content extraction and similarity matching
 * - Advanced filtering and categorization
 * - Comprehensive error handling and logging
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  CallToolResult,
  TextContent,
} from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';

// Exa API configuration
const EXA_API_BASE = 'https://api.exa.ai';
const API_KEY = process.env.EXA_API_KEY;

if (!API_KEY) {
  console.error('Error: EXA_API_KEY environment variable is required');
  console.error('Please set your Exa API key: export EXA_API_KEY=your_key_here');
  process.exit(1);
}

// Enhanced type definitions for Exa API responses
interface ExaSearchResult {
  id: string;
  url: string;
  title: string;
  score: number;
  publishedDate?: string;
  author?: string;
  text?: string;
  highlights?: string[];
  highlightScores?: number[];
  summary?: string;
}

interface ExaSearchResponse {
  results: ExaSearchResult[];
  autopromptString?: string;
  requestId?: string;
}

interface ExaContentResult {
  id: string;
  url: string;
  title: string;
  text: string;
  author?: string;
  publishedDate?: string;
}

interface ExaContentResponse {
  results: ExaContentResult[];
  requestId?: string;
}

interface ExaFindSimilarResponse {
  results: ExaSearchResult[];
  requestId?: string;
}

// Enhanced error handling
class ExaAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public requestId?: string
  ) {
    super(message);
    this.name = 'ExaAPIError';
  }
}

// Helper function to make API requests to Exa with enhanced error handling
async function makeExaRequest(endpoint: string, body: any): Promise<any> {
  try {
    const response = await fetch(`${EXA_API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY!,
        'User-Agent': 'exa-mcp-server/1.1.0',
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      let errorMessage = `Exa API error (${response.status}): ${responseText}`;
      
      // Try to parse error details if JSON
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // Use raw response if not JSON
      }
      
      throw new ExaAPIError(errorMessage, response.status);
    }

    return JSON.parse(responseText);
  } catch (error) {
    if (error instanceof ExaAPIError) {
      throw error;
    }
    throw new ExaAPIError(`Network error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Helper function to validate date format
function validateDateFormat(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

// Helper function to format search results
function formatSearchResults(results: ExaSearchResult[], query: string, autopromptString?: string): string {
  let output = `Found ${results.length} results for "${query}":\n\n`;
  
  results.forEach((result, index) => {
    output += `${index + 1}. **${result.title}**\n`;
    output += `   🔗 URL: ${result.url}\n`;
    output += `   📊 Relevance Score: ${result.score.toFixed(3)}\n`;
    
    if (result.author) {
      output += `   ✍️  Author: ${result.author}\n`;
    }
    
    if (result.publishedDate) {
      output += `   📅 Published: ${result.publishedDate}\n`;
    }
    
    if (result.summary) {
      output += `   📝 Summary: ${result.summary}\n`;
    }
    
    if (result.text) {
      const preview = result.text.length > 200 
        ? result.text.substring(0, 200) + '...'
        : result.text;
      output += `   📄 Content: ${preview}\n`;
    }
    
    if (result.highlights && result.highlights.length > 0) {
      const topHighlights = result.highlights.slice(0, 3);
      output += `   🔍 Key Highlights: ${topHighlights.join(' | ')}\n`;
    }
    
    output += '\n';
  });
  
  if (autopromptString) {
    output += `\n💡 _Enhanced query used: "${autopromptString}"_\n`;
  }
  
  return output;
}

// Create the MCP server - FIXED: Single argument constructor
const server = new Server({
  name: 'exa-mcp-server',
  version: '1.1.0',
  capabilities: {
    tools: {},
  },
});

// Enhanced tool definitions with better descriptions and validation
const TOOLS: Tool[] = [
  {
    name: 'exa_search',
    description: 'Search the web using Exa\'s AI-powered neural search. Perfect for finding high-quality, contextually relevant content. Supports both neural (AI-powered) and keyword search modes.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query. Use natural language for neural search or keywords for traditional search.',
          minLength: 1,
          maxLength: 500,
        },
        num_results: {
          type: 'number',
          description: 'Number of results to return (1-100)',
          minimum: 1,
          maximum: 100,
          default: 10,
        },
        include_domains: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of domains to include in search (e.g., ["reddit.com", "github.com"])',
          maxItems: 20,
        },
        exclude_domains: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of domains to exclude from search',
          maxItems: 20,
        },
        start_crawl_date: {
          type: 'string',
          description: 'Start date for content crawling (YYYY-MM-DD format)',
          pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        },
        end_crawl_date: {
          type: 'string',
          description: 'End date for content crawling (YYYY-MM-DD format)',
          pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        },
        start_published_date: {
          type: 'string',
          description: 'Start date for published content (YYYY-MM-DD format)',
          pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        },
        end_published_date: {
          type: 'string',
          description: 'End date for published content (YYYY-MM-DD format)',
          pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        },
        use_autoprompt: {
          type: 'boolean',
          description: 'Let Exa automatically enhance the search query for better results',
          default: true,
        },
        type: {
          type: 'string',
          enum: ['neural', 'keyword'],
          description: 'Search type: "neural" for AI-powered semantic search, "keyword" for traditional search',
          default: 'neural',
        },
        category: {
          type: 'string',
          enum: [
            'company',
            'research paper', 
            'news',
            'linkedin company',
            'github',
            'tweet',
            'movie',
            'song',
            'personal site',
            'pdf'
          ],
          description: 'Filter results by content category',
        },
        include_text: {
          type: 'boolean',
          description: 'Include text content in search results',
          default: false,
        },
        text_length_limit: {
          type: 'number',
          description: 'Maximum characters of text content to include per result',
          minimum: 100,
          maximum: 10000,
          default: 1000,
        },
        include_summary: {
          type: 'boolean',
          description: 'Include AI-generated summaries in results',
          default: false,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'exa_get_contents',
    description: 'Extract full text content from web pages using their URLs or Exa result IDs. Perfect for getting detailed content after finding relevant pages.',
    inputSchema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of Exa result IDs to get content for',
          maxItems: 100,
        },
        urls: {
          type: 'array',
          items: { 
            type: 'string',
            format: 'uri',
          },
          description: 'List of URLs to get content for',
          maxItems: 100,
        },
        text_length_limit: {
          type: 'number',
          description: 'Maximum characters of text content to return per page',
          minimum: 100,
          maximum: 50000,
          default: 5000,
        },
        include_html: {
          type: 'boolean',
          description: 'Include HTML content alongside text',
          default: false,
        },
      },
      oneOf: [
        { required: ['ids'] },
        { required: ['urls'] },
      ],
    },
  },
  {
    name: 'exa_find_similar',
    description: 'Find web pages similar to a given URL using Exa\'s AI similarity matching. Great for content discovery and competitive research.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          format: 'uri',
          description: 'The URL to find similar content for',
        },
        num_results: {
          type: 'number',
          description: 'Number of similar results to return (1-100)',
          minimum: 1,
          maximum: 100,
          default: 10,
        },
        include_domains: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of domains to include in similarity search',
          maxItems: 20,
        },
        exclude_domains: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of domains to exclude from similarity search',
          maxItems: 20,
        },
        start_crawl_date: {
          type: 'string',
          description: 'Start date for content crawling (YYYY-MM-DD format)',
          pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        },
        end_crawl_date: {
          type: 'string',
          description: 'End date for content crawling (YYYY-MM-DD format)',
          pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        },
        start_published_date: {
          type: 'string',
          description: 'Start date for published content (YYYY-MM-DD format)',
          pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        },
        end_published_date: {
          type: 'string',
          description: 'End date for published content (YYYY-MM-DD format)',
          pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        },
        category: {
          type: 'string',
          enum: [
            'company',
            'research paper',
            'news', 
            'linkedin company',
            'github',
            'tweet',
            'movie',
            'song',
            'personal site',
            'pdf'
          ],
          description: 'Filter similar results by content category',
        },
        include_text: {
          type: 'boolean',
          description: 'Include text content in similarity results',
          default: false,
        },
        text_length_limit: {
          type: 'number',
          description: 'Maximum characters of text content to include per result',
          minimum: 100,
          maximum: 10000,
          default: 1000,
        },
      },
      required: ['url'],
    },
  },
];

// Enhanced tool handlers with better validation and error handling
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'exa_search': {
        const {
          query,
          num_results = 10,
          include_domains,
          exclude_domains,
          start_crawl_date,
          end_crawl_date,
          start_published_date,
          end_published_date,
          use_autoprompt = true,
          type = 'neural',
          category,
          include_text = false,
          text_length_limit = 1000,
          include_summary = false,
        } = args as any;

        // Validation
        if (!query || typeof query !== 'string' || query.trim().length === 0) {
          throw new Error('Query is required and must be a non-empty string');
        }

        if (start_crawl_date && !validateDateFormat(start_crawl_date)) {
          throw new Error('start_crawl_date must be in YYYY-MM-DD format');
        }

        if (end_crawl_date && !validateDateFormat(end_crawl_date)) {
          throw new Error('end_crawl_date must be in YYYY-MM-DD format');
        }

        if (start_published_date && !validateDateFormat(start_published_date)) {
          throw new Error('start_published_date must be in YYYY-MM-DD format');
        }

        if (end_published_date && !validateDateFormat(end_published_date)) {
          throw new Error('end_published_date must be in YYYY-MM-DD format');
        }

        const requestBody: any = {
          query: query.trim(),
          numResults: Math.min(Math.max(1, num_results), 100),
          useAutoprompt: use_autoprompt,
          type,
        };

        // Add content options
        if (include_text || include_summary) {
          requestBody.contents = {};
          if (include_text) {
            requestBody.contents.text = { maxCharacters: text_length_limit };
          }
          if (include_summary) {
            requestBody.contents.summary = {};
          }
        }

        // Add optional filters
        if (include_domains?.length) {
          requestBody.includeDomains = include_domains.slice(0, 20);
        }
        if (exclude_domains?.length) {
          requestBody.excludeDomains = exclude_domains.slice(0, 20);
        }
        if (start_crawl_date) requestBody.startCrawlDate = start_crawl_date;
        if (end_crawl_date) requestBody.endCrawlDate = end_crawl_date;
        if (start_published_date) requestBody.startPublishedDate = start_published_date;
        if (end_published_date) requestBody.endPublishedDate = end_published_date;
        if (category) requestBody.category = category;

        const response: ExaSearchResponse = await makeExaRequest('/search', requestBody);

        const content: TextContent[] = [{
          type: 'text',
          text: formatSearchResults(response.results, query, response.autopromptString),
        }];

        return { content } as CallToolResult;
      }

      case 'exa_get_contents': {
        const { ids, urls, text_length_limit = 5000, include_html = false } = args as any;

        if (!ids && !urls) {
          throw new Error('Either ids or urls must be provided');
        }

        if (ids && urls) {
          throw new Error('Provide either ids or urls, not both');
        }

        const requestBody: any = {
          contents: {
            text: { maxCharacters: Math.min(Math.max(100, text_length_limit), 50000) },
          },
        };

        if (include_html) {
          requestBody.contents.html = {};
        }

        if (ids) {
          requestBody.ids = Array.isArray(ids) ? ids.slice(0, 100) : [ids];
        }
        if (urls) {
          requestBody.urls = Array.isArray(urls) ? urls.slice(0, 100) : [urls];
        }

        const response: ExaContentResponse = await makeExaRequest('/contents', requestBody);

        let output = `Retrieved content for ${response.results.length} page(s):\n\n`;
        
        response.results.forEach((result, index) => {
          output += `${index + 1}. **${result.title}**\n`;
          output += `   🔗 URL: ${result.url}\n`;
          output += `   📊 Content Length: ${result.text.length.toLocaleString()} characters\n`;
          
          if (result.author) {
            output += `   ✍️  Author: ${result.author}\n`;
          }
          
          if (result.publishedDate) {
            output += `   📅 Published: ${result.publishedDate}\n`;
          }
          
          const preview = result.text.length > 300 
            ? result.text.substring(0, 300) + '...'
            : result.text;
          output += `   📄 Preview: ${preview}\n\n`;
          
          output += `   📝 **Full Content:**\n${result.text}\n`;
          output += '\n' + '─'.repeat(80) + '\n\n';
        });

        const content: TextContent[] = [{
          type: 'text',
          text: output,
        }];

        return { content } as CallToolResult;
      }

      case 'exa_find_similar': {
        const {
          url,
          num_results = 10,
          include_domains,
          exclude_domains,
          start_crawl_date,
          end_crawl_date,
          start_published_date,
          end_published_date,
          category,
          include_text = false,
          text_length_limit = 1000,
        } = args as any;

        // Validation
        if (!url || typeof url !== 'string') {
          throw new Error('URL is required and must be a string');
        }

        // Basic URL validation
        try {
          new URL(url);
        } catch {
          throw new Error('Invalid URL format');
        }

        if (start_crawl_date && !validateDateFormat(start_crawl_date)) {
          throw new Error('start_crawl_date must be in YYYY-MM-DD format');
        }

        if (end_crawl_date && !validateDateFormat(end_crawl_date)) {
          throw new Error('end_crawl_date must be in YYYY-MM-DD format');
        }

        const requestBody: any = {
          url,
          numResults: Math.min(Math.max(1, num_results), 100),
        };

        // Add content options
        if (include_text) {
          requestBody.contents = {
            text: { maxCharacters: text_length_limit },
          };
        }

        // Add optional filters
        if (include_domains?.length) {
          requestBody.includeDomains = include_domains.slice(0, 20);
        }
        if (exclude_domains?.length) {
          requestBody.excludeDomains = exclude_domains.slice(0, 20);
        }
        if (start_crawl_date) requestBody.startCrawlDate = start_crawl_date;
        if (end_crawl_date) requestBody.endCrawlDate = end_crawl_date;
        if (start_published_date) requestBody.startPublishedDate = start_published_date;
        if (end_published_date) requestBody.endPublishedDate = end_published_date;
        if (category) requestBody.category = category;

        const response: ExaFindSimilarResponse = await makeExaRequest('/findSimilar', requestBody);

        let output = `Found ${response.results.length} pages similar to "${url}":\n\n`;
        
        response.results.forEach((result, index) => {
          output += `${index + 1}. **${result.title}**\n`;
          output += `   🔗 URL: ${result.url}\n`;
          output += `   📊 Similarity Score: ${result.score.toFixed(3)}\n`;
          
          if (result.author) {
            output += `   ✍️  Author: ${result.author}\n`;
          }
          
          if (result.publishedDate) {
            output += `   📅 Published: ${result.publishedDate}\n`;
          }
          
          if (result.text) {
            const preview = result.text.length > 200 
              ? result.text.substring(0, 200) + '...'
              : result.text;
            output += `   📄 Content: ${preview}\n`;
          }
          
          output += '\n';
        });

        const content: TextContent[] = [{
          type: 'text',
          text: output,
        }];

        return { content } as CallToolResult;
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error(`Error in tool ${name}:`, error);
    
    const errorMessage = error instanceof ExaAPIError 
      ? `Exa API Error: ${error.message}${error.statusCode ? ` (${error.statusCode})` : ''}`
      : error instanceof Error 
        ? error.message 
        : String(error);

    return {
      content: [{
        type: 'text',
        text: `❌ Error calling ${name}: ${errorMessage}`,
      }],
      isError: true,
    } as CallToolResult;
  }
});

// Start the server with enhanced error handling
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    // Log to stderr so it doesn't interfere with the MCP protocol
    console.error('🚀 Exa MCP Server v1.1.0 running on stdio');
    console.error(`📡 Connected to Exa API at ${EXA_API_BASE}`);
    console.error('✅ Ready to handle requests');
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

main().catch((error) => {
  console.error('💥 Unhandled server error:', error);
  process.exit(1);
});