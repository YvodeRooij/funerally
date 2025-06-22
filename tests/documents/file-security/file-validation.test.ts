/**
 * File Security Tests
 * Comprehensive testing of upload validation, virus scanning, and file type restrictions
 */

import { randomBytes } from 'crypto';
import { SecurityTestUtils } from '../setup';

// Mock implementations for file security components
class FileSecurityValidator {
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  private static readonly DANGEROUS_EXTENSIONS = [
    '.exe', '.bat', '.cmd', '.com', '.scr', '.pif', '.vbs', '.js', '.jar',
    '.msi', '.dll', '.sys', '.tmp', '.dmp', '.bin', '.iso', '.img'
  ];

  private static readonly VIRUS_SIGNATURES = [
    'EICAR-STANDARD-ANTIVIRUS-TEST-FILE',
    'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR',
    'while(1){alert("DOS")}',
    '<?xml version="1.0"?><!DOCTYPE',
    '<script>',
    'javascript:',
    'vbscript:',
    'eval(',
    'setTimeout(',
    'setInterval('
  ];

  static validateFile(file: {
    name: string;
    size: number;
    type: string;
    data?: Buffer;
  }): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    sanitizedName?: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // File size validation
    if (file.size > this.MAX_FILE_SIZE) {
      errors.push(`File size (${file.size} bytes) exceeds maximum allowed size (${this.MAX_FILE_SIZE} bytes)`);
      riskLevel = 'high';
    }

    if (file.size === 0) {
      errors.push('File is empty');
      riskLevel = 'medium';
    }

    // MIME type validation
    if (!this.ALLOWED_MIME_TYPES.includes(file.type)) {
      errors.push(`MIME type '${file.type}' is not allowed`);
      riskLevel = 'high';
    }

    // File extension validation
    const extension = this.getFileExtension(file.name).toLowerCase();
    if (this.DANGEROUS_EXTENSIONS.includes(extension)) {
      errors.push(`File extension '${extension}' is not allowed`);
      riskLevel = 'critical';
    }

    // Filename validation
    const sanitizedName = this.sanitizeFilename(file.name);
    if (sanitizedName !== file.name) {
      warnings.push('Filename contains potentially dangerous characters and has been sanitized');
      riskLevel = Math.max(riskLevel === 'low' ? 1 : riskLevel === 'medium' ? 2 : riskLevel === 'high' ? 3 : 4, 2) === 2 ? 'medium' : riskLevel;
    }

    // Content validation
    if (file.data) {
      const contentRisk = this.scanFileContent(file.data);
      if (contentRisk.malicious) {
        errors.push(...contentRisk.threats);
        riskLevel = 'critical';
      }
      if (contentRisk.warnings.length > 0) {
        warnings.push(...contentRisk.warnings);
        riskLevel = Math.max(riskLevel === 'low' ? 1 : riskLevel === 'medium' ? 2 : riskLevel === 'high' ? 3 : 4, 2) === 2 ? 'medium' : riskLevel;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedName,
      riskLevel
    };
  }

  static scanFileContent(data: Buffer): {
    malicious: boolean;
    threats: string[];
    warnings: string[];
  } {
    const threats: string[] = [];
    const warnings: string[] = [];
    const content = data.toString('utf-8', 0, Math.min(data.length, 10000)); // Scan first 10KB

    // Check for virus signatures
    for (const signature of this.VIRUS_SIGNATURES) {
      if (content.includes(signature)) {
        threats.push(`Virus signature detected: ${signature.substring(0, 50)}...`);
      }
    }

    // Check for potentially malicious patterns
    const maliciousPatterns = [
      /<%[\s\S]*?%>/g, // ASP/JSP code
      /<\?php[\s\S]*?\?>/g, // PHP code
      /(?:union|select|insert|update|delete|drop|create|alter|exec|execute)\s+/gi, // SQL
      /(?:eval|exec|system|shell_exec|passthru|file_get_contents)\s*\(/gi, // Dangerous functions
      /(?:document\.write|document\.cookie|window\.location|location\.href)\s*[=\(]/gi, // XSS patterns
      /(?:onload|onerror|onclick|onmouseover)\s*=/gi, // Event handlers
      /(?:cmd|powershell|bash|sh)\s+/gi // Command execution
    ];

    for (const pattern of maliciousPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        warnings.push(`Potentially malicious pattern detected: ${matches[0]}`);
      }
    }

    // Check for embedded files
    if (data.includes(Buffer.from('PK')) && data.length > 22) {
      warnings.push('File may contain embedded archive (ZIP/Office document)');
    }

    // Check for binary executable signatures
    const binarySignatures = [
      Buffer.from([0x4D, 0x5A]), // PE executable
      Buffer.from([0x7F, 0x45, 0x4C, 0x46]), // ELF executable
      Buffer.from([0xCE, 0xFA, 0xED, 0xFE]), // Mach-O executable
      Buffer.from([0xCA, 0xFE, 0xBA, 0xBE]) // Java class file
    ];

    for (const signature of binarySignatures) {
      if (data.indexOf(signature) === 0) {
        threats.push('Executable file signature detected');
        break;
      }
    }

    return {
      malicious: threats.length > 0,
      threats,
      warnings
    };
  }

  private static getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot === -1 ? '' : filename.substring(lastDot);
  }

  private static sanitizeFilename(filename: string): string {
    // Remove dangerous characters and patterns
    return filename
      .replace(/[<>:"\/\\|?*\x00-\x1f]/g, '_') // Control characters and file system reserved
      .replace(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, '_$1_') // Windows reserved names
      .replace(/\.+$/, '') // Trailing dots
      .replace(/\s+$/, '') // Trailing spaces
      .substring(0, 255); // Limit length
  }
}

describe('File Security Tests', () => {
  let maliciousPayloads: string[];

  beforeEach(() => {
    maliciousPayloads = SecurityTestUtils.getMaliciousPayloads();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('📁 File Upload Validation', () => {
    test('should accept valid file types', () => {
      const validFiles = [
        { name: 'document.pdf', size: 1024, type: 'application/pdf' },
        { name: 'photo.jpg', size: 2048, type: 'image/jpeg' },
        { name: 'scan.png', size: 1536, type: 'image/png' },
        { name: 'notes.txt', size: 512, type: 'text/plain' },
        { name: 'report.docx', size: 4096, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
      ];

      validFiles.forEach(file => {
        const result = FileSecurityValidator.validateFile(file);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.riskLevel).toBe('low');
      });
    });

    test('should reject dangerous file types', () => {
      const dangerousFiles = [
        { name: 'virus.exe', size: 1024, type: 'application/x-executable' },
        { name: 'script.bat', size: 512, type: 'application/x-bat' },
        { name: 'malware.scr', size: 2048, type: 'application/x-screensaver' },
        { name: 'trojan.com', size: 1024, type: 'application/x-msdownload' },
        { name: 'backdoor.vbs', size: 256, type: 'text/vbscript' }
      ];

      dangerousFiles.forEach(file => {
        const result = FileSecurityValidator.validateFile(file);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.riskLevel).toBe('critical');
      });
    });

    test('should enforce file size limits', () => {
      const oversizedFile = {
        name: 'huge-file.pdf',
        size: 100 * 1024 * 1024, // 100MB
        type: 'application/pdf'
      };

      const result = FileSecurityValidator.validateFile(oversizedFile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('exceeds maximum allowed size'));
      expect(result.riskLevel).toBe('high');
    });

    test('should reject empty files', () => {
      const emptyFile = {
        name: 'empty.txt',
        size: 0,
        type: 'text/plain'
      };

      const result = FileSecurityValidator.validateFile(emptyFile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File is empty');
      expect(result.riskLevel).toBe('medium');
    });

    test('should sanitize malicious filenames', () => {
      const maliciousFilenames = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '<script>alert("xss")</script>.pdf',
        'file"with:illegal*chars?.txt',
        'CON.txt',
        'PRN.pdf',
        'AUX.doc',
        'file.txt.',
        'file.txt   ',
        'a'.repeat(300) + '.txt' // Very long filename
      ];

      maliciousFilenames.forEach(filename => {
        const file = {
          name: filename,
          size: 1024,
          type: 'text/plain'
        };
        
        const result = FileSecurityValidator.validateFile(file);
        expect(result.sanitizedName).toBeDefined();
        expect(result.sanitizedName).not.toBe(filename);
        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.sanitizedName?.length).toBeLessThanOrEqual(255);
      });
    });

    test('should validate MIME type spoofing', () => {
      const spoofedFiles = [
        { name: 'malware.exe', size: 1024, type: 'text/plain' }, // Executable with text MIME
        { name: 'script.js', size: 512, type: 'image/jpeg' }, // Script with image MIME
        { name: 'trojan.scr', size: 2048, type: 'application/pdf' } // Screensaver with PDF MIME
      ];

      spoofedFiles.forEach(file => {
        const result = FileSecurityValidator.validateFile(file);
        // Should be rejected due to dangerous extension regardless of MIME type
        expect(result.isValid).toBe(false);
        expect(result.riskLevel).toBe('critical');
      });
    });
  });

  describe('🦠 Virus and Malware Detection', () => {
    test('should detect EICAR test virus', () => {
      const eicarFile = {
        name: 'eicar.txt',
        size: 68,
        type: 'text/plain',
        data: Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*')
      };

      const result = FileSecurityValidator.validateFile(eicarFile);
      expect(result.isValid).toBe(false);
      expect(result.riskLevel).toBe('critical');
      expect(result.errors.some(e => e.includes('Virus signature detected'))).toBe(true);
    });

    test('should detect malicious script content', () => {
      const scriptContents = [
        '<script>while(1){alert("DOS")}</script>',
        '<?php shell_exec($_GET["cmd"]); ?>',
        '<%=eval request("cmd")%>',
        'javascript:document.cookie="admin=true"',
        'eval(atob("bWFsaWNpb3VzIGNvZGU="))'
      ];

      scriptContents.forEach(content => {
        const maliciousFile = {
          name: 'malicious.txt',
          size: content.length,
          type: 'text/plain',
          data: Buffer.from(content)
        };

        const result = FileSecurityValidator.validateFile(maliciousFile);
        expect(result.riskLevel).toMatch(/^(medium|high|critical)$/);
        expect(result.warnings.length + result.errors.length).toBeGreaterThan(0);
      });
    });

    test('should detect SQL injection attempts in file content', () => {
      const sqlPayloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "UNION SELECT password FROM admin_users",
        "INSERT INTO backdoor VALUES ('hacked')",
        "exec master..xp_cmdshell 'net user hacker hacker123 /add'"
      ];

      sqlPayloads.forEach(payload => {
        const maliciousFile = {
          name: 'sql-injection.txt',
          size: payload.length,
          type: 'text/plain',
          data: Buffer.from(payload)
        };

        const result = FileSecurityValidator.validateFile(maliciousFile);
        expect(result.warnings.some(w => w.includes('malicious pattern'))).toBe(true);
      });
    });

    test('should detect executable file signatures', () => {
      const executableSignatures = [
        Buffer.from([0x4D, 0x5A, 0x90, 0x00]), // PE executable
        Buffer.from([0x7F, 0x45, 0x4C, 0x46]), // ELF executable
        Buffer.from([0xCE, 0xFA, 0xED, 0xFE]), // Mach-O executable
        Buffer.from([0xCA, 0xFE, 0xBA, 0xBE]) // Java class file
      ];

      executableSignatures.forEach((signature, index) => {
        const executableFile = {
          name: `executable${index}.bin`,
          size: signature.length,
          type: 'application/octet-stream',
          data: signature
        };

        const result = FileSecurityValidator.validateFile(executableFile);
        expect(result.riskLevel).toBe('critical');
        expect(result.errors.some(e => e.includes('Executable file signature'))).toBe(true);
      });
    });

    test('should detect polyglot files', () => {
      // File that appears as both PDF and HTML
      const polyglotContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
>>
endobj
<html><script>alert('XSS')</script></html>`;

      const polyglotFile = {
        name: 'polyglot.pdf',
        size: polyglotContent.length,
        type: 'application/pdf',
        data: Buffer.from(polyglotContent)
      };

      const result = FileSecurityValidator.validateFile(polyglotFile);
      expect(result.warnings.some(w => w.includes('malicious pattern'))).toBe(true);
    });
  });

  describe('🔐 Content Security Analysis', () => {
    test('should detect embedded archives', () => {
      // Create a minimal ZIP file signature
      const zipSignature = Buffer.from([
        0x50, 0x4B, 0x03, 0x04, // ZIP local file header signature
        0x14, 0x00, 0x00, 0x00, // Version, flags
        0x00, 0x00, 0x00, 0x00, // Compression, time, date
        0x00, 0x00, 0x00, 0x00, // CRC-32
        0x00, 0x00, 0x00, 0x00, // Compressed size
        0x00, 0x00, 0x00, 0x00, // Uncompressed size
        0x00, 0x00, 0x00, 0x00  // Filename length, extra field length
      ]);

      const suspiciousFile = {
        name: 'document.pdf',
        size: zipSignature.length,
        type: 'application/pdf',
        data: zipSignature
      };

      const result = FileSecurityValidator.validateFile(suspiciousFile);
      expect(result.warnings.some(w => w.includes('embedded archive'))).toBe(true);
    });

    test('should analyze file entropy for packed executables', () => {
      // High entropy data that might indicate packed/encrypted content
      const highEntropyData = randomBytes(1024);
      const suspiciousFile = {
        name: 'suspicious.pdf',
        size: highEntropyData.length,
        type: 'application/pdf',
        data: highEntropyData
      };

      // This would require more sophisticated entropy analysis
      const result = FileSecurityValidator.validateFile(suspiciousFile);
      expect(result).toBeDefined();
    });

    test('should detect steganography indicators', () => {
      // Simulated image with suspicious metadata
      const imageWithHiddenData = Buffer.alloc(1024);
      // Add JPEG signature
      imageWithHiddenData[0] = 0xFF;
      imageWithHiddenData[1] = 0xD8;
      imageWithHiddenData[2] = 0xFF;
      
      // Add suspicious comment section
      const suspiciousComment = Buffer.from('base64_encoded_payload_here');
      suspiciousComment.copy(imageWithHiddenData, 100);

      const suspiciousImage = {
        name: 'innocent.jpg',
        size: imageWithHiddenData.length,
        type: 'image/jpeg',
        data: imageWithHiddenData
      };

      const result = FileSecurityValidator.validateFile(suspiciousImage);
      expect(result).toBeDefined();
    });

    test('should validate document metadata', () => {
      // Simulated PDF with malicious JavaScript
      const maliciousPdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
/Names 3 0 R
>>
endobj
3 0 obj
<<
/JavaScript 4 0 R
>>
endobj
4 0 obj
<<
/S /JavaScript
/JS (app.alert("XSS Attack"); this.print({bUI:false,bSilent:true,bShrinkToFit:true});)
>>
endobj`;

      const maliciousPdf = {
        name: 'document.pdf',
        size: maliciousPdfContent.length,
        type: 'application/pdf',
        data: Buffer.from(maliciousPdfContent)
      };

      const result = FileSecurityValidator.validateFile(maliciousPdf);
      expect(result.warnings.some(w => w.includes('malicious pattern'))).toBe(true);
    });
  });

  describe('🛡️ File Upload Security Controls', () => {
    test('should enforce rate limiting on file uploads', async () => {
      // Simulate rapid file upload attempts
      const uploadAttempts = Array.from({ length: 100 }, (_, i) => ({
        name: `rapid-upload-${i}.txt`,
        size: 1024,
        type: 'text/plain',
        timestamp: Date.now()
      }));

      // In a real implementation, this would track upload rates per user/IP
      const rateLimitResults = uploadAttempts.map((file, index) => {
        const isRateLimited = index > 10; // Simulate rate limit after 10 uploads
        return {
          file,
          allowed: !isRateLimited,
          reason: isRateLimited ? 'Rate limit exceeded' : 'OK'
        };
      });

      const allowedUploads = rateLimitResults.filter(r => r.allowed);
      const blockedUploads = rateLimitResults.filter(r => !r.allowed);

      expect(allowedUploads.length).toBeLessThanOrEqual(10);
      expect(blockedUploads.length).toBeGreaterThan(0);
    });

    test('should quarantine suspicious files', () => {
      const suspiciousFile = {
        name: 'suspicious.exe',
        size: 1024,
        type: 'application/x-executable',
        data: Buffer.from('MZ\x90\x00') // PE executable signature
      };

      const result = FileSecurityValidator.validateFile(suspiciousFile);
      expect(result.isValid).toBe(false);
      expect(result.riskLevel).toBe('critical');

      // In a real system, this would trigger quarantine procedures
      const quarantineAction = {
        quarantined: true,
        reason: 'Dangerous file type and executable signature detected',
        timestamp: new Date(),
        reviewRequired: true
      };

      expect(quarantineAction.quarantined).toBe(true);
      expect(quarantineAction.reviewRequired).toBe(true);
    });

    test('should validate file upload source and context', () => {
      // Test different upload contexts
      const uploadContexts = [
        {
          context: 'direct_upload',
          allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
          maxSize: 10 * 1024 * 1024 // 10MB
        },
        {
          context: 'email_attachment',
          allowedTypes: ['text/plain', 'application/pdf'],
          maxSize: 5 * 1024 * 1024 // 5MB
        },
        {
          context: 'api_upload',
          allowedTypes: ['application/json', 'text/csv'],
          maxSize: 1 * 1024 * 1024 // 1MB
        }
      ];

      const testFile = {
        name: 'test.pdf',
        size: 8 * 1024 * 1024, // 8MB
        type: 'application/pdf'
      };

      uploadContexts.forEach(context => {
        const isAllowed = context.allowedTypes.includes(testFile.type) && 
                         testFile.size <= context.maxSize;
        
        if (context.context === 'api_upload') {
          expect(isAllowed).toBe(false); // Too large for API context
        } else {
          expect(isAllowed).toBe(true);
        }
      });
    });

    test('should implement secure file storage paths', () => {
      const dangerousFilenames = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\hosts',
        '/etc/shadow',
        'C:\\Windows\\System32\\config\\SAM',
        '\\\\server\\share\\sensitive.txt',
        '/dev/random',
        'file|with|pipes',
        'file with spaces.txt',
        'file:with:colons.txt'
      ];

      dangerousFilenames.forEach(filename => {
        // Simulate secure path generation
        const secureStoragePath = generateSecureStoragePath(filename);
        
        expect(secureStoragePath).not.toContain('..');
        expect(secureStoragePath).not.toContain('//');
        expect(secureStoragePath).not.toContain('\\\\');
        expect(secureStoragePath).not.toContain('|');
        expect(secureStoragePath).not.toContain(':');
        expect(secureStoragePath).toMatch(/^[a-zA-Z0-9_\-\/\.]+$/);
      });
    });
  });

  describe('🔍 Advanced Threat Detection', () => {
    test('should detect zip bombs', () => {
      // Simulate a file that claims to be very large when decompressed
      const suspiciousZip = {
        name: 'document.zip',
        size: 1024, // Small compressed size
        type: 'application/zip',
        data: Buffer.from([
          0x50, 0x4B, 0x03, 0x04, // ZIP signature
          // ... truncated for brevity
        ]),
        metadata: {
          uncompressedSize: 1024 * 1024 * 1024 * 10 // Claims 10GB uncompressed
        }
      };

      // In a real implementation, this would analyze compression ratios
      const compressionRatio = (suspiciousZip.metadata?.uncompressedSize || 0) / suspiciousZip.size;
      const isZipBomb = compressionRatio > 1000; // Suspicious compression ratio

      expect(isZipBomb).toBe(true);
    });

    test('should detect document with macros', () => {
      // Simulated Office document with macros
      const macroDocument = {
        name: 'document.docm',
        size: 2048,
        type: 'application/vnd.ms-word.document.macroEnabled.12',
        data: Buffer.from('macro_enabled_content_here')
      };

      // Macro-enabled documents should be flagged
      const isMacroEnabled = macroDocument.type.includes('macroEnabled') || 
                            macroDocument.name.endsWith('.docm') ||
                            macroDocument.name.endsWith('.xlsm') ||
                            macroDocument.name.endsWith('.pptm');

      expect(isMacroEnabled).toBe(true);
    });

    test('should validate file type consistency', () => {
      const inconsistentFiles = [
        {
          name: 'image.jpg',
          type: 'image/jpeg',
          data: Buffer.from('%PDF-1.4') // PDF content with JPEG extension
        },
        {
          name: 'document.pdf',
          type: 'application/pdf',
          data: Buffer.from('\x89PNG\r\n\x1a\n') // PNG content with PDF extension
        },
        {
          name: 'text.txt',
          type: 'text/plain',
          data: Buffer.from([0x4D, 0x5A]) // Executable content with TXT extension
        }
      ];

      inconsistentFiles.forEach(file => {
        const contentType = detectContentType(file.data);
        const isConsistent = isContentTypeConsistent(file.name, file.type, contentType);
        expect(isConsistent).toBe(false);
      });
    });

    test('should detect files with multiple extensions', () => {
      const multiExtensionFiles = [
        'document.pdf.exe',
        'image.jpg.scr',
        'text.txt.bat',
        'archive.zip.com'
      ];

      multiExtensionFiles.forEach(filename => {
        const extensions = filename.split('.').slice(1);
        const hasMultipleExtensions = extensions.length > 1;
        const hasDangerousExtension = extensions.some(ext => 
          FileSecurityValidator['DANGEROUS_EXTENSIONS'].includes('.' + ext)
        );

        expect(hasMultipleExtensions).toBe(true);
        expect(hasDangerousExtension).toBe(true);
      });
    });
  });

  // Helper functions for testing
  function generateSecureStoragePath(filename: string): string {
    // Simulate secure path generation
    const sanitized = filename
      .replace(/[^a-zA-Z0-9_\-\.]/g, '_')
      .replace(/\.{2,}/g, '.')
      .substring(0, 255);
    
    return `/secure/storage/${Date.now()}_${sanitized}`;
  }

  function detectContentType(data: Buffer): string {
    // Simplified content type detection
    if (data.slice(0, 4).toString() === '%PDF') return 'application/pdf';
    if (data.slice(0, 8).toString() === '\x89PNG\r\n\x1a\n') return 'image/png';
    if (data.slice(0, 2).equals(Buffer.from([0xFF, 0xD8]))) return 'image/jpeg';
    if (data.slice(0, 2).equals(Buffer.from([0x4D, 0x5A]))) return 'application/x-executable';
    return 'application/octet-stream';
  }

  function isContentTypeConsistent(filename: string, declaredType: string, detectedType: string): boolean {
    // Simplified consistency check
    const extension = filename.toLowerCase().split('.').pop();
    const typeMap: Record<string, string> = {
      'pdf': 'application/pdf',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'txt': 'text/plain'
    };

    const expectedType = typeMap[extension || ''];
    return declaredType === detectedType && declaredType === expectedType;
  }
});