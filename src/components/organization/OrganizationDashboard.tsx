import { useState } from "react";
import { motion } from "framer-motion";
import {
  Package, Truck, Clock, MapPin, CheckCircle,
  LogOut, Bell, Calendar, Plus, Send, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { DeliveryTracker } from "../shared/DeliveryTracker";
import { FoodRequestForm } from "./FoodRequestForm";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface OrganizationDashboardProps {
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
  volunteer?: { name: string } | null;
}

interface FoodRequestRecord {
  id: string;
  organization_id: string;
  food_type: string;
  quantity: string;
  urgency: string;
  notes: string | null;
  status: string;
  created_at: string;
}

export const OrganizationDashboard = ({ onLogout }: OrganizationDashboardProps) => {
  const { user } = useAuth();
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryRecord | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"incoming" | "requests" | "history">("incoming");

  const { data: organization } = useQuery({
    queryKey: ["organization", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations").select("*").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: deliveries = [], isLoading: deliveriesLoading } = useQuery({
    queryKey: ["deliveries", "organization", organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deliveries")
        .select("*, food_item:food_items(name), restaurant:restaurants(name, location), volunteer:volunteers(name)")
        .eq("organization_id", organization!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DeliveryRecord[];
    },
    enabled: !!organization?.id,
  });

  const { data: foodRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["food_requests", organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("food_requests")
        .select("*")
        .eq("organization_id", organization!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as FoodRequestRecord[];
    },
    enabled: !!organization?.id,
  });

  const pendingDeliveries = deliveries.filter(d =>
    ["pending", "volunteer_assigned", "picked_up", "in_transit"].includes(d.status)
  );
  const completedDeliveries = deliveries.filter(d => d.status === "delivered");
  const activeRequests = foodRequests.filter(r => r.status === "active");

  const isLoading = deliveriesLoading || requestsLoading;

  if (selectedDelivery) {
    return (
      <DeliveryTracker
        delivery={selectedDelivery as any}
        onBack={() => setSelectedDelivery(null)}
        userRole="organization"
      />
    );
  }

  if (showRequestForm) {
    return (
      <FoodRequestForm
        onBack={() => setShowRequestForm(false)}
        onSuccess={() => {
          setShowRequestForm(false);
          setActiveTab("requests");
        }}
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
              {organization?.name || user?.email}
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
            Welcome, {organization?.name?.split(' ')[0] || 'Organization'}! 🏠
          </h1>
          <p className="text-muted-foreground">Track incoming food donations and manage requests</p>
        </motion.div>

        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Incoming", value: pendingDeliveries.length, icon: Truck, color: "bg-info/10 text-info" },
            { label: "Active Requests", value: activeRequests.length, icon: Send, color: "bg-warning/10 text-warning" },
            { label: "Received", value: completedDeliveries.length, icon: Package, color: "bg-success/10 text-success" },
            { label: "Total Received", value: deliveries.length, icon: CheckCircle, color: "bg-primary/10 text-primary" },
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

        <motion.button
          className="w-full bg-gradient-primary text-primary-foreground rounded-xl p-6 shadow-lg mb-8 flex items-center justify-between group"
          onClick={() => setShowRequestForm(true)}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
              <Plus className="w-7 h-7" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold">Request Food Donation</h3>
              <p className="text-primary-foreground/80 text-sm">Let restaurants know what you need</p>
            </div>
          </div>
        </motion.button>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: "incoming", label: "Incoming", count: pendingDeliveries.length },
            { id: "requests", label: "My Requests", count: activeRequests.length },
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

        {/* Incoming Deliveries */}
        {activeTab === "incoming" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {pendingDeliveries.length === 0 ? (
              <div className="bg-card rounded-xl p-8 text-center shadow-md border border-border/50">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">No incoming deliveries</h3>
                <p className="text-muted-foreground text-sm mb-4">New food donations will appear here when matched</p>
                <Button variant="outline" onClick={() => setShowRequestForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Post a Food Request
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {pendingDeliveries.map((delivery, index) => (
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
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                          <Package className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {delivery.food_item?.name || "Food Donation"}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            From: {delivery.restaurant?.name || "Restaurant"}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {new Date(delivery.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          delivery.status === "pending" ? "bg-warning/10 text-warning" :
                          delivery.status === "in_transit" ? "bg-info/10 text-info" :
                          delivery.status === "picked_up" ? "bg-primary/10 text-primary" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {delivery.status === "pending" ? "Awaiting Volunteer" : delivery.status.replace("_", " ")}
                        </span>
                        {delivery.volunteer && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Volunteer: {delivery.volunteer.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* My Requests */}
        {activeTab === "requests" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {foodRequests.length === 0 ? (
              <div className="bg-card rounded-xl p-8 text-center shadow-md border border-border/50">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">No food requests</h3>
                <p className="text-muted-foreground text-sm mb-4">Post a request to let restaurants know what food you need</p>
                <Button variant="hero" onClick={() => setShowRequestForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Request
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {foodRequests.map((request, index) => (
                  <motion.div
                    key={request.id}
                    className="bg-card rounded-xl p-5 shadow-md border border-border/50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          request.status === "active" ? "bg-warning/10" : "bg-success/10"
                        }`}>
                          {request.status === "active" ? (
                            <Send className="w-6 h-6 text-warning" />
                          ) : (
                            <CheckCircle className="w-6 h-6 text-success" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">Food Request</h4>
                          <p className="text-sm text-muted-foreground">{request.quantity}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        request.urgency === "high" ? "bg-destructive/10 text-destructive" :
                        request.urgency === "medium" ? "bg-warning/10 text-warning" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {request.urgency} priority
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {request.food_type.split(", ").map((type) => (
                        <span key={type} className="text-xs bg-muted px-2 py-1 rounded">{type}</span>
                      ))}
                    </div>
                    {request.notes && (
                      <p className="text-sm text-muted-foreground">{request.notes}</p>
                    )}
                  </motion.div>
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
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">No donations received yet</h3>
                <p className="text-muted-foreground text-sm">Completed donations will appear here</p>
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
                            {delivery.food_item?.name || "Food Donation"}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            From: {delivery.restaurant?.name || "Restaurant"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {new Date(delivery.created_at).toLocaleDateString()} at {new Date(delivery.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                        Received ✓
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
