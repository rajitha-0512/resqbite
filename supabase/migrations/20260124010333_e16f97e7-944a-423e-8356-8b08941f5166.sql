-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('restaurant', 'organization', 'volunteer');

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- Create restaurants table
CREATE TABLE public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    name TEXT NOT NULL,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create organizations table
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    name TEXT NOT NULL,
    org_type TEXT NOT NULL DEFAULT 'shelter',
    address TEXT,
    document_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create volunteers table
CREATE TABLE public.volunteers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    name TEXT NOT NULL,
    vehicle_type TEXT,
    is_available BOOLEAN NOT NULL DEFAULT true,
    earnings NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create food_items table
CREATE TABLE public.food_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    quantity TEXT NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
    quality_rating TEXT,
    expire_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create deliveries table
CREATE TABLE public.deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    food_item_id UUID REFERENCES public.food_items(id) ON DELETE SET NULL,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    volunteer_id UUID REFERENCES public.volunteers(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    pickup_time TIMESTAMP WITH TIME ZONE,
    delivery_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create food_requests table
CREATE TABLE public.food_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    food_type TEXT NOT NULL,
    quantity TEXT NOT NULL,
    urgency TEXT NOT NULL DEFAULT 'normal',
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role = _role
    )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role
    FROM public.user_roles
    WHERE user_id = _user_id
    LIMIT 1
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles policies (only insert own role, no direct updates)
CREATE POLICY "Users can view own role" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own role on signup" ON public.user_roles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Restaurants policies
CREATE POLICY "Restaurants can view own record" ON public.restaurants
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Restaurants can insert own record" ON public.restaurants
    FOR INSERT WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'restaurant'));

CREATE POLICY "Restaurants can update own record" ON public.restaurants
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Organizations and volunteers can view restaurants" ON public.restaurants
    FOR SELECT USING (
        public.has_role(auth.uid(), 'organization') OR 
        public.has_role(auth.uid(), 'volunteer')
    );

-- Organizations policies
CREATE POLICY "Organizations can view own record" ON public.organizations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Organizations can insert own record" ON public.organizations
    FOR INSERT WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'organization'));

CREATE POLICY "Organizations can update own record" ON public.organizations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Restaurants and volunteers can view organizations" ON public.organizations
    FOR SELECT USING (
        public.has_role(auth.uid(), 'restaurant') OR 
        public.has_role(auth.uid(), 'volunteer')
    );

-- Volunteers policies
CREATE POLICY "Volunteers can view own record" ON public.volunteers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Volunteers can insert own record" ON public.volunteers
    FOR INSERT WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'volunteer'));

CREATE POLICY "Volunteers can update own record" ON public.volunteers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Restaurants and organizations can view available volunteers" ON public.volunteers
    FOR SELECT USING (
        is_available = true AND (
            public.has_role(auth.uid(), 'restaurant') OR 
            public.has_role(auth.uid(), 'organization')
        )
    );

-- Food items policies
CREATE POLICY "Restaurants can manage own food items" ON public.food_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurants 
            WHERE id = food_items.restaurant_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Organizations can view available food items" ON public.food_items
    FOR SELECT USING (
        status = 'available' AND public.has_role(auth.uid(), 'organization')
    );

CREATE POLICY "Volunteers can view food items in their deliveries" ON public.food_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.deliveries d
            JOIN public.volunteers v ON d.volunteer_id = v.id
            WHERE d.food_item_id = food_items.id AND v.user_id = auth.uid()
        )
    );

-- Deliveries policies
CREATE POLICY "Restaurants can view and manage own deliveries" ON public.deliveries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurants 
            WHERE id = deliveries.restaurant_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Organizations can view own deliveries" ON public.deliveries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organizations 
            WHERE id = deliveries.organization_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Volunteers can view and update assigned deliveries" ON public.deliveries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.volunteers 
            WHERE id = deliveries.volunteer_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Volunteers can update assigned deliveries" ON public.deliveries
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.volunteers 
            WHERE id = deliveries.volunteer_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Volunteers can claim pending deliveries" ON public.deliveries
    FOR UPDATE USING (
        status = 'pending' AND volunteer_id IS NULL AND public.has_role(auth.uid(), 'volunteer')
    );

-- Food requests policies
CREATE POLICY "Organizations can manage own requests" ON public.food_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.organizations 
            WHERE id = food_requests.organization_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Restaurants can view active requests" ON public.food_requests
    FOR SELECT USING (
        status = 'active' AND public.has_role(auth.uid(), 'restaurant')
    );

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply trigger to profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();