import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      sessionStorage.clear();
      window.location.href = '/';
    } catch (_) {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8fafc',
            color: '#0f172a',
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            padding: '24px',
          }}
        >
          <div
            style={{
              maxWidth: '540px',
              width: '100%',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '32px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '6px',
                backgroundColor: '#fee2e2',
                color: '#ef4444',
                marginBottom: '16px',
                fontWeight: 'bold',
                fontSize: '18px',
              }}
            >
              !
            </div>
            <h1
              style={{
                fontSize: '20px',
                fontWeight: 600,
                marginBottom: '8px',
                color: '#0f172a',
              }}
            >
              Aplikasi Mengalami Kendala Tampilan
            </h1>
            <p
              style={{
                fontSize: '14px',
                lineHeight: 1.6,
                color: '#64748b',
                marginBottom: '24px',
              }}
            >
              Terjadi kesalahan tidak terduga pada antarmuka. Seluruh data lamaran
              dan catatan karir Anda tersimpan dengan aman di server.
            </p>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                marginBottom: '20px',
              }}
            >
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                Muat Ulang Halaman
              </button>
              <button
                type="button"
                onClick={this.handleResetCache}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                Bersihkan Cache Sesi
              </button>
            </div>

            {this.state.error && (
              <details
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#475569',
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 500 }}>
                  Detail Teknis Kesalahan
                </summary>
                <pre
                  style={{
                    marginTop: '8px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  }}
                >
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
