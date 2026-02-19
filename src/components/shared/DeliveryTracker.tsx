import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, MapPin, Clock, Phone, CheckCircle, 
  Package, Truck, Building2, CreditCard, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleMap, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { useAppStore } from "@/store/appStore";
import { useToast } from "@/hooks/use-toast";
import { createDeliveryNotifications } from "@/lib/notifications";
import type { Delivery } from "@/types";

const routeMapStyle = { width: "100%", height: "280px", borderRadius: "0.75rem" };
const defaultCenter = { lat: 28.6139, lng: 77.209 };

const DeliveryMapView = ({ pickupAddress, dropoffAddress, showRoute = true }: {
  pickupAddress?: string; dropoffAddress?: string; showRoute?: boolean;
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [pickupPos, setPickupPos] = useState<google.maps.LatLngLiteral | null>(null);
  const [dropoffPos, setDropoffPos] = useState<google.maps.LatLngLiteral | null>(null);

  useEffect(() => {
    if (!apiKey || !pickupAddress || !dropoffAddress) return;
    const geocoder = new google.maps.Geocoder();
    const geocode = (address: string): Promise<google.maps.LatLngLiteral | null> =>
      new Promise(resolve => {
        geocoder.geocode({ address }, (results, status) => {
          if (status === "OK" && results?.[0]?.geometry?.location)
            resolve({ lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng() });
          else resolve(null);
        });
      });
    (async () => {
      const [p, d] = await Promise.all([geocode(pickupAddress), geocode(dropoffAddress)]);
      setPickupPos(p); setDropoffPos(d);
      if (showRoute && p && d) {
        new google.maps.DirectionsService().route(
          { origin: p, destination: d, travelMode: google.maps.TravelMode.DRIVING },
          (result, status) => { if (status === "OK" && result) setDirections(result); }
        );
      }
    })();
  }, [apiKey, pickupAddress, dropoffAddress, showRoute]);

  if (!apiKey) return (
    <div className="h-48 bg-gradient-to-br from-primary/10 to-info/10 rounded-xl flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Map unavailable</p>
    </div>
  );

  return (
    <GoogleMap mapContainerStyle={routeMapStyle} center={pickupPos || dropoffPos || defaultCenter} zoom={13}
      options={{ disableDefaultUI: true, zoomControl: true }}>
      {pickupPos && <Marker position={pickupPos} label={{ text: "P", color: "white", fontWeight: "bold" }} />}
      {dropoffPos && <Marker position={dropoffPos} label={{ text: "D", color: "white", fontWeight: "bold" }} />}
      {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true }} />}
    </GoogleMap>
  );
};

interface DeliveryTrackerProps {
  delivery: Delivery;
  onBack: () => void;
  userRole: "restaurant" | "organization" | "volunteer";
}

const statusSteps = [
  { key: "pending", label: "Pending Volunteer", icon: Clock },
  { key: "volunteer_assigned", label: "Volunteer Assigned", icon: Truck },
  { key: "picked_up", label: "Picked Up", icon: Package },
  { key: "in_transit", label: "In Transit", icon: MapPin },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
];

export const DeliveryTracker = ({ delivery, onBack, userRole }: DeliveryTrackerProps) => {
  const { updateDelivery, updateVolunteerEarnings, addNotification, deliveries } = useAppStore();
  const { toast } = useToast();
  
  // Get the latest delivery state from store
  const currentDelivery = deliveries.find(d => d.id === delivery.id) || delivery;
  const [currentStatus, setCurrentStatus] = useState(currentDelivery.status);
  const [showPayment, setShowPayment] = useState(currentDelivery.status === "delivered");
  const [location, setLocation] = useState({ lat: 0, progress: 0 });

  // Update local state when store changes
  useEffect(() => {
    setCurrentStatus(currentDelivery.status);
    if (currentDelivery.status === "delivered") {
      setShowPayment(true);
    }
  }, [currentDelivery.status]);

  // Filter out "pending" step if delivery already has volunteer
  const activeSteps = currentDelivery.volunteerId 
    ? statusSteps.filter(s => s.key !== "pending")
    : statusSteps;

  const currentStepIndex = activeSteps.findIndex(s => s.key === currentStatus);

  useEffect(() => {
    // Simulate live location updates
    if (currentStatus === "in_transit") {
      const interval = setInterval(() => {
        setLocation(prev => ({
          lat: prev.lat + 0.001,
          progress: Math.min(prev.progress + 5, 100)
        }));
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [currentStatus]);

  const advanceStatus = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < activeSteps.length) {
      const nextStatus = activeSteps[nextIndex].key as Delivery["status"];
      setCurrentStatus(nextStatus);
      updateDelivery(delivery.id, { status: nextStatus });
      
      // Create notifications for status change
      if (nextStatus === "picked_up") {
        const notifs = createDeliveryNotifications(currentDelivery, "picked_up");
        notifs.forEach(addNotification);
        toast({
          title: "Food Picked Up! 📦",
          description: "You've picked up the donation. Safe travels!",
        });
      }
      
      if (nextStatus === "delivered") {
        setShowPayment(true);
        if (currentDelivery.volunteerId && currentDelivery.payment) {
          updateVolunteerEarnings(currentDelivery.volunteerId, currentDelivery.payment);
        }
        const notifs = createDeliveryNotifications(currentDelivery, "delivered");
        notifs.forEach(addNotification);
        toast({
          title: "Delivery Complete! 🎉",
          description: `You earned $${currentDelivery.payment}!`,
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <div className="bg-card border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Button variant="ghost" onClick={onBack} className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-xl font-bold text-foreground">
            Delivery Tracking
          </h1>
          <p className="text-muted-foreground">
            {currentDelivery.foodItem?.name || "Food Delivery"} • {currentDelivery.distance || "Calculating..."}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Live Map */}
        <motion.div
          className="bg-card rounded-2xl overflow-hidden shadow-lg mb-6 border border-border/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <DeliveryMapView
            pickupAddress={currentDelivery.restaurantAddress || currentDelivery.foodItem?.restaurantAddress}
            dropoffAddress={currentDelivery.organizationAddress}
            showRoute={["in_transit", "picked_up", "volunteer_assigned"].includes(currentStatus)}
          />
          <div className="px-4 py-3">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{currentDelivery.restaurantName || currentDelivery.foodItem?.restaurantName}</span>
              <span>{currentDelivery.organizationName}</span>
            </div>
            <p className="mt-2 text-sm text-center text-muted-foreground">
              {currentStatus === "pending" && "Waiting for a volunteer..."}
              {currentStatus === "volunteer_assigned" && "Volunteer on the way to pickup"}
              {currentStatus === "picked_up" && "Ready to start delivery"}
              {currentStatus === "in_transit" && "Live tracking active..."}
              {currentStatus === "delivered" && "Delivery complete! 🎉"}
            </p>
          </div>
        </motion.div>

        {/* Status Steps */}
        <div className="bg-card rounded-2xl p-6 shadow-lg mb-6 border border-border/50">
          <h3 className="font-bold text-foreground mb-4">Delivery Status</h3>
          <div className="space-y-4">
            {activeSteps.map((step, index) => {
              const isComplete = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              return (
                <motion.div
                  key={step.key}
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isComplete
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${isComplete ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="text-xs text-primary">Current status</p>
                    )}
                  </div>
                  {isComplete && index < currentStepIndex && (
                    <CheckCircle className="w-5 h-5 text-success" />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Action Button (for volunteers) */}
          {userRole === "volunteer" && currentStatus !== "delivered" && currentStatus !== "pending" && (
            <Button
              variant="hero"
              className="w-full mt-6"
              onClick={advanceStatus}
            >
              {currentStatus === "volunteer_assigned" && "Mark as Picked Up"}
              {currentStatus === "picked_up" && "Start Delivery"}
              {currentStatus === "in_transit" && "Mark as Delivered"}
            </Button>
          )}
        </div>

        {/* Delivery Details */}
        <div className="bg-card rounded-2xl p-6 shadow-lg mb-6 border border-border/50">
          <h3 className="font-bold text-foreground mb-4">Delivery Details</h3>
          <div className="grid gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pickup From</p>
                <p className="font-medium text-foreground">
                  {currentDelivery.restaurantName || currentDelivery.foodItem?.restaurantName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {currentDelivery.restaurantAddress || currentDelivery.foodItem?.restaurantAddress}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deliver To</p>
                <p className="font-medium text-foreground">{currentDelivery.organizationName}</p>
                <p className="text-xs text-muted-foreground">{currentDelivery.organizationAddress}</p>
              </div>
            </div>
            {currentDelivery.volunteerName && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Volunteer</p>
                  <p className="font-medium text-foreground">{currentDelivery.volunteerName}</p>
                  {currentDelivery.volunteerPhone && (
                    <p className="text-xs text-muted-foreground">{currentDelivery.volunteerPhone}</p>
                  )}
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estimated Time</p>
                <p className="font-medium text-foreground">{currentDelivery.estimatedTime || "Calculating..."}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Confirmation */}
        {showPayment && (
          <motion.div
            className="bg-success/10 border border-success/30 rounded-2xl p-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-success rounded-xl flex items-center justify-center">
                <CreditCard className="w-7 h-7 text-success-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-success text-lg">
                  {userRole === "volunteer" ? "Payment Earned!" : "Delivery Complete!"}
                </h3>
                <p className="text-success/80">
                  {userRole === "volunteer" 
                    ? `$${currentDelivery.payment} has been added to your earnings`
                    : `Food has been successfully delivered to ${currentDelivery.organizationName}`
                  }
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
