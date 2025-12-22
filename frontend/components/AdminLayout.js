import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../hooks/useAuth'
import { useState } from 'react'
import { LayoutDashboard, Users, BookOpen, Calendar, ClipboardCheck, Star, Users2, Bell, FolderOpen, LogOut, Menu, X, Search } from 'lucide-react'

export default function AdminLayout({ children }) {
    const router = useRouter()
    const { logout } = useAuth()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    // Navigation Items configuration
    const navItems = [
        { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { label: 'Students', href: '/admin/students', icon: Users },
        { label: 'Classes', href: '/admin/classes', icon: Calendar },
        { label: 'Attendance', href: '/admin/attendance', icon: ClipboardCheck },
        { label: 'Performance', href: '/admin/stars', icon: Star },
        { label: 'Leaders', href: '/admin/captains', icon: Crown }, // Added Leaders
        { label: 'Badges', href: '/admin/badges', icon: Award },
        { label: 'Teams', href: '/admin/teams', icon: Users2 },
        { label: 'Subjects', href: '/admin/subjects', icon: BookOpen },
        { label: 'Tests', href: '/admin/tests', icon: ClipboardCheck },
        { label: 'Materials', href: '/admin/materials', icon: FolderOpen },
        { label: 'Notices', href: '/admin/announcements', icon: Bell },
    ]

    // Get current page label
    const currentPage = navItems.find(i => i.href === router.pathname)?.label || 'Dashboard'

    return (
        <div className="admin-container">

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar Navigation */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>

                {/* Sidebar Header */}
                <div className="sidebar-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="sidebar-brand">
                            JATHIN'S <span style={{ fontWeight: 400, color: 'var(--secondary)' }}>HUB</span>
                        </div>
                    </div>
                    {/* Close Button on Mobile */}
                    <button
                        className="lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                        style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                        aria-label="Close Sidebar"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="sidebar-divider"></div>

                {/* Navigation Links */}
                <nav className="sidebar-nav">
                    {navItems.map(item => {
                        const isActive = router.pathname === item.href
                        const Icon = item.icon
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`nav-item ${isActive ? 'active' : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <Icon size={20} color={isActive ? 'var(--secondary)' : 'currentColor'} strokeWidth={isActive ? 2.5 : 2} />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                {/* Logout Button */}
                <div className="logout-container">
                    <button
                        onClick={logout}
                        className="logout-btn"
                        aria-label="Sign Out"
                    >
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className="main-content-wrapper">

                {/* Modern Floating Header */}
                <header className="admin-header">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pages / {currentPage}</div>
                        <h2 style={{ margin: 0, fontSize: 24, color: 'var(--text-main)', marginTop: 2 }}>
                            {currentPage}
                        </h2>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                        {/* Search Bar */}
                        <div className="header-search-container">
                            <Search size={16} color="var(--text-muted)" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="header-search-input"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        router.push(`/admin/students?search=${e.target.value}`)
                                    }
                                }}
                            />
                        </div>

                        {/* Header Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }} className="header-actions">
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} aria-label="Notifications">
                                <Bell size={20} color="var(--text-muted)" />
                            </button>
                            <div style={{ width: 35, height: 35, background: 'white', borderRadius: '50%', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>
                                AP
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="mobile-menu-btn"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)' }}
                            aria-label="Open Menu"
                        >
                            <Menu size={24} />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="admin-main">
                    {children}
                </main>
            </div>

        </div>
    )
}
