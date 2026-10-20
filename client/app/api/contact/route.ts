import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '../_lib/rateLimit';

export const dynamic = 'force-dynamic';

const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    '';
const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    '';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
});

export async function POST(req: NextRequest) {
    // 1. Rate Limiting: Max 5 tickets per 15 minutes per IP
    const rateLimit = checkRateLimit(req, 5, 15 * 60, 'contact');
    if (!rateLimit.success) {
        return NextResponse.json(
            { error: 'Too many submissions. Please wait before submitting another ticket.' },
            {
                status: 429,
                headers: { 'Retry-After': String(rateLimit.resetInSeconds) },
            }
        );
    }

    try {
        const body = await req.json();
        const { user_id, email, category, message } = body;

        if (!email || typeof email !== 'string' || !email.includes('@') || email.length > 150) {
            return NextResponse.json(
                { error: 'Please provide a valid email address.' },
                { status: 400 }
            );
        }

        if (!message || typeof message !== 'string' || !message.trim()) {
            return NextResponse.json(
                { error: 'Please provide a message.' },
                { status: 400 }
            );
        }

        if (message.trim().length > 3000) {
            return NextResponse.json(
                { error: 'Message cannot exceed 3000 characters.' },
                { status: 400 }
            );
        }

        const sanitizedCategory = typeof category === 'string'
            ? category.replace(/[\r\n]/g, '').trim().substring(0, 60)
            : 'General Inquiry';

        const { data, error } = await supabaseAdmin
            .from('support_tickets')
            .insert({
                user_id: (typeof user_id === 'string' && user_id.length === 36) ? user_id : null,
                email: email.trim().toLowerCase(),
                category: sanitizedCategory,
                message: message.trim(),
                status: 'open', // Always forced to open - cannot be forged by client
            })
            .select('id, category, status, created_at')
            .single();

        if (error) {
            console.error('Server error inserting support ticket:', error);
            return NextResponse.json(
                { error: 'Failed to submit support ticket. Please try again later.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            ticket: data,
        });
    } catch (err: any) {
        console.error('Unexpected error in /api/contact:', err);
        return NextResponse.json(
            { error: 'Internal server error.' },
            { status: 500 }
        );
    }
}
