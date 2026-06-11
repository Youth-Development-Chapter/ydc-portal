-- Enforce event capacity at the database level.
-- events.capacity existed and was displayed but never checked, so every registration path
-- (claimTicket, api/events/ticket/claim, api/events/ticket/check-in, api/events/leave) could
-- overbook indefinitely. A BEFORE INSERT trigger covers all paths atomically with no
-- per-route TOCTOU race. Staff (admin/superadmin/president/tier-3) may override a full event
-- (e.g. a walk-in check-in); volunteers are blocked when the event is full.
CREATE OR REPLACE FUNCTION public.enforce_event_capacity()
RETURNS TRIGGER AS $$
DECLARE
    event_capacity INTEGER;
    current_count INTEGER;
    is_staff BOOLEAN;
BEGIN
    SELECT capacity INTO event_capacity
    FROM public.events
    WHERE id = NEW.event_id;

    -- No capacity configured (null) means unlimited.
    IF event_capacity IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('admin', 'superadmin', 'president', 'tier-3')
    ) INTO is_staff;

    IF is_staff THEN
        RETURN NEW;
    END IF;

    SELECT COUNT(*) INTO current_count
    FROM public.event_registrations
    WHERE event_id = NEW.event_id;

    IF current_count >= event_capacity THEN
        RAISE EXCEPTION 'EVENT_FULL' USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_registration_enforce_capacity ON public.event_registrations;
CREATE TRIGGER on_registration_enforce_capacity
    BEFORE INSERT ON public.event_registrations
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_event_capacity();
