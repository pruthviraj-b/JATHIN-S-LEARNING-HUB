
import React from 'react';
import { Award } from 'lucide-react';

const TIER_COLORS = {
    BRONZE: 'linear-gradient(135deg, #cd7f32 0%, #a05a2c 100%)',
    SILVER: 'linear-gradient(135deg, #C0C0C0 0%, #A9A9A9 100%)',
    GOLD: 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)',
    PLATINUM: 'linear-gradient(135deg, #E5E4E2 0%, #B0C4DE 100%)'
};

const TIER_BORDER = {
    BRONZE: '#cd7f32',
    SILVER: '#C0C0C0',
    GOLD: '#FFD700',
    PLATINUM: 'cyan'
};

export default function BadgeCard({ badge, size = 'md' }) {
    // size: 'sm' (list view), 'md' (profile view), 'lg' (modal)

    const isSmall = size === 'sm';
    const bg = TIER_COLORS[badge.tier] || TIER_COLORS.BRONZE;
    const border = TIER_BORDER[badge.tier] || TIER_BORDER.BRONZE;

    return (
        <div style={{
            background: 'white',
            borderRadius: 12,
            border: `1px solid ${border}`,
            padding: isSmall ? '8px' : '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            boxShadow: `0 4px 10px -2px ${border}40`, // 40 = 25% opacity hex
            width: isSmall ? 80 : 120, // fixed width for grid alignment
            minHeight: isSmall ? 100 : 140,
            gap: 8,
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Glow effect at top */}
            <div style={{ position: 'absolute', top: -20, insetInline: 0, height: 40, background: bg, opacity: 0.2, borderRadius: '50%', filter: 'blur(20px)' }} />

            <div style={{
                fontSize: isSmall ? 24 : 32,
                lineHeight: 1,
                filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))'
            }}>
                {badge.icon || '🏆'}
            </div>

            <div>
                <div style={{
                    fontSize: isSmall ? 11 : 13,
                    fontWeight: 700,
                    color: '#1C2541',
                    marginBottom: 2
                }}>
                    {badge.name}
                </div>
                {!isSmall && (
                    <div style={{ fontSize: 10, color: '#64748b' }}>
                        {badge.tier}
                    </div>
                )}
            </div>
        </div>
    );
}
