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
                        borderRadius: '3px',
                        border: '1px solid #faf7f3',
                        background: '#faf7f3',
                        color: '#33332f',
                        fontWeight: 600
                    },
                    success: { iconTheme: { primary: '#33332f', secondary: '#faf7f3' } },
                    error: { iconTheme: { primary: '#B84A4A', secondary: '#faf7f3' } }
                }}
            />
        </AuthProvider>
    </React.StrictMode>
)
