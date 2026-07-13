import { lastShownDeeds } from './agent';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { hasAdminPermission } from '@/lib/admin';
import { tool, generateText } from 'ai';
import { google } from '@ai-sdk/google';
import fs from 'fs';

// Direct Supabase client — no HTTP loopback, runs in the same Node.js process
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '', {
  auth: { persistSession: false, autoRefreshToken: false },
});

function getDeedImageUrl(proofUrl: string) {
  if (!proofUrl) return '';
  if (proofUrl.startsWith('http')) return proofUrl;
  const cleanUrl = supabaseUrl?.endsWith('/') ? supabaseUrl.slice(0, -1) : supabaseUrl;
  if (proofUrl.startsWith('deeds/')) {
    return `${cleanUrl}/storage/v1/object/public/${proofUrl}`;
  }
  return `${cleanUrl}/storage/v1/object/public/deeds/${proofUrl}`;
}

function getAvatarImageUrl(avatarUrl: string) {
  if (!avatarUrl) return '';
  if (avatarUrl.startsWith('http')) return avatarUrl;
  const cleanUrl = supabaseUrl?.endsWith('/') ? supabaseUrl.slice(0, -1) : supabaseUrl;
  if (avatarUrl.startsWith('avatars/')) {
    return `${cleanUrl}/storage/v1/object/public/${avatarUrl}`;
  }
  return `${cleanUrl}/storage/v1/object/public/avatars/${avatarUrl}`;
}

export const adminTools = (adminProfile: any) => ({
  // =========================================================================
  // 1. UNIT MANAGEMENT & DEMOGRAPHICS
  // =========================================================================
  getUnits: tool({
    description: 'Fetch the list of all units/chapters in the system. Presidents can only view their own unit.',
    inputSchema: z.object({}),
    execute: async () => {
      try {
        let query = supabase.from('units').select('*').order('name', { ascending: true });
        if (adminProfile.role === 'president' && adminProfile.unit_id) {
          query = query.eq('id', adminProfile.unit_id);
        }
        const { data: units, error } = await query;
        if (error) return { error: error.message };

        // For demographics, enrich with member counts
        const enrichedUnits = [];
        for (const u of (units || [])) {
          const { count, error: countErr } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('unit_id', u.id);

          enrichedUnits.push({
            id: u.id,
            name: u.name,
            province: u.province || 'N/A',
            memberCount: countErr ? 0 : (count || 0),
            createdAt: u.created_at,
          });
        }

        console.log(`[Tool:getUnits] Fetched demographics for ${enrichedUnits.length} units`);
        return { units: enrichedUnits };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),

  createUnit: tool({
    description: 'Create a new unit/chapter. Superadmins and admins only.',
    inputSchema: z.object({
      name: z.string().min(1).describe('The name of the new unit.'),
      province: z.string().min(1).describe('The province where the unit is located.'),
    }),
    execute: async (input: { name: string; province: string }) => {
      try {
        if (!['superadmin', 'admin'].includes(adminProfile.role)) {
          return { error: 'Permission denied: Only admins and superadmins can create units.' };
        }
        const { data, error } = await supabase
          .from('units')
          .insert({ name: input.name, province: input.province })
          .select()
          .single();

        if (error) return { error: error.message };
        console.log(`[Tool:createUnit] Created unit "${input.name}"`);
        return { success: true, unit: data };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),

  updateUnit: tool({
    description: 'Update unit metadata (name, province). Superadmins and admins only.',
    inputSchema: z.object({
      unitId: z.string().uuid().describe('The UUID of the unit to update.'),
      name: z.string().min(1).optional().describe('The new name of the unit.'),
      province: z.string().min(1).optional().describe('The new province of the unit.'),
    }),
    execute: async (input: { unitId: string; name?: string; province?: string }) => {
      try {
        if (!['superadmin', 'admin'].includes(adminProfile.role)) {
          return { error: 'Permission denied: Only admins and superadmins can update units.' };
        }
        const updates: any = {};
        if (input.name) updates.name = input.name;
        if (input.province) updates.province = input.province;

        const { data, error } = await supabase
          .from('units')
          .update(updates)
          .eq('id', input.unitId)
          .select()
          .single();

        if (error) return { error: error.message };
        console.log(`[Tool:updateUnit] Updated unit ${input.unitId}`);
        return { success: true, unit: data };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),

  // =========================================================================
  // 2. USER PROFILE MANAGEMENT
  // =========================================================================
  searchUsers: tool({
    description: 'Search for any user (volunteers, admins, superadmins, presidents, etc.) by full name, phone number, or email. Supports filtering by unitId.',
    inputSchema: z.object({
      searchTerm: z.string().optional().describe('Optional search query matching user full name, email, or phone number.'),
      unitId: z.string().uuid().optional().describe('Optional UUID of the unit to filter results by.'),
    }),
    execute: async (input: { searchTerm?: string; unitId?: string }) => {
      try {
        const term = (input.searchTerm || '').trim();
        let targetUnit = input.unitId;

        // Scoping for presidents
        if (adminProfile.role === 'president') {
          targetUnit = adminProfile.unit_id;
        }

        let query = supabase
          .from('profiles')
          .select('id, full_name, email, phone, whatsapp, role, unit_id, units(name)');

        const filterOrs = [];
        if (term) {
          filterOrs.push(`full_name.ilike.%${term}%`, `email.ilike.%${term}%`, `phone.ilike.%${term}%`, `whatsapp.ilike.%${term}%`);
          query = query.or(filterOrs.join(','));
        }

        if (targetUnit) {
          query = query.eq('unit_id', targetUnit);
        }

        const { data, error } = await query.limit(15);
        if (error) return { error: error.message };

        const rawResults = ((data as any) || []).map((p: any) => {
          const unit = Array.isArray(p.units) ? p.units[0] : p.units;
          return {
            id: p.id,
            name: p.full_name,
            email: p.email,
            phone: p.phone || p.whatsapp || 'N/A',
            role: p.role,
            unitId: p.unit_id,
            unitName: unit?.name || 'Not specified',
          };
        });

        if (rawResults.length === 0 || !term) {
          return { users: rawResults };
        }

        console.log(`[Tool:searchUsers] Found ${rawResults.length} raw SQL results for term "${term}". Refining using semantic AI filter...`);

        // Secondary internal AI call to filter out false positives
        const refinementPrompt = `
You are a database search result refiner. A user searched for the term: "${term}".
The database returned the following raw matches:
${JSON.stringify(rawResults, null, 2)}

TASK:
Filter this list to include ONLY users whose name, email, or phone is a logical/meaningful match for the search term "${term}".
Remove false positives caused by accidental substring matches in emails or names (for example, searching for "Ali" should NOT return "Rohan Ghalib" just because "ghalib" contains the letters "ali").
Keep the matches that represent actual "Ali" or containing "Ali" as a name block or start of email, etc.
If there are direct name matches, prioritize them.

Return the filtered list of users as a raw JSON array of user objects in the exact same structure as the input, and nothing else. Do not add markdown formatting, backticks, or code blocks.
`;

        const refinementResult = await generateText({
          model: google('gemini-3.1-flash-lite'),
          prompt: refinementPrompt,
        });

        let refinedUsers = rawResults;
        try {
          const cleanedText = refinementResult.text
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();
          refinedUsers = JSON.parse(cleanedText);
          console.log(`[Tool:searchUsers] AI refined search results from ${rawResults.length} to ${refinedUsers.length}`);
        } catch (parseErr) {
          console.error('[Tool:searchUsers] Failed to parse AI refinement result, falling back to raw results:', parseErr);
        }

        return { users: refinedUsers };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),

  getUserHistory: tool({
    description: 'Fetch details, current coins balance, daily deed streak, and recent deed submissions of a user by their UUID.',
    inputSchema: z.object({
      userId: z.string().uuid().describe('The UUID of the user.'),
    }),
    execute: async (input: { userId: string }) => {
      try {
        const { data: profileData, error: profileErr } = await supabase
          .from('profiles')
          .select('*, units(name)')
          .eq('id', input.userId)
          .single();

        if (profileErr || !profileData) return { error: 'User not found.' };

        const profile = profileData as any;
        if (adminProfile.role === 'president' && profile.unit_id !== adminProfile.unit_id) {
          return { error: 'Permission denied: user belongs to another unit.' };
        }

        const { data: streak } = await supabase
          .from('streaks')
          .select('*')
          .eq('user_id', input.userId)
          .single();

        const { data: coinTransactions } = await supabase
          .from('coin_transactions')
          .select('amount')
          .eq('user_id', input.userId);

        const totalCoins = ((coinTransactions as any) || []).reduce((sum: number, tx: any) => sum + tx.amount, 0);

        const { data: deeds } = await supabase
          .from('deed_submissions')
          .select('id, description, status, coin_reward, bonus_coins, created_at')
          .eq('user_id', input.userId)
          .order('created_at', { ascending: false })
          .limit(5);

        const unit = Array.isArray(profile.units) ? profile.units[0] : profile.units;

        console.log(`[Tool:getUserHistory] Fetched history for ${profile.full_name}`);
        return {
          profile: {
            id: profile.id,
            name: profile.full_name,
            email: profile.email,
            phone: profile.phone || profile.whatsapp || 'N/A',
            role: profile.role,
            unitName: unit?.name || 'N/A',
          },
          streak: streak ? {
            currentStreak: (streak as any).current_streak,
            longestStreak: (streak as any).longest_streak,
            lastDeedDate: (streak as any).last_deed_date,
          } : { currentStreak: 0, longestStreak: 0, lastDeedDate: null },
          totalCoins,
          recentDeeds: deeds || [],
        };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),

  updateUserProfile: tool({
    description: 'Update the profile details of any user (e.g. name, father name, address, unit, role, email, phone). Scoped to unit for presidents.',
    inputSchema: z.object({
      userId: z.string().uuid().describe('The UUID of the user/profile to update.'),
      fullName: z.string().optional().describe('New full name of the user.'),
      email: z.string().optional().describe('New email address.'),
      fatherName: z.string().optional().describe('New father name.'),
      dob: z.string().optional().describe('New date of birth (YYYY-MM-DD).'),
      whatsapp: z.string().optional().describe('New WhatsApp number.'),
      phone: z.string().optional().describe('New phone number.'),
      city: z.string().optional().describe('New city.'),
      district: z.string().optional().describe('New district.'),
      division: z.string().optional().describe('New division.'),
      qualification: z.string().optional().describe('New qualification.'),
      address: z.string().optional().describe('New physical address.'),
      role: z.enum(['volunteer', 'admin', 'superadmin', 'president', 'tier-3']).optional().describe('New system role (Superadmin/admin only).'),
      unitId: z.string().uuid().optional().describe('New unit UUID for the user.'),
    }),
    execute: async (input: any) => {
      try {
        // 1. Fetch current profile to verify scoping
        const { data: currentProfile, error: fetchErr } = await supabase
          .from('profiles')
          .select('unit_id, role, full_name')
          .eq('id', input.userId)
          .single();

        if (fetchErr || !currentProfile) return { error: 'User profile not found.' };

        // Scope check for presidents
        if (adminProfile.role === 'president') {
          if (currentProfile.unit_id !== adminProfile.unit_id) {
            return { error: 'Permission denied: User belongs to another unit.' };
          }
          if (input.unitId && input.unitId !== adminProfile.unit_id) {
            return { error: 'Permission denied: Presidents cannot transfer users to other units.' };
          }
          if (input.role && input.role !== currentProfile.role) {
            return { error: 'Permission denied: Presidents cannot modify user roles.' };
          }
        }

        // Only superadmins and admins can change roles
        if (input.role && !['superadmin', 'admin'].includes(adminProfile.role)) {
          return { error: 'Permission denied: Only admins and superadmins can modify user roles.' };
        }

        // 2. Perform updates
        const updates: any = {};
        if (input.fullName !== undefined) updates.full_name = input.fullName;
        if (input.email !== undefined) updates.email = input.email;
        if (input.fatherName !== undefined) updates.father_name = input.fatherName;
        if (input.dob !== undefined) updates.dob = input.dob;
        if (input.whatsapp !== undefined) updates.whatsapp = input.whatsapp;
        if (input.phone !== undefined) updates.phone = input.phone;
        if (input.city !== undefined) updates.city = input.city;
        if (input.district !== undefined) updates.district = input.district;
        if (input.division !== undefined) updates.division = input.division;
        if (input.qualification !== undefined) updates.qualification = input.qualification;
        if (input.address !== undefined) updates.address = input.address;
        if (input.role !== undefined) updates.role = input.role;
        if (input.unitId !== undefined) updates.unit_id = input.unitId;

        const { data, error: updateErr } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', input.userId)
          .select()
          .single();

        if (updateErr) return { error: updateErr.message };
        console.log(`[Tool:updateUserProfile] Updated user ${input.userId} details:`, JSON.stringify(updates));
        return { success: true, user: data };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),

  // =========================================================================
  // 3. ADMIN PERMISSIONS & GRANULAR SECURITY
  // =========================================================================
  getAdminPermissions: tool({
    description: 'Fetch the granular permissions flag mappings for a tier-3 administrator.',
    inputSchema: z.object({
      adminId: z.string().uuid().describe('The UUID of the administrator.'),
    }),
    execute: async (input: { adminId: string }) => {
      try {
        const { data, error } = await supabase
          .from('admin_permissions')
          .select('*')
          .eq('admin_id', input.adminId)
          .maybeSingle();

        if (error) return { error: error.message };
        return { permissions: data || { admin_id: input.adminId, can_scan_tickets: false, can_approve_deeds: false, can_manage_events: false, can_manage_courses: false, can_manage_settings: false, can_manage_admins: false } };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),

  updateAdminPermissions: tool({
    description: 'Update the granular permission flags for a tier-3 administrator. Presidents and superadmins only.',
    inputSchema: z.object({
      adminId: z.string().uuid().describe('The UUID of the administrator.'),
      canScanTickets: z.boolean().optional().describe('Flag for event ticket QR scanning check-ins.'),
      canApproveDeeds: z.boolean().optional().describe('Flag for daily good deed submission reviews.'),
      canManageEvents: z.boolean().optional().describe('Flag for event creation, archival, and cancellation.'),
      canManageCourses: z.boolean().optional().describe('Flag for course syllabus and MCQ updates.'),
      canManageSettings: z.boolean().optional().describe('Flag for adjusting daily coin ratios/system settings.'),
      canManageAdmins: z.boolean().optional().describe('Flag to authorize sub-scanners.'),
    }),
    execute: async (input: any) => {
      try {
        if (!['superadmin', 'president'].includes(adminProfile.role)) {
          return { error: 'Permission denied: Only presidents and superadmins can update admin permissions.' };
        }

        const updates: any = {};
        if (input.canScanTickets !== undefined) updates.can_scan_tickets = input.canScanTickets;
        if (input.canApproveDeeds !== undefined) updates.can_approve_deeds = input.canApproveDeeds;
        if (input.canManageEvents !== undefined) updates.can_manage_events = input.canManageEvents;
        if (input.canManageCourses !== undefined) updates.can_manage_courses = input.canManageCourses;
        if (input.canManageSettings !== undefined) updates.can_manage_settings = input.canManageSettings;
        if (input.canManageAdmins !== undefined) updates.can_manage_admins = input.canManageAdmins;

        const { data, error } = await supabase
          .from('admin_permissions')
          .upsert({ admin_id: input.adminId, ...updates })
          .select()
          .single();

        if (error) return { error: error.message };
        console.log(`[Tool:updateAdminPermissions] Updated permissions for ${input.adminId}`);
        return { success: true, permissions: data };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),

  // =========================================================================
  // 4. EVENTS & ATTENDANCE SCANNER
  // =========================================================================
  getEvents: tool({
    description: 'Fetch the list of physical community events, optionally filtered by date or unit.',
    inputSchema: z.object({
      unitId: z.string().uuid().optional().describe('Optional UUID of the unit to filter events by.'),
      isArchived: z.boolean().default(false).describe('Whether to fetch archived events instead of active ones.'),
    }),
    execute: async (input: { unitId?: string; isArchived: boolean }) => {
      try {
        let query = supabase.from('events').select('*, units(name)').eq('is_archived', input.isArchived);

        let targetUnit = input.unitId;
        if (adminProfile.role === 'president') {
          targetUnit = adminProfile.unit_id;
        }

        if (targetUnit) {
          query = query.eq('unit_id', targetUnit);
        }

        const { data: events, error } = await query.order('date', { ascending: false }).limit(10);
        if (error) return { error: error.message };

        console.log(`[Tool:getEvents] Fetched ${events?.length || 0} events`);
        return { events };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),

  getEventRegistrations: tool({
    description: 'Fetch the registrations list for an event. Presidents can only view their unit events.',
    inputSchema: z.object({
      eventId: z.string().uuid().describe('The UUID of the event.'),
    }),
    execute: async (input: { eventId: string }) => {
      try {
        const { data: event, error: eventErr } = await supabase.from('events').select('unit_id').eq('id', input.eventId).single();
        if (eventErr || !event) return { error: 'Event not found.' };

        if (adminProfile.role === 'president' && event.unit_id !== adminProfile.unit_id) {
          return { error: 'Permission denied: Event belongs to another unit.' };
        }

        const { data: regs, error } = await supabase
          .from('event_registrations')
          .select('id, ticket_code, attended, status, leave_note, created_at, profiles:user_id(id, full_name, email, phone)')
          .eq('event_id', input.eventId);

        if (error) return { error: error.message };
        console.log(`[Tool:getEventRegistrations] Found ${regs?.length || 0} registrations`);
        return { registrations: regs };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),

  createEvent: tool({
    description: 'Create a new physical community service event.',
    inputSchema: z.object({
      title: z.string().describe('The title of the event.'),
      description: z.string().optional().describe('An optional description detailing the event.'),
      date: z.string().describe('The date of the event in YYYY-MM-DD format.'),
      startTime: z.string().default('09:00:00').describe('Start time in HH:MM:SS format.'),
      endTime: z.string().default('17:00:00').describe('End time in HH:MM:SS format.'),
      location: z.string().describe('The physical location or venue of the event.'),
      capacity: z.number().default(100).describe('Capacity threshold for registration.'),
      coinReward: z.number().default(50).describe('The number of coins awarded to volunteers who attend the event.'),
      isCompulsory: z.boolean().default(false).describe('Whether the event is mandatory.'),
    }),
    execute: async (input: any) => {
      try {
        let eventUnitId: string | null = null;
        if (adminProfile.role === 'president') {
          eventUnitId = adminProfile.unit_id || null;
          if (!eventUnitId) return { error: 'Active president is not assigned to a unit.' };
        }

        const { error } = await supabase
          .from('events')
          .insert({
            title: input.title,
            description: input.description || null,
            date: input.date,
            start_time: input.startTime,
            end_time: input.endTime,
            location: input.location,
            capacity: input.capacity,
            coin_reward: input.coinReward,
            unit_id: eventUnitId,
            is_compulsory: input.isCompulsory || false,
            excluded_unit_ids: [],
          });

        if (error) return { error: error.message };
        console.log(`[Tool:createEvent] Created event "${input.title}" on ${input.date}`);
        return { success: true, eventTitle: input.title };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),

  deleteEvent: tool({
    description: 'Delete a physical community service event by its UUID.',
    inputSchema: z.object({
      eventId: z.string().uuid().describe('The UUID of the event to delete.'),
    }),
    execute: async (input: { eventId: string }) => {
      try {
        const allowed = await hasAdminPermission(adminProfile.id, 'can_manage_events');
        if (!allowed) return { error: 'Permission denied.' };

        if (adminProfile.role === 'president') {
          const { data: event } = await supabase.from('events').select('unit_id').eq('id', input.eventId).single();
          if (!event || event.unit_id !== adminProfile.unit_id) {
            return { error: 'Permission denied: event belongs to another unit.' };
          }
        }

        const { error } = await supabase.from('events').delete().eq('id', input.eventId);
        if (error) return { error: error.message };
        console.log(`[Tool:deleteEvent] Deleted event ${input.eventId}`);
        return { success: true };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),

  archiveEvent: tool({
    description: 'Archive or unarchive an event by its UUID.',
    inputSchema: z.object({
      eventId: z.string().uuid().describe('The UUID of the event to archive or unarchive.'),
      isArchived: z.boolean().describe('Set to true to archive, false to unarchive.'),
    }),
    execute: async (input: { eventId: string; isArchived: boolean }) => {
      try {
        const allowed = await hasAdminPermission(adminProfile.id, 'can_manage_events');
        if (!allowed) return { error: 'Permission denied.' };

        if (adminProfile.role === 'president') {
          const { data: event } = await supabase.from('events').select('unit_id').eq('id', input.eventId).single();
          if (!event || event.unit_id !== adminProfile.unit_id) {
            return { error: 'Permission denied: event belongs to another unit.' };
          }
        }

        const { error } = await supabase.from('events').update({ is_archived: input.isArchived }).eq('id', input.eventId);
        if (error) return { error: error.message };
        console.log(`[Tool:archiveEvent] ${input.isArchived ? 'Archived' : 'Unarchived'} event ${input.eventId}`);
        return { success: true };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),

  checkInTicket: tool({
    description: 'Scan and check in a registration ticket code (e.g. TKT-EVENT-XXXX), marking the volunteer present and awarding the event coins.',
    inputSchema: z.object({
      ticketCode: z.string().min(1).describe('The unique ticket code shown in volunteer QR.'),
    }),
    execute: async (input: { ticketCode: string }) => {
      try {
        // Fetch registration and check president scoping
        const { data: reg, error: regErr } = await supabase
          .from('event_registrations')
          .select('*, events:event_id(unit_id, coin_reward)')
          .eq('ticket_code', input.ticketCode)
          .maybeSingle();

        if (regErr || !reg) return { error: 'Ticket code not found.' };
        if (reg.attended) return { error: 'This ticket has already been checked in.' };

        const event = Array.isArray(reg.events) ? reg.events[0] : reg.events;
        if (adminProfile.role === 'president' && event?.unit_id !== adminProfile.unit_id) {
          return { error: 'Permission denied: Ticket belongs to another unit.' };
        }

        // Mark attended
        const { error: updateErr } = await supabase
          .from('event_registrations')
          .update({
            attended: true,
            status: 'present',
            attended_at: new Date().toISOString(),
          })
          .eq('id', reg.id);

        if (updateErr) return { error: updateErr.message };

        // Award coins
        const coinAmount = event?.coin_reward || 50;
        await supabase.from('coin_transactions').insert({
          user_id: reg.user_id,
          amount: coinAmount,
          reason: `event_attendance:${reg.event_id}`,
          reference_id: reg.id,
          credited_by: adminProfile.id,
        });

        console.log(`[Tool:checkInTicket] Checked in ticket ${input.ticketCode}`);
        return { success: true, ticketCode: input.ticketCode, coinsAwarded: coinAmount };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),

  // =========================================================================
  // 5. DAILY DEEDS REVIEWS
  // =========================================================================
  getPendingDeeds: tool({
    description: 'Fetch the list of pending daily deed submissions for evaluation. For chapter presidents, this automatically filters and shows only the deeds submitted by volunteers in their own unit/chapter.',
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const query = supabase
          .from('deed_submissions')
          .select('id, description, proof_url, created_at, local_date, profiles:user_id(id, full_name, unit_id)')
          .eq('status', 'pending')
          .order('created_at', { ascending: true })
          .limit(10);

        const { data: deeds, error } = await query;
        if (error) return { error: error.message };

        // Filter by unit for presidents
        let filtered = deeds || [];
        if (adminProfile.role === 'president' && adminProfile.unit_id) {
          filtered = filtered.filter((d: any) => {
            const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
            return profile?.unit_id === adminProfile.unit_id;
          });
        }

        const phone = adminProfile.phone || adminProfile.whatsapp;
        console.log(`[Tool:getPendingDeeds] Found ${filtered.length} pending deeds`);

        if (filtered.length > 0) {
          const socket = (globalThis as any).whatsappSocket;
          const phoneJid = phone.includes('@') ? phone : `${phone.replace('+', '')}@s.whatsapp.net`;

          // Store the most recent deed ID in session context Map for context-aware approvals
          lastShownDeeds.set(phone, filtered[0].id);

          if (socket) {
            console.log(`[Tool:getPendingDeeds] Sending ${filtered.length} deed images/messages directly to ${phoneJid}...`);
            for (const d of filtered) {
              const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
              const imageUrl = getDeedImageUrl(d.proof_url);
              const caption = `📝 *Pending Deed Submission*\n\n` +
                `*Deed ID:* ${d.id}\n` +
                `*Volunteer:* ${profile?.full_name || 'N/A'}\n` +
                `*Description:* ${d.description}\n` +
                `*Date:* ${d.local_date}\n\n` +
                `Reply "approve" or "reject" to evaluate this deed.`;

              try {
                if (imageUrl) {
                  await socket.sendMessage(phoneJid, {
                    image: { url: imageUrl },
                    caption: caption
                  });
                } else {
                  await socket.sendMessage(phoneJid, { text: caption });
                }
                // Small sleep to ensure message order in chat
                await new Promise(resolve => setTimeout(resolve, 800));
              } catch (sendErr) {
                console.error(`Failed to send deed image/msg for ${d.id} to user:`, sendErr);
              }
            }
            return { deedsCount: filtered.length, deeds: filtered, status: `I have sent all ${filtered.length} pending deeds as individual image messages to you.` };
          }
        }

        return { deeds: [], status: "No pending deeds found." };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),

  getRecentDeeds: tool({
    description: 'Fetch recently evaluated or processed daily deed submissions (approved, rejected, flagged) to check history or correct mistakes. For presidents, scoped to their unit.',
    inputSchema: z.object({
      status: z.enum(['approved', 'rejected', 'flagged']).optional().describe('Optional status to filter by (approved, rejected, or flagged).'),
      userId: z.string().uuid().optional().describe('Optional user UUID to filter deeds for a specific volunteer.'),
    }),
    execute: async (input: { status?: 'approved' | 'rejected' | 'flagged'; userId?: string }) => {
      try {
        let query = supabase
          .from('deed_submissions')
          .select('id, description, proof_url, status, created_at, local_date, profiles:user_id(id, full_name, unit_id)');

        if (input.status) {
          query = query.eq('status', input.status);
        } else {
          // If no status is specified, look for all processed deeds (not pending)
          query = query.neq('status', 'pending');
        }

        if (input.userId) {
          query = query.eq('user_id', input.userId);
        }

        // Get most recent deeds first
        const { data: deeds, error } = await query.order('created_at', { ascending: false }).limit(5);
        if (error) return { error: error.message };

        // Filter by unit for presidents
        let filtered = deeds || [];
        if (adminProfile.role === 'president' && adminProfile.unit_id) {
          filtered = filtered.filter((d: any) => {
            const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
            return profile?.unit_id === adminProfile.unit_id;
          });
        }

        const phone = adminProfile.phone || adminProfile.whatsapp;
        console.log(`[Tool:getRecentDeeds] Found ${filtered.length} recent deeds`);

        if (filtered.length > 0) {
          const socket = (globalThis as any).whatsappSocket;
          const phoneJid = phone.includes('@') ? phone : `${phone.replace('+', '')}@s.whatsapp.net`;

          // Register most recent deed ID in session context Map for context-aware resets/approvals
          lastShownDeeds.set(phone, filtered[0].id);

          if (socket) {
            console.log(`[Tool:getRecentDeeds] Sending ${filtered.length} recent deeds directly to ${phoneJid}...`);
            for (const d of filtered) {
              const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
              const imageUrl = getDeedImageUrl(d.proof_url);
              const caption = `📝 *Processed Deed Submission*\n\n` +
                `*Deed ID:* ${d.id}\n` +
                `*Volunteer:* ${profile?.full_name || 'N/A'}\n` +
                `*Description:* ${d.description}\n` +
                `*Status:* ${d.status.toUpperCase()}\n` +
                `*Date:* ${d.local_date}\n\n` +
                `You can change the status of this deed (e.g. back to pending) using the updateDeedStatus command.`;

              try {
                if (imageUrl) {
                  await socket.sendMessage(phoneJid, {
                    image: { url: imageUrl },
                    caption: caption
                  });
                } else {
                  await socket.sendMessage(phoneJid, { text: caption });
                }
                await new Promise(resolve => setTimeout(resolve, 800));
              } catch (sendErr) {
                console.error(`Failed to send recent deed ${d.id} to user:`, sendErr);
              }
            }
            return { deedsCount: filtered.length, deeds: filtered, status: `I have sent the ${filtered.length} recently evaluated deeds as individual image messages to you.` };
          }
        }

        return { deeds: [], status: "No recently evaluated deeds matching the criteria were found." };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),


  approveDeed: tool({
    description: 'Approve a daily deed submission by ID, awarding base daily deed points and optional bonus points.',
    inputSchema: z.object({
      deedId: z.string().uuid().describe('The UUID of the deed submission to approve.'),
      bonusCoins: z.number().default(0).describe('Optional bonus coins to award for exceptional performance.'),
      adminNotes: z.string().optional().describe('Optional review notes or feedback for the volunteer.'),
    }),
    execute: async (input: { deedId: string; bonusCoins: number; adminNotes?: string }) => {
      try {
        const { data, error: fetchErr } = await supabase
          .from('deed_submissions')
          .select('*, profiles:user_id(unit_id)')
          .eq('id', input.deedId)
          .single();

        if (fetchErr || !data) return { error: 'Deed not found.' };
        if (data.status !== 'pending') return { error: `Deed is already "${data.status}".` };

        const deedProfile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
        if (adminProfile.role === 'president' && deedProfile?.unit_id !== adminProfile.unit_id) {
          return { error: 'Permission denied: deed belongs to another unit.' };
        }

        // Fetch base reward setting
        const { data: baseSetting } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'daily_deed_base_reward')
          .single();

        const baseReward = baseSetting ? parseInt(baseSetting.value, 10) : 10;

        const { error: updateErr } = await supabase
          .from('deed_submissions')
          .update({
            status: 'approved',
            admin_notes: input.adminNotes || null,
            coin_reward: baseReward,
            bonus_coins: input.bonusCoins || 0,
            verified_by: adminProfile.id,
            verified_at: new Date().toISOString(),
            status_updated_by: adminProfile.id,
          })
          .eq('id', input.deedId);

        if (updateErr) return { error: updateErr.message };
        console.log(`[Tool:approveDeed] Approved deed ${input.deedId} (base: ${baseReward}, bonus: ${input.bonusCoins})`);
        return { success: true, baseReward, bonusCoins: input.bonusCoins };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),

  rejectDeed: tool({
    description: 'Reject a daily deed submission by ID, with a required rejection reason.',
    inputSchema: z.object({
      deedId: z.string().uuid().describe('The UUID of the deed submission to reject.'),
      adminNotes: z.string().min(1).describe('The reason for rejection (required).'),
    }),
    execute: async (input: { deedId: string; adminNotes: string }) => {
      try {
        const { data, error: fetchErr } = await supabase
          .from('deed_submissions')
          .select('*, profiles:user_id(unit_id)')
          .eq('id', input.deedId)
          .single();

        if (fetchErr || !data) return { error: 'Deed not found.' };
        if (data.status !== 'pending') return { error: `Deed is already "${data.status}".` };

        const deedProfile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
        if (adminProfile.role === 'president' && deedProfile?.unit_id !== adminProfile.unit_id) {
          return { error: 'Permission denied: deed belongs to another unit.' };
        }

        const { error: updateErr } = await supabase
          .from('deed_submissions')
          .update({
            status: 'rejected',
            admin_notes: input.adminNotes,
            verified_by: adminProfile.id,
            verified_at: new Date().toISOString(),
            status_updated_by: adminProfile.id,
          })
          .eq('id', input.deedId);

        if (updateErr) return { error: updateErr.message };
        console.log(`[Tool:rejectDeed] Rejected deed ${input.deedId}`);
        return { success: true };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),

  updateDeedStatus: tool({
    description: 'Change the status of a daily deed submission to any status (pending, approved, rejected, flagged). Useful for correcting mistakes (e.g. changing an approved/rejected deed back to pending). Scoped to unit for presidents.',
    inputSchema: z.object({
      deedId: z.string().uuid().describe('The UUID of the deed submission.'),
      status: z.enum(['pending', 'approved', 'rejected', 'flagged']).describe('The target status to change the deed to.'),
      bonusCoins: z.number().default(0).describe('Optional bonus coins to award (only when changing to approved).'),
      adminNotes: z.string().optional().describe('Optional reviewer notes explaining the status change.'),
    }),
    execute: async (input: { deedId: string; status: 'pending' | 'approved' | 'rejected' | 'flagged'; bonusCoins: number; adminNotes?: string }) => {
      try {
        // 1. Fetch existing deed
        const { data: deed, error: fetchErr } = await supabase
          .from('deed_submissions')
          .select('*, profiles:user_id(unit_id)')
          .eq('id', input.deedId)
          .single();

        if (fetchErr || !deed) return { error: 'Deed not found.' };

        const deedProfile = Array.isArray(deed.profiles) ? deed.profiles[0] : deed.profiles;
        if (adminProfile.role === 'president' && deedProfile?.unit_id !== adminProfile.unit_id) {
          return { error: 'Permission denied: Deed belongs to another unit.' };
        }

        const wasApproved = deed.status === 'approved';
        const willBeApproved = input.status === 'approved';

        // 2. Update deed status
        const updates: any = {
          status: input.status,
          admin_notes: input.adminNotes || null,
          status_updated_by: adminProfile.id,
          verified_by: adminProfile.id,
          verified_at: new Date().toISOString(),
        };

        if (willBeApproved) {
          // Fetch base reward setting
          const { data: baseSetting } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'daily_deed_base_reward')
            .single();

          const baseReward = baseSetting ? parseInt(baseSetting.value, 10) : 10;
          updates.coin_reward = baseReward;
          updates.bonus_coins = input.bonusCoins || 0;
        }

        const { error: updateErr } = await supabase
          .from('deed_submissions')
          .update(updates)
          .eq('id', input.deedId);

        if (updateErr) return { error: updateErr.message };

        // 3. Handle coins adjustments
        if (wasApproved && !willBeApproved) {
          // Retrieve and revoke previous coins
          const totalPrev = (deed.coin_reward || 0) + (deed.bonus_coins || 0);
          if (totalPrev > 0) {
            await supabase.from('coin_transactions').insert({
              user_id: deed.user_id,
              amount: -totalPrev,
              reason: 'deed_approval_revoked',
              reference_id: deed.id,
              credited_by: adminProfile.id,
            });
            console.log(`[Tool:updateDeedStatus] Revoked ${totalPrev} coins for deed ${input.deedId}`);
          }
        }

        if (!wasApproved && willBeApproved) {
          // Award new coins
          const totalReward = (updates.coin_reward || 10) + (updates.bonus_coins || 0);
          await supabase.from('coin_transactions').insert({
            user_id: deed.user_id,
            amount: totalReward,
            reason: 'daily_deed',
            reference_id: deed.id,
            credited_by: adminProfile.id,
          });
          console.log(`[Tool:updateDeedStatus] Awarded ${totalReward} coins for deed ${input.deedId}`);
        }

        console.log(`[Tool:updateDeedStatus] Updated deed ${input.deedId} status to "${input.status}"`);
        return { success: true, newStatus: input.status };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),

  // =========================================================================
  // 6. SYSTEM SETTINGS
  // =========================================================================
  getSystemSettings: tool({
    description: 'Fetch system-wide settings, rewards values, configurations.',
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const { data, error } = await supabase.from('system_settings').select('*');
        if (error) return { error: error.message };
        return { settings: data };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),

  updateSystemSetting: tool({
    description: 'Update the value of a system configuration key. Superadmins and presidents only.',
    inputSchema: z.object({
      key: z.string().min(1).describe('The system setting key to update (e.g. daily_deed_reward).'),
      value: z.string().min(1).describe('The new string value to configure.'),
    }),
    execute: async (input: { key: string; value: string }) => {
      try {
        if (!['superadmin', 'president'].includes(adminProfile.role)) {
          return { error: 'Permission denied: Only presidents and superadmins can modify system settings.' };
        }

        const { data, error } = await supabase
          .from('system_settings')
          .update({ value: input.value, updated_at: new Date().toISOString() })
          .eq('key', input.key)
          .select()
          .single();

        if (error) return { error: error.message };
        console.log(`[Tool:updateSystemSetting] Updated setting "${input.key}" to "${input.value}"`);
        return { success: true, setting: data };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),

  // =========================================================================
  // 7. LMS / COURSES
  // =========================================================================
  getCourses: tool({
    description: 'Fetch the list of courses in the system.',
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
        if (error) return { error: error.message };
        return { courses: data };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),

  getCourseProgress: tool({
    description: 'View the completed lessons progress list for a user.',
    inputSchema: z.object({
      userId: z.string().uuid().describe('The UUID of the user.'),
    }),
    execute: async (input: { userId: string }) => {
      try {
        // Scoping
        if (adminProfile.role === 'president') {
          const { data: p } = await supabase.from('profiles').select('unit_id').eq('id', input.userId).single();
          if (!p || p.unit_id !== adminProfile.unit_id) {
            return { error: 'Permission denied: User belongs to another unit.' };
          }
        }

        const { data, error } = await supabase
          .from('user_progress')
          .select('*, courses(title), lessons(title)')
          .eq('user_id', input.userId);

        if (error) return { error: error.message };
        return { progress: data };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),

  getUserQuizAttempts: tool({
    description: 'View failed quiz attempts for a user by their user UUID.',
    inputSchema: z.object({
      userId: z.string().uuid().describe('The UUID of the user.'),
    }),
    execute: async (input: { userId: string }) => {
      try {
        if (adminProfile.role === 'president') {
          const { data: p } = await supabase.from('profiles').select('unit_id').eq('id', input.userId).single();
          if (!p || p.unit_id !== adminProfile.unit_id) {
            return { error: 'Permission denied: User belongs to another unit.' };
          }
        }

        const { data, error } = await supabase
          .from('quiz_attempts')
          .select('*, lessons(title)')
          .eq('user_id', input.userId);

        if (error) return { error: error.message };
        return { attempts: data };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),

  // =========================================================================
  // 8. ANNOUNCEMENTS
  // =========================================================================
  getAnnouncements: tool({
    description: 'Fetch announcements list. Scoped by president unit if applicable.',
    inputSchema: z.object({}),
    execute: async () => {
      try {
        let query = supabase.from('announcements').select('*, units(name)');
        if (adminProfile.role === 'president' && adminProfile.unit_id) {
          query = query.eq('unit_id', adminProfile.unit_id);
        }

        const { data, error } = await query.order('created_at', { ascending: false }).limit(10);
        if (error) return { error: error.message };
        return { announcements: data };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),

  createAnnouncement: tool({
    description: 'Publish a new announcement. Scopes to the president unit automatically.',
    inputSchema: z.object({
      title: z.string().min(1).describe('The title of the announcement.'),
      content: z.string().min(1).describe('The text content of the announcement.'),
      isPinned: z.boolean().default(false).describe('Whether to pin the announcement.'),
    }),
    execute: async (input: { title: string; content: string; isPinned: boolean }) => {
      try {
        let announcementUnitId: string | null = null;
        if (adminProfile.role === 'president') {
          announcementUnitId = adminProfile.unit_id || null;
          if (!announcementUnitId) return { error: 'President unit is not set.' };
        }

        const { data, error } = await supabase
          .from('announcements')
          .insert({
            title: input.title,
            content: input.content,
            is_pinned: input.isPinned,
            unit_id: announcementUnitId,
            created_by: adminProfile.id,
          })
          .select()
          .single();

        if (error) return { error: error.message };
        console.log(`[Tool:createAnnouncement] Created announcement "${input.title}"`);
        return { success: true, announcement: data };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),

  deleteAnnouncement: tool({
    description: 'Delete an announcement by UUID.',
    inputSchema: z.object({
      announcementId: z.string().uuid().describe('The UUID of the announcement to delete.'),
    }),
    execute: async (input: { announcementId: string }) => {
      try {
        if (adminProfile.role === 'president') {
          const { data: ann } = await supabase.from('announcements').select('unit_id').eq('id', input.announcementId).single();
          if (!ann || ann.unit_id !== adminProfile.unit_id) {
            return { error: 'Permission denied: Announcement belongs to another unit.' };
          }
        }

        const { error } = await supabase.from('announcements').delete().eq('id', input.announcementId);
        if (error) return { error: error.message };
        console.log(`[Tool:deleteAnnouncement] Deleted announcement ${input.announcementId}`);
        return { success: true };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),

  // =========================================================================
  // 9. REWARDS SHOP & REDEMPTIONS
  // =========================================================================
  getRewards: tool({
    description: 'Fetch the rewards item catalog.',
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const { data, error } = await supabase.from('rewards').select('*').order('created_at', { ascending: false });
        if (error) return { error: error.message };
        return { rewards: data };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),

  createReward: tool({
    description: 'Create a new reward item in the shop catalog. Admins and superadmins only.',
    inputSchema: z.object({
      title: z.string().min(1).describe('The name of the reward item.'),
      description: z.string().optional().describe('Optional catalog description.'),
      coinCost: z.number().int().positive().describe('The cost in YDC Coins to redeem.'),
      quantityAvailable: z.number().int().positive().optional().describe('Optional maximum stock quantity available.'),
    }),
    execute: async (input: any) => {
      try {
        if (!['superadmin', 'admin'].includes(adminProfile.role)) {
          return { error: 'Permission denied: Only admins and superadmins can create rewards.' };
        }

        const { data, error } = await supabase
          .from('rewards')
          .insert({
            title: input.title,
            description: input.description || null,
            coin_cost: input.coinCost,
            quantity_available: input.quantityAvailable || null,
          })
          .select()
          .single();

        if (error) return { error: error.message };
        console.log(`[Tool:createReward] Created reward "${input.title}"`);
        return { success: true, reward: data };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),

  getRedemptions: tool({
    description: 'Fetch reward redemptions log, optionally filtered by status.',
    inputSchema: z.object({
      status: z.enum(['pending', 'fulfilled', 'cancelled', 'rejected']).optional().describe('Filter by redemption status.'),
    }),
    execute: async (input: { status?: 'pending' | 'fulfilled' | 'cancelled' | 'rejected' }) => {
      try {
        let query = supabase
          .from('reward_redemptions')
          .select('*, profiles:user_id(id, full_name, unit_id), rewards(title)');

        if (input.status) {
          query = query.eq('status', input.status);
        }

        const { data: redemptions, error } = await query.order('redeemed_at', { ascending: false });
        if (error) return { error: error.message };

        // Scope to unit for presidents
        let filtered = redemptions || [];
        if (adminProfile.role === 'president' && adminProfile.unit_id) {
          filtered = filtered.filter((r: any) => {
            const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
            return profile?.unit_id === adminProfile.unit_id;
          });
        }

        console.log(`[Tool:getRedemptions] Found ${filtered.length} redemptions`);
        return { redemptions: filtered };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),

  updateRedemptionStatus: tool({
    description: 'Fulfill, reject, or cancel a reward redemption by redemption UUID.',
    inputSchema: z.object({
      redemptionId: z.string().uuid().describe('The UUID of the redemption to process.'),
      status: z.enum(['fulfilled', 'cancelled', 'rejected']).describe('The new status of the redemption.'),
    }),
    execute: async (input: { redemptionId: string; status: 'fulfilled' | 'cancelled' | 'rejected' }) => {
      try {
        const { data: reg, error: fetchErr } = await supabase
          .from('reward_redemptions')
          .select('*, profiles:user_id(unit_id)')
          .eq('id', input.redemptionId)
          .single();

        if (fetchErr || !reg) return { error: 'Redemption not found.' };

        const regProfile = Array.isArray(reg.profiles) ? reg.profiles[0] : reg.profiles;
        if (adminProfile.role === 'president' && regProfile?.unit_id !== adminProfile.unit_id) {
          return { error: 'Permission denied: Redemption belongs to another unit.' };
        }

        const { error: updateErr } = await supabase
          .from('reward_redemptions')
          .update({
            status: input.status,
            processed_by: adminProfile.id,
          })
          .eq('id', input.redemptionId);

        if (updateErr) return { error: updateErr.message };

        // If cancelled or rejected, refund the user coins
        if (['cancelled', 'rejected'].includes(input.status)) {
          await supabase.from('coin_transactions').insert({
            user_id: reg.user_id,
            amount: reg.coin_cost,
            reason: `reward_refund:${reg.id}`,
            reference_id: reg.id,
            credited_by: adminProfile.id,
          });
          console.log(`[Tool:updateRedemptionStatus] Refunded ${reg.coin_cost} coins for cancelled redemption ${input.redemptionId}`);
        }

        console.log(`[Tool:updateRedemptionStatus] Updated redemption ${input.redemptionId} status to "${input.status}"`);
        return { success: true };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),

  // =========================================================================
  // 10. COIN TRANSACTION LEDGER
  // =========================================================================
  getCoinTransactions: tool({
    description: 'Fetch the coin transactions history ledger for a user or recent system-wide transactions.',
    inputSchema: z.object({
      userId: z.string().uuid().optional().describe('Optional UUID of the user to view history for.'),
    }),
    execute: async (input: { userId?: string }) => {
      try {
        let query = supabase
          .from('coin_transactions')
          .select('*, profiles:user_id(id, full_name, unit_id)');

        if (input.userId) {
          query = query.eq('user_id', input.userId);
        }

        const { data: txs, error } = await query.order('created_at', { ascending: false }).limit(20);
        if (error) return { error: error.message };

        // Scope to unit for presidents
        let filtered = txs || [];
        if (adminProfile.role === 'president' && adminProfile.unit_id) {
          filtered = filtered.filter((tx: any) => {
            const profile = Array.isArray(tx.profiles) ? tx.profiles[0] : tx.profiles;
            return profile?.unit_id === adminProfile.unit_id;
          });
        }

        console.log(`[Tool:getCoinTransactions] Fetched ${filtered.length} transaction entries`);
        return { transactions: filtered };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),

  // =========================================================================
  // 11. GENERAL USER ACTION HELPERS
  // =========================================================================
  adjustUserCoins: tool({
    description: 'Manually add (positive amount) or deduct (negative amount) coins for a user.',
    inputSchema: z.object({
      userId: z.string().uuid().describe('The UUID of the user.'),
      amount: z.number().describe('The number of coins to add (e.g. 50) or deduct (e.g. -20).'),
      reason: z.string().min(1).describe('The reasoning for manual coin adjustment.'),
    }),
    execute: async (input: { userId: string; amount: number; reason: string }) => {
      try {
        // Verify the target user exists and is in scope
        const { data: targetProfile, error: profileErr } = await supabase
          .from('profiles')
          .select('unit_id, full_name')
          .eq('id', input.userId)
          .single();

        if (profileErr || !targetProfile) return { error: 'User not found.' };

        if (adminProfile.role === 'president' && (targetProfile as any).unit_id !== adminProfile.unit_id) {
          return { error: 'Permission denied: user belongs to another unit.' };
        }

        const { error: txErr } = await supabase
          .from('coin_transactions')
          .insert({
            user_id: input.userId,
            amount: input.amount,
            reason: `manual_adjustment: ${input.reason}`,
            credited_by: adminProfile.id,
          });

        if (txErr) return { error: txErr.message };
        console.log(`[Tool:adjustUserCoins] ${input.amount > 0 ? 'Added' : 'Deducted'} ${input.amount} coins for ${(targetProfile as any).full_name}`);
        return { success: true, userName: (targetProfile as any).full_name, amount: input.amount, reason: input.reason };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),

  // =========================================================================
  // 12. SYSTEM ASSETS & USER MEDIA
  // =========================================================================
  sendProfilePicture: tool({
    description: "Fetch a user's profile picture and send it directly to the administrator on WhatsApp. Scoped to unit for presidents.",
    inputSchema: z.object({
      userId: z.string().uuid().describe('The UUID of the user.'),
    }),
    execute: async (input: { userId: string }) => {
      try {
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, unit_id')
          .eq('id', input.userId)
          .single();

        if (profileErr || !profile) return { error: 'User not found.' };

        if (adminProfile.role === 'president' && profile.unit_id !== adminProfile.unit_id) {
          return { error: 'Permission denied: User belongs to another unit.' };
        }

        if (!profile.avatar_url) {
          return { error: `User ${profile.full_name} does not have a profile picture set.` };
        }

        const imageUrl = getAvatarImageUrl(profile.avatar_url);
        const socket = (globalThis as any).whatsappSocket;
        const phone = adminProfile.phone || adminProfile.whatsapp;
        const phoneJid = phone.includes('@') ? phone : `${phone.replace('+', '')}@s.whatsapp.net`;

        if (socket && imageUrl) {
          console.log(`[Tool:sendProfilePicture] Sending avatar for ${profile.full_name} directly to ${phoneJid}...`);
          await socket.sendMessage(phoneJid, {
            image: { url: imageUrl },
            caption: `📷 *Profile Picture of ${profile.full_name}*`
          });
          return { success: true, status: `I have sent the profile picture of ${profile.full_name} to you.` };
        }

        return { error: 'Failed to send image (socket or URL missing).' };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),

  sendSystemAsset: tool({
    description: 'Fetch and send system visual assets (like the YDC logo or app icon) directly to the administrator on WhatsApp.',
    inputSchema: z.object({
      assetType: z.enum(['logo', 'icon', 'icontransparent']).describe('The asset type: "logo" (ydc color logo), "icon" (app icon), or "icontransparent" (transparent icon).'),
    }),
    execute: async (input: { assetType: 'logo' | 'icon' | 'icontransparent' }) => {
      try {
        let filePath = 'public/logocolor.png';
        let caption = '🟢 *Youth Development Chapter (YDC) Color Logo*';
        if (input.assetType === 'icon') {
          filePath = 'public/icon.png';
          caption = '📱 *Youth Development Chapter (YDC) App Icon*';
        } else if (input.assetType === 'icontransparent') {
          filePath = 'public/icontransparent.png';
          caption = '✨ *Youth Development Chapter (YDC) Transparent Icon*';
        }

        if (!fs.existsSync(filePath)) {
          return { error: `Asset file not found at path: ${filePath}` };
        }

        const socket = (globalThis as any).whatsappSocket;
        const phone = adminProfile.phone || adminProfile.whatsapp;
        const phoneJid = phone.includes('@') ? phone : `${phone.replace('+', '')}@s.whatsapp.net`;

        if (socket) {
          console.log(`[Tool:sendSystemAsset] Sending local file ${filePath} directly to ${phoneJid}...`);
          const buffer = fs.readFileSync(filePath);
          await socket.sendMessage(phoneJid, {
            image: buffer,
            caption: caption
          });
          return { success: true, status: `I have sent the YDC ${input.assetType} directly to you.` };
        }

        return { error: 'Failed to send asset (socket missing).' };
      } catch (err: any) {
        return { error: err.message };
      }
    },
  }),
});
