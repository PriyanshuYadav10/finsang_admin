import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    console.log('Creating test invitation...');

    // First, get a real user ID from the database
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, name, phone')
      .limit(1);

    if (userError || !users || users.length === 0) {
      console.error('No users found:', userError);
      return NextResponse.json(
        { error: 'No users found in database' },
        { status: 404 }
      );
    }

    const leader = users[0];
    console.log('Using leader:', leader);

    // Create a test invitation
    const testInvitation = {
      team_leader_id: leader.id,
      invitation_token: `test_inv_${Date.now()}`,
      member_name: 'Test Team Member',
      member_phone: '+919876543210',
      member_email: 'testmember@example.com',
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    };

    const { data, error } = await supabase
      .from('team_invitations')
      .insert(testInvitation)
      .select()
      .single();

    if (error) {
      console.error('Error creating test invitation:', error);
      return NextResponse.json(
        { error: 'Failed to create test invitation', details: error },
        { status: 500 }
      );
    }

    console.log('Test invitation created:', data);

    return NextResponse.json({
      success: true,
      invitation: data,
      testUrl: `http://172.24.132.187:3000/invite?token=${data.invitation_token}`,
      leader: {
        name: leader.name,
        phone: leader.phone
      }
    });

  } catch (error) {
    console.error('Error in test invitation creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
