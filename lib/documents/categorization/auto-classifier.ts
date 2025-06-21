/**
 * Document Categorization and Auto-Classification System
 * Intelligent document organization with ML-powered categorization
 */

import { DocumentCategory, ClassificationRule, SecureDocument } from '../types';

export interface ClassificationConfig {
  enableAutoClassification: boolean;
  confidenceThreshold: number; // 0-1
  enableContentAnalysis: boolean;
  enableNameAnalysis: boolean;
  enableMetadataAnalysis: boolean;
  enableMLClassification: boolean;
  fallbackCategory: string;
  maxCategories: number;
}

export interface ClassificationResult {
  categoryId: string;
  confidence: number;
  reason: string;
  matchedRules: ClassificationRule[];
  suggestedTags: string[];
  personalDataDetected: boolean;
  sensitivityLevel: 'low' | 'medium' | 'high';
}

export interface CategoryMetrics {
  categoryId: string;
  documentCount: number;
  averageSize: number;
  lastUpdated: Date;
  autoClassificationAccuracy: number;
  popularTags: Array<{ tag: string; count: number }>;
}

export class DocumentCategorizer {
  private static config: ClassificationConfig = {
    enableAutoClassification: true,
    confidenceThreshold: 0.7,
    enableContentAnalysis: true,
    enableNameAnalysis: true,
    enableMetadataAnalysis: true,
    enableMLClassification: false, // Requires ML model
    fallbackCategory: 'uncategorized',
    maxCategories: 5
  };

  private static readonly PREDEFINED_CATEGORIES: DocumentCategory[] = [
    {
      id: 'legal',
      name: 'Legal Documents',
      description: 'Legal documents, contracts, agreements',
      icon: 'scale',
      color: '#1e40af',
      autoClassificationRules: [
        {
          field: 'name',
          operator: 'contains',
          value: 'contract|agreement|legal|terms|policy',
          confidence: 0.8
        },
        {
          field: 'content',
          operator: 'contains',
          value: 'whereas|party|agreement|contract|legal',
          confidence: 0.7
        }
      ],
      defaultRetentionPolicy: 'legal-7years'
    },
    {
      id: 'financial',
      name: 'Financial Records',
      description: 'Financial statements, invoices, receipts',
      icon: 'dollar',
      color: '#059669',
      autoClassificationRules: [
        {
          field: 'name',
          operator: 'contains',
          value: 'invoice|receipt|statement|financial|tax|payment',
          confidence: 0.9
        },
        {
          field: 'content',
          operator: 'contains',
          value: '\\$|€|£|invoice|payment|tax|amount',
          confidence: 0.8
        }
      ],
      defaultRetentionPolicy: 'financial-7years'
    },
    {
      id: 'personal',
      name: 'Personal Documents',
      description: 'Personal identification, certificates, personal data',
      icon: 'user',
      color: '#7c3aed',
      autoClassificationRules: [
        {
          field: 'name',
          operator: 'contains',
          value: 'passport|license|certificate|birth|death|marriage',
          confidence: 0.9
        },
        {
          field: 'content',
          operator: 'contains',
          value: 'born|social security|passport|license|certificate',
          confidence: 0.8
        }
      ],
      defaultRetentionPolicy: 'personal-indefinite'
    },
    {
      id: 'medical',
      name: 'Medical Records',
      description: 'Medical documents, health records, prescriptions',
      icon: 'heart',
      color: '#dc2626',
      autoClassificationRules: [
        {
          field: 'name',
          operator: 'contains',
          value: 'medical|health|prescription|doctor|hospital|clinic',
          confidence: 0.9
        },
        {
          field: 'content',
          operator: 'contains',
          value: 'patient|diagnosis|treatment|medication|doctor|medical',
          confidence: 0.8
        }
      ],
      defaultRetentionPolicy: 'medical-10years'
    },
    {
      id: 'funeral',
      name: 'Funeral Planning',
      description: 'Funeral arrangements, memorials, estate planning',
      icon: 'flower',
      color: '#6b7280',
      autoClassificationRules: [
        {
          field: 'name',
          operator: 'contains',
          value: 'funeral|memorial|burial|cremation|estate|will|inheritance',
          confidence: 0.9
        },
        {
          field: 'content',
          operator: 'contains',
          value: 'funeral|memorial|deceased|burial|cremation|estate|will',
          confidence: 0.8
        }
      ],
      defaultRetentionPolicy: 'funeral-indefinite'
    },
    {
      id: 'insurance',
      name: 'Insurance Documents',
      description: 'Insurance policies, claims, coverage documents',
      icon: 'shield',
      color: '#2563eb',
      autoClassificationRules: [
        {
          field: 'name',
          operator: 'contains',
          value: 'insurance|policy|claim|coverage|premium',
          confidence: 0.9
        },
        {
          field: 'content',
          operator: 'contains',
          value: 'insurance|policy|claim|coverage|premium|deductible',
          confidence: 0.8
        }
      ],
      defaultRetentionPolicy: 'insurance-5years'
    }
  ];

  /**
   * Automatically classify a document based on its properties
   */
  static async classifyDocument(
    document: Partial<SecureDocument>,
    content?: string
  ): Promise<ClassificationResult[]> {
    if (!this.config.enableAutoClassification) {
      return [{
        categoryId: this.config.fallbackCategory,
        confidence: 0.5,
        reason: 'Auto-classification disabled',
        matchedRules: [],
        suggestedTags: [],
        personalDataDetected: false,
        sensitivityLevel: 'low'
      }];
    }

    const results: ClassificationResult[] = [];
    const categories = await this.getCategories();

    for (const category of categories) {
      const result = await this.classifyAgainstCategory(document, category, content);
      if (result.confidence >= this.config.confidenceThreshold) {
        results.push(result);
      }
    }

    // Sort by confidence and limit results
    results.sort((a, b) => b.confidence - a.confidence);
    const topResults = results.slice(0, this.config.maxCategories);

    // If no categories meet threshold, use fallback
    if (topResults.length === 0) {
      return [{
        categoryId: this.config.fallbackCategory,
        confidence: 0.5,
        reason: 'No category met confidence threshold',
        matchedRules: [],
        suggestedTags: await this.extractTags(document, content),
        personalDataDetected: await this.detectPersonalData(document, content),
        sensitivityLevel: await this.assessSensitivity(document, content)
      }];
    }

    return topResults;
  }

  /**
   * Classify document against a specific category
   */
  private static async classifyAgainstCategory(
    document: Partial<SecureDocument>,
    category: DocumentCategory,
    content?: string
  ): Promise<ClassificationResult> {
    const matchedRules: ClassificationRule[] = [];
    let totalScore = 0;
    let ruleCount = 0;

    for (const rule of category.autoClassificationRules) {
      const match = await this.evaluateRule(rule, document, content);
      if (match.matches) {
        matchedRules.push(rule);
        totalScore += rule.confidence * match.strength;
        ruleCount++;
      }
    }

    const confidence = ruleCount > 0 ? totalScore / ruleCount : 0;
    const reason = matchedRules.length > 0 
      ? `Matched ${matchedRules.length} classification rules`
      : 'No rules matched';

    return {
      categoryId: category.id,
      confidence,
      reason,
      matchedRules,
      suggestedTags: await this.extractTags(document, content),
      personalDataDetected: await this.detectPersonalData(document, content),
      sensitivityLevel: await this.assessSensitivity(document, content)
    };
  }

  /**
   * Evaluate a classification rule against document
   */
  private static async evaluateRule(
    rule: ClassificationRule,
    document: Partial<SecureDocument>,
    content?: string
  ): Promise<{ matches: boolean; strength: number }> {
    let targetValue = '';
    
    switch (rule.field) {
      case 'name':
        targetValue = document.name || '';
        break;
      case 'content':
        targetValue = content || '';
        break;
      case 'metadata':
        targetValue = JSON.stringify(document.metadata || {});
        break;
      default:
        return { matches: false, strength: 0 };
    }

    const matches = this.evaluateOperator(rule.operator, targetValue, rule.value);
    const strength = matches ? 1.0 : 0.0; // Could be enhanced with fuzzy matching

    return { matches, strength };
  }

  /**
   * Evaluate operator against values
   */
  private static evaluateOperator(
    operator: string,
    target: string,
    pattern: string
  ): boolean {
    const targetLower = target.toLowerCase();
    const patternLower = pattern.toLowerCase();

    switch (operator) {
      case 'contains':
        return targetLower.includes(patternLower);
      case 'matches':
        return targetLower === patternLower;
      case 'startsWith':
        return targetLower.startsWith(patternLower);
      case 'endsWith':
        return targetLower.endsWith(patternLower);
      case 'regex':
        try {
          const regex = new RegExp(pattern, 'i');
          return regex.test(target);
        } catch {
          return false;
        }
      default:
        return false;
    }
  }

  /**
   * Extract relevant tags from document
   */
  private static async extractTags(
    document: Partial<SecureDocument>,
    content?: string
  ): Promise<string[]> {
    const tags: Set<string> = new Set();
    
    // Extract from filename
    if (document.name) {
      const nameTags = this.extractTagsFromText(document.name);
      nameTags.forEach(tag => tags.add(tag));
    }

    // Extract from content (if available and enabled)
    if (content && this.config.enableContentAnalysis) {
      const contentTags = this.extractTagsFromText(content);
      contentTags.forEach(tag => tags.add(tag));
    }

    // Extract from existing metadata
    if (document.metadata?.tags) {
      document.metadata.tags.forEach(tag => tags.add(tag));
    }

    return Array.from(tags).slice(0, 10); // Limit to 10 tags
  }

  /**
   * Extract tags from text using keyword analysis
   */
  private static extractTagsFromText(text: string): string[] {
    const commonKeywords = [
      'contract', 'agreement', 'invoice', 'receipt', 'statement',
      'medical', 'health', 'insurance', 'policy', 'claim',
      'personal', 'identification', 'certificate', 'license',
      'funeral', 'memorial', 'estate', 'will', 'inheritance',
      'financial', 'tax', 'payment', 'legal', 'document'
    ];

    const textLower = text.toLowerCase();
    return commonKeywords.filter(keyword => textLower.includes(keyword));
  }

  /**
   * Detect personal data in document
   */
  private static async detectPersonalData(
    document: Partial<SecureDocument>,
    content?: string
  ): Promise<boolean> {
    const personalDataPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b[A-Z]\d{8}\b/, // Passport
      /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/, // Credit card
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{3}-\d{3}-\d{4}\b/, // Phone number
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/ // Date of birth pattern
    ];

    const textToCheck = `${document.name || ''} ${content || ''}`;
    
    return personalDataPatterns.some(pattern => pattern.test(textToCheck));
  }

  /**
   * Assess document sensitivity level
   */
  private static async assessSensitivity(
    document: Partial<SecureDocument>,
    content?: string
  ): Promise<'low' | 'medium' | 'high'> {
    const textToCheck = `${document.name || ''} ${content || ''}`.toLowerCase();
    
    const highSensitivityKeywords = [
      'ssn', 'social security', 'passport', 'medical', 'health',
      'diagnosis', 'treatment', 'confidential', 'private'
    ];
    
    const mediumSensitivityKeywords = [
      'financial', 'insurance', 'legal', 'contract', 'personal',
      'address', 'phone', 'email'
    ];

    if (highSensitivityKeywords.some(keyword => textToCheck.includes(keyword))) {
      return 'high';
    }
    
    if (mediumSensitivityKeywords.some(keyword => textToCheck.includes(keyword))) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Get all categories with their rules
   */
  static async getCategories(): Promise<DocumentCategory[]> {
    // In a real implementation, this would fetch from database
    return this.PREDEFINED_CATEGORIES;
  }

  /**
   * Create a new category
   */
  static async createCategory(category: Omit<DocumentCategory, 'id'>): Promise<DocumentCategory> {
    const newCategory: DocumentCategory = {
      id: this.generateCategoryId(category.name),
      ...category
    };
    
    // In a real implementation, this would save to database
    return newCategory;
  }

  /**
   * Update category rules
   */
  static async updateCategoryRules(
    categoryId: string,
    rules: ClassificationRule[]
  ): Promise<boolean> {
    // In a real implementation, this would update database
    return true;
  }

  /**
   * Get category metrics and statistics
   */
  static async getCategoryMetrics(categoryId?: string): Promise<CategoryMetrics[]> {
    // In a real implementation, this would query database for metrics
    return [];
  }

  /**
   * Batch classify multiple documents
   */
  static async batchClassifyDocuments(
    documents: Array<{ document: Partial<SecureDocument>; content?: string }>
  ): Promise<Array<{
    documentId: string;
    classifications: ClassificationResult[];
    processingTime: number;
  }>> {
    const results = [];
    
    for (const { document, content } of documents) {
      const startTime = Date.now();
      const classifications = await this.classifyDocument(document, content);
      const processingTime = Date.now() - startTime;
      
      results.push({
        documentId: document.id || 'unknown',
        classifications,
        processingTime
      });
    }
    
    return results;
  }

  /**
   * Train classification model with user feedback
   */
  static async trainWithFeedback(
    documentId: string,
    correctCategoryId: string,
    predictedCategoryId: string,
    confidence: number
  ): Promise<void> {
    // In a real implementation, this would update ML model training data
    // For now, we could adjust rule weights based on feedback
  }

  /**
   * Get classification suggestions for manual review
   */
  static async getClassificationSuggestions(
    documents: SecureDocument[]
  ): Promise<Array<{
    documentId: string;
    currentCategory: string;
    suggestedCategory: string;
    confidence: number;
    reason: string;
  }>> {
    const suggestions = [];
    
    for (const document of documents) {
      const classifications = await this.classifyDocument(document);
      const topClassification = classifications[0];
      
      if (topClassification && 
          topClassification.categoryId !== document.category?.id &&
          topClassification.confidence > 0.8) {
        suggestions.push({
          documentId: document.id,
          currentCategory: document.category?.id || 'none',
          suggestedCategory: topClassification.categoryId,
          confidence: topClassification.confidence,
          reason: topClassification.reason
        });
      }
    }
    
    return suggestions;
  }

  // Helper methods

  private static generateCategoryId(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  }
}

/**
 * Category hierarchy management
 */
export class CategoryHierarchy {
  /**
   * Build category tree structure
   */
  static async buildCategoryTree(): Promise<Array<DocumentCategory & { children: DocumentCategory[] }>> {
    const categories = await DocumentCategorizer.getCategories();
    const categoryMap = new Map<string, DocumentCategory & { children: DocumentCategory[] }>();
    
    // Initialize all categories with empty children arrays
    categories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });
    
    // Build hierarchy
    const rootCategories: Array<DocumentCategory & { children: DocumentCategory[] }> = [];
    
    categories.forEach(cat => {
      const categoryWithChildren = categoryMap.get(cat.id)!;
      
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children.push(categoryWithChildren);
        } else {
          rootCategories.push(categoryWithChildren);
        }
      } else {
        rootCategories.push(categoryWithChildren);
      }
    });
    
    return rootCategories;
  }

  /**
   * Get category path
   */
  static async getCategoryPath(categoryId: string): Promise<string[]> {
    const categories = await DocumentCategorizer.getCategories();
    const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
    
    const path: string[] = [];
    let currentId: string | undefined = categoryId;
    
    while (currentId) {
      const category = categoryMap.get(currentId);
      if (!category) break;
      
      path.unshift(category.name);
      currentId = category.parentId;
    }
    
    return path;
  }
}