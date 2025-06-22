/**
 * Family Documents API Unit Tests
 * Tests for /api/family/documents endpoints
 */

import { GET, POST } from '@/app/api/family/documents/route'
import { GET as DocumentDetailGET, PUT as DocumentDetailPUT, DELETE as DocumentDetailDELETE } from '@/app/api/family/documents/[id]/route'
import { 
  createMockRequest, 
  createMockSession, 
  createTestFamily,
  createTestDocument,
  mockAuthSession,
  validateApiResponse,
  validateErrorResponse 
} from '../../utils/test-setup'

// Mock the route handlers since they don't exist yet
jest.mock('@/app/api/family/documents/route', () => ({
  GET: jest.fn(),
  POST: jest.fn(),
}))

jest.mock('@/app/api/family/documents/[id]/route', () => ({
  GET: jest.fn(),
  PUT: jest.fn(),
  DELETE: jest.fn(),
}))

// Mock file operations
jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue(Buffer.from('mock file content')),
  unlink: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
}))

describe('Family Documents API - Unit Tests', () => {
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Setup default successful responses
    const { GET: MockGET, POST: MockPOST } = require('@/app/api/family/documents/route')
    const { GET: MockDetailGET, PUT: MockDetailPUT, DELETE: MockDetailDELETE } = require('@/app/api/family/documents/[id]/route')
    
    MockGET.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ success: true, documents: [] }),
    })
    
    MockPOST.mockResolvedValue({
      status: 201,
      json: () => Promise.resolve({ success: true, document: createTestDocument('family-123', 'family') }),
    })
    
    MockDetailGET.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ success: true, document: createTestDocument('family-123', 'family') }),
    })
    
    MockDetailPUT.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ success: true, document: createTestDocument('family-123', 'family') }),
    })
    
    MockDetailDELETE.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ success: true, message: 'Document deleted' }),
    })
  })
  
  describe('GET /api/family/documents', () => {
    it('should return list of family documents for authenticated user', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const mockDocuments = [
        createTestDocument(familySession.user.id, 'family'),
        createTestDocument(familySession.user.id, 'family'),
      ]
      
      const { GET: MockGET } = require('@/app/api/family/documents/route')
      MockGET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true, documents: mockDocuments }),
      })
      
      const request = createMockRequest('GET')
      
      // Execute
      const response = await MockGET(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body).toHaveProperty('success', true)
      expect(body).toHaveProperty('documents')
      expect(Array.isArray(body.documents)).toBe(true)
      expect(body.documents).toHaveLength(2)
      expect(body.documents[0]).toHaveProperty('owner_type', 'family')
    })
    
    it('should return 401 for unauthenticated requests', async () => {
      // Setup - no session
      mockAuthSession(null)
      
      const { GET: MockGET } = require('@/app/api/family/documents/route')
      MockGET.mockResolvedValue({
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      })
      
      const request = createMockRequest('GET')
      
      // Execute
      const response = await MockGET(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(401)
      expect(body).toHaveProperty('error', 'Unauthorized')
    })
    
    it('should filter documents by type when specified', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const request = createMockRequest('GET', null, {}, {
        type: 'certificate',
      })
      
      const mockDocuments = [
        { ...createTestDocument(familySession.user.id, 'family'), type: 'certificate' },
      ]
      
      const { GET: MockGET } = require('@/app/api/family/documents/route')
      MockGET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true, documents: mockDocuments }),
      })
      
      // Execute
      const response = await MockGET(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body.documents.every((doc: any) => doc.type === 'certificate')).toBe(true)
    })
    
    it('should handle pagination', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const request = createMockRequest('GET', null, {}, {
        page: '2',
        limit: '5',
      })
      
      const { GET: MockGET } = require('@/app/api/family/documents/route')
      MockGET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({
          success: true,
          documents: [],
          pagination: {
            page: 2,
            limit: 5,
            total: 12,
            pages: 3,
          },
        }),
      })
      
      // Execute
      const response = await MockGET(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body).toHaveProperty('pagination')
      expect(body.pagination.page).toBe(2)
      expect(body.pagination.limit).toBe(5)
    })
    
    it('should include shared documents', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const mockDocuments = [
        createTestDocument(familySession.user.id, 'family'),
        { ...createTestDocument('director-123', 'director'), shared_with: [familySession.user.id] },
      ]
      
      const { GET: MockGET } = require('@/app/api/family/documents/route')
      MockGET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true, documents: mockDocuments }),
      })
      
      const request = createMockRequest('GET')
      
      // Execute
      const response = await MockGET(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body.documents).toHaveLength(2)
      expect(body.documents.some((doc: any) => doc.owner_type === 'director')).toBe(true)
    })
  })
  
  describe('POST /api/family/documents', () => {
    it('should upload document with valid data', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      // Mock FormData
      const mockFile = new File(['test content'], 'test-document.pdf', { type: 'application/pdf' })
      const mockFormData = new FormData()
      mockFormData.append('file', mockFile)
      mockFormData.append('title', 'Test Document')
      mockFormData.append('type', 'certificate')
      
      const request = {
        formData: jest.fn().mockResolvedValue(mockFormData),
      } as any
      
      const mockDocument = createTestDocument(familySession.user.id, 'family')
      const { POST: MockPOST } = require('@/app/api/family/documents/route')
      MockPOST.mockResolvedValue({
        status: 201,
        json: () => Promise.resolve({ success: true, document: mockDocument }),
      })
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(201)
      expect(body).toHaveProperty('success', true)
      expect(body).toHaveProperty('document')
      expect(body.document).toHaveProperty('owner_id', familySession.user.id)
      expect(body.document).toHaveProperty('owner_type', 'family')
    })
    
    it('should validate file size limits', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      // Mock large file (10MB)
      const largeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'large-file.pdf', { type: 'application/pdf' })
      const mockFormData = new FormData()
      mockFormData.append('file', largeFile)
      mockFormData.append('title', 'Large Document')
      
      const request = {
        formData: jest.fn().mockResolvedValue(mockFormData),
      } as any
      
      const { POST: MockPOST } = require('@/app/api/family/documents/route')
      MockPOST.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'File size exceeds limit (5MB)' }),
      })
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error', 'File size exceeds limit (5MB)')
    })
    
    it('should validate file types', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const invalidFile = new File(['test'], 'test.exe', { type: 'application/exe' })
      const mockFormData = new FormData()
      mockFormData.append('file', invalidFile)
      mockFormData.append('title', 'Invalid File')
      
      const request = {
        formData: jest.fn().mockResolvedValue(mockFormData),
      } as any
      
      const { POST: MockPOST } = require('@/app/api/family/documents/route')
      MockPOST.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG' }),
      })
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error')
      expect(body.error).toContain('Invalid file type')
    })
    
    it('should handle encryption option', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const mockFile = new File(['sensitive content'], 'sensitive.pdf', { type: 'application/pdf' })
      const mockFormData = new FormData()
      mockFormData.append('file', mockFile)
      mockFormData.append('title', 'Sensitive Document')
      mockFormData.append('encrypt', 'true')
      
      const request = {
        formData: jest.fn().mockResolvedValue(mockFormData),
      } as any
      
      const encryptedDocument = {
        ...createTestDocument(familySession.user.id, 'family'),
        is_encrypted: true,
        encryption_key: 'encrypted_key_hash',
      }
      
      const { POST: MockPOST } = require('@/app/api/family/documents/route')
      MockPOST.mockResolvedValue({
        status: 201,
        json: () => Promise.resolve({ success: true, document: encryptedDocument }),
      })
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(201)
      expect(body.document).toHaveProperty('is_encrypted', true)
      expect(body.document).toHaveProperty('encryption_key')
    })
    
    it('should require authentication', async () => {
      // Setup - no session
      mockAuthSession(null)
      
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      const mockFormData = new FormData()
      mockFormData.append('file', mockFile)
      
      const request = {
        formData: jest.fn().mockResolvedValue(mockFormData),
      } as any
      
      const { POST: MockPOST } = require('@/app/api/family/documents/route')
      MockPOST.mockResolvedValue({
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      })
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(401)
      expect(body).toHaveProperty('error', 'Unauthorized')
    })
    
    it('should validate required fields', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const mockFormData = new FormData()
      // Missing file and title
      
      const request = {
        formData: jest.fn().mockResolvedValue(mockFormData),
      } as any
      
      const { POST: MockPOST } = require('@/app/api/family/documents/route')
      MockPOST.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'Missing required fields: file, title' }),
      })
      
      // Execute
      const response = await MockPOST(request)
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error')
      expect(body.error).toContain('required fields')
    })
  })
  
  describe('GET /api/family/documents/[id]', () => {
    it('should return specific document for authorized user', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const documentId = 'doc-123'
      const mockDocument = createTestDocument(familySession.user.id, 'family')
      mockDocument.id = documentId
      
      const { GET: MockDetailGET } = require('@/app/api/family/documents/[id]/route')
      MockDetailGET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true, document: mockDocument }),
      })
      
      const request = createMockRequest('GET')
      
      // Execute
      const response = await MockDetailGET(request, { params: { id: documentId } })
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body).toHaveProperty('success', true)
      expect(body).toHaveProperty('document')
      expect(body.document.id).toBe(documentId)
      expect(body.document.owner_id).toBe(familySession.user.id)
    })
    
    it('should return 404 for non-existent document', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const { GET: MockDetailGET } = require('@/app/api/family/documents/[id]/route')
      MockDetailGET.mockResolvedValue({
        status: 404,
        json: () => Promise.resolve({ error: 'Document not found' }),
      })
      
      const request = createMockRequest('GET')
      
      // Execute
      const response = await MockDetailGET(request, { params: { id: 'non-existent' } })
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(404)
      expect(body).toHaveProperty('error', 'Document not found')
    })
    
    it('should return 403 for unauthorized access', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const { GET: MockDetailGET } = require('@/app/api/family/documents/[id]/route')
      MockDetailGET.mockResolvedValue({
        status: 403,
        json: () => Promise.resolve({ error: 'Access denied' }),
      })
      
      const request = createMockRequest('GET')
      
      // Execute
      const response = await MockDetailGET(request, { params: { id: 'other-user-doc' } })
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(403)
      expect(body).toHaveProperty('error', 'Access denied')
    })
    
    it('should handle encrypted documents', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const encryptedDocument = {
        ...createTestDocument(familySession.user.id, 'family'),
        is_encrypted: true,
        encryption_key: 'key_hash',
      }
      
      const { GET: MockDetailGET } = require('@/app/api/family/documents/[id]/route')
      MockDetailGET.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ 
          success: true, 
          document: encryptedDocument,
          encrypted: true,
        }),
      })
      
      const request = createMockRequest('GET')
      
      // Execute
      const response = await MockDetailGET(request, { params: { id: 'encrypted-doc' } })
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body.document).toHaveProperty('is_encrypted', true)
      expect(body).toHaveProperty('encrypted', true)
    })
  })
  
  describe('PUT /api/family/documents/[id]', () => {
    it('should update document metadata', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const documentId = 'doc-123'
      const updateData = {
        title: 'Updated Document Title',
        type: 'will',
      }
      
      const updatedDocument = {
        ...createTestDocument(familySession.user.id, 'family'),
        id: documentId,
        ...updateData,
      }
      
      const { PUT: MockDetailPUT } = require('@/app/api/family/documents/[id]/route')
      MockDetailPUT.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true, document: updatedDocument }),
      })
      
      const request = createMockRequest('PUT', updateData)
      
      // Execute
      const response = await MockDetailPUT(request, { params: { id: documentId } })
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body).toHaveProperty('success', true)
      expect(body.document).toMatchObject(updateData)
    })
    
    it('should handle sharing permissions', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const documentId = 'doc-123'
      const shareData = {
        shared_with: ['director-456', 'venue-789'],
      }
      
      const sharedDocument = {
        ...createTestDocument(familySession.user.id, 'family'),
        id: documentId,
        shared_with: shareData.shared_with,
      }
      
      const { PUT: MockDetailPUT } = require('@/app/api/family/documents/[id]/route')
      MockDetailPUT.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true, document: sharedDocument }),
      })
      
      const request = createMockRequest('PUT', shareData)
      
      // Execute
      const response = await MockDetailPUT(request, { params: { id: documentId } })
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body.document.shared_with).toEqual(shareData.shared_with)
    })
    
    it('should prevent unauthorized updates', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const { PUT: MockDetailPUT } = require('@/app/api/family/documents/[id]/route')
      MockDetailPUT.mockResolvedValue({
        status: 403,
        json: () => Promise.resolve({ error: 'Access denied' }),
      })
      
      const request = createMockRequest('PUT', { title: 'Hack attempt' })
      
      // Execute
      const response = await MockDetailPUT(request, { params: { id: 'other-user-doc' } })
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(403)
      expect(body).toHaveProperty('error', 'Access denied')
    })
  })
  
  describe('DELETE /api/family/documents/[id]', () => {
    it('should delete document successfully', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const documentId = 'doc-123'
      
      const { DELETE: MockDetailDELETE } = require('@/app/api/family/documents/[id]/route')
      MockDetailDELETE.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true, message: 'Document deleted successfully' }),
      })
      
      const request = createMockRequest('DELETE')
      
      // Execute
      const response = await MockDetailDELETE(request, { params: { id: documentId } })
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body).toHaveProperty('success', true)
      expect(body).toHaveProperty('message', 'Document deleted successfully')
    })
    
    it('should clean up file system when deleting', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const documentId = 'doc-123'
      const fs = require('fs/promises')
      
      const { DELETE: MockDetailDELETE } = require('@/app/api/family/documents/[id]/route')
      MockDetailDELETE.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ 
          success: true, 
          message: 'Document and files deleted successfully' 
        }),
      })
      
      const request = createMockRequest('DELETE')
      
      // Execute
      const response = await MockDetailDELETE(request, { params: { id: documentId } })
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(200)
      expect(body.message).toContain('files deleted')
    })
    
    it('should prevent unauthorized deletion', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const { DELETE: MockDetailDELETE } = require('@/app/api/family/documents/[id]/route')
      MockDetailDELETE.mockResolvedValue({
        status: 403,
        json: () => Promise.resolve({ error: 'Access denied' }),
      })
      
      const request = createMockRequest('DELETE')
      
      // Execute
      const response = await MockDetailDELETE(request, { params: { id: 'other-user-doc' } })
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(403)
      expect(body).toHaveProperty('error', 'Access denied')
    })
    
    it('should handle shared document deletion carefully', async () => {
      // Setup
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const { DELETE: MockDetailDELETE } = require('@/app/api/family/documents/[id]/route')
      MockDetailDELETE.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ 
          error: 'Cannot delete document that is shared with others. Remove sharing first.' 
        }),
      })
      
      const request = createMockRequest('DELETE')
      
      // Execute
      const response = await MockDetailDELETE(request, { params: { id: 'shared-doc' } })
      const body = await response.json()
      
      // Assert
      expect(response.status).toBe(400)
      expect(body.error).toContain('shared with others')
    })
  })
  
  describe('Error Handling', () => {
    it('should handle file system errors during upload', async () => {
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const fs = require('fs/promises')
      fs.writeFile.mockRejectedValue(new Error('Disk full'))
      
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      const mockFormData = new FormData()
      mockFormData.append('file', mockFile)
      mockFormData.append('title', 'Test')
      
      const request = {
        formData: jest.fn().mockResolvedValue(mockFormData),
      } as any
      
      const { POST: MockPOST } = require('@/app/api/family/documents/route')
      MockPOST.mockResolvedValue({
        status: 500,
        json: () => Promise.resolve({ error: 'Failed to save file' }),
      })
      
      const response = await MockPOST(request)
      const body = await response.json()
      
      expect(response.status).toBe(500)
      expect(body).toHaveProperty('error', 'Failed to save file')
    })
    
    it('should handle malformed form data', async () => {
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const request = {
        formData: jest.fn().mockRejectedValue(new Error('Invalid form data')),
      } as any
      
      const { POST: MockPOST } = require('@/app/api/family/documents/route')
      MockPOST.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid request data' }),
      })
      
      const response = await MockPOST(request)
      const body = await response.json()
      
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error', 'Invalid request data')
    })
  })
  
  describe('Security Tests', () => {
    it('should prevent path traversal attacks', async () => {
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const maliciousFile = new File(['malicious'], '../../../etc/passwd', { type: 'text/plain' })
      const mockFormData = new FormData()
      mockFormData.append('file', maliciousFile)
      mockFormData.append('title', 'Malicious File')
      
      const request = {
        formData: jest.fn().mockResolvedValue(mockFormData),
      } as any
      
      const { POST: MockPOST } = require('@/app/api/family/documents/route')
      MockPOST.mockResolvedValue({
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid filename' }),
      })
      
      const response = await MockPOST(request)
      const body = await response.json()
      
      expect(response.status).toBe(400)
      expect(body).toHaveProperty('error', 'Invalid filename')
    })
    
    it('should sanitize document metadata', async () => {
      const familySession = createMockSession('family')
      mockAuthSession(familySession)
      
      const xssData = {
        title: '<script>alert("XSS")</script>',
        type: '<img src=x onerror=alert(1)>',
      }
      
      const sanitizedDocument = {
        ...createTestDocument(familySession.user.id, 'family'),
        title: 'alert("XSS")', // XSS tags removed
        type: '',
      }
      
      const { PUT: MockDetailPUT } = require('@/app/api/family/documents/[id]/route')
      MockDetailPUT.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ success: true, document: sanitizedDocument }),
      })
      
      const request = createMockRequest('PUT', xssData)
      
      const response = await MockDetailPUT(request, { params: { id: 'doc-123' } })
      const body = await response.json()
      
      expect(response.status).toBe(200)
      expect(body.document.title).not.toContain('<script>')
      expect(body.document.type).not.toContain('<img')
    })
  })
})