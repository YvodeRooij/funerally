import { GeminiSparringPartner } from './sparring-partner'

export interface BatchToolRequest {
  action: 'brainstorm' | 'review' | 'debug' | 'query' | 'create_session'
  params: any
}

export interface BatchToolResponse {
  success: boolean
  data?: any
  error?: string
}

/**
 * BatchTool wrapper for Gemini CLI sparring partner
 * This allows Claude Code to use Gemini as a sparring partner via batch tools
 */
export class GeminiBatchTool {
  private sparringPartner: GeminiSparringPartner
  private activeSessions: Map<string, string> = new Map() // taskId -> sessionId

  constructor() {
    this.sparringPartner = new GeminiSparringPartner()
  }

  async execute(request: BatchToolRequest): Promise<BatchToolResponse> {
    try {
      switch (request.action) {
        case 'create_session':
          return this.createSession(request.params)
        
        case 'brainstorm':
          return this.brainstorm(request.params)
        
        case 'review':
          return this.reviewCode(request.params)
        
        case 'debug':
          return this.debugAssist(request.params)
        
        case 'query':
          return this.query(request.params)
        
        default:
          return {
            success: false,
            error: `Unknown action: ${request.action}`
          }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async createSession(params: { context: string, taskId?: string }): Promise<BatchToolResponse> {
    const sessionId = await this.sparringPartner.createSession(params.context)
    
    if (params.taskId) {
      this.activeSessions.set(params.taskId, sessionId)
    }
    
    return {
      success: true,
      data: { sessionId }
    }
  }

  private async brainstorm(params: { 
    topic: string, 
    perspectives?: string[], 
    depth?: 'shallow' | 'deep',
    taskId?: string 
  }): Promise<BatchToolResponse> {
    const response = await this.sparringPartner.brainstorm(params.topic, {
      perspectives: params.perspectives,
      depth: params.depth
    })
    
    return {
      success: true,
      data: { response }
    }
  }

  private async reviewCode(params: { 
    code: string, 
    language?: string,
    taskId?: string 
  }): Promise<BatchToolResponse> {
    const response = await this.sparringPartner.reviewCode(
      params.code, 
      params.language || 'typescript'
    )
    
    return {
      success: true,
      data: { response }
    }
  }

  private async debugAssist(params: { 
    error: string, 
    context: string,
    taskId?: string 
  }): Promise<BatchToolResponse> {
    const response = await this.sparringPartner.debugAssist(
      params.error, 
      params.context
    )
    
    return {
      success: true,
      data: { response }
    }
  }

  private async query(params: { 
    sessionId?: string, 
    taskId?: string, 
    prompt: string 
  }): Promise<BatchToolResponse> {
    let sessionId = params.sessionId
    
    // Try to get session from taskId if not provided
    if (!sessionId && params.taskId) {
      sessionId = this.activeSessions.get(params.taskId)
    }
    
    if (!sessionId) {
      // Create a new session if none exists
      sessionId = await this.sparringPartner.createSession('General sparring session')
    }
    
    const response = await this.sparringPartner.query(sessionId, params.prompt)
    
    return {
      success: true,
      data: { response, sessionId }
    }
  }

  // Method to be called by Claude Code's Task tool
  async runTask(taskDescription: string, taskParams: any = {}): Promise<string> {
    // Parse the task description to determine the action
    const lowerDesc = taskDescription.toLowerCase()
    
    let request: BatchToolRequest
    
    if (lowerDesc.includes('brainstorm')) {
      request = {
        action: 'brainstorm',
        params: {
          topic: taskParams.topic || taskDescription,
          perspectives: taskParams.perspectives,
          depth: taskParams.depth
        }
      }
    } else if (lowerDesc.includes('review') && lowerDesc.includes('code')) {
      request = {
        action: 'review',
        params: {
          code: taskParams.code || '',
          language: taskParams.language
        }
      }
    } else if (lowerDesc.includes('debug') || lowerDesc.includes('error')) {
      request = {
        action: 'debug',
        params: {
          error: taskParams.error || taskDescription,
          context: taskParams.context || ''
        }
      }
    } else {
      request = {
        action: 'query',
        params: {
          prompt: taskDescription,
          ...taskParams
        }
      }
    }
    
    const response = await this.execute(request)
    
    if (response.success) {
      return response.data?.response || JSON.stringify(response.data)
    } else {
      throw new Error(response.error || 'Unknown error')
    }
  }
}

// Export singleton for easy integration
export const geminiBatchTool = new GeminiBatchTool()