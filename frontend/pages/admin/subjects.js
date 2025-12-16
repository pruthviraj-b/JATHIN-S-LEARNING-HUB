import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import { apiCall } from '../../lib/api'
import Link from 'next/link'
import AdminLayout from '../../components/AdminLayout'

export default function ManageSubjects() {
  const [classLevel, setClassLevel] = useState(1)
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    visible: true
  })
  const [submitting, setSubmitting] = useState(false)

  // Fetch subjects for selected class
  useEffect(() => {
    fetchSubjects()
  }, [classLevel])

  const fetchSubjects = async () => {
    try {
      setLoading(true)
      const data = await apiCall('/subjects/admin/all')
      // Filter by class level
      const filtered = data.filter(s => s.classLevel === classLevel)
      console.log(`📚 Fetched subjects for class ${classLevel}:`, filtered)
      setSubjects(filtered)
      setError('')
    } catch (err) {
      console.error('❌ Error fetching subjects:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      console.log('📝 Creating subject:', { ...formData, classLevel })
      await apiCall('/subjects', {
        method: 'POST',
        body: JSON.stringify({ ...formData, classLevel })
      })
      console.log('✅ Subject created successfully')
      setFormData({ name: '', code: '', visible: true })
      setShowForm(false)
      await fetchSubjects()
    } catch (err) {
      console.error('❌ Error creating subject:', err)
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (subjectId) => {
    if (!confirm('Are you sure? This will delete the subject permanently.')) return
    try {
      await apiCall(`/subjects/${subjectId}`, { method: 'DELETE' })
      console.log('✅ Subject deleted')
      await fetchSubjects()
    } catch (err) {
      console.error('❌ Error deleting subject:', err)
      setError(err.message)
    }
  }

  const toggleVisibility = async (subjectId, currentStatus) => {
    try {
      await apiCall(`/subjects/${subjectId}`, {
        method: 'PUT',
        body: JSON.stringify({ visible: !currentStatus })
      })
      await fetchSubjects()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24 }}>Curriculum</h1>
            <p style={{ color: '#666', margin: '5px 0 0 0' }}>Manage subjects for each class.</p>
          </div>
        </div>

        {error && <div style={{ background: '#fee', color: '#c00', padding: 15, borderRadius: 4, marginBottom: 20 }}>⚠️ {error}</div>}

        {/* Class Level Selector */}
        <div style={{ background: '#f5f5f5', padding: 20, borderRadius: 8, marginBottom: 30 }}>
          <h2>Select Class Level</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))', gap: 10 }}>
            {[...Array(10)].map((_, i) => {
              const level = i + 1
              return (
                <button
                  key={level}
                  onClick={() => setClassLevel(level)}
                  style={{
                    padding: '10px',
                    background: classLevel === level ? '#007bff' : '#e0e0e0',
                    color: classLevel === level ? 'white' : '#333',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {level}
                </button>
              )
            })}
          </div>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          style={{ marginBottom: 20, padding: '10px 20px', background: '#3699ff', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}
        >
          {showForm ? 'Cancel' : '+ Add Subject for Class ' + classLevel}
        </button>

        {showForm && (
          <div style={{ background: '#f5f5f5', padding: 20, borderRadius: 8, marginBottom: 30 }}>
            <h2>Add New Subject (Class {classLevel})</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, maxWidth: 600 }}>
                <div>
                  <label><strong>Subject Name</strong></label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Mathematics"
                    required
                  />
                </div>
                <div>
                  <label><strong>Subject Code</strong></label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., MATH"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                style={{ marginTop: 15, padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: 4, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}
              >
                {submitting ? 'Adding...' : 'Add Subject'}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div>Loading subjects for class {classLevel}...</div>
        ) : subjects.length === 0 ? (
          <div style={{ background: '#f5f5f5', padding: 20, borderRadius: 4, textAlign: 'center' }}>
            No subjects for class {classLevel} yet. Click "Add Subject" to add one!
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,.1)' }}>
              <thead>
                <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: 12, textAlign: 'left' }}>Subject Name</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Code</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Class</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>Visibility</th>
                  <th style={{ padding: 12, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr key={subject.id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: 12 }}>{subject.name}</td>
                    <td style={{ padding: 12 }}>{subject.code || '—'}</td>
                    <td style={{ padding: 12 }}>Class {subject.classLevel}</td>
                    <td style={{ padding: 12 }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 'bold',
                        background: subject.visible ? '#d4edda' : '#f8d7da',
                        color: subject.visible ? '#155724' : '#856404'
                      }}>
                        {subject.visible ? '👁️ Visible' : '🔒 Hidden'}
                      </span>
                    </td>
                    <td style={{ padding: 12, textAlign: 'center' }}>
                      <button
                        onClick={() => toggleVisibility(subject.id, subject.visible)}
                        style={{
                          padding: '6px 10px',
                          marginRight: 8,
                          background: subject.visible ? '#ffc107' : '#17a2b8',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 12
                        }}
                      >
                        {subject.visible ? 'Hide' : 'Show'}
                      </button>
                      <button
                        onClick={() => handleDelete(subject.id)}
                        style={{
                          padding: '6px 10px',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 12
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: 30, padding: 20, background: '#f5f5f5', borderRadius: 8 }}>
          <h3>📊 Class {classLevel} Summary</h3>
          <p><strong>Subjects in this class:</strong> {subjects.length}</p>
          <p><strong>Visible subjects:</strong> {subjects.filter(s => s.visible).length}</p>
          <p><strong>Hidden subjects:</strong> {subjects.filter(s => !s.visible).length}</p>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  )
}
