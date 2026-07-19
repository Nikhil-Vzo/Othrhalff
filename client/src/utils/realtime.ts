const DEFAULT_REALTIME_FILTER_CHUNK_SIZE = 80;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isUuid = (value: string | null | undefined): value is string => {
  return typeof value === 'string' && UUID_PATTERN.test(value);
};

export const uniqueValidUuids = (ids: Array<string | null | undefined>) => {
  return Array.from(new Set(ids.filter(isUuid)));
};

export const chunkIds = <T,>(items: T[], size = DEFAULT_REALTIME_FILTER_CHUNK_SIZE): T[][] => {
  if (items.length === 0) return [];

  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

export const buildRealtimeIdFilter = (column: string, ids: string[]) => {
  if (ids.length === 1) {
    return `${column}=eq.${ids[0]}`;
  }

  return `${column}=in.(${ids.join(',')})`;
};
