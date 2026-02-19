import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
// @ts-ignore - DeliveryTracker uses legacy Delivery type, we pass DeliveryRecord
import {
  Plus, Package, Truck, MapPin, Clock, ChevronRight,
  LogOut, CheckCircle, Users, DollarSign, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { FoodUpload } from "./FoodUpload";
import { OrganizationMatcher } from "./OrganizationMatcher";
import { DeliveryTracker } from "../shared/DeliveryTracker";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FoodItemRecord {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string | null;
  quantity: string;
  category: string;
  image_url?: string | null;
  quality_score?: number | null;
  quality_rating?: string | null;
  expire_at: string;
  status: string;
  created_at: string;
}

export interface DeliveryRecord {
  id: string;
  food_item_id: string | null;
  restaurant_id: string;
  organization_id: string;
  volunteer_id: string | null;
  status: string;
  pickup_time: string | null;
  delivery_time: string | null;
  notes: string | null;
  created_at: string;
  food_item?: { name: string } | null;
  organization?: { name: string } | null;
  restaurant?: { name: string } | null;
  volunteer?: { name: string } | null;
}

interface RestaurantDashboardProps {
  onLogout: () => void;
}

type View = "dashboard" | "upload" | "match" | "tracking";

export const RestaurantDashboard = ({ onLogout }: RestaurantDashboardProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Inline restaurant data fetching
  const { data: restaurant } = useQuery({
    queryKey: ["restaurant", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurants").select("*").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: foodItems = [], isLoading: foodItemsLoading } = useQuery({
    queryKey: ["food_items", restaurant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("food_items").select("*").eq("restaurant_id", restaurant!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as FoodItemRecord[];
    },
    enabled: !!restaurant?.id,
  });

  const updateFoodItem = useMutation({
    mutationFn: async (params: { id: string; status?: string }) => {
      const { id, ...updates } = params;
      const { data, error } = await supabase
        .from("food_items").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["food_items"] }); },
  });

  // Inline delivery data fetching
  const { data: deliveries = [], isLoading: deliveriesLoading } = useQuery({
    queryKey: ["deliveries", "restaurant", user?.id],
    queryFn: async () => {
      if (!restaurant?.id) return [];
      const { data, error } = await supabase
        .from("deliveries")
        .select("*, food_item:food_items(name), organization:organizations(name), restaurant:restaurants(name), volunteer:volunteers(name)")
        .eq("restaurant_id", restaurant.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DeliveryRecord[];
    },
    enabled: !!restaurant?.id,
  });

  const createDelivery = useMutation({
    mutationFn: async (input: { food_item_id?: string; restaurant_id: string; organization_id: string; volunteer_id?: string | null; }) => {
      const { data, error } = await supabase
        .from("deliveries")
        .insert({ food_item_id: input.food_item_id || null, restaurant_id: input.restaurant_id, organization_id: input.organization_id, volunteer_id: input.volunteer_id || null, status: "pending" })
        .select("*, food_item:food_items(name), organization:organizations(name), restaurant:restaurants(name), volunteer:volunteers(name)")
        .single();
      if (error) throw error;
      return data as DeliveryRecord;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["deliveries"] }); },
  });

  const [view, setView] = useState<View>("dashboard");
  const [selectedFood, setSelectedFood] = useState<FoodItemRecord | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryRecord | null>(null);

  const pendingItems = foodItems.filter(item => item.status === "available");
  const activeDeliveries = deliveries.filter(d => d.status !== "delivered");
  const completedDeliveries = deliveries.filter(d => d.status === "delivered");

  const handleFoodUploadSuccess = (item: any) => {
    setSelectedFood(item as FoodItemRecord);
    setView("match");
  };

  const handleDeliveryCreated = async (delivery: DeliveryRecord) => {
    if (delivery.food_item_id) {
      await updateFoodItem.mutateAsync({ id: delivery.food_item_id, status: "matched" });
    }
    setSelectedDelivery(delivery);
    setView("tracking");
  };

  const isLoading = foodItemsLoading || deliveriesLoading;

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="bg-card border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {restaurant?.name || user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {view === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground">
                  Welcome, {restaurant?.name?.split(' ')[0] || 'Restaurant'}! 👋
                </h1>
                <p className="text-muted-foreground">
                  Ready to donate surplus food and make a difference?
                </p>
              </div>

              {isLoading && (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Active Donations", value: pendingItems.length, icon: Package, color: "bg-primary/10 text-primary" },
                  { label: "In Transit", value: activeDeliveries.length, icon: Truck, color: "bg-info/10 text-info" },
                  { label: "Completed", value: completedDeliveries.length, icon: CheckCircle, color: "bg-success/10 text-success" },
                  { label: "Total Earned", value: `$${completedDeliveries.length * 0}`, icon: DollarSign, color: "bg-accent/10 text-accent" },
                ].map((stat) => (
                  <motion.div
                    key={stat.label}
                    className="bg-card rounded-xl p-4 shadow-md border border-border/50"
                    whileHover={{ y: -2 }}
                  >
                    <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              <motion.button
                className="w-full bg-gradient-primary text-primary-foreground rounded-xl p-6 shadow-lg mb-8 flex items-center justify-between group"
                onClick={() => setView("upload")}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
                    <Plus className="w-7 h-7" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold">Donate Food Now</h3>
                    <p className="text-primary-foreground/80 text-sm">
                      Upload food with AI quality analysis
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              {activeDeliveries.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-foreground mb-4">Active Deliveries</h2>
                  <div className="space-y-3">
                    {activeDeliveries.map((delivery) => (
                      <motion.button
                        key={delivery.id}
                        className="w-full bg-card rounded-xl p-4 shadow-md border border-border/50 flex items-center justify-between text-left"
                        onClick={() => { setSelectedDelivery(delivery); setView("tracking"); }}
                        whileHover={{ y: -2 }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center">
                            <Truck className="w-6 h-6 text-info" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">
                              {delivery.food_item?.name || "Food Delivery"}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              To: {delivery.organization?.name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            delivery.status === "picked_up" ? "bg-info/10 text-info" :
                            delivery.status === "in_transit" ? "bg-warning/10 text-warning" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {delivery.status.replace("_", " ")}
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {pendingItems.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-foreground mb-4">Pending Donations</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {pendingItems.map((item) => (
                      <motion.div
                        key={item.id}
                        className="bg-card rounded-xl overflow-hidden shadow-md border border-border/50"
                        whileHover={{ y: -2 }}
                      >
                        {item.image_url && (
                          <img src={item.image_url} alt={item.name} className="w-full h-32 object-cover" />
                        )}
                        <div className="p-4">
                          <h4 className="font-semibold text-foreground">{item.name}</h4>
                          <p className="text-sm text-muted-foreground mb-3">{item.quantity}</p>
                          {item.quality_score && (
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full">
                                Quality: {item.quality_score}%
                              </span>
                            </div>
                          )}
                          <Button variant="default" size="sm" className="w-full" onClick={() => { setSelectedFood(item); setView("match"); }}>
                            <Users className="w-4 h-4 mr-2" />
                            Find Organization
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {view === "upload" && (
          <FoodUpload onClose={() => setView("dashboard")} onSuccess={handleFoodUploadSuccess} />
        )}
      </AnimatePresence>

      {view === "match" && selectedFood && (
        <OrganizationMatcher
          foodItem={selectedFood}
          onBack={() => setView("dashboard")}
          onDeliveryCreated={handleDeliveryCreated}
          restaurant={restaurant}
        />
      )}

      {view === "tracking" && selectedDelivery && (
        <DeliveryTracker
          delivery={selectedDelivery as any}
          onBack={() => { setSelectedDelivery(null); setView("dashboard"); }}
          userRole="restaurant"
        />
      )}
    </div>
  );
};
