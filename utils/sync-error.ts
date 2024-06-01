class NetworkError extends Error {
  public className = 'warning';

  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

class SyncError extends Error {
  public className = 'error';

  constructor(message: string) {
    super(message);
    this.name = 'SyncError';
  }
}

export {
  NetworkError,
  SyncError,
};
