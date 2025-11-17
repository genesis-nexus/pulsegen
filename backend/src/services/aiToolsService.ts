import { PrismaClient, AIToolType } from '@prisma/client';
import { encrypt, decrypt } from '../utils/encryption';
import axios, { AxiosInstance } from 'axios';

const prisma = new PrismaClient();

export interface AIToolConfigInput {
  type: AIToolType;
  name: string;
  endpoint: string;
  apiKey?: string;
  username?: string;
  password?: string;
  database?: string;
  settings?: any;
  isEnabled?: boolean;
  isDefault?: boolean;
}

class AIToolClient {
  protected client: AxiosInstance;
  protected config: any;

  constructor(config: any) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.endpoint,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async testConnection(): Promise<boolean> {
    throw new Error('Test connection not implemented for this tool type');
  }
}

class MindsDBClient extends AIToolClient {
  constructor(config: any) {
    super(config);

    // Add authentication headers
    if (config.apiKey) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${config.apiKey}`;
    } else if (config.username && config.password) {
      const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64');
      this.client.defaults.headers.common['Authorization'] = `Basic ${credentials}`;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/status');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async createModel(params: {
    name: string;
    fromTable: string;
    predictColumn: string;
    features?: string[];
    engine?: string;
  }): Promise<any> {
    const { name, fromTable, predictColumn, features, engine = 'lightwood' } = params;

    const usingClause = features && features.length > 0
      ? `USING ${features.map(f => `'${f}'`).join(', ')}`
      : '';

    const query = `
      CREATE MODEL ${this.config.database ? `${this.config.database}.` : ''}${name}
      FROM ${fromTable}
      PREDICT ${predictColumn}
      ${usingClause}
      USING engine = '${engine}';
    `;

    const response = await this.client.post('/api/sql/query', {
      query: query.trim(),
    });

    return response.data;
  }

  async getModel(modelName: string): Promise<any> {
    const query = `
      SELECT * FROM models
      WHERE name = '${modelName}';
    `;

    const response = await this.client.post('/api/sql/query', {
      query: query.trim(),
    });

    return response.data;
  }

  async predict(params: {
    modelName: string;
    where?: Record<string, any>;
    limit?: number;
  }): Promise<any> {
    const { modelName, where, limit = 10 } = params;

    let whereClause = '';
    if (where && Object.keys(where).length > 0) {
      const conditions = Object.entries(where)
        .map(([key, value]) => {
          if (typeof value === 'string') {
            return `${key} = '${value}'`;
          }
          return `${key} = ${value}`;
        })
        .join(' AND ');
      whereClause = `WHERE ${conditions}`;
    }

    const query = `
      SELECT * FROM ${this.config.database ? `${this.config.database}.` : ''}${modelName}
      ${whereClause}
      LIMIT ${limit};
    `;

    const response = await this.client.post('/api/sql/query', {
      query: query.trim(),
    });

    return response.data;
  }

  async getModelStatus(modelName: string): Promise<any> {
    const query = `
      SELECT status, accuracy, training_time
      FROM models
      WHERE name = '${modelName}';
    `;

    const response = await this.client.post('/api/sql/query', {
      query: query.trim(),
    });

    return response.data;
  }

  async listModels(): Promise<any> {
    const query = 'SELECT * FROM models;';

    const response = await this.client.post('/api/sql/query', {
      query,
    });

    return response.data;
  }

  async dropModel(modelName: string): Promise<any> {
    const query = `DROP MODEL ${this.config.database ? `${this.config.database}.` : ''}${modelName};`;

    const response = await this.client.post('/api/sql/query', {
      query,
    });

    return response.data;
  }

  async executeQuery(query: string): Promise<any> {
    const response = await this.client.post('/api/sql/query', {
      query,
    });

    return response.data;
  }
}

export const aiToolsService = {
  async getAllConfigs() {
    const configs = await prisma.aIToolConfig.findMany({
      include: {
        _count: {
          select: {
            models: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Don't expose sensitive credentials
    return configs.map(config => ({
      ...config,
      apiKey: config.apiKey ? '***ENCRYPTED***' : null,
      password: config.password ? '***ENCRYPTED***' : null,
    }));
  },

  async getConfig(id: string) {
    const config = await prisma.aIToolConfig.findUnique({
      where: { id },
      include: {
        models: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!config) {
      return null;
    }

    // Decrypt credentials
    return {
      ...config,
      apiKey: config.apiKey ? decrypt(config.apiKey) : null,
      password: config.password ? decrypt(config.password) : null,
    };
  },

  async createConfig(data: AIToolConfigInput) {
    // Check if config with same type and name exists
    const existing = await prisma.aIToolConfig.findUnique({
      where: {
        type_name: {
          type: data.type,
          name: data.name,
        },
      },
    });

    if (existing) {
      throw new Error(`Configuration for ${data.type} with name "${data.name}" already exists`);
    }

    // If this is set as default, unset other defaults for this type
    if (data.isDefault) {
      await prisma.aIToolConfig.updateMany({
        where: { type: data.type, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Encrypt sensitive data
    const encryptedData: any = { ...data };
    if (data.apiKey) {
      encryptedData.apiKey = encrypt(data.apiKey);
    }
    if (data.password) {
      encryptedData.password = encrypt(data.password);
    }

    const config = await prisma.aIToolConfig.create({
      data: encryptedData,
    });

    return {
      ...config,
      apiKey: config.apiKey ? '***ENCRYPTED***' : null,
      password: config.password ? '***ENCRYPTED***' : null,
    };
  },

  async updateConfig(id: string, data: Partial<AIToolConfigInput>) {
    const existing = await prisma.aIToolConfig.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Configuration not found');
    }

    // If setting as default, unset other defaults for this type
    if (data.isDefault) {
      await prisma.aIToolConfig.updateMany({
        where: { type: existing.type, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    // Encrypt new sensitive data if provided
    const updateData: any = { ...data };
    if (data.apiKey) {
      updateData.apiKey = encrypt(data.apiKey);
    }
    if (data.password) {
      updateData.password = encrypt(data.password);
    }

    const config = await prisma.aIToolConfig.update({
      where: { id },
      data: updateData,
    });

    return {
      ...config,
      apiKey: config.apiKey ? '***ENCRYPTED***' : null,
      password: config.password ? '***ENCRYPTED***' : null,
    };
  },

  async deleteConfig(id: string) {
    await prisma.aIToolConfig.delete({
      where: { id },
    });

    return { message: 'Configuration deleted successfully' };
  },

  async testConnection(id: string) {
    const config = await this.getConfig(id);
    if (!config) {
      throw new Error('Configuration not found');
    }

    let client: AIToolClient;

    switch (config.type) {
      case AIToolType.MINDSDB:
        client = new MindsDBClient(config);
        break;
      default:
        throw new Error(`Tool type ${config.type} not supported yet`);
    }

    const isConnected = await client.testConnection();

    if (!isConnected) {
      throw new Error('Connection test failed');
    }

    return { success: true, message: 'Connection successful' };
  },

  getClient(config: any): AIToolClient {
    switch (config.type) {
      case AIToolType.MINDSDB:
        return new MindsDBClient(config);
      default:
        throw new Error(`Tool type ${config.type} not supported yet`);
    }
  },
};
