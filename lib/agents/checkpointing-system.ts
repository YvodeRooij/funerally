/**
 * Checkpointing System for Funeral Planning Workflows
 * 
 * Provides persistent state management with Redis for caching and PostgreSQL
 * for long-term storage. Implements LangGraph checkpointing interface.
 */

import { BaseCheckpointSaver, Checkpoint, CheckpointMetadata, CheckpointTuple } from "@langchain/langgraph";
import { RunnableConfig } from "@langchain/core/runnables";
import { FuneralWorkflowState } from "./state-management";

// Redis client interface (to be implemented with actual Redis client)
interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX?: number }): Promise<void>;
  del(key: string): Promise<void>;
  keys(pattern: string): Promise<string[]>;
  hget(key: string, field: string): Promise<string | null>;
  hset(key: string, field: string, value: string): Promise<void>;
  hdel(key: string, field: string): Promise<void>;
  hgetall(key: string): Promise<Record<string, string>>;
}

// PostgreSQL client interface (to be implemented with actual PostgreSQL client)
interface PostgreSQLClient {
  query(text: string, params?: any[]): Promise<{ rows: any[] }>;
  connect(): Promise<void>;
  end(): Promise<void>;
}

// Checkpoint storage configuration
export interface CheckpointConfig {
  redis: {
    client: RedisClient;
    keyPrefix: string;
    defaultTTL: number; // Time to live in seconds
  };
  postgresql: {
    client: PostgreSQLClient;
    tableName: string;
    schemaName?: string;
  };
  enableCompression: boolean;
  maxCheckpoints: number;
  cleanupInterval: number; // Cleanup interval in milliseconds
}

// Extended checkpoint metadata for funeral planning
export interface FuneralCheckpointMetadata extends CheckpointMetadata {
  workflowId: string;
  stage: string;
  familyId: string;
  directorId: string;
  timestamp: string;
  version: number;
  culturalContext?: string;
  priority: "low" | "medium" | "high" | "critical";
  tags: string[];
}

// Checkpoint entry for database storage
export interface CheckpointEntry {
  id: string;
  thread_id: string;
  checkpoint_ns: string;
  checkpoint_id: string;
  parent_checkpoint_id?: string;
  type: string;
  checkpoint: string; // JSON serialized checkpoint
  metadata: string; // JSON serialized metadata
  created_at: Date;
  updated_at: Date;
}

/**
 * Funeral Planning Checkpoint Saver
 * 
 * Implements persistent checkpointing with Redis caching and PostgreSQL storage
 */
export class FuneralCheckpointSaver extends BaseCheckpointSaver {
  private config: CheckpointConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: CheckpointConfig) {
    super();
    this.config = config;
    this.initializeStorage();
    this.startCleanupTimer();
  }

  /**
   * Initialize storage systems
   */
  private async initializeStorage(): Promise<void> {
    try {
      await this.config.postgresql.client.connect();
      await this.createTables();
      console.log("[Checkpointing] Storage initialized successfully");
    } catch (error) {
      console.error("[Checkpointing] Failed to initialize storage:", error);
      throw error;
    }
  }

  /**
   * Create necessary database tables
   */
  private async createTables(): Promise<void> {
    const schema = this.config.postgresql.schemaName || "public";
    const tableName = this.config.postgresql.tableName;

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${schema}.${tableName} (
        id VARCHAR(255) PRIMARY KEY,
        thread_id VARCHAR(255) NOT NULL,
        checkpoint_ns VARCHAR(255) NOT NULL DEFAULT '',
        checkpoint_id VARCHAR(255) NOT NULL,
        parent_checkpoint_id VARCHAR(255),
        type VARCHAR(100) NOT NULL,
        checkpoint TEXT NOT NULL,
        metadata TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createIndexQueries = [
      `CREATE INDEX IF NOT EXISTS idx_${tableName}_thread_id ON ${schema}.${tableName}(thread_id);`,
      `CREATE INDEX IF NOT EXISTS idx_${tableName}_checkpoint_id ON ${schema}.${tableName}(checkpoint_id);`,
      `CREATE INDEX IF NOT EXISTS idx_${tableName}_created_at ON ${schema}.${tableName}(created_at);`,
      `CREATE INDEX IF NOT EXISTS idx_${tableName}_type ON ${schema}.${tableName}(type);`,
    ];

    await this.config.postgresql.client.query(createTableQuery);
    
    for (const indexQuery of createIndexQueries) {
      await this.config.postgresql.client.query(indexQuery);
    }
  }

  /**
   * Generate checkpoint cache key
   */
  private getCacheKey(threadId: string, checkpointNs: string, checkpointId: string): string {
    return `${this.config.redis.keyPrefix}:checkpoint:${threadId}:${checkpointNs}:${checkpointId}`;
  }

  /**
   * Generate metadata cache key
   */
  private getMetadataCacheKey(threadId: string, checkpointNs: string): string {
    return `${this.config.redis.keyPrefix}:metadata:${threadId}:${checkpointNs}`;
  }

  /**
   * Compress data if compression is enabled
   */
  private compressData(data: string): string {
    if (!this.config.enableCompression) {
      return data;
    }
    // Implement compression logic here (e.g., using zlib)
    // For now, return the data as-is
    return data;
  }

  /**
   * Decompress data if compression is enabled
   */
  private decompressData(data: string): string {
    if (!this.config.enableCompression) {
      return data;
    }
    // Implement decompression logic here
    // For now, return the data as-is
    return data;
  }

  /**
   * Save checkpoint to both Redis and PostgreSQL
   */
  async put(
    config: RunnableConfig,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata,
    newVersions: Record<string, unknown>
  ): Promise<RunnableConfig> {
    const threadId = config.configurable?.thread_id;
    const checkpointNs = config.configurable?.checkpoint_ns || "";
    const checkpointId = checkpoint.id;

    if (!threadId) {
      throw new Error("thread_id is required in config.configurable");
    }

    const funeralMetadata = metadata as FuneralCheckpointMetadata;
    
    // Prepare checkpoint data
    const checkpointData = {
      checkpoint: JSON.stringify(checkpoint),
      metadata: JSON.stringify(funeralMetadata),
      type: "funeral_planning",
    };

    // Compress data if enabled
    const compressedCheckpoint = this.compressData(checkpointData.checkpoint);
    const compressedMetadata = this.compressData(checkpointData.metadata);

    try {
      // Save to Redis for fast access
      const cacheKey = this.getCacheKey(threadId, checkpointNs, checkpointId);
      await this.config.redis.client.set(
        cacheKey,
        JSON.stringify({
          checkpoint: compressedCheckpoint,
          metadata: compressedMetadata,
        }),
        { EX: this.config.redis.defaultTTL }
      );

      // Save metadata to Redis hash for efficient querying
      const metadataCacheKey = this.getMetadataCacheKey(threadId, checkpointNs);
      await this.config.redis.client.hset(
        metadataCacheKey,
        checkpointId,
        compressedMetadata
      );

      // Save to PostgreSQL for persistence
      const entry: CheckpointEntry = {
        id: `${threadId}_${checkpointNs}_${checkpointId}`,
        thread_id: threadId,
        checkpoint_ns: checkpointNs,
        checkpoint_id: checkpointId,
        parent_checkpoint_id: checkpoint.parent_config?.configurable?.checkpoint_id,
        type: checkpointData.type,
        checkpoint: compressedCheckpoint,
        metadata: compressedMetadata,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const query = `
        INSERT INTO ${this.config.postgresql.schemaName || "public"}.${this.config.postgresql.tableName}
        (id, thread_id, checkpoint_ns, checkpoint_id, parent_checkpoint_id, type, checkpoint, metadata, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO UPDATE SET
          checkpoint = EXCLUDED.checkpoint,
          metadata = EXCLUDED.metadata,
          updated_at = EXCLUDED.updated_at
      `;

      await this.config.postgresql.client.query(query, [
        entry.id,
        entry.thread_id,
        entry.checkpoint_ns,
        entry.checkpoint_id,
        entry.parent_checkpoint_id,
        entry.type,
        entry.checkpoint,
        entry.metadata,
        entry.created_at,
        entry.updated_at,
      ]);

      console.log(`[Checkpointing] Saved checkpoint ${checkpointId} for thread ${threadId}`);

      return {
        ...config,
        configurable: {
          ...config.configurable,
          checkpoint_id: checkpointId,
        },
      };
    } catch (error) {
      console.error("[Checkpointing] Failed to save checkpoint:", error);
      throw error;
    }
  }

  /**
   * Get checkpoint from Redis or PostgreSQL
   */
  async get(config: RunnableConfig): Promise<CheckpointTuple | undefined> {
    const threadId = config.configurable?.thread_id;
    const checkpointNs = config.configurable?.checkpoint_ns || "";
    const checkpointId = config.configurable?.checkpoint_id;

    if (!threadId) {
      throw new Error("thread_id is required in config.configurable");
    }

    try {
      let checkpointData: { checkpoint: string; metadata: string } | null = null;

      // Try Redis first for fast access
      if (checkpointId) {
        const cacheKey = this.getCacheKey(threadId, checkpointNs, checkpointId);
        const cachedData = await this.config.redis.client.get(cacheKey);
        if (cachedData) {
          checkpointData = JSON.parse(cachedData);
        }
      }

      // Fall back to PostgreSQL if not in cache or no specific checkpoint ID
      if (!checkpointData) {
        let query: string;
        let params: any[];

        if (checkpointId) {
          query = `
            SELECT checkpoint, metadata FROM ${this.config.postgresql.schemaName || "public"}.${this.config.postgresql.tableName}
            WHERE thread_id = $1 AND checkpoint_ns = $2 AND checkpoint_id = $3
          `;
          params = [threadId, checkpointNs, checkpointId];
        } else {
          // Get latest checkpoint
          query = `
            SELECT checkpoint, metadata FROM ${this.config.postgresql.schemaName || "public"}.${this.config.postgresql.tableName}
            WHERE thread_id = $1 AND checkpoint_ns = $2
            ORDER BY created_at DESC
            LIMIT 1
          `;
          params = [threadId, checkpointNs];
        }

        const result = await this.config.postgresql.client.query(query, params);
        if (result.rows.length > 0) {
          checkpointData = {
            checkpoint: result.rows[0].checkpoint,
            metadata: result.rows[0].metadata,
          };
        }
      }

      if (!checkpointData) {
        return undefined;
      }

      // Decompress and parse data
      const checkpoint = JSON.parse(this.decompressData(checkpointData.checkpoint));
      const metadata = JSON.parse(this.decompressData(checkpointData.metadata));

      return {
        config: {
          ...config,
          configurable: {
            ...config.configurable,
            checkpoint_id: checkpoint.id,
          },
        },
        checkpoint,
        metadata,
        parentConfig: checkpoint.parent_config,
      };
    } catch (error) {
      console.error("[Checkpointing] Failed to get checkpoint:", error);
      throw error;
    }
  }

  /**
   * List checkpoints for a thread
   */
  async list(
    config: RunnableConfig,
    options?: {
      filter?: Record<string, any>;
      before?: RunnableConfig;
      limit?: number;
    }
  ): Promise<CheckpointTuple[]> {
    const threadId = config.configurable?.thread_id;
    const checkpointNs = config.configurable?.checkpoint_ns || "";

    if (!threadId) {
      throw new Error("thread_id is required in config.configurable");
    }

    try {
      let query = `
        SELECT checkpoint_id, checkpoint, metadata, created_at
        FROM ${this.config.postgresql.schemaName || "public"}.${this.config.postgresql.tableName}
        WHERE thread_id = $1 AND checkpoint_ns = $2
      `;
      const params: any[] = [threadId, checkpointNs];

      // Add filter conditions
      if (options?.filter) {
        for (const [key, value] of Object.entries(options.filter)) {
          query += ` AND metadata::jsonb ->> '${key}' = $${params.length + 1}`;
          params.push(value);
        }
      }

      // Add before condition
      if (options?.before?.configurable?.checkpoint_id) {
        query += ` AND created_at < (
          SELECT created_at FROM ${this.config.postgresql.schemaName || "public"}.${this.config.postgresql.tableName}
          WHERE checkpoint_id = $${params.length + 1}
        )`;
        params.push(options.before.configurable.checkpoint_id);
      }

      query += " ORDER BY created_at DESC";

      // Add limit
      if (options?.limit) {
        query += ` LIMIT $${params.length + 1}`;
        params.push(options.limit);
      }

      const result = await this.config.postgresql.client.query(query, params);

      return result.rows.map(row => {
        const checkpoint = JSON.parse(this.decompressData(row.checkpoint));
        const metadata = JSON.parse(this.decompressData(row.metadata));

        return {
          config: {
            ...config,
            configurable: {
              ...config.configurable,
              checkpoint_id: row.checkpoint_id,
            },
          },
          checkpoint,
          metadata,
          parentConfig: checkpoint.parent_config,
        };
      });
    } catch (error) {
      console.error("[Checkpointing] Failed to list checkpoints:", error);
      throw error;
    }
  }

  /**
   * Delete checkpoint from both Redis and PostgreSQL
   */
  async delete(config: RunnableConfig): Promise<void> {
    const threadId = config.configurable?.thread_id;
    const checkpointNs = config.configurable?.checkpoint_ns || "";
    const checkpointId = config.configurable?.checkpoint_id;

    if (!threadId || !checkpointId) {
      throw new Error("thread_id and checkpoint_id are required");
    }

    try {
      // Delete from Redis
      const cacheKey = this.getCacheKey(threadId, checkpointNs, checkpointId);
      await this.config.redis.client.del(cacheKey);

      // Delete from metadata hash
      const metadataCacheKey = this.getMetadataCacheKey(threadId, checkpointNs);
      await this.config.redis.client.hdel(metadataCacheKey, checkpointId);

      // Delete from PostgreSQL
      const query = `
        DELETE FROM ${this.config.postgresql.schemaName || "public"}.${this.config.postgresql.tableName}
        WHERE thread_id = $1 AND checkpoint_ns = $2 AND checkpoint_id = $3
      `;
      await this.config.postgresql.client.query(query, [threadId, checkpointNs, checkpointId]);

      console.log(`[Checkpointing] Deleted checkpoint ${checkpointId} for thread ${threadId}`);
    } catch (error) {
      console.error("[Checkpointing] Failed to delete checkpoint:", error);
      throw error;
    }
  }

  /**
   * Clean up old checkpoints
   */
  async cleanup(): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - this.config.cleanupInterval);
      
      // Clean up PostgreSQL
      const query = `
        DELETE FROM ${this.config.postgresql.schemaName || "public"}.${this.config.postgresql.tableName}
        WHERE created_at < $1
      `;
      const result = await this.config.postgresql.client.query(query, [cutoffDate]);
      
      console.log(`[Checkpointing] Cleaned up ${result.rows.length} old checkpoints`);

      // Clean up Redis (Redis TTL should handle most of this automatically)
      const pattern = `${this.config.redis.keyPrefix}:checkpoint:*`;
      const keys = await this.config.redis.client.keys(pattern);
      
      // You might want to implement more sophisticated Redis cleanup logic here
      console.log(`[Checkpointing] Found ${keys.length} Redis keys for potential cleanup`);
    } catch (error) {
      console.error("[Checkpointing] Failed to cleanup checkpoints:", error);
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup().catch(error => {
        console.error("[Checkpointing] Cleanup timer failed:", error);
      });
    }, this.config.cleanupInterval);
  }

  /**
   * Stop cleanup timer
   */
  public stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * Get checkpoint statistics
   */
  async getStatistics(threadId?: string): Promise<{
    totalCheckpoints: number;
    checkpointsByThread: Record<string, number>;
    checkpointsByStage: Record<string, number>;
    oldestCheckpoint: Date | null;
    newestCheckpoint: Date | null;
  }> {
    try {
      let whereClause = "";
      const params: any[] = [];

      if (threadId) {
        whereClause = "WHERE thread_id = $1";
        params.push(threadId);
      }

      const queries = [
        `SELECT COUNT(*) as total FROM ${this.config.postgresql.schemaName || "public"}.${this.config.postgresql.tableName} ${whereClause}`,
        `SELECT thread_id, COUNT(*) as count FROM ${this.config.postgresql.schemaName || "public"}.${this.config.postgresql.tableName} ${whereClause} GROUP BY thread_id`,
        `SELECT metadata::jsonb ->> 'stage' as stage, COUNT(*) as count FROM ${this.config.postgresql.schemaName || "public"}.${this.config.postgresql.tableName} ${whereClause} GROUP BY metadata::jsonb ->> 'stage'`,
        `SELECT MIN(created_at) as oldest, MAX(created_at) as newest FROM ${this.config.postgresql.schemaName || "public"}.${this.config.postgresql.tableName} ${whereClause}`,
      ];

      const results = await Promise.all(
        queries.map(query => this.config.postgresql.client.query(query, params))
      );

      const checkpointsByThread: Record<string, number> = {};
      results[1].rows.forEach(row => {
        checkpointsByThread[row.thread_id] = parseInt(row.count);
      });

      const checkpointsByStage: Record<string, number> = {};
      results[2].rows.forEach(row => {
        if (row.stage) {
          checkpointsByStage[row.stage] = parseInt(row.count);
        }
      });

      return {
        totalCheckpoints: parseInt(results[0].rows[0].total),
        checkpointsByThread,
        checkpointsByStage,
        oldestCheckpoint: results[3].rows[0].oldest || null,
        newestCheckpoint: results[3].rows[0].newest || null,
      };
    } catch (error) {
      console.error("[Checkpointing] Failed to get statistics:", error);
      throw error;
    }
  }

  /**
   * Export checkpoints for backup
   */
  async exportCheckpoints(threadId: string, outputPath: string): Promise<void> {
    // Implementation would depend on file system access
    // This is a placeholder for the export functionality
    console.log(`[Checkpointing] Export requested for thread ${threadId} to ${outputPath}`);
  }

  /**
   * Import checkpoints from backup
   */
  async importCheckpoints(inputPath: string): Promise<void> {
    // Implementation would depend on file system access
    // This is a placeholder for the import functionality
    console.log(`[Checkpointing] Import requested from ${inputPath}`);
  }

  /**
   * Cleanup on destruction
   */
  async destroy(): Promise<void> {
    this.stopCleanupTimer();
    await this.config.postgresql.client.end();
  }
}

/**
 * Factory function to create checkpoint saver with default configuration
 */
export function createFuneralCheckpointSaver(
  redisClient: RedisClient,
  postgresClient: PostgreSQLClient,
  options?: Partial<CheckpointConfig>
): FuneralCheckpointSaver {
  const defaultConfig: CheckpointConfig = {
    redis: {
      client: redisClient,
      keyPrefix: "funeral_planning",
      defaultTTL: 3600, // 1 hour
    },
    postgresql: {
      client: postgresClient,
      tableName: "funeral_checkpoints",
      schemaName: "public",
    },
    enableCompression: true,
    maxCheckpoints: 1000,
    cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
    ...options,
  };

  return new FuneralCheckpointSaver(defaultConfig);
}