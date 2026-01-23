import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Package, Truck, Clock, MapPin, CheckCircle,
  LogOut, Bell, Calendar, Plus, Send, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { DeliveryTracker } from "../shared/DeliveryTracker";
import { FoodRequestForm } from "./FoodRequestForm";
import { useAppStore } from "@/store/appStore";
import { useToast } from "@/hooks/use-toast";
import type { Delivery, Organization } from "@/types";

interface OrganizationDashboardProps {
  onLogout: () => void;
}

export const OrganizationDashboard = ({ onLogout }: OrganizationDashboardProps) => {
  const { currentUser, deliveries, foodRequests, notifications, markNotificationRead } = useAppStore();
  const { toast } = useToast();
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"incoming" | "requests" | "history">("incoming");

  const org = currentUser as Organization;

  const myDeliveries = deliveries.filter(d => d.organizationId === currentUser?.id);
  const pendingDeliveries = myDeliveries.filter(d => 
    ["pending", "volunteer_assigned", "picked_up", "in_transit"].includes(d.status)
  );
  const completedDeliveries = myDeliveries.filter(d => d.status === "delivered");

  // Get my food requests
  const myFoodRequests = foodRequests.filter(r => r.organizationId === currentUser?.id);
  const activeRequests = myFoodRequests.filter(r => r.status === "active");

  // Get unread notifications
  const myNotifications = notifications.filter(
    n => n.userId === currentUser?.id && !n.read
  );

  // Show toast for new notifications
  useEffect(() => {
    if (myNotifications.length > 0) {
      const latest = myNotifications[myNotifications.length - 1];
      toast({
        title: latest.title,
        description: latest.message,
      });
      markNotificationRead(latest.id);
    }
  }, [myNotifications.length]);

  if (selectedDelivery) {
    return (
      <DeliveryTracker
        delivery={selectedDelivery}
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
      {/* Header */}
      <div className="bg-card border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-4">
            {myNotifications.length > 0 && (
              <div className="relative">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-accent-foreground rounded-full text-xs flex items-center justify-center">
                  {myNotifications.length}
                </span>
              </div>
            )}
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
        {/* Welcome */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-foreground">
            Welcome, {currentUser?.name?.split(' ')[0]}! 🏠
          </h1>
          <p className="text-muted-foreground">
            Track incoming food donations and manage requests
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Incoming", value: pendingDeliveries.length, icon: Truck, color: "bg-info/10 text-info" },
            { label: "Active Requests", value: activeRequests.length, icon: Send, color: "bg-warning/10 text-warning" },
            { label: "Received Today", value: completedDeliveries.length, icon: Package, color: "bg-success/10 text-success" },
            { label: "Total Received", value: completedDeliveries.length, icon: CheckCircle, color: "bg-primary/10 text-primary" },
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

        {/* Quick Action - Request Food */}
        <motion.button
          className="w-full bg-gradient-primary text-primary-foreground rounded-xl p-6 shadow-lg mb-8 flex items-center justify-between group"
          onClick={() => setShowRequestForm(true)}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
              <Plus className="w-7 h-7" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold">Request Food Donation</h3>
              <p className="text-primary-foreground/80 text-sm">
                Let restaurants know what you need
              </p>
            </div>
          </div>
        </motion.button>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: "incoming", label: "Incoming", count: pendingDeliveries.length },
            { id: "requests", label: "My Requests", count: activeRequests.length },
            { id: "history", label: "Received", count: completedDeliveries.length },
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

        {/* Notifications Banner */}
        {pendingDeliveries.length > 0 && activeTab === "incoming" && (
          <motion.div
            className="bg-info/10 border border-info/30 rounded-xl p-4 mb-6 flex items-center gap-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-12 h-12 bg-info rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-info-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {pendingDeliveries.length} Delivery{pendingDeliveries.length > 1 ? 'ies' : 'y'} Incoming!
              </h3>
              <p className="text-sm text-muted-foreground">
                Track your deliveries in real-time below
              </p>
            </div>
          </motion.div>
        )}

        {/* Tab Content - Incoming Deliveries */}
        {activeTab === "incoming" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {pendingDeliveries.length === 0 ? (
              <div className="bg-card rounded-xl p-8 text-center shadow-md border border-border/50">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">No incoming deliveries</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  New food donations will appear here when matched with your organization
                </p>
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
                        {delivery.foodItem?.imageUrl ? (
                          <img
                            src={delivery.foodItem.imageUrl}
                            alt={delivery.foodItem.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                            <Package className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {delivery.foodItem?.name || "Food Donation"}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            From: {delivery.restaurantName || delivery.foodItem?.restaurantName}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {delivery.estimatedTime || "TBD"}
                            </span>
                            <span className="text-xs flex items-center gap-1 text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              {delivery.distance || "TBD"}
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
                        {delivery.volunteerName && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Volunteer: {delivery.volunteerName}
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

        {/* Tab Content - My Requests */}
        {activeTab === "requests" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {myFoodRequests.length === 0 ? (
              <div className="bg-card rounded-xl p-8 text-center shadow-md border border-border/50">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">No food requests</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Post a request to let restaurants know what food you need
                </p>
                <Button variant="hero" onClick={() => setShowRequestForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Request
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {myFoodRequests.map((request, index) => (
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
                            <Send className={`w-6 h-6 text-warning`} />
                          ) : (
                            <CheckCircle className="w-6 h-6 text-success" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">
                            Food Request
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {request.quantity}
                          </p>
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
                      {request.foodTypes.map((type) => (
                        <span key={type} className="text-xs bg-muted px-2 py-1 rounded">
                          {type}
                        </span>
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

        {/* Tab Content - Recent History */}
        {activeTab === "history" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {completedDeliveries.length === 0 ? (
              <div className="bg-card rounded-xl p-8 text-center shadow-md border border-border/50">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">No donations received yet</h3>
                <p className="text-muted-foreground text-sm">
                  Completed donations will appear here
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {completedDeliveries.map((delivery, index) => (
                  <motion.div
                    key={delivery.id}
                    className="bg-card rounded-xl p-4 shadow-md border border-border/50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-success" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {delivery.foodItem?.name || "Food Donation"}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {delivery.foodItem?.quantity} {delivery.foodItem?.unit}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          From: {delivery.restaurantName || delivery.foodItem?.restaurantName}
                        </p>
                      </div>
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
