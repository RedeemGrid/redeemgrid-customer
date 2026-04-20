/**
 * @module errors
 * @description Backend-agnostic error hierarchy for the application.
 * By normalizing errors here, the UI and services remain decoupled from
 * the underlying data source (currently Supabase, in the future a C# API).
 */

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', statusCode: number = 500) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    // Maintains proper prototype chain in TypeScript
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action.') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found.`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'This resource already exists.') {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication is required.') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Normalizes any raw error (from Supabase PostgREST, fetch, etc.)
 * into a typed AppError. This is the critical abstraction layer that
 * allows swapping Supabase for a C# API without touching the UI layer.
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>;

    // Supabase / PostgREST specific codes
    if (e.code === '23505') return new ConflictError('You have already claimed this deal.');
    if (e.code === '42501' || e.status === 403) return new ForbiddenError();
    if (e.status === 404) return new NotFoundError();
    if (e.status === 401) return new UnauthorizedError();

    const message = typeof e.message === 'string' ? e.message : 'An unexpected error occurred.';
    return new AppError(message, String(e.code || 'UNKNOWN_ERROR'), Number(e.status || 500));
  }

  if (typeof error === 'string') return new AppError(error);
  return new AppError('An unexpected error occurred.');
}
