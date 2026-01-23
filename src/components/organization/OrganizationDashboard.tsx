import { useState } from "react";
import { motion } from "framer-motion";
import {
  Package, Truck, Clock, MapPin, CheckCircle,
  LogOut, Bell, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { DeliveryTracker } from "../shared/DeliveryTracker";
import { useAppStore } from "@/store/appStore";
import type { Delivery } from "@/types";

interface OrganizationDashboardProps {
  onLogout: () => void;
}

export const OrganizationDashboard = ({ onLogout }: OrganizationDashboardProps) => {
  const { currentUser, deliveries } = useAppStore();
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  const myDeliveries = deliveries.filter(d => d.organizationId === currentUser?.id);
  const pendingDeliveries = myDeliveries.filter(d => 
    ["volunteer_assigned", "picked_up", "in_transit"].includes(d.status)
  );
  const completedDeliveries = myDeliveries.filter(d => d.status === "delivered");

  if (selectedDelivery) {
    return (
      <DeliveryTracker
        delivery={selectedDelivery}
        onBack={() => setSelectedDelivery(null)}
        userRole="organization"
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
            Track incoming food donations and manage deliveries
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Incoming Deliveries", value: pendingDeliveries.length, icon: Truck, color: "bg-info/10 text-info" },
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

        {/* Notifications Banner */}
        {pendingDeliveries.length > 0 && (
          <motion.div
            className="bg-info/10 border border-info/30 rounded-xl p-4 mb-8 flex items-center gap-4"
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

        {/* Incoming Deliveries */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4">Incoming Deliveries</h2>
          {pendingDeliveries.length === 0 ? (
            <div className="bg-card rounded-xl p-8 text-center shadow-md border border-border/50">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">No incoming deliveries</h3>
              <p className="text-muted-foreground text-sm">
                New food donations will appear here when matched with your organization
              </p>
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
                          From: {delivery.foodItem?.restaurantName}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {delivery.estimatedTime}
                          </span>
                          <span className="text-xs flex items-center gap-1 text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {delivery.distance}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        delivery.status === "in_transit" ? "bg-warning/10 text-warning" :
                        delivery.status === "picked_up" ? "bg-info/10 text-info" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {delivery.status.replace("_", " ")}
                      </span>
                      <p className="text-xs text-muted-foreground mt-2">
                        Volunteer: {delivery.volunteerName}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Recent History */}
        {completedDeliveries.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4">Recent Donations Received</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {completedDeliveries.slice(0, 4).map((delivery, index) => (
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
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
