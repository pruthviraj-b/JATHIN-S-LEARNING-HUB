import { useState } from 'react'
import useSWR from 'swr'
import ProtectedRoute from '../../components/ProtectedRoute'
import StudentLayout from '../../components/StudentLayout'
import { apiCall } from '../../lib/api'
import { Plus, Trash2, CheckSquare, Square, StickyNote } from 'lucide-react'

const fetcher = (url) => apiCall(url)

export default function Notes() {
    const { data: tasks, mutate } = useSWR('/tasks', fetcher)
    const [newTask, setNewTask] = useState('')
    const [adding, setAdding] = useState(false)

    const handleAdd = async (e) => {
        e.preventDefault()
        if (!newTask.trim()) return
        setAdding(true)
        try {
            await apiCall('/tasks', {
                method: 'POST',
                body: JSON.stringify({ text: newTask })
            })
            setNewTask('')
            mutate()
        } catch (err) {
            console.error(err)
        }
        setAdding(false)
    }

    const toggleTask = async (id) => {
        // Optimistic update could be done here, but simple mutate is fine for now
        try {
            await apiCall(`/tasks/${id}/toggle`, { method: 'PUT' })
            mutate()
        } catch (err) {
            console.error(err)
        }
    }

    const deleteTask = async (id) => {
        if (!confirm('Delete this task?')) return
        try {
            await apiCall(`/tasks/${id}`, { method: 'DELETE' })
            mutate()
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <ProtectedRoute requiredRole="STUDENT">
            <StudentLayout>
                <div style={{ marginBottom: 24 }}>
                    <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a' }}>Keep Notes & Tasks</h1>
                    <p style={{ margin: '5px 0 0', color: '#64748b' }}>Manage your daily to-dos and reminders</p>
                </div>

                <div className="card" style={{
                    borderRadius: 16,
                    border: '1px solid #E4E4E7', overflow: 'hidden', padding: 24,
                    maxWidth: 600
                }}>
                    <form onSubmit={handleAdd} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                        <input
                            value={newTask}
                            onChange={e => setNewTask(e.target.value)}
                            placeholder="Add a new task..."
                            className="input-field"
                            style={{
                                flex: 1, padding: 12, borderRadius: 8,
                                border: '1px solid #E4E4E7', fontFamily: 'inherit', outline: 'none',
                                background: 'white', color: 'var(--text-main)',
                                boxShadow: 'var(--shadow-sm)'
                            }}
                        />
                        <button
                            type="submit"
                            disabled={!newTask.trim() || adding}
                            style={{
                                background: 'var(--primary)', color: 'white', border: 'none',
                                borderRadius: 8, padding: '0 20px', fontWeight: 600,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                                opacity: (!newTask.trim() || adding) ? 0.7 : 1,
                                boxShadow: 'var(--shadow-sm)'
                            }}
                        >
                            <Plus size={18} /> Add
                        </button>
                    </form>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {tasks?.map(task => (
                            <div key={task.id} style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: 12, borderRadius: 8, background: '#F4F4F5',
                                border: '1px solid #E4E4E7',
                                opacity: task.completed ? 0.6 : 1,
                                textDecoration: task.completed ? 'line-through' : 'none',
                                transition: 'all 0.2s'
                            }}>
                                <button
                                    onClick={() => toggleTask(task.id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: task.completed ? '#10B981' : 'var(--text-muted)' }}
                                >
                                    {task.completed ? <CheckSquare size={20} /> : <Square size={20} />}
                                </button>

                                <span style={{ flex: 1, fontWeight: 500, color: 'var(--text-main)' }}>{task.text}</span>

                                <button
                                    onClick={() => deleteTask(task.id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', opacity: 0.6 }}
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        {tasks?.length === 0 && (
                            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                                <StickyNote size={32} style={{ marginBottom: 10, opacity: 0.5 }} />
                                <div>No tasks yet. Add one above!</div>
                            </div>
                        )}
                    </div>
                </div>
            </StudentLayout>
        </ProtectedRoute>
    )
}
