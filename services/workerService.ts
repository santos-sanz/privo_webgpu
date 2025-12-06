class WorkerService {
  worker: Worker | null = null;
  listeners: ((msg: any) => void)[] = [];

  constructor() {
    // Use a direct string path. This resolves relative to the page root (index.html).
    // This avoids "Invalid URL" errors that can occur when manually constructing 
    // a URL object with window.location.href or import.meta.url in certain environments.
    this.worker = new Worker('ai.worker.ts', { type: 'module' });
    
    this.worker.addEventListener('message', (e) => {
      this.listeners.forEach(l => l(e.data));
    });
  }

  postMessage(msg: any) {
    this.worker?.postMessage(msg);
  }

  subscribe(callback: (msg: any) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  terminate() {
    this.worker?.terminate();
    this.worker = null;
  }
}

export const aiWorker = new WorkerService();