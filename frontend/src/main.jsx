import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import './index.css'
import './styles/studio-theme.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AuthProvider>
            <App />
            <Toaster
                position='top-right'
                toastOptions={{
                    duration: 4000,
                    style: {
                        borderRadius: '8px',
                        border: '1px solid var(--tt-border)',
                        background: 'var(--tt-surface)',
                        color: 'var(--tt-ink)',
                        fontWeight: 600
                    },
                    success: { iconTheme: { primary: 'var(--tt-success)', secondary: 'var(--tt-surface)' } },
                    error: { iconTheme: { primary: 'var(--tt-danger)', secondary: 'var(--tt-surface)' } }
                }}
            />
        </AuthProvider>
    </React.StrictMode>
)
