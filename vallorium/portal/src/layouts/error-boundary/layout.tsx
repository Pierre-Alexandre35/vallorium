import React from 'react';
import { ErrorView } from 'src/views/misc/error';

type P = {
  fallback: React.ReactElement<typeof ErrorView>;
  children: React.ReactNode;
};

export class ErrorBoundary extends React.Component<
  P,
  { hasError: boolean; error?: Error }
> {
  constructor(props: P) {
    super(props);
    this.state = { hasError: false, error: undefined };
  }

  static getDerivedStateFromError(err: Error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: err };
  }

  // componentDidCatch(error: Error, info: unknown) {
  //   // Example "componentStack":
  //   //   in ComponentThatThrows (created by App)
  //   //   in ErrorBoundary (created by App)
  //   //   in div (created by App)
  //   //   in App
  //   logErrorToMyService(error, info.componentStack);
  // }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return React.cloneElement(this.props.fallback, {
        error: this.state.error,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    }

    return this.props.children;
  }
}
