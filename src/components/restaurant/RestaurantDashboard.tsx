import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Package, Truck, MapPin, Clock, ChevronRight,
  LogOut, CheckCircle, Users, DollarSign, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { FoodUpload } from "./FoodUpload";
import { OrganizationMatcher } from "./OrganizationMatcher";
import { DeliveryTracker } from "../shared/DeliveryTracker";
import { useRestaurantData, FoodItemRecord } from "@/hooks/useRestaurantData";
import { useDeliveryData, DeliveryRecord } from "@/hooks/useDeliveryData";
import { useAuth } from "@/hooks/useAuth";

interface RestaurantDashboardProps {
  onLogout: () => void;
}

type View = "dashboard" | "upload" | "match" | "tracking";

export const RestaurantDashboard = ({ onLogout }: RestaurantDashboardProps) => {
  const { user } = useAuth();
  const { restaurant, foodItems, foodItemsLoading, updateFoodItem } = useRestaurantData();
  const { deliveries, deliveriesLoading, createDelivery } = useDeliveryData("restaurant");
  const [view, setView] = useState<View>("dashboard");
  const [selectedFood, setSelectedFood] = useState<FoodItemRecord | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryRecord | null>(null);

  const pendingItems = foodItems.filter(item => item.status === "available");
  const activeDeliveries = deliveries.filter(d => d.status !== "delivered");
  const completedDeliveries = deliveries.filter(d => d.status === "delivered");

  const handleFoodUploadSuccess = (item: FoodItemRecord) => {
    setSelectedFood(item);
    setView("match");
  };

  const handleDeliveryCreated = async (delivery: DeliveryRecord) => {
    // Update food item status if there's one attached
    if (delivery.food_item_id) {
      await updateFoodItem.mutateAsync({ id: delivery.food_item_id, status: "matched" });
    }
    setSelectedDelivery(delivery);
    setView("tracking");
  };

  const isLoading = foodItemsLoading || deliveriesLoading;

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
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

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {view === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Welcome */}
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

              {/* Stats */}
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

              {/* Quick Action */}
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

              {/* Active Deliveries */}
              {activeDeliveries.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-foreground mb-4">Active Deliveries</h2>
                  <div className="space-y-3">
                    {activeDeliveries.map((delivery) => (
                      <motion.button
                        key={delivery.id}
                        className="w-full bg-card rounded-xl p-4 shadow-md border border-border/50 flex items-center justify-between text-left"
                        onClick={() => {
                          setSelectedDelivery(delivery);
                          setView("tracking");
                        }}
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

              {/* Pending Items */}
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
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-32 object-cover"
                          />
                        )}
                        <div className="p-4">
                          <h4 className="font-semibold text-foreground">{item.name}</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            {item.quantity}
                          </p>
                          {item.quality_score && (
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full">
                                Quality: {item.quality_score}%
                              </span>
                            </div>
                          )}
                          <Button
                            variant="default"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              setSelectedFood(item);
                              setView("match");
                            }}
                          >
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

      {/* Modals */}
      <AnimatePresence>
        {view === "upload" && (
          <FoodUpload
            onClose={() => setView("dashboard")}
            onSuccess={handleFoodUploadSuccess}
          />
        )}
      </AnimatePresence>

      {view === "match" && selectedFood && (
        <OrganizationMatcher
          foodItem={selectedFood}
          onBack={() => setView("dashboard")}
          onDeliveryCreated={handleDeliveryCreated}
        />
      )}

      {view === "tracking" && selectedDelivery && (
        <DeliveryTracker
          delivery={selectedDelivery}
          onBack={() => {
            setSelectedDelivery(null);
            setView("dashboard");
          }}
          userRole="restaurant"
        />
      )}
    </div>
  );
};
