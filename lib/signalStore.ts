const globalForSignal = globalThis as unknown as { signalStore: Map<string, any> };

if (!globalForSignal.signalStore) {
  globalForSignal.signalStore = new Map<string, any>();
}

export const signalStore = globalForSignal.signalStore;
