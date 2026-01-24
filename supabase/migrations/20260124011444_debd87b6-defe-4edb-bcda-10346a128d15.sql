-- Explicitly deny public (unauthenticated) access to all sensitive tables
-- This prevents any data exposure to anonymous users

-- PROFILES TABLE - contains PII (email, phone, address)
CREATE POLICY "Deny anon select on profiles" ON public.profiles
    FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon insert on profiles" ON public.profiles
    FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Deny anon update on profiles" ON public.profiles
    FOR UPDATE TO anon USING (false);
CREATE POLICY "Deny anon delete on profiles" ON public.profiles
    FOR DELETE TO anon USING (false);

-- RESTAURANTS TABLE - contains business info
CREATE POLICY "Deny anon select on restaurants" ON public.restaurants
    FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon insert on restaurants" ON public.restaurants
    FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Deny anon update on restaurants" ON public.restaurants
    FOR UPDATE TO anon USING (false);
CREATE POLICY "Deny anon delete on restaurants" ON public.restaurants
    FOR DELETE TO anon USING (false);

-- ORGANIZATIONS TABLE - contains organization data
CREATE POLICY "Deny anon select on organizations" ON public.organizations
    FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon insert on organizations" ON public.organizations
    FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Deny anon update on organizations" ON public.organizations
    FOR UPDATE TO anon USING (false);
CREATE POLICY "Deny anon delete on organizations" ON public.organizations
    FOR DELETE TO anon USING (false);

-- VOLUNTEERS TABLE - contains volunteer data
CREATE POLICY "Deny anon select on volunteers" ON public.volunteers
    FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon insert on volunteers" ON public.volunteers
    FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Deny anon update on volunteers" ON public.volunteers
    FOR UPDATE TO anon USING (false);
CREATE POLICY "Deny anon delete on volunteers" ON public.volunteers
    FOR DELETE TO anon USING (false);

-- USER_ROLES TABLE - contains role assignments
CREATE POLICY "Deny anon select on user_roles" ON public.user_roles
    FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon insert on user_roles" ON public.user_roles
    FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Deny anon update on user_roles" ON public.user_roles
    FOR UPDATE TO anon USING (false);
CREATE POLICY "Deny anon delete on user_roles" ON public.user_roles
    FOR DELETE TO anon USING (false);

-- FOOD_ITEMS TABLE - contains food donation data
CREATE POLICY "Deny anon select on food_items" ON public.food_items
    FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon insert on food_items" ON public.food_items
    FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Deny anon update on food_items" ON public.food_items
    FOR UPDATE TO anon USING (false);
CREATE POLICY "Deny anon delete on food_items" ON public.food_items
    FOR DELETE TO anon USING (false);

-- DELIVERIES TABLE - contains delivery data
CREATE POLICY "Deny anon select on deliveries" ON public.deliveries
    FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon insert on deliveries" ON public.deliveries
    FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Deny anon update on deliveries" ON public.deliveries
    FOR UPDATE TO anon USING (false);
CREATE POLICY "Deny anon delete on deliveries" ON public.deliveries
    FOR DELETE TO anon USING (false);

-- FOOD_REQUESTS TABLE - contains request data
CREATE POLICY "Deny anon select on food_requests" ON public.food_requests
    FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon insert on food_requests" ON public.food_requests
    FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Deny anon update on food_requests" ON public.food_requests
    FOR UPDATE TO anon USING (false);
CREATE POLICY "Deny anon delete on food_requests" ON public.food_requests
    FOR DELETE TO anon USING (false);

-- NOTIFICATIONS TABLE - contains user notifications
CREATE POLICY "Deny anon select on notifications" ON public.notifications
    FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anon insert on notifications" ON public.notifications
    FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Deny anon update on notifications" ON public.notifications
    FOR UPDATE TO anon USING (false);
CREATE POLICY "Deny anon delete on notifications" ON public.notifications
    FOR DELETE TO anon USING (false);