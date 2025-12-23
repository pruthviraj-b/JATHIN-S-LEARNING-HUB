import React from 'react';
import AdminLayout from '../../components/AdminLayout';

export default function AdminBadges() {
    return (
        <AdminLayout>
            <div style={{ padding: 20, color: 'red', background: 'white' }}>
                <h1>SUPER SIMPLE DEBUG PAGE</h1>
                <p>If you see this, the routing and AdminLayout are working.</p>
            </div>
        </AdminLayout>
    );
}
