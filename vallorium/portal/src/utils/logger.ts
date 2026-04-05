/* eslint-disable no-console */
/**
 * Prints console messages with prefix
 */
export class Logger {
  private readonly scope: string;
  private readonly shouldLog: boolean;

  constructor(options?: {
    /**
     * Prefix the log with a custom string
     * @default "app"
     */
    scope?: string;
    /**
     * Show logs according to import.meta.env.MODE
     * @default 'dev'
     */
    mode?: 'dev' | 'prod' | 'always' | 'hidden';
  }) {
    this.scope = options?.scope || 'app';
    if (options?.mode === 'always') {
      this.shouldLog = true;
    }
    if (options?.mode === 'hidden') {
      this.shouldLog = false;
    } else if (options?.mode === 'prod') {
      this.shouldLog = import.meta.env.PROD;
    } else {
      this.shouldLog = import.meta.env.DEV;
    }
  }

  private prefixStyles = [
    'color: #000',
    'background-color: lightblue',
    'padding: 2px 4px',
    'border-radius: 2px',
  ].join(';');

  log = (...data: unknown[]) =>
    this.shouldLog
      ? console.log(`%c${this.scope}`, this.prefixStyles, ...data)
      : null;
  error = (...data: unknown[]) =>
    this.shouldLog
      ? console.error(`%c${this.scope}`, this.prefixStyles, ...data)
      : null;
  warn = (...data: unknown[]) =>
    this.shouldLog
      ? console.warn(`%c${this.scope}`, this.prefixStyles, ...data)
      : null;

  table = (...data: unknown[]) =>
    this.shouldLog ? console.table(...data) : null; // table does not support styles

  info = this.log;
  debug = this.log;
}
