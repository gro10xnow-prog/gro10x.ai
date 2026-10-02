-- ============================================================================
-- Migration: 20261003_v7.2_retainer_burn_rpc.sql
-- Description: Atomic Retainer Hours Burndown RPC with row-level pessimistic locking
-- Safe: Uses CREATE OR REPLACE FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.burn_retainer_hours(
  p_project_id TEXT,
  p_hours NUMERIC,
  p_task_description TEXT,
  p_category TEXT DEFAULT 'ai_development',
  p_deliverable_id TEXT DEFAULT NULL,
  p_logged_by TEXT DEFAULT 'Delivery Pod Engineer',
  p_notes TEXT DEFAULT ''
) RETURNS JSONB AS $$
DECLARE
  v_bank public.retainer_banks%ROWTYPE;
  v_log_id TEXT;
  v_new_used NUMERIC;
  v_total_avail NUMERIC;
  v_status VARCHAR(50);
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- 1. Acquire pessimistic row-level lock on the target retainer bank
  SELECT * INTO v_bank
  FROM public.retainer_banks
  WHERE project_id = p_project_id
  FOR UPDATE;

  -- If bank does not exist yet in DB, create it with default 40 hours
  IF NOT FOUND THEN
    INSERT INTO public.retainer_banks (
      project_id, total_purchased_hours, rollover_hours, hourly_rate_usd,
      billing_cycle_start, billing_cycle_end, status, created_at, updated_at
    ) VALUES (
      p_project_id, 40, 0, 45,
      v_now, v_now + INTERVAL '30 days', 'healthy', v_now, v_now
    )
    RETURNING * INTO v_bank;
  END IF;

  -- 2. Calculate new hours consumption
  v_total_avail := COALESCE(v_bank.total_purchased_hours, 40) + COALESCE(v_bank.rollover_hours, 0);

  SELECT COALESCE(SUM(hours), 0) + p_hours INTO v_new_used
  FROM public.retainer_hours_logs
  WHERE project_id = p_project_id;

  -- 3. Determine capacity status
  IF v_new_used > v_total_avail THEN
    v_status := 'critical_overage';
  ELSIF v_total_avail > 0 AND (v_new_used / v_total_avail) >= 0.85 THEN
    v_status := 'critical_capacity';
  ELSIF v_total_avail > 0 AND (v_new_used / v_total_avail) >= 0.75 THEN
    v_status := 'nearing_capacity';
  ELSE
    v_status := 'healthy';
  END IF;

  -- 4. Generate unique log ID and insert the immutable hours log entry
  v_log_id := 'LOG-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));

  INSERT INTO public.retainer_hours_logs (
    id, project_id, hours, task_description, category, deliverable_id, logged_by, logged_at, notes
  ) VALUES (
    v_log_id, p_project_id, p_hours, p_task_description, p_category, p_deliverable_id, p_logged_by, v_now, p_notes
  );

  -- 5. Update bank status and timestamp atomically under the lock
  UPDATE public.retainer_banks
  SET status = v_status,
      updated_at = v_now
  WHERE project_id = p_project_id;

  RETURN jsonb_build_object(
    'success', true,
    'logId', v_log_id,
    'hoursBurned', p_hours,
    'totalUsed', v_new_used,
    'totalAvailable', v_total_avail,
    'remainingHours', GREATEST(0, v_total_avail - v_new_used),
    'status', v_status,
    'loggedAt', v_now
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
