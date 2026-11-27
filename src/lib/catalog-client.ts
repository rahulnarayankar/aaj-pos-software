type Catalog = {
  categories: unknown[];
  tables: unknown[];
};

const TTL_MS = 15_000;
let cache: { at: number; data: Catalog } | null = null;
let inflight: Promise<Catalog | null> | null = null;

export function peekCatalog<T extends Catalog>() {
  if (!cache || Date.now() - cache.at > TTL_MS) return null;
  return cache.data as T;
}

export function rememberCatalog(data: Catalog) {
  cache = { at: Date.now(), data };
}

export function clearCatalog() {
  cache = null;
}

export function loadCatalog<T extends Catalog>(force = false) {
  if (!force) {
    const fresh = peekCatalog<T>();
    if (fresh) return Promise.resolve(fresh);
    if (inflight) return inflight as Promise<T | null>;
  }

  const request = fetch("/api/catalog")
    .then((response) => (response.ok ? response.json() : null))
    .then((data: T | null) => {
      if (data) rememberCatalog(data);
      return data;
    })
    .catch(() => null)
    .finally(() => {
      if (inflight === request) inflight = null;
    });

  inflight = request;
  return request;
}
