import { readFileSync } from 'fs';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const file = readFileSync('C:\\Users\\AKJ\\.gemini\\antigravity-ide\\brain\\8c5db0ba-ca39-4ecd-b30f-1b55ea98da8b\\.tempmediaStorage\\media_8c5db0ba-ca39-4ecd-b30f-1b55ea98da8b_1785691986955.png');
    return new NextResponse(file, { headers: { 'Content-Type': 'image/png' } });
  } catch (error) {
    return new NextResponse('Not found', { status: 404 });
  }
}
