import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../hooks/useAuth'
import { useState } from 'react'
import { LayoutDashboard, Users, BookOpen, Calendar, ClipboardCheck, Star, Users2, Bell, FolderOpen, LogOut, Menu, X, MessageSquare, Search, ChevronRight } from 'lucide-react'

export default function AdminLayout({ children }) {
    const router = useRouter()
    const { logout } = useAuth()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const navItems = [
        { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { label: 'Students', href: '/admin/students', icon: Users },
        { label: 'Classes', href: '/admin/classes', icon: Calendar },
        { label: 'Attendance', href: '/admin/attendance', icon: ClipboardCheck },
        { label: 'Performance', href: '/admin/stars', icon: Star },
        { label: 'Teams', href: '/admin/teams', icon: Users2 },
        { label: 'Subjects', href: '/admin/subjects', icon: BookOpen },
        { label: 'Tests', href: '/admin/tests', icon: ClipboardCheck },
        { label: 'Materials', href: '/admin/materials', icon: FolderOpen },
        { label: 'Notices', href: '/admin/announcements', icon: Bell },
    ]

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-body)' }}>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 40 }}
                />
            )}

            {/* Lernia Sidebar: Black & White */}
            {/* Lernia Sidebar: Black & White */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''} `}>

                <div style={{ padding: '30px 30px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ fontWeight: 900, fontSize: 26, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                            JATHIN'S <span style={{ fontWeight: 400 }}>HUB</span>
                        </div>
                    </div>
                </div>

                <div style={{ height: 1, background: '#27272A', margin: '10px 30px 20px' }}></div>

                <nav style={{ flex: 1, padding: '0 16px', overflowY: 'auto' }}>
                    {navItems.map(item => {
                        const isActive = router.pathname === item.href
                        const Icon = item.icon
                        return (
                            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }} onClick={() => setSidebarOpen(false)}>
                                <div style={{
                                    padding: '12px 20px',
                                    marginBottom: 8,
                                    borderRadius: 0,
                                    position: 'relative',
                                    color: isActive ? 'white' : '#A1A1AA',
                                    cursor: 'pointer',
                                    fontSize: 15,
                                    fontWeight: isActive ? 700 : 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'all 0.2s',
                                    gap: 14,
                                    borderLeft: isActive ? '3px solid white' : '3px solid transparent'
                                }}>
                                    <Icon size={20} color={isActive ? 'white' : 'currentColor'} strokeWidth={isActive ? 2.5 : 2} />
                                    {item.label}
                                </div>
                            </Link>
                        )
                    })}
                </nav>

                <div style={{ padding: 20 }}>
                    <button
                        onClick={logout}
                        style={{
                            width: '100%',
                            background: '#18181B',
                            color: '#EF4444',
                            border: '1px solid #27272A',
                            padding: '12px',
                            borderRadius: 16, // Matching theme radius
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                            fontFamily: 'var(--font-main)',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#27272A'}
                        onMouseOut={(e) => e.currentTarget.style.background = '#18181B'}
                    >
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto', width: '100%' }}>

                {/* Modern Floating Header - Dark Glass */}
                <header style={{
                    minHeight: 80,
                    margin: '20px 20px 10px',
                    borderRadius: 20,
                    background: 'rgba(9, 9, 11, 0.7)', // Dark glass
                    backdropFilter: 'blur(20px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 24px',
                    zIndex: 40,
                    position: 'sticky', // Ensure it sticks on mobile if needed, or just stay relative
                    top: 20,
                    border: '1px solid #27272A'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pages / {navItems.find(i => i.href === router.pathname)?.label || 'Dashboard'}</div>
                        <h2 style={{ margin: 0, fontSize: 24, color: 'var(--text-main)', marginTop: 2 }}>
                            {navItems.find(i => i.href === router.pathname)?.label || 'Dashboard'}
                        </h2>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                        {/* Search Bar - Hidden on very small screens, or collapsed? For now, standard. */}
                        <div className="search-bar-container" style={{ background: '#18181B', borderRadius: 20, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #27272A' }}>
                            <Search size={16} color="var(--text-muted)" />
                            <input
                                type="text"
                                placeholder="Search..."
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        router.push(`/admin/students?search=${e.target.value}`)
                                    }
                                }}
                                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, width: 150, color: 'var(--text-main)' }}
                            />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }} className="header-actions">
                            <Bell size={20} color="var(--text-muted)" style={{ cursor: 'pointer' }} />
                            <div style={{ width: 35, height: 35, background: 'white', borderRadius: '50%', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>
                                AP
                            </div>
                        </div>

                        {/* Mobile Menu Button - Visible < 1024px */}
                        <button onClick={() => setSidebarOpen(true)} className="mobile-menu-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)' }}>
                            <Menu size={24} />
                        </button>
                    </div>

                    <style>{`
                        @media(max-width: 1024px) {
                            .search-bar-container { display: none!important; }
                            .mobile-menu-btn { display: block; }
                            .header-actions { display: none!important; } /* Simplify header on mobile */
                        }
                         @media(min-width: 1025px) {
                            .mobile-menu-btn { display: none; }
                        }
                    `}</style>
                </header>

                <main style={{ padding: '0 20px 40px', maxWidth: 1600, width: '100%' }}>
                    {children}
                </main>
            </div>

        </div>
    )
}

