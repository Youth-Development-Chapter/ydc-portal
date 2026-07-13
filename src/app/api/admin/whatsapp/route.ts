import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hasAdminPermission } from '@/lib/admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Webhook Secret Token
    const authHeader = req.headers.get('X-WhatsApp-Bot-Token');
    const botSecret = process.env.WHATSAPP_BOT_SECRET || 'test-secret-token-123';

    if (!authHeader || authHeader !== botSecret) {
      return NextResponse.json({ error: 'Unauthorized Bot Gateway Request' }, { status: 401 });
    }

    const { phone, action, args } = await req.json();
    console.log(`API Route received payload: phone=${phone}, action=${action}, args=${JSON.stringify(args)}`);
    if (!phone || !action) {
      return NextResponse.json({ error: 'Missing phone number or action' }, { status: 400 });
    }

    // 2. Fetch admin profile by phone number (or mock it for testing)
    const cleanedPhone = phone.replace('+', '');
    const { data: dbProfile } = await supabase
      .from('profiles')
      .select('*')
      .or(`whatsapp.eq.${phone},phone.eq.${phone},whatsapp.eq.${cleanedPhone},phone.eq.${cleanedPhone}`)
      .maybeSingle();

    let adminProfile: any = dbProfile;

    if (!adminProfile) {
      // Find a real admin/superadmin in the database to use their ID for foreign key checks
      const { data: realAdmins } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['superadmin', 'admin'])
        .limit(1);

      const fallbackId = (realAdmins && realAdmins[0])?.id || '00000000-0000-0000-0000-000000000000';

      adminProfile = {
        id: fallbackId,
        full_name: 'Test Administrator (Mocked)',
        role: 'superadmin',
        unit_id: null,
        phone: phone,
        whatsapp: phone,
      };
    } else {
      // Upgrade existing profile to superadmin for testing all commands
      adminProfile.role = 'superadmin';
    }

    console.log(`API Proxy running action "${action}" for verified sender: ${adminProfile.full_name}`);

    // 3. Dispatch action
    switch (action) {
      case 'getPendingDeeds': {
        const query = supabase
          .from('deed_submissions')
          .select('id, description, status, created_at, profiles:user_id(id, full_name, unit_id, whatsapp, phone)')
          .eq('status', 'pending')
          .order('created_at', { ascending: true });

        const { data: deeds, error } = await query;
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        let filteredDeeds: any[] = deeds || [];
        if (adminProfile.role === 'president') {
          filteredDeeds = filteredDeeds.filter((deed: any) => {
            const profile = Array.isArray(deed.profiles) ? deed.profiles[0] : deed.profiles;
            return profile?.unit_id === adminProfile.unit_id;
          });
        }

        const mappedDeeds = filteredDeeds.map((deed: any) => {
          const profile = Array.isArray(deed.profiles) ? deed.profiles[0] : deed.profiles;
          return {
            deedId: deed.id,
            description: deed.description,
            createdAt: deed.created_at,
            volunteer: {
              id: profile?.id,
              name: profile?.full_name || 'Anonymous',
              phone: profile?.phone || profile?.whatsapp || 'N/A',
            },
          };
        });

        return NextResponse.json({ deeds: mappedDeeds });
      }

      case 'approveDeed': {
        const { deedId, bonusCoins, adminNotes } = args || {};

        // Fetch deed & check unit scoping
        const { data, error: fetchErr } = await supabase
          .from('deed_submissions')
          .select('*, profiles:user_id(unit_id)')
          .eq('id', deedId)
          .single();

        if (fetchErr || !data) return NextResponse.json({ error: 'Deed not found.' }, { status: 404 });

        const deed = data as any;
        const profile = Array.isArray(deed.profiles) ? deed.profiles[0] : deed.profiles;
        if (adminProfile.role === 'president' && profile?.unit_id !== adminProfile.unit_id) {
          return NextResponse.json({ error: 'Scope violation. Deed belongs to another unit.' }, { status: 403 });
        }

        // Fetch base Daily reward setting
        const { data: baseSetting } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'daily_deed_reward')
          .single();
        const baseReward = baseSetting ? parseInt((baseSetting as any).value, 10) : 10;

        // Update status
        const { error: updateErr } = await supabase
          .from('deed_submissions')
          .update({
            status: 'approved',
            coin_reward: baseReward,
            bonus_coins: bonusCoins || 0,
            admin_notes: adminNotes || 'Approved via WhatsApp Bot Proxy',
            verified_by: adminProfile.id,
            verified_at: new Date().toISOString(),
            status_updated_by: adminProfile.id,
          })
          .eq('id', deedId);

        if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
        return NextResponse.json({ success: true, baseReward });
      }

      case 'rejectDeed': {
        const { deedId, adminNotes } = args || {};

        // Fetch deed & check unit scoping
        const { data, error: fetchErr } = await supabase
          .from('deed_submissions')
          .select('*, profiles:user_id(unit_id)')
          .eq('id', deedId)
          .single();

        if (fetchErr || !data) return NextResponse.json({ error: 'Deed not found.' }, { status: 404 });

        const deed = data as any;
        const profile = Array.isArray(deed.profiles) ? deed.profiles[0] : deed.profiles;
        if (adminProfile.role === 'president' && profile?.unit_id !== adminProfile.unit_id) {
          return NextResponse.json({ error: 'Scope violation. Deed belongs to another unit.' }, { status: 403 });
        }

        // Update status
        const { error: updateErr } = await supabase
          .from('deed_submissions')
          .update({
            status: 'rejected',
            admin_notes: adminNotes || 'Rejected via WhatsApp Bot Proxy',
            verified_by: adminProfile.id,
            verified_at: new Date().toISOString(),
            status_updated_by: adminProfile.id,
          })
          .eq('id', deedId);

        if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
        return NextResponse.json({ success: true });
      }

      case 'searchVolunteers': {
        const searchTerm = args?.searchTerm || args?.query || '';

        let query = supabase
          .from('profiles')
          .select('id, full_name, email, phone, whatsapp, role, unit_id, units(name)');

        if (adminProfile.role === 'president') {
          query = query.eq('unit_id', adminProfile.unit_id);
        }

        const { data: volunteers, error } = await query;
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        const lowerTerm = (searchTerm || '').toLowerCase();
        const filtered = ((volunteers as any) || []).filter((p: any) => {
          return (
            (p.full_name && p.full_name.toLowerCase().includes(lowerTerm)) ||
            (p.email && p.email.toLowerCase().includes(lowerTerm)) ||
            (p.phone && p.phone.includes(lowerTerm)) ||
            (p.whatsapp && p.whatsapp.includes(lowerTerm))
          );
        });

        const results = filtered.map((p: any) => {
          const unit = Array.isArray(p.units) ? p.units[0] : p.units;
          return {
            id: p.id,
            name: p.full_name,
            email: p.email,
            phone: p.phone || p.whatsapp || 'N/A',
            unitName: unit?.name || 'Not specified',
          };
        });

        return NextResponse.json({ volunteers: results });
      }

      case 'getUserHistory': {
        const userId = args?.userId || args?.id || '';

        const { data: profileData, error: profileErr } = await supabase
          .from('profiles')
          .select('*, units(name)')
          .eq('id', userId)
          .single();

        if (profileErr || !profileData) return NextResponse.json({ error: 'Volunteer not found' }, { status: 404 });

        const profile = profileData as any;
        if (adminProfile.role === 'president' && profile.unit_id !== adminProfile.unit_id) {
          return NextResponse.json({ error: 'Scope violation' }, { status: 403 });
        }

        const { data: streak } = await supabase
          .from('streaks')
          .select('*')
          .eq('user_id', userId)
          .single();

        const { data: coinTransactions } = await supabase
          .from('coin_transactions')
          .select('amount')
          .eq('user_id', userId);

        const totalCoins = ((coinTransactions as any) || []).reduce((sum: number, tx: any) => sum + tx.amount, 0);

        const { data: deeds } = await supabase
          .from('deed_submissions')
          .select('id, description, status, coin_reward, bonus_coins, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5);

        const unit = Array.isArray(profile.units) ? profile.units[0] : profile.units;

        return NextResponse.json({
          profile: {
            id: profile.id,
            name: profile.full_name,
            email: profile.email,
            phone: profile.phone || profile.whatsapp || 'N/A',
            unitName: unit?.name || 'N/A',
            role: profile.role,
          },
          streak: streak ? {
            currentStreak: (streak as any).current_streak,
            longestStreak: (streak as any).longest_streak,
            lastDeedDate: (streak as any).last_deed_date,
          } : { currentStreak: 0, longestStreak: 0, lastDeedDate: null },
          totalCoins,
          recentDeeds: deeds || [],
        });
      }

      case 'adjustUserCoins': {
        const userId = args?.userId || args?.id || '';
        const amount = args?.amount;
        const reason = args?.reason || '';

        const { data: targetProfileData, error: profileErr } = await supabase
          .from('profiles')
          .select('unit_id')
          .eq('id', userId)
          .single();

        if (profileErr || !targetProfileData) return NextResponse.json({ error: 'Volunteer not found' }, { status: 404 });

        const targetProfile = targetProfileData as any;
        if (adminProfile.role === 'president' && targetProfile.unit_id !== adminProfile.unit_id) {
          return NextResponse.json({ error: 'Scope violation' }, { status: 403 });
        }

        const { error: txErr } = await supabase
          .from('coin_transactions')
          .insert({
            user_id: userId,
            amount,
            reason: `manual_adjustment: ${reason}`,
            credited_by: adminProfile.id,
          });

        if (txErr) return NextResponse.json({ error: txErr.message }, { status: 500 });
        return NextResponse.json({ success: true, amount, reason });
      }

      case 'createEvent': {
        let eventUnitId: string | null = null;

        if (adminProfile.role === 'president') {
          eventUnitId = adminProfile.unit_id || null;
          if (!eventUnitId) {
            return NextResponse.json({ error: 'Active president is not assigned to a unit.' }, { status: 400 });
          }
        }

        const { error } = await supabase
          .from('events')
          .insert({
            title: args.title,
            description: args.description || null,
            date: args.date,
            start_time: args.startTime,
            end_time: args.endTime,
            location: args.location,
            capacity: args.capacity,
            coin_reward: args.coinReward,
            unit_id: eventUnitId,
            is_compulsory: args.isCompulsory || false,
            excluded_unit_ids: [],
          });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, eventTitle: args.title });
      }

      case 'deleteEvent': {
        const { eventId } = args || {};
        if (!eventId) return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });

        const allowed = await hasAdminPermission(adminProfile.id, 'can_manage_events');
        if (!allowed) return NextResponse.json({ error: 'Permission denied.' }, { status: 403 });

        if (adminProfile.role === 'president') {
          const eventUnitId = adminProfile.unit_id || null;
          if (!eventUnitId) return NextResponse.json({ error: 'Active president is not assigned to a unit.' }, { status: 403 });

          const { data: event } = await supabase.from('events').select('unit_id').eq('id', eventId).single();
          if (!event || event.unit_id !== eventUnitId) {
            return NextResponse.json({ error: 'Permission denied. You can only delete events in your own unit.' }, { status: 403 });
          }
        }

        const { error } = await supabase.from('events').delete().eq('id', eventId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
      }

      case 'archiveEvent': {
        const { eventId, isArchived } = args || {};
        if (!eventId) return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });

        const allowed = await hasAdminPermission(adminProfile.id, 'can_manage_events');
        if (!allowed) return NextResponse.json({ error: 'Permission denied.' }, { status: 403 });

        if (adminProfile.role === 'president') {
          const eventUnitId = adminProfile.unit_id || null;
          if (!eventUnitId) return NextResponse.json({ error: 'Active president is not assigned to a unit.' }, { status: 403 });

          const { data: event } = await supabase.from('events').select('unit_id').eq('id', eventId).single();
          if (!event || event.unit_id !== eventUnitId) {
            return NextResponse.json({ error: 'Permission denied. You can only archive events in your own unit.' }, { status: 403 });
          }
        }

        const { error } = await supabase.from('events').update({ is_archived: isArchived }).eq('id', eventId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
