import { useEffect } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop'
import Header from './components/Header'
import CustomerHeader from './components/CustomerHeader'
import Footer from './components/Footer'
import ProtectedRoute from './components/routes/ProtectedRoute'
import ProfileCompletionRoute from './components/routes/ProfileCompletionRoute'
import GuestRoute from './components/routes/GuestRoute'
import Home from './pages/Home'
import Services from './pages/Services'
import About from './pages/About'
import Contact from './pages/Contact'
import Booking from './pages/Booking'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Admin from './pages/Admin'
import UserDashboard from './pages/UserDashboard'
import MyPets from './pages/MyPets'
import Appointments from './pages/Appointments'
import Profile from './pages/Profile'
import CompleteProfile from './pages/CompleteProfile'
import ForgotPassword from './pages/ForgotPassword'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import { useAuth } from './context/AuthContext'
import { appointmentsApi, warmupBackendServer } from './utils/api'
import BottomNav from './components/BottomNav'

function PublicLayout() {
    return (
        <div className='public-shell app-shell min-h-screen bg-[var(--tt-canvas)] text-[var(--tt-ink)] antialiased selection:bg-[var(--tt-brand)] selection:text-[var(--tt-canvas)] pb-16 md:pb-0'>
            <Header />
            <main id='main-content' tabIndex={-1}><Outlet /></main>
            <Footer />
            <BottomNav mode='public' />
        </div>
    )
}

function GuestUtilityLayout() {
    return (
        <div className='guest-shell studio-theme app-shell min-h-screen bg-[var(--tt-canvas)] text-[var(--tt-ink)] antialiased selection:bg-[var(--tt-brand)] selection:text-[var(--tt-canvas)]'>
            <main id='main-content' tabIndex={-1}><Outlet /></main>
        </div>
    )
}

function CustomerLayout() {
    return (
        <div className='customer-shell studio-theme app-shell min-h-screen bg-[var(--tt-canvas)] text-[var(--tt-ink)] antialiased selection:bg-[var(--tt-brand)] selection:text-[var(--tt-canvas)] pb-16 md:pb-0'>
            <CustomerHeader />
            <main id='main-content' tabIndex={-1}><Outlet /></main>
            <BottomNav mode='customer' />
        </div>
    )
}

function CompleteProfileEntry() {
    const { user, loading } = useAuth()
    if (loading) return null
    if (!user) return <Navigate to='/login' replace />
    if (user.profileCompleted) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
    return <CompleteProfile />
}

function AdminEntry() {
    const { user, loading } = useAuth()
    if (loading) return null
    if (!user) return <Navigate to='/login' replace />
    if (user.role !== 'admin') return <Navigate to='/dashboard' replace />
    return <Admin />
}

export default function App() {
    useEffect(() => {
        warmupBackendServer()
        appointmentsApi.getServices().catch(() => { })

        const interval = setInterval(() => {
            warmupBackendServer()
        }, 4 * 60 * 1000)

        return () => clearInterval(interval)
    }, [])

    return (
        <BrowserRouter>
            <ScrollToTop />
            <Routes>
                <Route element={<PublicLayout />}>
                    <Route path='/' element={<Home />} />
                    <Route path='/services' element={<Services />} />
                    <Route path='/about' element={<About />} />
                    <Route path='/contact' element={<Contact />} />
                    <Route path='/privacy-policy' element={<PrivacyPolicy />} />
                    <Route path='/terms-of-service' element={<TermsOfService />} />
                </Route>

                <Route element={<GuestUtilityLayout />}>
                    <Route element={<GuestRoute />}>
                        <Route path='/login' element={<Login />} />
                        <Route path='/signup' element={<Signup />} />
                    </Route>
                    <Route path='/forgot-password' element={<ForgotPassword />} />
                    <Route path='/complete-profile' element={<CompleteProfileEntry />} />
                </Route>

                <Route element={<ProtectedRoute />}>
                    <Route element={<ProfileCompletionRoute />}>
                        <Route element={<CustomerLayout />}>
                            <Route path='/dashboard' element={<UserDashboard />} />
                            <Route path='/booking' element={<Booking />} />
                            <Route path='/my-pets' element={<MyPets />} />
                            <Route path='/appointments' element={<Appointments />} />
                            <Route path='/profile' element={<Profile />} />
                        </Route>
                    </Route>
                </Route>

                <Route path='/admin' element={<AdminEntry />} />
                <Route path='*' element={<Navigate to='/' replace />} />
            </Routes>
        </BrowserRouter>
    )
}
