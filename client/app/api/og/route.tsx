import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const title = searchParams.get('title') || 'Othrhalff';
    const subtitle = searchParams.get('subtitle') || 'Campus Speed Dating & Anonymous Confessions';
    const category = searchParams.get('category') || 'CAMPUS HUB';
    const students = searchParams.get('students') || 'Verified Students';
    const type = searchParams.get('type') || 'campus';

    const isTea = type === 'tea';
    const accentColor = isTea ? '#FF007F' : '#F45D9B';
    const badgeText = isTea ? '🍵 ANONYMOUS CAMPUS TEA' : '⚡ VERIFIED CAMPUS DATING';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '60px 70px',
            backgroundColor: '#07030d',
            backgroundImage:
              'radial-gradient(circle at 15% 20%, rgba(244, 93, 155, 0.22) 0%, transparent 45%), radial-gradient(circle at 85% 80%, rgba(139, 92, 246, 0.2) 0%, transparent 45%)',
            fontFamily: 'sans-serif',
            color: 'white',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #FF007F, #9333EA)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '24px',
                }}
              >
                O
              </div>
              <span style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '0.08em' }}>
                OTHRHALFF
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '999px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: accentColor,
              }}
            >
              {badgeText}
            </div>
          </div>

          {/* Body */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '950px' }}>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 800,
                letterSpacing: '0.2em',
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
              }}
            >
              {category}
            </span>

            <h1
              style={{
                fontSize: title.length > 35 ? '48px' : '58px',
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: '-0.03em',
                margin: 0,
                color: 'white',
              }}
            >
              {title}
            </h1>

            <p
              style={{
                fontSize: '22px',
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.7)',
                lineHeight: 1.35,
                margin: 0,
              }}
            >
              {subtitle}
            </p>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                }}
              />
              <span style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600 }}>
                {students}
              </span>
            </div>

            <div style={{ fontSize: '15px', color: accentColor, fontWeight: 700, letterSpacing: '0.05em' }}>
              www.othrhalff.in
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
