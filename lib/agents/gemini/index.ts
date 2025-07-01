/**
 * Gemini CLI Sparring Partner Integration
 * 
 * This module provides integration between Claude Code and Gemini CLI,
 * allowing Claude to use Gemini as a sparring partner for various development tasks.
 */

export { GeminiSparringPartner, geminiSparringPartner } from './sparring-partner'
export { GeminiBatchTool, geminiBatchTool } from './batch-tool-wrapper'
export { executeGeminiTask, GeminiSparring } from './claude-integration'

// Re-export types
export type { 
  GeminiSparringConfig, 
  SparringSession 
} from './sparring-partner'

export type { 
  BatchToolRequest, 
  BatchToolResponse 
} from './batch-tool-wrapper'

export type { 
  ClaudeGeminiTask 
} from './claude-integration'