import crypto from 'crypto'

// Use the encryption key from environment or generate a secure one
const ENCRYPTION_KEY = process.env.ENCRYPTION_MASTER_KEY || 'c7VpkulbQQZE5TmxkGSVGAhNw6wNBDEYbZAsEbuOVyg='

// Convert base64 key to buffer
const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'base64')

// Ensure key is 32 bytes for AES-256
const key = crypto.createHash('sha256').update(keyBuffer).digest()

export function encrypt(text: string): string {
  try {
    // Generate random IV
    const iv = crypto.randomBytes(16)
    
    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    
    // Encrypt data
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    // Return IV + encrypted data
    return iv.toString('hex') + ':' + encrypted
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

export function decrypt(encryptedText: string): string {
  try {
    // Split IV and encrypted data
    const parts = encryptedText.split(':')
    const iv = Buffer.from(parts[0], 'hex')
    const encrypted = parts[1]
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    
    // Decrypt data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

// Hash sensitive data for comparison without storing plaintext
export function hashData(data: string): string {
  return crypto
    .createHash('sha256')
    .update(data + process.env.NEXTAUTH_SECRET)
    .digest('hex')
}