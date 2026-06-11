-- Fix flag double-deduction.
-- Previously handle_deed_coins() inserted a hardcoded -10 ('deed_flagged') on flag,
-- while app code (flagDeedSubmission / overrideDeedDecision) also inserted the admin-chosen
-- deduction ('flagged_deed'). Flagging therefore deducted coins twice.
-- The trigger now only awards coins on approval; flag deductions are owned by app code.
CREATE OR REPLACE FUNCTION public.handle_deed_coins()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        INSERT INTO public.coin_transactions (user_id, amount, reason, reference_id, processed_by)
        VALUES (NEW.user_id, NEW.coin_reward + NEW.bonus_coins, 'daily_deed', NEW.id, NEW.status_updated_by);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
