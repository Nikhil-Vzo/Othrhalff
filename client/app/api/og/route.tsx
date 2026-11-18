import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const title = searchParams.get('title') || 'Othrhalff';
    const subtitle = searchParams.get('subtitle') || 'Campus Community & Anonymous Confessions';
    const category = searchParams.get('category') || 'CAMPUS HUB';
    const type = searchParams.get('type') || 'campus';

    const isTea = type === 'tea';
    const badgeText = isTea ? '🍵 ANONYMOUS CAMPUS TEA' : '⚡ VERIFIED CAMPUS NETWORK';

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
            backgroundColor: '#FF007F',
            backgroundImage:
              'linear-gradient(135deg, #FF007F 0%, #F45D9B 55%, #FF6B9D 100%)',
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
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '24px',
                  color: '#FF007F',
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
                backgroundColor: 'white',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: '#FF007F',
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
                color: 'rgba(255, 255, 255, 0.75)',
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
                color: 'rgba(255, 255, 255, 0.9)',
                lineHeight: 1.35,
                margin: 0,
              }}
            >
              {subtitle}
            </p>
          </div>

          {/* Footer — no user counts: the old footer rendered "{studentsCount} Verified
              Students" from campus data, which is university enrolment, not Othrhalff
              users. Keep only the honest 18+ rule and the site address. */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.35)',
            }}
          >
            <span style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.85)', fontWeight: 600 }}>
              18+ · Students only
            </span>

            <div style={{ fontSize: '15px', color: 'white', fontWeight: 700, letterSpacing: '0.05em' }}>
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
