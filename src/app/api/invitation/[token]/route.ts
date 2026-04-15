import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    console.log('API called with token:', token);

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      );
    }

    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase not configured:', { supabaseUrl, supabaseKey: supabaseKey ? 'SET' : 'NOT_SET' });
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Fetch invitation details from database
    const { data: invitation, error } = await supabase
      .from('team_invitations')
      .select(`
        *,
        team_leader:team_leader_id(name, phone)
      `)
      .eq('invitation_token', token)
      .single();

    console.log('Database query result:', { invitation, error });

    // If the join didn't work, try fetching leader details separately
    let leaderDetails = null;
    if (invitation && invitation.team_leader_id) {
      const { data: leader, error: leaderError } = await supabase
        .from('users')
        .select('name, phone')
        .eq('id', invitation.team_leader_id)
        .single();
      
      if (!leaderError && leader) {
        leaderDetails = leader;
        console.log('Leader details fetched separately:', leaderDetails);
      }
    }

    if (error || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if invitation is expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);

    const leaderName = leaderDetails?.name || invitation.team_leader?.name || 'Unknown';
    const leaderPhone = leaderDetails?.phone || invitation.team_leader?.phone || 'Unknown';

    if (now > expiresAt) {
      return NextResponse.json({
        leader_name: leaderName,
        invited_by: leaderName,
        status: 'expired',
        error: 'Invitation has expired',
        member_name: invitation.member_name,
        member_phone: invitation.member_phone,
        created_at: invitation.created_at
      });
    }

    // Check if already accepted
    if (invitation.status === 'accepted') {
      return NextResponse.json({
        leader_name: leaderName,
        invited_by: leaderName,
        status: 'accepted',
        error: 'Invitation already accepted',
        member_name: invitation.member_name,
        member_phone: invitation.member_phone,
        created_at: invitation.created_at
      });
    }

    return NextResponse.json({
      leader_name: leaderName,
      invited_by: leaderName,
      status: 'valid',
      member_name: invitation.member_name,
      member_phone: invitation.member_phone,
      member_email: invitation.member_email,
      created_at: invitation.created_at,
      expires_at: invitation.expires_at
    });

  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
