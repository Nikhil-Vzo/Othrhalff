import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    try {
        const body = await req.json();
        const { user_id, email, category, message, status = 'open' } = body;

        if (!email || typeof email !== 'string' || !email.includes('@')) {
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

        const { data, error } = await supabaseAdmin
            .from('support_tickets')
            .insert({
                user_id: user_id || null,
                email: email.trim(),
                category: (category || 'General Inquiry').trim(),
                message: message.trim(),
                status: status || 'open',
            })
            .select()
            .single();

        if (error) {
            console.error('Server error inserting support ticket:', error);
            return NextResponse.json(
                { error: error.message || 'Failed to submit support ticket.' },
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
            { error: err.message || 'Internal server error.' },
            { status: 500 }
        );
    }
}
