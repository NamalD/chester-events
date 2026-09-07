import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import robotsParser from 'robots-parser';

export class CollectionError extends Error {}
interface CacheEntry { etag?: string; modified?: string; body: string }
export class HttpClient {
  private robots = new Map<string, ReturnType<typeof robotsParser>>();
  private lastRequest = new Map<string, number>();
  constructor(private userAgent: string, private cacheDir = '.cache/http') {
    if (!/ChesterEventsBot.*https:\/\/github\.com\//.test(userAgent)) throw new Error('User-Agent must identify ChesterEventsBot and its public GitHub repository');
  }
  private async request(url: URL, headers: Record<string, string> = {}) {
    const delay = 400 - (Date.now() - (this.lastRequest.get(url.origin) ?? 0));
    if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));
    this.lastRequest.set(url.origin, Date.now());
    try {
      return await fetch(url, { headers: { 'User-Agent': this.userAgent, ...headers }, signal: AbortSignal.timeout(25000), redirect: 'manual' });
    } catch { throw new CollectionError('Network request failed or timed out'); }
  }
  async get(input: string, options: { api?: boolean; cache?: boolean } = {}, redirects = 0): Promise<string> {
    const url = new URL(input);
    if (url.protocol !== 'https:') throw new CollectionError('Only HTTPS collection is supported');
    if (!options.api) {
      if (!this.robots.has(url.origin)) {
        const robotsUrl = new URL('/robots.txt', url);
        const response = await this.request(robotsUrl);
        if (!response.ok && response.status !== 404) throw new CollectionError('Could not verify publisher robots rules');
        const parser = robotsParser(robotsUrl.href, response.ok ? await response.text() : '');
        this.robots.set(url.origin, parser);
      }
      const parser = this.robots.get(url.origin)!;
      if (parser.isAllowed(url.href, this.userAgent) === false) throw new CollectionError('Publisher robots rules disallow this collection route');
      const delay = (parser.getCrawlDelay(this.userAgent) ?? 0) * 1000 - (Date.now() - (this.lastRequest.get(url.origin) ?? 0));
      if (delay > 60000) throw new CollectionError('Publisher crawl delay exceeds collection budget');
      if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));
    }
    // Key-bearing API responses and URLs are never persisted to disk or logs.
    const cacheable = options.cache !== false && !options.api;
    const path = `${this.cacheDir}/${createHash('sha256').update(input).digest('hex')}.json`;
    let cache: CacheEntry | null = null;
    if (cacheable) { try { cache = JSON.parse(await readFile(path, 'utf8')); } catch { /* first fetch */ } }
    const headers: Record<string, string> = {};
    if (cache?.etag) headers['If-None-Match'] = cache.etag;
    if (cache?.modified) headers['If-Modified-Since'] = cache.modified;
    const response = await this.request(url, headers);
    if ([301, 302, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      const next = location ? new URL(location, url) : null;
      if (!next || next.origin !== url.origin || redirects >= 3) throw new CollectionError('Unexpected feed redirect');
      return this.get(next.href, options, redirects + 1);
    }
    if (response.status === 304 && cache) return cache.body;
    if (!response.ok) throw new CollectionError(`Publisher returned HTTP ${response.status}`);
    const body = await response.text();
    if (body.length > 10000000) throw new CollectionError('Feed exceeds size limit');
    if (cacheable) {
      await mkdir(this.cacheDir, { recursive: true });
      await writeFile(path, JSON.stringify({ body, etag: response.headers.get('etag'), modified: response.headers.get('last-modified') }));
    }
    return body;
  }
  async json(url: string, api = false): Promise<Record<string, any>> {
    try { return JSON.parse(await this.get(url, { api })); }
    catch (error) { if (error instanceof CollectionError) throw error; throw new CollectionError('Publisher returned invalid JSON'); }
  }
}
