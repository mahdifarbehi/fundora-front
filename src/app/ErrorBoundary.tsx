import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button, Result, Space } from "antd";
import { strings } from "../lib/strings";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

/**
 * App-wide crash guard for *render* errors (the kind async API errors never reach — those are
 * handled per-screen via `ApiError`/`errorMessage`). A thrown render shows a Persian fallback with
 * reload / go-home actions instead of a blank white screen. Uses a hard navigation because the
 * router/component tree may be in a broken state after the throw.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // No remote logging yet; surface it in the console for debugging.
    console.error("Uncaught render error:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <Result
        status="error"
        title={strings.errorBoundary.title}
        subTitle={strings.errorBoundary.body}
        extra={
          <Space>
            <Button type="primary" onClick={() => window.location.reload()}>
              {strings.errorBoundary.reload}
            </Button>
            <Button onClick={() => window.location.assign("/")}>
              {strings.errorBoundary.home}
            </Button>
          </Space>
        }
      />
    );
  }
}
