import { useState, useEffect, useRef } from 'react'
import { apiCall } from '../lib/api'
import StudentProfileImage from './StudentProfileImage'
import { MessageCircle, Send, X, Plus, Users, User as UserIcon, ChevronLeft } from 'lucide-react'

export default function ChatSlider({ isOpen, onClose, studentId, isAdmin }) {
    const [rooms, setRooms] = useState([])
    const [activeRoom, setActiveRoom] = useState(null)
    const [messages, setMessages] = useState([])
    const [messageText, setMessageText] = useState('')
    const [loading, setLoading] = useState(false)
    const [showNewRoomModal, setShowNewRoomModal] = useState(false)
    const messagesEndRef = useRef(null)

    // Polling interval for new messages
    useEffect(() => {
        if (isOpen) {
            loadRooms()
            const interval = setInterval(() => {
                if (activeRoom) {
                    loadMessages(activeRoom.id, true) // Silent reload
                }
                loadRooms() // Refresh room list
            }, 3000) // Poll every 3 seconds

            return () => clearInterval(interval)
        }
    }, [isOpen, activeRoom])

    const loadRooms = async () => {
        try {
            const data = await apiCall('/chat/rooms')
            setRooms(data)
        } catch (err) {
            console.error(err)
        }
    }

    const loadMessages = async (roomId, silent = false) => {
        try {
            if (!silent) setLoading(true)
            const data = await apiCall(`/chat/rooms/${roomId}/messages`)
            setMessages(data)
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        } catch (err) {
            console.error(err)
        } finally {
            if (!silent) setLoading(false)
        }
    }

    const sendMessage = async (e) => {
        e?.preventDefault()
        if (!messageText.trim() || !activeRoom) return

        try {
            await apiCall('/chat/messages', {
                method: 'POST',
                body: JSON.stringify({
                    roomId: activeRoom.id,
                    content: messageText.trim()
                })
            })
            setMessageText('')
            loadMessages(activeRoom.id, true)
            loadRooms()
        } catch (err) {
            alert(err.message)
        }
    }

    const selectRoom = (room) => {
        setActiveRoom(room)
        loadMessages(room.id)
    }

    const backToRooms = () => {
        setActiveRoom(null)
        setMessages([])
    }

    if (!isOpen) return null

    return (
        <>
            {/* Overlay */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    zIndex: 999,
                    backdropFilter: 'blur(2px)'
                }}
            />

            {/* Chat Slider */}
            <div style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                maxWidth: 420,
                background: '#FFFFFF',
                zIndex: 1000,
                boxShadow: '-4px 0 20px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column',
                animation: 'slideIn 0.3s ease-out'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px',
                    background: 'linear-gradient(135deg, #000 0%, #333 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #444'
                }}>
                    {activeRoom && (
                        <button
                            onClick={backToRooms}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                padding: 8,
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <ChevronLeft size={20} />
                        </button>
                    )}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <MessageCircle size={24} />
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                            {activeRoom ? activeRoom.name || 'Chat' : 'Messages'}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            padding: 8
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                {!activeRoom ? (
                    <RoomList
                        rooms={rooms}
                        onSelect={selectRoom}
                        isAdmin={isAdmin}
                        onCreateNew={() => setShowNewRoomModal(true)}
                    />
                ) : (
                    <ChatView
                        messages={messages}
                        messageText={messageText}
                        setMessageText={setMessageText}
                        sendMessage={sendMessage}
                        loading={loading}
                        messagesEndRef={messagesEndRef}
                        currentStudentId={studentId}
                    />
                )}
            </div>

            {/* New Room Modal */}
            {showNewRoomModal && (
                <NewRoomModal
                    onClose={() => setShowNewRoomModal(false)}
                    onCreated={() => {
                        setShowNewRoomModal(false)
                        loadRooms()
                    }}
                    isAdmin={isAdmin}
                />
            )}

            <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
        </>
    )
}

// Room List Component
function RoomList({ rooms, onSelect, isAdmin, onCreateNew }) {
    return (
        <div style={{ flex: 1, overflowY: 'auto', background: '#F9FAFB' }}>
            {isAdmin && (
                <button
                    onClick={onCreateNew}
                    style={{
                        width: '100%',
                        padding: '16px 20px',
                        background: '#D4AF37',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10
                    }}
                >
                    <Plus size={20} />
                    Create New Room
                </button>
            )}

            {rooms.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>
                    <MessageCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                    <p>No chat rooms yet</p>
                </div>
            ) : (
                rooms.map(room => (
                    <div
                        key={room.id}
                        onClick={() => onSelect(room)}
                        style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid #E5E7EB',
                            cursor: 'pointer',
                            background: 'white',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                background: room.type === 'GROUP' ? '#D4AF37' : '#3B82F6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white'
                            }}>
                                {room.type === 'GROUP' ? <Users size={20} /> : <UserIcon size={20} />}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, color: '#111827', fontSize: 15 }}>
                                    {room.name || 'Chat'}
                                </div>
                                {room.messages?.[0] && (
                                    <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {room.messages[0].content}
                                    </div>
                                )}
                            </div>
                            {room._count?.messages > 0 && (
                                <div style={{
                                    background: '#D4AF37',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: 24,
                                    height: 24,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 11,
                                    fontWeight: 700
                                }}>
                                    {room._count.messages}
                                </div>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    )
}

// Chat View Component
function ChatView({ messages, messageText, setMessageText, sendMessage, loading, messagesEndRef, currentStudentId }) {
    return (
        <>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#F9FAFB' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>Loading...</div>
                ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    messages.map(msg => {
                        const isOwn = msg.senderId === currentStudentId
                        return (
                            <div
                                key={msg.id}
                                style={{
                                    marginBottom: 16,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: isOwn ? 'flex-end' : 'flex-start'
                                }}
                            >
                                <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>
                                    {msg.senderName} {msg.senderRole === 'ADMIN' && '(Admin)'}
                                </div>
                                <div style={{
                                    maxWidth: '70%',
                                    padding: '12px 16px',
                                    borderRadius: 16,
                                    background: isOwn ? '#D4AF37' : '#FFFFFF',
                                    color: isOwn ? 'white' : '#111827',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                    wordWrap: 'break-word'
                                }}>
                                    {msg.content}
                                </div>
                                <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} style={{
                padding: '16px 20px',
                background: 'white',
                borderTop: '1px solid #E5E7EB',
                display: 'flex',
                gap: 10
            }}>
                <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    style={{
                        flex: 1,
                        padding: '12px 16px',
                        border: '1px solid #E5E7EB',
                        borderRadius: 24,
                        outline: 'none',
                        fontSize: 14
                    }}
                />
                <button
                    type="submit"
                    disabled={!messageText.trim()}
                    style={{
                        background: '#D4AF37',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: 44,
                        height: 44,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: messageText.trim() ? 'pointer' : 'not-allowed',
                        opacity: messageText.trim() ? 1 : 0.5
                    }}
                >
                    <Send size={20} />
                </button>
            </form>
        </>
    )
}

// New Room Modal Component
function NewRoomModal({ onClose, onCreated, isAdmin }) {
    const [name, setName] = useState('')
    const [type, setType] = useState('GROUP')
    const [students, setStudents] = useState([])
    const [selectedStudents, setSelectedStudents] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isAdmin) {
            loadStudents()
        }
    }, [])

    const loadStudents = async () => {
        try {
            const data = await apiCall('/chat/students-list')
            setStudents(data)
        } catch (err) {
            console.error(err)
        }
    }

    const toggleStudent = (id) => {
        setSelectedStudents(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        )
    }

    const createRoom = async () => {
        if (!name.trim() || selectedStudents.length === 0) {
            return alert('Please enter a room name and select at least one student')
        }

        try {
            setLoading(true)
            await apiCall('/chat/rooms', {
                method: 'POST',
                body: JSON.stringify({
                    name: name.trim(),
                    type,
                    memberIds: selectedStudents
                })
            })
            alert('Chat room created!')
            onCreated()
        } catch (err) {
            alert(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                background: 'white',
                borderRadius: 16,
                padding: 24,
                width: '90%',
                maxWidth: 500,
                maxHeight: '80vh',
                overflowY: 'auto'
            }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: 20, fontWeight: 700 }}>Create New Chat Room</h3>

                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: '#6B7280' }}>
                        Room Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Math Study Group"
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #E5E7EB',
                            borderRadius: 8,
                            fontSize: 14
                        }}
                    />
                </div>

                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8, color: '#6B7280' }}>
                        Select Students ({selectedStudents.length} selected)
                    </label>
                    <div style={{
                        maxHeight: 200,
                        overflowY: 'auto',
                        border: '1px solid #E5E7EB',
                        borderRadius: 8,
                        padding: 8
                    }}>
                        {students.map(student => (
                            <label
                                key={student.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: 8,
                                    cursor: 'pointer',
                                    borderRadius: 6,
                                    background: selectedStudents.includes(student.id) ? '#FEF3C7' : 'transparent'
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedStudents.includes(student.id)}
                                    onChange={() => toggleStudent(student.id)}
                                    style={{ accentColor: '#D4AF37' }}
                                />
                                <span style={{ fontSize: 14 }}>
                                    {student.firstName} {student.lastName}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 20px',
                            border: '1px solid #E5E7EB',
                            background: 'white',
                            borderRadius: 8,
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={createRoom}
                        disabled={loading}
                        style={{
                            padding: '10px 20px',
                            background: '#D4AF37',
                            color: 'white',
                            border: 'none',
                            borderRadius: 8,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontWeight: 700,
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Creating...' : 'Create Room'}
                    </button>
                </div>
            </div>
        </div>
    )
}
