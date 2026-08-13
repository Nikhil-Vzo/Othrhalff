import { readFileSync, existsSync } from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';

const FALLBACK_BENCH_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 64" width="128" height="64">
  <ellipse cx="64" cy="56" rx="56" ry="6" fill="rgba(0,0,0,0.3)"/>
  <rect x="20" y="36" width="6" height="20" fill="#374151" rx="1"/>
  <rect x="102" y="36" width="6" height="20" fill="#374151" rx="1"/>
  <rect x="30" y="40" width="6" height="16" fill="#1f2937" rx="1"/>
  <rect x="92" y="40" width="6" height="16" fill="#1f2937" rx="1"/>
  <rect x="12" y="32" width="104" height="6" fill="#9a3412" rx="2"/>
  <rect x="12" y="39" width="104" height="6" fill="#7c2d12" rx="2"/>
  <rect x="12" y="46" width="104" height="6" fill="#78350f" rx="2"/>
  <rect x="18" y="10" width="6" height="24" fill="#374151" rx="1"/>
  <rect x="104" y="10" width="6" height="24" fill="#374151" rx="1"/>
  <rect x="14" y="12" width="100" height="7" fill="#b45309" rx="2"/>
  <rect x="14" y="21" width="100" height="7" fill="#9a3412" rx="2"/>
  <rect x="10" y="28" width="8" height="14" fill="#4b5563" rx="2"/>
  <rect x="110" y="28" width="8" height="14" fill="#4b5563" rx="2"/>
</svg>`;

export async function GET() {
  try {
    const pngPath = path.join(process.cwd(), 'public', 'assets', 'bench.png');
    if (existsSync(pngPath)) {
      const file = readFileSync(pngPath);
      return new NextResponse(file, { headers: { 'Content-Type': 'image/png' } });
    }

    const svgPath = path.join(process.cwd(), 'public', 'assets', 'bench.svg');
    if (existsSync(svgPath)) {
      const file = readFileSync(svgPath);
      return new NextResponse(file, { headers: { 'Content-Type': 'image/svg+xml' } });
    }

    return new NextResponse(FALLBACK_BENCH_SVG, { headers: { 'Content-Type': 'image/svg+xml' } });
  } catch (error) {
    return new NextResponse(FALLBACK_BENCH_SVG, { headers: { 'Content-Type': 'image/svg+xml' } });
  }
}
