"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  reset = () => this.setState({ hasError: false, message: "" });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          className="flex flex-col items-center justify-center h-full p-8 text-center"
          style={{ background: "#1a1a2e" }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-2xl"
            style={{ background: "#2a1a1a" }}
          >
            ⚠️
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: "#e2e2f0" }}>
            Something went wrong
          </p>
          <p className="text-xs mb-5 max-w-xs" style={{ color: "#6b6b8a" }}>
            {this.state.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={this.reset}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "#6d28d9", color: "#fff" }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
