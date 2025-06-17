import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import JobTracker from './JobTracker.jsx';

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by error boundary:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          margin: '20px', 
          border: '1px solid #f56565', 
          borderRadius: '5px',
          backgroundColor: '#fff5f5'
        }}>
          <h2 style={{ color: '#c53030', marginBottom: '10px' }}>Something went wrong</h2>
          <p style={{ color: '#e53e3e', marginBottom: '10px' }}>
            {this.state.error && this.state.error.toString()}
          </p>
          <details style={{ marginTop: '10px' }}>
            <summary style={{ cursor: 'pointer', color: '#c53030' }}>View error details</summary>
            <pre style={{ 
              marginTop: '10px', 
              padding: '10px', 
              backgroundColor: '#edf2f7', 
              borderRadius: '5px',
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <JobTracker />
    </ErrorBoundary>
  </React.StrictMode>
);
