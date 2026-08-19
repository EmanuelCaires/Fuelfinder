import {
  Component,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
} from 'react';

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  FallbackComponent?: ComponentType<ErrorFallbackProps>;
  /** Changing this clears a caught error. Pass the route to recover on navigation. */
  resetKey?: unknown;
}

interface ErrorBoundaryState {
  error: Error | null;
}

function toError(value: unknown): Error {
  if (value instanceof Error) {
    return value;
  }
  if (typeof value === 'string') {
    return new Error(value);
  }
  try {
    return new Error(JSON.stringify(value));
  } catch {
    return new Error(String(value));
  }
}

function DefaultFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-[hsl(var(--background))] p-6">
      <div className="w-full max-w-lg rounded-[26px] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-8 text-center shadow-[var(--shadow)]">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[hsl(var(--destructive)/.12)] text-[hsl(var(--destructive))]">!</div>
        <p className="mt-5 font-mono-ui text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--ring))]">A rough patch of road</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-[-.05em]">
          Something took a wrong turn
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
          This view hit an error. Your comparison is still safe; try loading it again.
        </p>
        {/* Dev only: messages can carry API responses and other internals. */}
        {import.meta.env.DEV ? (
          <pre className="mt-4 overflow-x-auto rounded-xl bg-[hsl(var(--muted))] p-3 text-left font-mono-ui text-xs text-[hsl(var(--muted-foreground))]">
            {error.message || String(error)}
          </pre>
        ) : null}
        <button
          type="button"
          onClick={resetError}
          className="tap-target mt-5 rounded-xl bg-[hsl(var(--primary))] px-4 py-3 text-xs font-bold text-[hsl(var(--primary-foreground))] hover:-translate-y-0.5"
          data-testid="button-error-retry"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error: toError(error) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error(
      'ErrorBoundary caught an error:',
      toError(error),
      info.componentStack,
    );
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (
      this.state.error !== null &&
      prevProps.resetKey !== this.props.resetKey
    ) {
      this.resetError();
    }
  }

  resetError = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (error === null) {
      return this.props.children;
    }
    const Fallback = this.props.FallbackComponent ?? DefaultFallback;
    return <Fallback error={error} resetError={this.resetError} />;
  }
}
