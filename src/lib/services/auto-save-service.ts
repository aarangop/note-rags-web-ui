import {
  AutoSaveCallbacks,
  AutoSaveConfig,
  DEFAULT_AUTO_SAVE_CONFIG,
  SaveStatus,
} from "./auto-save-service.types";

export default class AutoSaveService {
  private _status: SaveStatus = 'idle';
  private _lastSaved: Date | null = null;
  private _lastContent: string | null = null;
  private debounceTimeout: NodeJS.Timeout | null = null;
  private isDestroyed = false;
  private saveQueue: Array<{ content: string; resolve: () => void; reject: (error: Error) => void }> = [];
  private isProcessingQueue = false;

  constructor(
    private noteId: number,
    private callbacks: AutoSaveCallbacks,
    private config: AutoSaveConfig = DEFAULT_AUTO_SAVE_CONFIG
  ) {
    this.setStatus('idle');
  }

  // Public methods
  queueSave(): void {
    if (this.isDestroyed) return;

    // Clear existing debounce timer
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }

    // Reset status if we're in error state
    if (this._status === 'error') {
      this.setStatus('idle');
    }

    // Set up new debounce timer
    this.debounceTimeout = setTimeout(() => {
      this.enqueueSave();
    }, this.config.debounceMs);
  }

  async forceSave(): Promise<void> {
    if (this.isDestroyed) return;

    // Cancel any pending debounced save
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }

    return new Promise<void>((resolve, reject) => {
      try {
        const content = this.callbacks.getCurrentContent();
        
        // Check if identical content is already queued or if no change since last save
        if (this._lastContent === content) {
          resolve();
          return;
        }
        
        // Check if same content is already in queue
        const existingItem = this.saveQueue.find(item => item.content === content);
        if (existingItem) {
          // Chain to existing promise instead of adding duplicate
          const originalResolve = existingItem.resolve;
          const originalReject = existingItem.reject;
          
          existingItem.resolve = () => {
            originalResolve();
            resolve();
          };
          existingItem.reject = (error: Error) => {
            originalReject(error);
            reject(error);
          };
          return;
        }
        
        this.saveQueue.push({ content, resolve, reject });
        this.processQueue();
      } catch (error) {
        reject(error as Error);
      }
    });
  }

  destroy(): void {
    this.isDestroyed = true;
    
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
  }

  // Getters
  get status(): SaveStatus {
    return this._status;
  }

  get lastSaved(): Date | null {
    return this._lastSaved;
  }

  // Private methods
  private setStatus(status: SaveStatus): void {
    this._status = status;
    this.callbacks.onStatusChange(status);
  }

  private enqueueSave(): void {
    if (this.isDestroyed) return;

    try {
      const content = this.callbacks.getCurrentContent();
      
      // Don't save if content hasn't changed since last save
      if (this._lastContent === content) {
        return;
      }

      // Add to queue
      this.saveQueue.push({ 
        content, 
        resolve: () => {}, 
        reject: () => {} 
      });
      
      this.processQueue();
    } catch (error) {
      this.setStatus('error');
      this.callbacks.onSaveError(error as Error);
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.saveQueue.length === 0 || this.isDestroyed) {
      return;
    }

    this.isProcessingQueue = true;
    this.setStatus('saving');

    while (this.saveQueue.length > 0 && !this.isDestroyed) {
      const saveItem = this.saveQueue.shift()!;
      
      try {
        // Skip if content hasn't changed from last save
        if (this._lastContent === saveItem.content) {
          saveItem.resolve();
          continue;
        }
        
        // Only process the latest content - skip outdated saves by content comparison
        const laterSave = this.saveQueue.find(item => item.content !== saveItem.content);
        if (laterSave) {
          saveItem.resolve(); // Resolve the skipped save
          continue;
        }

        await this.saveWithRetry(saveItem.content);
        
        this._lastContent = saveItem.content;
        this._lastSaved = new Date();
        this.setStatus('saved');
        
        saveItem.resolve();

        // Brief "saved" status, then back to idle if queue is empty
        setTimeout(() => {
          if (!this.isDestroyed && this._status === 'saved' && this.saveQueue.length === 0) {
            this.setStatus('idle');
          }
        }, 100);

      } catch (error) {
        this.setStatus('error');
        this.callbacks.onSaveError(error as Error);
        saveItem.reject(error as Error);
        
        // Clear remaining queue on error
        while (this.saveQueue.length > 0) {
          const failedItem = this.saveQueue.shift()!;
          failedItem.reject(error as Error);
        }
        break;
      }
    }

    this.isProcessingQueue = false;
  }

  private async saveWithRetry(content: string, attempt = 0): Promise<void> {
    try {
      const result = await this.callbacks.saveToAPI(content);
      this.callbacks.onSaveSuccess(result);
    } catch (error) {
      if (attempt < this.config.retryAttempts) {
        const delay = this.config.retryDelayMs * Math.pow(2, attempt);
        await new Promise(resolve => {
          setTimeout(resolve, delay);
        });
        return this.saveWithRetry(content, attempt + 1);
      }
      throw error;
    }
  }
}
