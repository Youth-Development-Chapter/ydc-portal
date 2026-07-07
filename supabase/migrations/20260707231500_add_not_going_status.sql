-- Drop old check constraint if it exists
ALTER TABLE public.event_registrations DROP CONSTRAINT IF EXISTS event_registrations_status_check;

-- Add updated check constraint with 'not_going'
ALTER TABLE public.event_registrations ADD CONSTRAINT event_registrations_status_check 
  CHECK (status IN ('registered', 'present', 'absent', 'leave_pending', 'leave_approved', 'leave_rejected', 'not_going'));
