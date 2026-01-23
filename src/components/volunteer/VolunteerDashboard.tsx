import { useState } from "react";
import { motion } from "framer-motion";
import {
  Package, Truck, Clock, MapPin, CheckCircle, XCircle,
  LogOut, DollarSign, Star, History, Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { DeliveryTracker } from "../shared/DeliveryTracker";
import { useAppStore } from "@/store/appStore";
import type { Delivery, DeliveryRequest, Volunteer } from "@/types";

interface VolunteerDashboardProps {
  onLogout: () => void;
}

export const VolunteerDashboard = ({ onLogout }: VolunteerDashboardProps) => {
  const { currentUser, deliveries, foodItems, organizations, updateDelivery } = useAppStore();
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [activeTab, setActiveTab] = useState<"requests" | "active" | "history">("requests");

  const volunteer = currentUser as Volunteer;
  
  // Find deliveries assigned to this volunteer
  const myDeliveries = deliveries.filter(d => d.volunteerId === volunteer?.id);
  const activeDeliveries = myDeliveries.filter(d => 
    ["volunteer_assigned", "picked_up", "in_transit"].includes(d.status)
  );
  const completedDeliveries = myDeliveries.filter(d => d.status === "delivered");

  // Simulate pending pickup requests (deliveries waiting for a volunteer)
  const pendingRequests: DeliveryRequest[] = deliveries
    .filter(d => d.status === "pending" || (!d.volunteerId && d.status !== "delivered"))
    .map(d => ({
      id: d.id,
      delivery: d,
      distance: `${(Math.random() * 3 + 0.5).toFixed(1)} km`,
      payment: Math.floor(Math.random() * 10) + 5,
      estimatedTime: `${Math.floor(Math.random() * 15) + 10} min`,
    }));

  const acceptRequest = (request: DeliveryRequest) => {
    if (!volunteer) return;
    updateDelivery(request.id, {
      volunteerId: volunteer.id,
      volunteerName: volunteer.name,
      status: "volunteer_assigned",
      distance: request.distance,
      estimatedTime: request.estimatedTime,
      payment: request.payment,
    });
  };

  if (selectedDelivery) {
    return (
      <DeliveryTracker
        delivery={selectedDelivery}
        onBack={() => setSelectedDelivery(null)}
        userRole="volunteer"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <div className="bg-card border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {currentUser?.name}
            </span>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Welcome & Earnings */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-foreground">
            Hey, {currentUser?.name?.split(' ')[0]}! 🚴
          </h1>
          <p className="text-muted-foreground">
            Ready to make some deliveries today?
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Earnings", value: `$${volunteer?.earnings?.toFixed(2) || '0.00'}`, icon: DollarSign, color: "bg-success/10 text-success" },
            { label: "Deliveries", value: volunteer?.completedDeliveries || 0, icon: CheckCircle, color: "bg-primary/10 text-primary" },
            { label: "Rating", value: volunteer?.rating?.toFixed(1) || '5.0', icon: Star, color: "bg-warning/10 text-warning" },
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
            { id: "requests", label: "Requests", count: pendingRequests.length },
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

        {/* Tab Content */}
        {activeTab === "requests" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {pendingRequests.length === 0 ? (
              <div className="bg-card rounded-xl p-8 text-center shadow-md border border-border/50">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">No pickup requests</h3>
                <p className="text-muted-foreground text-sm">
                  New delivery requests will appear here
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {pendingRequests.map((request, index) => (
                  <motion.div
                    key={request.id}
                    className="bg-card rounded-xl p-5 shadow-md border border-border/50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        {request.delivery.foodItem?.imageUrl ? (
                          <img
                            src={request.delivery.foodItem.imageUrl}
                            alt="Food"
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                            <Package className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {request.delivery.foodItem?.name || "Food Delivery"}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {request.delivery.foodItem?.restaurantName} → {request.delivery.organizationName}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs flex items-center gap-1 text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              {request.distance}
                            </span>
                            <span className="text-xs flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {request.estimatedTime}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-success">${request.payment}</p>
                        <p className="text-xs text-muted-foreground">earn</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {}}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        variant="hero"
                        className="flex-1"
                        onClick={() => acceptRequest(request)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "active" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {activeDeliveries.length === 0 ? (
              <div className="bg-card rounded-xl p-8 text-center shadow-md border border-border/50">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">No active deliveries</h3>
                <p className="text-muted-foreground text-sm">
                  Accept a request to start delivering
                </p>
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
                            {delivery.foodItem?.name || "Food Delivery"}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            To: {delivery.organizationName}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {delivery.distance} • {delivery.estimatedTime}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          delivery.status === "in_transit" ? "bg-warning/10 text-warning" :
                          delivery.status === "picked_up" ? "bg-info/10 text-info" :
                          "bg-primary/10 text-primary"
                        }`}>
                          {delivery.status.replace("_", " ")}
                        </span>
                        <p className="text-lg font-bold text-success mt-2">
                          ${delivery.payment}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {completedDeliveries.length === 0 ? (
              <div className="bg-card rounded-xl p-8 text-center shadow-md border border-border/50">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <History className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">No delivery history</h3>
                <p className="text-muted-foreground text-sm">
                  Your completed deliveries will appear here
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {completedDeliveries.map((delivery, index) => (
                  <motion.div
                    key={delivery.id}
                    className="bg-card rounded-xl p-4 shadow-md border border-border/50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-success" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {delivery.foodItem?.name || "Delivery"}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {delivery.organizationName}
                          </p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-success">
                        +${delivery.payment}
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
