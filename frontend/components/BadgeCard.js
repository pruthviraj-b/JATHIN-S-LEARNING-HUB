import React from 'react';

export default function BadgeCard({ badge, awardedAt, size = 'medium' }) {
    // Styles based on Tier
    const tierStyles = {
        BRONZE: { border: '1px solid #CD7F32', bg: 'linear-gradient(135deg, #1c1c1c 0%, #3d2b1f 100%)', text: '#CD7F32' },
        SILVER: { border: '1px solid #C0C0C0', bg: 'linear-gradient(135deg, #1c1c1c 0%, #2e3b4e 100%)', text: '#C0C0C0' },
        GOLD: { border: '1px solid #FFD700', bg: 'linear-gradient(135deg, #1c1c1c 0%, #4a3b00 100%)', text: '#FFD700' },
        PLATINUM: { border: '1px solid #E5E4E2', bg: 'linear-gradient(135deg, #1c1c1c 0%, #2c2c2c 100%)', text: '#E5E4E2' }
    };

    const style = tierStyles[badge.tier] || tierStyles.BRONZE;
    const isSmall = size === 'small';

    return (
        <div style={{
            background: style.bg,
            border: style.border,
            borderRadius: 12,
            padding: isSmall ? 10 : 15,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            minWidth: isSmall ? 80 : 120,
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{ fontSize: isSmall ? 24 : 36, marginBottom: 5 }}>{badge.icon}</div>
            <div style={{ fontSize: isSmall ? 11 : 14, fontWeight: 700, color: 'white' }}>{badge.name}</div>
            {!isSmall && badge.description && (
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>{badge.description}</div>
            )}
            {awardedAt && (
                <div style={{ fontSize: 10, color: style.text, marginTop: isSmall ? 2 : 8, fontWeight: 600 }}>
                    {new Date(awardedAt).toLocaleDateString()}
                </div>
            )}
        </div>
    );
}
