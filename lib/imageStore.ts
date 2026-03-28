const globalForStore = globalThis as unknown as { imageStore: Map<string, string> };

if (!globalForStore.imageStore) {
  globalForStore.imageStore = new Map<string, string>();
}

export const imageStore = globalForStore.imageStore;
