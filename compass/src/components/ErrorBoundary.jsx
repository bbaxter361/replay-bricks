// Error Boundary Component to catch React errors and prevent app crashes
// Prevents chat history from disappearing due to unhandled errors

import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorId: Date.now() // Unique ID for this error instance
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error details
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Send error to monitoring service if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-dark-card border border-dark-border rounded-xl p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertTriangle size={32} className="text-red-400" />
            </div>
            
            <h1 className="text-xl font-bold text-red-300 mb-2">
              Something went wrong
            </h1>
            
            <p className="text-sm text-dark-muted mb-6">
              Don't worry! Your chat history and data are still safe. 
              This was just a temporary display issue.
            </p>
            
            <button
              onClick={this.handleRetry}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
            
            <div className="mt-4 p-3 bg-dark-bg/50 rounded-lg text-left">
              <p className="text-xs text-dark-muted mb-2">Error ID: {this.state.errorId}</p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-xs text-red-400">
                  <summary className="cursor-pointer">Technical Details</summary>
                  <pre className="mt-2 overflow-x-auto text-xs whitespace-pre-wrap">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;