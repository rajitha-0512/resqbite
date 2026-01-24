-- Drop the overly permissive notifications INSERT policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Create a more restrictive policy - only authenticated users can receive notifications
-- Notifications will be inserted by edge functions using service role, or users can insert their own
CREATE POLICY "Users can insert own notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);