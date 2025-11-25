// src/types/retry.d.ts
declare module 'retry' {
  interface OperationOptions {
    retries?: number
    factor?: number
    minTimeout?: number
    maxTimeout?: number
    randomize?: boolean
  }

  interface Operation {
    attempt(fn: (currentAttempt: number) => void): void
    retry(error: Error): boolean
  }

  function operation(options?: OperationOptions): Operation

  export { operation }
}
