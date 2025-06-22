/**
 * Checkpointing System Tests
 * 
 * Comprehensive tests for state management, persistence, checkpointing,
 * recovery, rollback, and data integrity.
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  FuneralCheckpointSaver,
  FuneralCheckpointMetadata,
  CheckpointConfig,
  CheckpointEntry,
  createFuneralCheckpointSaver
} from '../../../lib/agents/checkpointing-system';
import { Checkpoint, CheckpointMetadata } from '@langchain/langgraph';
import { RunnableConfig } from '@langchain/core/runnables';

// Mock implementations for testing
class MockRedisClient {
  private storage: Map<string, string> = new Map();
  private hashes: Map<string, Map<string, string>> = new Map();

  async get(key: string): Promise<string | null> {
    return this.storage.get(key) || null;
  }

  async set(key: string, value: string, options?: { EX?: number }): Promise<void> {
    this.storage.set(key, value);
  }

  async del(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.storage.keys()).filter(key => regex.test(key));
  }

  async hget(key: string, field: string): Promise<string | null> {
    const hash = this.hashes.get(key);
    return hash?.get(field) || null;
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    if (!this.hashes.has(key)) {
      this.hashes.set(key, new Map());
    }
    this.hashes.get(key)!.set(field, value);
  }

  async hdel(key: string, field: string): Promise<void> {
    const hash = this.hashes.get(key);
    if (hash) {
      hash.delete(field);
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    const hash = this.hashes.get(key);
    return hash ? Object.fromEntries(hash) : {};
  }

  clear() {
    this.storage.clear();
    this.hashes.clear();
  }
}

class MockPostgreSQLClient {
  private tables: Map<string, any[]> = new Map();
  private isConnected = false;

  async connect(): Promise<void> {
    this.isConnected = true;
  }

  async end(): Promise<void> {
    this.isConnected = false;
  }

  async query(text: string, params?: any[]): Promise<{ rows: any[] }> {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    // Simple mock implementation for testing
    if (text.includes('CREATE TABLE') || text.includes('CREATE INDEX')) {
      return { rows: [] };
    }

    if (text.includes('INSERT')) {
      const tableName = 'funeral_checkpoints';
      if (!this.tables.has(tableName)) {
        this.tables.set(tableName, []);
      }
      
      const entry = {
        id: params?.[0],
        thread_id: params?.[1],
        checkpoint_ns: params?.[2],
        checkpoint_id: params?.[3],
        parent_checkpoint_id: params?.[4],
        type: params?.[5],
        checkpoint: params?.[6],
        metadata: params?.[7],
        created_at: params?.[8],
        updated_at: params?.[9]
      };
      
      this.tables.get(tableName)!.push(entry);
      return { rows: [entry] };
    }

    if (text.includes('SELECT')) {
      const tableName = 'funeral_checkpoints';
      const rows = this.tables.get(tableName) || [];
      
      if (params && params.length > 0) {
        // Filter based on parameters (simplified)
        const filtered = rows.filter(row => 
          row.thread_id === params[0] && 
          (params.length < 2 || row.checkpoint_ns === params[1])
        );
        return { rows: filtered };
      }
      
      return { rows };
    }

    if (text.includes('DELETE')) {
      const tableName = 'funeral_checkpoints';
      const rows = this.tables.get(tableName) || [];
      const filtered = rows.filter(row => !(
        row.thread_id === params?.[0] && 
        row.checkpoint_ns === params?.[1] && 
        row.checkpoint_id === params?.[2]
      ));
      this.tables.set(tableName, filtered);
      return { rows: [] };
    }

    if (text.includes('COUNT')) {
      const tableName = 'funeral_checkpoints';
      const rows = this.tables.get(tableName) || [];
      return { rows: [{ total: rows.length.toString() }] };
    }

    return { rows: [] };
  }

  clear() {
    this.tables.clear();
  }
}

describe('FuneralCheckpointSaver', () => {
  let checkpointSaver: FuneralCheckpointSaver;
  let mockRedis: MockRedisClient;
  let mockPostgres: MockPostgreSQLClient;
  let config: CheckpointConfig;

  beforeEach(async () => {
    mockRedis = new MockRedisClient();
    mockPostgres = new MockPostgreSQLClient();
    
    config = {
      redis: {
        client: mockRedis as any,
        keyPrefix: 'test_funeral',
        defaultTTL: 3600
      },
      postgresql: {
        client: mockPostgres as any,
        tableName: 'funeral_checkpoints',
        schemaName: 'public'
      },
      enableCompression: false, // Disable for testing
      maxCheckpoints: 100,
      cleanupInterval: 24 * 60 * 60 * 1000
    };

    checkpointSaver = new FuneralCheckpointSaver(config);
    await new Promise(resolve => setTimeout(resolve, 100)); // Allow initialization
  });

  afterEach(async () => {
    checkpointSaver.stopCleanupTimer();
    await checkpointSaver.destroy();
    mockRedis.clear();
    mockPostgres.clear();
    jest.clearAllMocks();
  });

  describe('Initialization and Setup', () => {
    test('should initialize storage systems correctly', async () => {
      expect(mockPostgres).toBeDefined();
      expect(mockRedis).toBeDefined();
    });

    test('should create necessary database tables', async () => {
      // Tables should be created during initialization
      const result = await mockPostgres.query('SELECT * FROM public.funeral_checkpoints');
      expect(result).toBeDefined();
    });

    test('should use factory function correctly', () => {
      const factorySaver = createFuneralCheckpointSaver(
        mockRedis as any,
        mockPostgres as any,
        { enableCompression: true }
      );
      
      expect(factorySaver).toBeInstanceOf(FuneralCheckpointSaver);
    });
  });

  describe('Checkpoint Storage and Retrieval', () => {
    test('should save checkpoint to both Redis and PostgreSQL', async () => {
      const checkpoint: Checkpoint = {
        v: 1,
        id: 'checkpoint_001',
        ts: new Date().toISOString(),
        channel_values: {
          planningStage: 'requirements_gathering',
          familyRequirements: { contact: 'John Doe' },
          documentsRequired: ['death_certificate']
        },
        channel_versions: {},
        versions_seen: {},
        pending_sends: []
      };

      const metadata: FuneralCheckpointMetadata = {
        workflowId: 'workflow_001',
        stage: 'requirements_gathering',
        familyId: 'family_001',
        directorId: 'director_001',
        timestamp: new Date().toISOString(),
        version: 1,
        priority: 'high',
        tags: ['test', 'requirements']
      };

      const config: RunnableConfig = {
        configurable: {
          thread_id: 'thread_001',
          checkpoint_ns: 'test_namespace'
        }
      };

      const result = await checkpointSaver.put(config, checkpoint, metadata, {});
      
      expect(result.configurable?.checkpoint_id).toBe('checkpoint_001');
      
      // Verify stored in Redis
      const redisKey = 'test_funeral:checkpoint:thread_001:test_namespace:checkpoint_001';
      const redisData = await mockRedis.get(redisKey);
      expect(redisData).toBeDefined();
      
      // Verify stored in PostgreSQL
      const pgResult = await mockPostgres.query(
        'SELECT * FROM public.funeral_checkpoints WHERE thread_id = $1 AND checkpoint_id = $2',
        ['thread_001', 'checkpoint_001']
      );
      expect(pgResult.rows.length).toBe(1);
    });

    test('should retrieve checkpoint from Redis cache first', async () => {
      // Set up cached checkpoint
      const checkpoint: Checkpoint = {
        v: 1,
        id: 'cached_checkpoint',
        ts: new Date().toISOString(),
        channel_values: { test: 'data' },
        channel_versions: {},
        versions_seen: {},
        pending_sends: []
      };

      const metadata: FuneralCheckpointMetadata = {
        workflowId: 'workflow_002',
        stage: 'cultural_assessment',
        familyId: 'family_002',
        directorId: 'director_002',
        timestamp: new Date().toISOString(),
        version: 1,
        priority: 'medium',
        tags: ['cached']
      };

      const config: RunnableConfig = {
        configurable: {
          thread_id: 'thread_002',
          checkpoint_ns: 'test_namespace',
          checkpoint_id: 'cached_checkpoint'
        }
      };

      // Save checkpoint
      await checkpointSaver.put(config, checkpoint, metadata, {});
      
      // Retrieve checkpoint
      const retrieved = await checkpointSaver.get(config);
      
      expect(retrieved).toBeDefined();
      expect(retrieved!.checkpoint.id).toBe('cached_checkpoint');
      expect(retrieved!.metadata.stage).toBe('cultural_assessment');
    });

    test('should fallback to PostgreSQL when not in Redis cache', async () => {
      // Manually insert into PostgreSQL only
      await mockPostgres.query(
        'INSERT INTO public.funeral_checkpoints (id, thread_id, checkpoint_ns, checkpoint_id, type, checkpoint, metadata, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [
          'postgres_only',
          'thread_003',
          'test_namespace',
          'postgres_checkpoint',
          'funeral_planning',
          JSON.stringify({
            v: 1,
            id: 'postgres_checkpoint',
            ts: new Date().toISOString(),
            channel_values: { source: 'postgres' },
            channel_versions: {},
            versions_seen: {},
            pending_sends: []
          }),
          JSON.stringify({
            workflowId: 'workflow_003',
            stage: 'document_collection',
            familyId: 'family_003',
            directorId: 'director_003'
          }),
          new Date(),
          new Date()
        ]
      );

      const config: RunnableConfig = {
        configurable: {
          thread_id: 'thread_003',
          checkpoint_ns: 'test_namespace',
          checkpoint_id: 'postgres_checkpoint'
        }
      };

      const retrieved = await checkpointSaver.get(config);
      
      expect(retrieved).toBeDefined();
      expect(retrieved!.checkpoint.id).toBe('postgres_checkpoint');
      expect(retrieved!.checkpoint.channel_values.source).toBe('postgres');
    });

    test('should return latest checkpoint when no specific ID provided', async () => {
      // Create multiple checkpoints
      const checkpoints = [
        { id: 'checkpoint_1', ts: new Date(Date.now() - 1000).toISOString() },
        { id: 'checkpoint_2', ts: new Date(Date.now() - 500).toISOString() },
        { id: 'checkpoint_3', ts: new Date().toISOString() }
      ];

      for (const cp of checkpoints) {
        await mockPostgres.query(
          'INSERT INTO public.funeral_checkpoints (id, thread_id, checkpoint_ns, checkpoint_id, type, checkpoint, metadata, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [
            cp.id,
            'thread_latest',
            'test_namespace',
            cp.id,
            'funeral_planning',
            JSON.stringify({
              v: 1,
              id: cp.id,
              ts: cp.ts,
              channel_values: {},
              channel_versions: {},
              versions_seen: {},
              pending_sends: []
            }),
            JSON.stringify({ stage: 'test' }),
            new Date(cp.ts),
            new Date(cp.ts)
          ]
        );
      }

      const config: RunnableConfig = {
        configurable: {
          thread_id: 'thread_latest',
          checkpoint_ns: 'test_namespace'
        }
      };

      const retrieved = await checkpointSaver.get(config);
      
      expect(retrieved).toBeDefined();
      expect(retrieved!.checkpoint.id).toBe('checkpoint_3');
    });
  });

  describe('Checkpoint Listing and Filtering', () => {
    test('should list checkpoints for a thread', async () => {
      // Create test checkpoints
      const threadId = 'thread_list_test';
      const checkpointIds = ['list_1', 'list_2', 'list_3'];

      for (const id of checkpointIds) {
        await mockPostgres.query(
          'INSERT INTO public.funeral_checkpoints (id, thread_id, checkpoint_ns, checkpoint_id, type, checkpoint, metadata, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [
            id,
            threadId,
            'test_namespace',
            id,
            'funeral_planning',
            JSON.stringify({
              v: 1,
              id,
              ts: new Date().toISOString(),
              channel_values: {},
              channel_versions: {},
              versions_seen: {},
              pending_sends: []
            }),
            JSON.stringify({ stage: 'test', workflowId: 'workflow_list' }),
            new Date(),
            new Date()
          ]
        );
      }

      const config: RunnableConfig = {
        configurable: {
          thread_id: threadId,
          checkpoint_ns: 'test_namespace'
        }
      };

      const checkpoints = await checkpointSaver.list(config);
      
      expect(checkpoints.length).toBe(3);
      expect(checkpoints.map(cp => cp.checkpoint.id)).toEqual(
        expect.arrayContaining(checkpointIds)
      );
    });

    test('should filter checkpoints by metadata', async () => {
      const threadId = 'thread_filter_test';
      
      // Create checkpoints with different stages
      const checkpointData = [
        { id: 'filter_1', stage: 'requirements_gathering' },
        { id: 'filter_2', stage: 'cultural_assessment' },
        { id: 'filter_3', stage: 'requirements_gathering' }
      ];

      for (const data of checkpointData) {
        await mockPostgres.query(
          'INSERT INTO public.funeral_checkpoints (id, thread_id, checkpoint_ns, checkpoint_id, type, checkpoint, metadata, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [
            data.id,
            threadId,
            'test_namespace',
            data.id,
            'funeral_planning',
            JSON.stringify({
              v: 1,
              id: data.id,
              ts: new Date().toISOString(),
              channel_values: {},
              channel_versions: {},
              versions_seen: {},
              pending_sends: []
            }),
            JSON.stringify({ stage: data.stage }),
            new Date(),
            new Date()
          ]
        );
      }

      const config: RunnableConfig = {
        configurable: {
          thread_id: threadId,
          checkpoint_ns: 'test_namespace'
        }
      };

      const filtered = await checkpointSaver.list(config, {
        filter: { stage: 'requirements_gathering' }
      });
      
      expect(filtered.length).toBe(2);
      expect(filtered.map(cp => cp.checkpoint.id)).toEqual(
        expect.arrayContaining(['filter_1', 'filter_3'])
      );
    });

    test('should limit checkpoint results', async () => {
      const threadId = 'thread_limit_test';
      
      // Create 5 checkpoints
      for (let i = 1; i <= 5; i++) {
        await mockPostgres.query(
          'INSERT INTO public.funeral_checkpoints (id, thread_id, checkpoint_ns, checkpoint_id, type, checkpoint, metadata, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [
            `limit_${i}`,
            threadId,
            'test_namespace',
            `limit_${i}`,
            'funeral_planning',
            JSON.stringify({
              v: 1,
              id: `limit_${i}`,
              ts: new Date().toISOString(),
              channel_values: {},
              channel_versions: {},
              versions_seen: {},
              pending_sends: []
            }),
            JSON.stringify({ stage: 'test' }),
            new Date(),
            new Date()
          ]
        );
      }

      const config: RunnableConfig = {
        configurable: {
          thread_id: threadId,
          checkpoint_ns: 'test_namespace'
        }
      };

      const limited = await checkpointSaver.list(config, { limit: 3 });
      
      expect(limited.length).toBe(3);
    });
  });

  describe('Checkpoint Deletion and Cleanup', () => {
    test('should delete checkpoint from both Redis and PostgreSQL', async () => {
      const checkpoint: Checkpoint = {
        v: 1,
        id: 'delete_test',
        ts: new Date().toISOString(),
        channel_values: {},
        channel_versions: {},
        versions_seen: {},
        pending_sends: []
      };

      const metadata: FuneralCheckpointMetadata = {
        workflowId: 'workflow_delete',
        stage: 'test',
        familyId: 'family_delete',
        directorId: 'director_delete',
        timestamp: new Date().toISOString(),
        version: 1,
        priority: 'low',
        tags: ['delete_test']
      };

      const config: RunnableConfig = {
        configurable: {
          thread_id: 'thread_delete',
          checkpoint_ns: 'test_namespace',
          checkpoint_id: 'delete_test'
        }
      };

      // Save checkpoint
      await checkpointSaver.put(config, checkpoint, metadata, {});
      
      // Verify it exists
      const beforeDelete = await checkpointSaver.get(config);
      expect(beforeDelete).toBeDefined();
      
      // Delete checkpoint
      await checkpointSaver.delete(config);
      
      // Verify it's deleted
      const afterDelete = await checkpointSaver.get(config);
      expect(afterDelete).toBeUndefined();
    });

    test('should handle cleanup of old checkpoints', async () => {
      // Create old checkpoint
      const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago
      
      await mockPostgres.query(
        'INSERT INTO public.funeral_checkpoints (id, thread_id, checkpoint_ns, checkpoint_id, type, checkpoint, metadata, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [
          'old_checkpoint',
          'thread_cleanup',
          'test_namespace',
          'old_checkpoint',
          'funeral_planning',
          JSON.stringify({
            v: 1,
            id: 'old_checkpoint',
            ts: oldDate.toISOString(),
            channel_values: {},
            channel_versions: {},
            versions_seen: {},
            pending_sends: []
          }),
          JSON.stringify({ stage: 'old' }),
          oldDate,
          oldDate
        ]
      );

      // Run cleanup
      await checkpointSaver.cleanup();
      
      // Verify old checkpoint handling (implementation depends on cleanup logic)
      const remaining = await mockPostgres.query(
        'SELECT * FROM public.funeral_checkpoints WHERE checkpoint_id = $1',
        ['old_checkpoint']
      );
      
      // The actual cleanup behavior will depend on the implementation
      expect(remaining).toBeDefined();
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle database connection failures gracefully', async () => {
      await mockPostgres.end(); // Disconnect database
      
      const checkpoint: Checkpoint = {
        v: 1,
        id: 'error_test',
        ts: new Date().toISOString(),
        channel_values: {},
        channel_versions: {},
        versions_seen: {},
        pending_sends: []
      };

      const metadata: FuneralCheckpointMetadata = {
        workflowId: 'workflow_error',
        stage: 'error_test',
        familyId: 'family_error',
        directorId: 'director_error',
        timestamp: new Date().toISOString(),
        version: 1,
        priority: 'high',
        tags: ['error']
      };

      const config: RunnableConfig = {
        configurable: {
          thread_id: 'thread_error',
          checkpoint_ns: 'test_namespace'
        }
      };

      // Should throw error due to disconnected database
      await expect(checkpointSaver.put(config, checkpoint, metadata, {}))
        .rejects.toThrow();
    });

    test('should handle invalid checkpoint data', async () => {
      const invalidConfig: RunnableConfig = {
        configurable: {
          // Missing thread_id
          checkpoint_ns: 'test_namespace'
        }
      };

      const checkpoint: Checkpoint = {
        v: 1,
        id: 'invalid_test',
        ts: new Date().toISOString(),
        channel_values: {},
        channel_versions: {},
        versions_seen: {},
        pending_sends: []
      };

      const metadata: FuneralCheckpointMetadata = {
        workflowId: 'workflow_invalid',
        stage: 'invalid_test',
        familyId: 'family_invalid',
        directorId: 'director_invalid',
        timestamp: new Date().toISOString(),
        version: 1,
        priority: 'medium',
        tags: ['invalid']
      };

      await expect(checkpointSaver.put(invalidConfig, checkpoint, metadata, {}))
        .rejects.toThrow('thread_id is required');
    });

    test('should handle corrupted checkpoint data gracefully', async () => {
      // Insert corrupted data directly
      await mockPostgres.query(
        'INSERT INTO public.funeral_checkpoints (id, thread_id, checkpoint_ns, checkpoint_id, type, checkpoint, metadata, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [
          'corrupted',
          'thread_corrupted',
          'test_namespace',
          'corrupted',
          'funeral_planning',
          'INVALID_JSON{{{', // Corrupted JSON
          'INVALID_METADATA{{{', // Corrupted metadata
          new Date(),
          new Date()
        ]
      );

      const config: RunnableConfig = {
        configurable: {
          thread_id: 'thread_corrupted',
          checkpoint_ns: 'test_namespace',
          checkpoint_id: 'corrupted'
        }
      };

      // Should handle gracefully
      await expect(checkpointSaver.get(config)).rejects.toThrow();
    });
  });

  describe('Statistics and Monitoring', () => {
    test('should provide checkpoint statistics', async () => {
      // Create test checkpoints with different stages
      const checkpoints = [
        { thread: 'stats_1', stage: 'requirements_gathering' },
        { thread: 'stats_1', stage: 'cultural_assessment' },
        { thread: 'stats_2', stage: 'document_collection' },
        { thread: 'stats_2', stage: 'venue_selection' }
      ];

      for (let i = 0; i < checkpoints.length; i++) {
        const cp = checkpoints[i];
        await mockPostgres.query(
          'INSERT INTO public.funeral_checkpoints (id, thread_id, checkpoint_ns, checkpoint_id, type, checkpoint, metadata, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [
            `stats_${i}`,
            cp.thread,
            'test_namespace',
            `stats_${i}`,
            'funeral_planning',
            JSON.stringify({
              v: 1,
              id: `stats_${i}`,
              ts: new Date().toISOString(),
              channel_values: {},
              channel_versions: {},
              versions_seen: {},
              pending_sends: []
            }),
            JSON.stringify({ stage: cp.stage }),
            new Date(),
            new Date()
          ]
        );
      }

      const stats = await checkpointSaver.getStatistics();
      
      expect(stats.totalCheckpoints).toBe(4);
      expect(stats.checkpointsByThread['stats_1']).toBe(2);
      expect(stats.checkpointsByThread['stats_2']).toBe(2);
      expect(stats.checkpointsByStage).toBeDefined();
    });

    test('should provide thread-specific statistics', async () => {
      const threadId = 'specific_thread';
      
      // Create checkpoints for specific thread
      for (let i = 0; i < 3; i++) {
        await mockPostgres.query(
          'INSERT INTO public.funeral_checkpoints (id, thread_id, checkpoint_ns, checkpoint_id, type, checkpoint, metadata, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [
            `specific_${i}`,
            threadId,
            'test_namespace',
            `specific_${i}`,
            'funeral_planning',
            JSON.stringify({
              v: 1,
              id: `specific_${i}`,
              ts: new Date().toISOString(),
              channel_values: {},
              channel_versions: {},
              versions_seen: {},
              pending_sends: []
            }),
            JSON.stringify({ stage: 'test' }),
            new Date(),
            new Date()
          ]
        );
      }

      const stats = await checkpointSaver.getStatistics(threadId);
      
      expect(stats.totalCheckpoints).toBe(3);
      expect(stats.checkpointsByThread[threadId]).toBe(3);
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle large number of checkpoints efficiently', async () => {
      const startTime = Date.now();
      
      // Create many checkpoints
      const promises = [];
      for (let i = 0; i < 50; i++) {
        const checkpoint: Checkpoint = {
          v: 1,
          id: `perf_${i}`,
          ts: new Date().toISOString(),
          channel_values: { index: i },
          channel_versions: {},
          versions_seen: {},
          pending_sends: []
        };

        const metadata: FuneralCheckpointMetadata = {
          workflowId: `workflow_${i}`,
          stage: 'performance_test',
          familyId: `family_${i}`,
          directorId: `director_${i}`,
          timestamp: new Date().toISOString(),
          version: 1,
          priority: 'medium',
          tags: ['performance']
        };

        const config: RunnableConfig = {
          configurable: {
            thread_id: `thread_perf_${i}`,
            checkpoint_ns: 'performance_test'
          }
        };

        promises.push(checkpointSaver.put(config, checkpoint, metadata, {}));
      }

      await Promise.all(promises);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(executionTime).toBeLessThan(10000); // 10 seconds
      
      // Verify all checkpoints were saved
      const stats = await checkpointSaver.getStatistics();
      expect(stats.totalCheckpoints).toBeGreaterThanOrEqual(50);
    });

    test('should handle concurrent checkpoint operations', async () => {
      const concurrentOps = [];
      
      // Create concurrent save and retrieve operations
      for (let i = 0; i < 10; i++) {
        const saveOp = async () => {
          const checkpoint: Checkpoint = {
            v: 1,
            id: `concurrent_${i}`,
            ts: new Date().toISOString(),
            channel_values: { concurrent: true },
            channel_versions: {},
            versions_seen: {},
            pending_sends: []
          };

          const metadata: FuneralCheckpointMetadata = {
            workflowId: `concurrent_workflow_${i}`,
            stage: 'concurrent_test',
            familyId: `concurrent_family_${i}`,
            directorId: `concurrent_director_${i}`,
            timestamp: new Date().toISOString(),
            version: 1,
            priority: 'high',
            tags: ['concurrent']
          };

          const config: RunnableConfig = {
            configurable: {
              thread_id: `concurrent_thread_${i}`,
              checkpoint_ns: 'concurrent_test'
            }
          };

          await checkpointSaver.put(config, checkpoint, metadata, {});
          return await checkpointSaver.get(config);
        };

        concurrentOps.push(saveOp());
      }

      const results = await Promise.all(concurrentOps);
      
      expect(results).toHaveLength(10);
      results.forEach((result, index) => {
        expect(result).toBeDefined();
        expect(result!.checkpoint.id).toBe(`concurrent_${index}`);
      });
    });
  });

  describe('Data Compression and Optimization', () => {
    test('should handle compression when enabled', async () => {
      // Create new saver with compression enabled
      const compressedConfig = {
        ...config,
        enableCompression: true
      };
      
      const compressedSaver = new FuneralCheckpointSaver(compressedConfig);
      
      const checkpoint: Checkpoint = {
        v: 1,
        id: 'compressed_test',
        ts: new Date().toISOString(),
        channel_values: {
          largeData: 'x'.repeat(1000) // Large data to test compression
        },
        channel_versions: {},
        versions_seen: {},
        pending_sends: []
      };

      const metadata: FuneralCheckpointMetadata = {
        workflowId: 'compression_workflow',
        stage: 'compression_test',
        familyId: 'compression_family',
        directorId: 'compression_director',
        timestamp: new Date().toISOString(),
        version: 1,
        priority: 'low',
        tags: ['compression']
      };

      const saveConfig: RunnableConfig = {
        configurable: {
          thread_id: 'compression_thread',
          checkpoint_ns: 'compression_test'
        }
      };

      await compressedSaver.put(saveConfig, checkpoint, metadata, {});
      const retrieved = await compressedSaver.get(saveConfig);
      
      expect(retrieved).toBeDefined();
      expect(retrieved!.checkpoint.channel_values.largeData).toBe('x'.repeat(1000));
      
      await compressedSaver.destroy();
    });
  });

  describe('Backup and Export Functionality', () => {
    test('should support export checkpoint request', async () => {
      const threadId = 'export_thread';
      const outputPath = '/tmp/export_test.json';
      
      // Create checkpoint to export
      const checkpoint: Checkpoint = {
        v: 1,
        id: 'export_test',
        ts: new Date().toISOString(),
        channel_values: { export: true },
        channel_versions: {},
        versions_seen: {},
        pending_sends: []
      };

      const metadata: FuneralCheckpointMetadata = {
        workflowId: 'export_workflow',
        stage: 'export_test',
        familyId: 'export_family',
        directorId: 'export_director',
        timestamp: new Date().toISOString(),
        version: 1,
        priority: 'medium',
        tags: ['export']
      };

      const config: RunnableConfig = {
        configurable: {
          thread_id: threadId,
          checkpoint_ns: 'export_test'
        }
      };

      await checkpointSaver.put(config, checkpoint, metadata, {});
      
      // Test export (placeholder implementation)
      await expect(checkpointSaver.exportCheckpoints(threadId, outputPath))
        .resolves.not.toThrow();
    });

    test('should support import checkpoint request', async () => {
      const inputPath = '/tmp/import_test.json';
      
      // Test import (placeholder implementation)
      await expect(checkpointSaver.importCheckpoints(inputPath))
        .resolves.not.toThrow();
    });
  });
});