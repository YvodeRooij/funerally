/**
 * Claude Code Integration for Gemini CLI Sparring Partner
 * 
 * This module provides integration between Claude Code's batch tools
 * and the Gemini CLI, allowing Claude to use Gemini as a sparring partner
 * for various tasks like brainstorming, code review, and debugging.
 */

import { geminiBatchTool } from './batch-tool-wrapper'

export interface ClaudeGeminiTask {
  type: 'brainstorm' | 'review_code' | 'debug' | 'consult'
  description: string
  params?: any
}

/**
 * Main integration function that Claude Code can call via Task tool
 */
export async function executeGeminiTask(task: ClaudeGeminiTask): Promise<string> {
  try {
    switch (task.type) {
      case 'brainstorm':
        return await geminiBatchTool.runTask(
          `Brainstorm: ${task.description}`,
          {
            topic: task.description,
            perspectives: task.params?.perspectives || ['technical', 'user-experience', 'implementation'],
            depth: task.params?.depth || 'deep'
          }
        )

      case 'review_code':
        return await geminiBatchTool.runTask(
          `Review code: ${task.description}`,
          {
            code: task.params?.code || task.description,
            language: task.params?.language || 'typescript'
          }
        )

      case 'debug':
        return await geminiBatchTool.runTask(
          `Debug: ${task.description}`,
          {
            error: task.params?.error || task.description,
            context: task.params?.context || ''
          }
        )

      case 'consult':
      default:
        return await geminiBatchTool.runTask(task.description, task.params)
    }
  } catch (error) {
    return `Gemini Sparring Partner Error: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

/**
 * Convenience functions for specific use cases
 */
export const GeminiSparring = {
  /**
   * Brainstorm ideas with Gemini
   */
  async brainstorm(topic: string, options?: { perspectives?: string[], depth?: 'shallow' | 'deep' }) {
    return executeGeminiTask({
      type: 'brainstorm',
      description: topic,
      params: options
    })
  },

  /**
   * Get code review from Gemini
   */
  async reviewCode(code: string, language: string = 'typescript') {
    return executeGeminiTask({
      type: 'review_code',
      description: 'Code review request',
      params: { code, language }
    })
  },

  /**
   * Get debugging assistance from Gemini
   */
  async debugHelp(error: string, context: string) {
    return executeGeminiTask({
      type: 'debug',
      description: error,
      params: { error, context }
    })
  },

  /**
   * General consultation with Gemini
   */
  async consult(query: string) {
    return executeGeminiTask({
      type: 'consult',
      description: query
    })
  }
}

// Export for use in claude-flow integration
const geminiIntegration = {
  executeGeminiTask,
  GeminiSparring
}

export default geminiIntegration