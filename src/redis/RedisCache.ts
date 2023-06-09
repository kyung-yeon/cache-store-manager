import { Redis, RedisOptions } from 'ioredis';
import { CacheConfig, CacheStoreManager, DEFAULT_TTL_TIME } from '../type';

export class RedisCache implements CacheStoreManager {
  private readonly client: Redis;
  private readonly ttl: number;

  constructor(config?: CacheConfig, client?: (opts: RedisOptions) => Redis) {
    const { ttl, ...redisConfig } = config ?? {};
    this.ttl = ttl ?? DEFAULT_TTL_TIME;
    if (client) {
      this.client = client(redisConfig ?? {});
    } else {
      this.client = new Redis(redisConfig);
    }
  }

  static create(config?: CacheConfig, client?: (opts: RedisOptions) => Redis) {
    return new RedisCache(config, client);
  }

  get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  mget(keys: Array<string>): Promise<(string | null)[]> {
    return this.client.mget(keys);
  }

  set(key: string, value: string, ttl?: number) {
    return this.client.set(key, value, 'EX', ttl ?? this.ttl);
  }

  mset(list: Array<{ key: string; value: string }>, ttl?: number) {
    return Promise.all(list.map(({ key, value }) => this.set(key, value, ttl ?? this.ttl)));
  }

  del(key: string) {
    return this.client.del(key);
  }

  mdel(keys: string[]) {
    return Promise.all(keys.map((key) => this.del(key)));
  }

  flush() {
    return this.client.flushdb();
  }

  disConnect() {
    return this.client.disconnect();
  }
}
