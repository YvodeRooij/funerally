import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

const execAsync = promisify(exec)

export interface GeminiSparringConfig {
  apiKey?: string
  model?: string
  maxTokens?: number
  temperature?: number
}

export interface SparringSession {
  id: string
  context: string
  history: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
}

export class GeminiSparringPartner {
  private config: GeminiSparringConfig
  private sessions: Map<string, SparringSession> = new Map()

  constructor(config: GeminiSparringConfig = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY,
      model: config.model || 'gemini-pro',
      maxTokens: config.maxTokens || 8192,
      temperature: config.temperature || 0.7
    }
  }

  async createSession(context: string): Promise<string> {
    const sessionId = randomUUID()
    this.sessions.set(sessionId, {
      id: sessionId,
      context,
      history: []
    })
    return sessionId
  }

  async query(sessionId: string, prompt: string): Promise<string> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    try {
      // Prepare the full prompt with context and history
      let fullPrompt = `Context: ${session.context}\n\n`
      
      if (session.history.length > 0) {
        fullPrompt += 'Previous conversation:\n'
        session.history.forEach(entry => {
          fullPrompt += `${entry.role === 'user' ? 'User' : 'Assistant'}: ${entry.content}\n`
        })
        fullPrompt += '\n'
      }
      
      fullPrompt += `User: ${prompt}\nAssistant:`

      // Create a temporary file for the prompt
      const tempFile = join('/tmp', `gemini-prompt-${randomUUID()}.txt`)
      await writeFile(tempFile, fullPrompt)

      // Execute gemini CLI command
      const command = `GEMINI_API_KEY="${this.config.apiKey}" gemini "${prompt}" --model ${this.config.model} --max-tokens ${this.config.maxTokens} --temperature ${this.config.temperature}`
      
      const { stdout, stderr } = await execAsync(command)
      
      // Clean up temp file
      await unlink(tempFile).catch(() => {})

      if (stderr) {
        console.error('Gemini CLI stderr:', stderr)
      }

      const response = stdout.trim()
      
      // Update session history
      session.history.push(
        { role: 'user', content: prompt },
        { role: 'assistant', content: response }
      )

      return response
    } catch (error) {
      throw new Error(`Gemini CLI error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async brainstorm(topic: string, options: { perspectives?: string[], depth?: 'shallow' | 'deep' } = {}): Promise<string> {
    const perspectives = options.perspectives || ['technical', 'user-experience', 'business']
    const depth = options.depth || 'deep'
    
    const prompt = `Please brainstorm about: "${topic}"
    
    Consider these perspectives: ${perspectives.join(', ')}
    Analysis depth: ${depth}
    
    Provide:
    1. Key considerations
    2. Potential challenges
    3. Innovative solutions
    4. Implementation suggestions`

    const sessionId = await this.createSession(`Brainstorming session for: ${topic}`)
    return this.query(sessionId, prompt)
  }

  async reviewCode(code: string, language: string = 'typescript'): Promise<string> {
    const prompt = `Please review this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Provide:
1. Code quality assessment
2. Potential bugs or issues
3. Performance considerations
4. Security concerns
5. Suggestions for improvement`

    const sessionId = await this.createSession('Code review session')
    return this.query(sessionId, prompt)
  }

  async debugAssist(error: string, context: string): Promise<string> {
    const prompt = `Help debug this error:

Error: ${error}

Context: ${context}

Please provide:
1. Likely causes
2. Debugging steps
3. Potential solutions
4. Prevention strategies`

    const sessionId = await this.createSession('Debugging assistance')
    return this.query(sessionId, prompt)
  }

  getSession(sessionId: string): SparringSession | undefined {
    return this.sessions.get(sessionId)
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId)
  }
}

// Export a singleton instance for easy use
export const geminiSparringPartner = new GeminiSparringPartner()