import fetchAssetsKeys from "./fetch-assets-keys";

class StaticResponse extends Response {
  _arrayBuffer: ArrayBuffer;

  constructor(body: ArrayBuffer) {
    super(body, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this._arrayBuffer = body;
  }

  async arrayBuffer() {
    return this._arrayBuffer;
  }
}

const responseCache = new Map<string, Response>();

const request = async (input: RequestInfo | URL, init?: RequestInit) => {
  if (typeof input === 'string' && fetchAssetsKeys.has(input)) {
    if (responseCache.has(input)) {
      return responseCache.get(input)!;
    }

    const cache = await import('./fetch-assets').then((module) => module.default);
    const entry = cache.get(input);

    if (!entry) {
      return await fetch(input, init);
    }

    const json = JSON.stringify(entry);
    const buffer = new TextEncoder().encode(json).buffer as ArrayBuffer;

    const response = new StaticResponse(buffer);

    responseCache.set(input, response);

    return response;
  }

  return await fetch(input, init);
}

export { request }
