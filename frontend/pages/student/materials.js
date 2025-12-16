const { user } = useAuth()
// Group by subject helpers
const grouped = materials.reduce((acc, m) => {
    const subName = m.subject?.name || 'General'
    if (!acc[subName]) acc[subName] = []
    acc[subName].push(m)
    return acc
}, {})

useEffect(() => {
    if (!user) return
    async function load() {
        try {
            // Fetch materials only for this student's class
            const classLevel = user.student?.classLevel || 1
            const data = await apiCall(`/materials?classLevel=${classLevel}`)
            setMaterials(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }
    load()
}, [user])

return (
    <ProtectedRoute requiredRole="STUDENT">
        <StudentLayout>
            <div style={{ marginBottom: 30 }}>
                <h1 style={{ margin: 0, fontSize: 24 }}>📚 Study Materials</h1>
                <p style={{ color: '#666', margin: '5px 0 0 0' }}>Resources for Class {user?.student?.classLevel}</p>
            </div>

            {loading ? <p>Loading...</p> : Object.keys(grouped).length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, background: 'white', borderRadius: 12 }}>
                    <p style={{ fontSize: 18, color: '#999' }}>No study materials uploaded for your class yet.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
                    {Object.keys(grouped).map(subjectName => (
                        <div key={subjectName}>
                            <h3 style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: 10, color: '#3f4254' }}>{subjectName}</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                                {grouped[subjectName].map(m => (
                                    <div key={m.id} style={{
                                        background: 'white', border: '1px solid #eee', borderRadius: 12, padding: 20,
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.02)', transition: 'transform 0.2s',
                                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                                    }}
                                        className="hover-card">
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: m.type === 'video' ? '#ffe2e5' : '#e1f0ff', color: m.type === 'video' ? '#f64e60' : '#3699ff', textTransform: 'uppercase' }}>
                                                    {m.type === 'video' ? 'VIDEO 🎥' : 'DOC 📄'}
                                                </span>
                                                <span style={{ fontSize: 11, color: '#b5b5c3' }}>{new Date(m.uploadedAt).toLocaleDateString()}</span>
                                            </div>
                                            <h4 style={{ margin: '0 0 10px 0', fontSize: 16 }}>{m.title}</h4>
                                        </div>
                                        <a href={m.url} target="_blank" rel="noreferrer" style={{
                                            display: 'block', textAlign: 'center', padding: '10px',
                                            background: '#f3f6f9', color: '#3f4254', borderRadius: 8,
                                            textDecoration: 'none', fontWeight: 600, fontSize: 13,
                                            marginTop: 15
                                        }}>
                                            Open Resource ↗
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </StudentLayout>
    </ProtectedRoute>
)
}
