// Brain Engine Configuration
export const BRAIN_CONFIG = {
  // Batching settings
  batchSize: 10,
  batchTimeout: 1000, // 1 second
  
  // Debouncing settings
  debounceDelay: 500, // 500ms
  
  // Caching settings
  cacheTTL: 300000, // 5 minutes
  maxCacheSize: 1000, // 1000 sessions
  
  // Throttling settings
  maxRequestsPerMinute: 1000,
  
  // Event filtering
  filterLowPriorityEvents: true,
  lowPriorityEventTypes: [
    'cursor_move',
    'scroll',
    'mouse_move',
    'selection_change'
  ],
  lowPriorityEventSampleRate: 0.1, // 10%
  
  // Database settings
  database: {
    enableBatching: true,
    batchInsertSize: 50,
    maxRetries: 3
  },
  
  // Logging
  logging: {
    enable: true,
    level: 'info', // 'debug' | 'info' | 'warn' | 'error'
    logToConsole: true,
    logToDatabase: false
  },
  
  // Performance
  performance: {
    maxProcessingTime: 5000, // 5 seconds
    timeout: 10000, // 10 seconds
    maxMemoryUsage: 100 // 100MB
  }
};
