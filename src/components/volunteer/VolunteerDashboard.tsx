import { useState } from "react";
import { motion } from "framer-motion";
import {
  Package, Truck, Clock, MapPin, CheckCircle, XCircle,
  LogOut, DollarSign, Star, History, Bell, Building2, Calendar, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { DeliveryTracker } from "../shared/DeliveryTracker";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VolunteerDashboardProps {
  onLogout: () => void;
}

interface DeliveryRecord {
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
  restaurant?: { name: string; location: string | null } | null;
  organization?: { name: string; address: string | null } | null;
  volunteer?: { name: string } | null;
}

export const VolunteerDashboard = ({ onLogout }: VolunteerDashboardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryRecord | null>(null);
  const [activeTab, setActiveTab] = useState<"requests" | "active" | "history">("requests");

  const { data: volunteer } = useQuery({
    queryKey: ["volunteer", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("volunteers").select("*").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Deliveries assigned to this volunteer
  const { data: myDeliveries = [], isLoading: myDeliveriesLoading } = useQuery({
    queryKey: ["deliveries", "volunteer", volunteer?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deliveries")
        .select("*, food_item:food_items(name), restaurant:restaurants(name, location), organization:organizations(name, address), volunteer:volunteers(name)")
        .eq("volunteer_id", volunteer!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DeliveryRecord[];
    },
    enabled: !!volunteer?.id,
  });

  // Pending deliveries available to claim
  const { data: pendingDeliveries = [], isLoading: pendingLoading } = useQuery({
    queryKey: ["deliveries", "pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deliveries")
        .select("*, food_item:food_items(name), restaurant:restaurants(name, location), organization:organizations(name, address)")
        .eq("status", "pending")
        .is("volunteer_id", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DeliveryRecord[];
    },
    enabled: !!volunteer?.id,
  });

  const claimDelivery = useMutation({
    mutationFn: async (deliveryId: string) => {
      const { data, error } = await supabase
        .from("deliveries")
        .update({ volunteer_id: volunteer!.id, status: "volunteer_assigned" })
        .eq("id", deliveryId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      toast({ title: "Request Accepted! 🎉", description: "You're now assigned to this delivery." });
      setActiveTab("active");
    },
  });

  const activeDeliveries = myDeliveries.filter(d =>
    ["volunteer_assigned", "picked_up", "in_transit"].includes(d.status)
  );
  const completedDeliveries = myDeliveries.filter(d => d.status === "delivered");

  const isLoading = myDeliveriesLoading || pendingLoading;

  if (selectedDelivery) {
    return (
      <DeliveryTracker
        delivery={selectedDelivery as any}
        onBack={() => setSelectedDelivery(null)}
        userRole="volunteer"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="bg-card border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {volunteer?.name || user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">
            Hey, {volunteer?.name?.split(' ')[0] || 'Volunteer'}! 🚴
          </h1>
          <p className="text-muted-foreground">Ready to make some deliveries today?</p>
        </motion.div>

        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Earnings", value: `$${volunteer?.earnings?.toFixed(2) || '0.00'}`, icon: DollarSign, color: "bg-success/10 text-success" },
            { label: "Deliveries", value: completedDeliveries.length, icon: CheckCircle, color: "bg-primary/10 text-primary" },
            { label: "Rating", value: "5.0", icon: Star, color: "bg-warning/10 text-warning" },
            { label: "Active", value: activeDeliveries.length, icon: Truck, color: "bg-info/10 text-info" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="bg-card rounded-xl p-4 shadow-md border border-border/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
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

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: "requests", label: "Available", count: pendingDeliveries.length },
            { id: "active", label: "Active", count: activeDeliveries.length },
            { id: "history", label: "History", count: completedDeliveries.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? "bg-primary-foreground/20" : "bg-muted"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Available Requests */}
        {activeTab === "requests" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {pendingDeliveries.length === 0 ? (
              <div className="bg-card rounded-xl p-8 text-center shadow-md border border-border/50">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">No pickup requests</h3>
                <p className="text-muted-foreground text-sm">New delivery requests from restaurants will appear here</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {pendingDeliveries.map((delivery, index) => (
                  <motion.div
                    key={delivery.id}
                    className="bg-card rounded-xl p-5 shadow-md border border-border/50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                          <Package className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {delivery.food_item?.name || "Food Delivery"}
                          </h4>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs flex items-center gap-1 text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              {delivery.restaurant?.location || "Pickup location"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-3 mb-4">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Building2 className="w-3 h-3 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Pickup from</p>
                          <p className="text-sm font-medium text-foreground">{delivery.restaurant?.name || "Restaurant"}</p>
                          <p className="text-xs text-muted-foreground">{delivery.restaurant?.location}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-accent/10 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                          <MapPin className="w-3 h-3 text-accent" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Deliver to</p>
                          <p className="text-sm font-medium text-foreground">{delivery.organization?.name || "Organization"}</p>
                          <p className="text-xs text-muted-foreground">{delivery.organization?.address}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="hero" className="flex-1" onClick={() => claimDelivery.mutate(delivery.id)} disabled={claimDelivery.isPending}>
                        {claimDelivery.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                        Accept
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Active Deliveries */}
        {activeTab === "active" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {activeDeliveries.length === 0 ? (
              <div className="bg-card rounded-xl p-8 text-center shadow-md border border-border/50">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">No active deliveries</h3>
                <p className="text-muted-foreground text-sm">Accept a request to start delivering</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {activeDeliveries.map((delivery, index) => (
                  <motion.button
                    key={delivery.id}
                    className="w-full bg-card rounded-xl p-5 shadow-md border border-border/50 text-left hover:border-primary/30 transition-colors"
                    onClick={() => setSelectedDelivery(delivery)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -2 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-info/10 rounded-xl flex items-center justify-center">
                          <Truck className="w-7 h-7 text-info" />
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
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        delivery.status === "in_transit" ? "bg-warning/10 text-warning" :
                        delivery.status === "picked_up" ? "bg-info/10 text-info" :
                        "bg-primary/10 text-primary"
                      }`}>
                        {delivery.status.replace("_", " ")}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* History */}
        {activeTab === "history" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {completedDeliveries.length === 0 ? (
              <div className="bg-card rounded-xl p-8 text-center shadow-md border border-border/50">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <History className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">No delivery history</h3>
                <p className="text-muted-foreground text-sm">Your completed deliveries will appear here</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {completedDeliveries.map((delivery, index) => (
                  <motion.div
                    key={delivery.id}
                    className="bg-card rounded-xl p-5 shadow-md border border-border/50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-success" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {delivery.food_item?.name || "Delivery"}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            To: {delivery.organization?.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {new Date(delivery.created_at).toLocaleDateString()} at {new Date(delivery.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                        Completed ✓
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};
