"use client";

import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <span className="text-xl">⚠️</span>
          </div>
          <h3 className="text-sm font-black text-slate-800">Beklenmeyen bir hata oluştu</h3>
          <p className="mt-1 text-xs font-medium text-slate-500 max-w-xs">
            {this.state.errorMessage || "Bu bölüm yüklenirken bir sorun oluştu."}
          </p>
          <button
            onClick={this.handleReset}
            className="mt-4 rounded-lg bg-slate-900 px-5 py-2 text-xs font-black text-white transition-all hover:bg-red-600 active:scale-95"
          >
            Tekrar Dene
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
