import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught application error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearAndReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.href = window.location.pathname;
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-white">
                पृष्ठ लोड गर्दा समस्या आयो
              </h1>
              <p className="text-xs text-slate-300">
                दार्चुला बहुमुखी क्याम्पस साप्ताहिक हाजिरी जवाफ पोर्टल लोड गर्दा प्राविधिक समस्या उत्पन्न भयो। कृपया तलका विकल्पहरू प्रयोग गर्नुहोस्।
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-700/60 text-left text-xs font-mono text-red-300 max-h-28 overflow-y-auto break-all">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                <span>पुनः प्रयास गर्नुहोस् (Reload Page)</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearAndReset}
                className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                <span>क्यास खाली गरी सुरु गर्नुहोस् (Clear Cache & Reset)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.location.href = './';
                }}
                className="text-xs text-slate-400 hover:text-white pt-2 flex items-center justify-center gap-1 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>गृहपृष्ठमा फर्कनुहोस्</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
