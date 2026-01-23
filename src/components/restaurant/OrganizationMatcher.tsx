import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Clock, Star, CheckCircle, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/appStore";
import type { FoodItem, Delivery, Organization, Volunteer } from "@/types";

interface OrganizationMatcherProps {
  foodItem: FoodItem;
  onBack: () => void;
  onDeliveryCreated: (delivery: Delivery) => void;
}

export const OrganizationMatcher = ({
  foodItem,
  onBack,
  onDeliveryCreated,
}: OrganizationMatcherProps) => {
  const { organizations, volunteers, currentUser } = useAppStore();
  const [step, setStep] = useState<"org" | "volunteer">("org");
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);

  const handleOrgSelect = (org: Organization) => {
    setSelectedOrg(org);
    setStep("volunteer");
  };

  const handleVolunteerSelect = (volunteer: Volunteer) => {
    setSelectedVolunteer(volunteer);
  };

  const confirmDelivery = () => {
    if (!selectedOrg || !selectedVolunteer || !currentUser) return;

    const delivery: Delivery = {
      id: `del-${Date.now()}`,
      foodItemId: foodItem.id,
      foodItem: foodItem,
      restaurantId: currentUser.id,
      organizationId: selectedOrg.id,
      organizationName: selectedOrg.name,
      volunteerId: selectedVolunteer.id,
      volunteerName: selectedVolunteer.name,
      status: "volunteer_assigned",
      distance: `${(Math.random() * 5 + 1).toFixed(1)} km`,
      estimatedTime: `${Math.floor(Math.random() * 20) + 15} min`,
      payment: Math.floor(Math.random() * 10) + 5,
    };

    onDeliveryCreated(delivery);
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <div className="bg-card border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Button variant="ghost" onClick={onBack} className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-xl font-bold text-foreground">
            {step === "org" ? "Select Organization" : "Select Volunteer"}
          </h1>
          <p className="text-muted-foreground">
            Donating: {foodItem.name} ({foodItem.quantity} {foodItem.unit})
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {step === "org" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-sm text-muted-foreground mb-4">
              AI matched these nearby organizations based on your location and food type
            </p>
            <div className="grid gap-4">
              {organizations.map((org, index) => (
                <motion.button
                  key={org.id}
                  className={`w-full bg-card rounded-xl p-5 shadow-md border-2 text-left transition-all ${
                    selectedOrg?.id === org.id
                      ? "border-primary"
                      : "border-transparent hover:border-primary/30"
                  }`}
                  onClick={() => handleOrgSelect(org)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center text-2xl">
                        {org.organizationType === "shelter" ? "🏠" :
                         org.organizationType === "food_bank" ? "🏦" : "🍳"}
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">{org.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <MapPin className="w-3 h-3" />
                          {org.address}
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full">
                            Verified ✓
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {(Math.random() * 4 + 1).toFixed(1)} km away
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {org.organizationType.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {step === "volunteer" && selectedOrg && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-card rounded-xl p-4 mb-6 border border-border/50">
              <p className="text-sm text-muted-foreground">Delivering to:</p>
              <p className="font-semibold text-foreground">{selectedOrg.name}</p>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Select a volunteer based on proximity and rating
            </p>

            <div className="grid gap-4 mb-6">
              {volunteers.map((vol, index) => (
                <motion.button
                  key={vol.id}
                  className={`w-full bg-card rounded-xl p-5 shadow-md border-2 text-left transition-all ${
                    selectedVolunteer?.id === vol.id
                      ? "border-primary"
                      : "border-transparent hover:border-primary/30"
                  }`}
                  onClick={() => handleVolunteerSelect(vol)}
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
                        <h3 className="font-bold text-foreground">{vol.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="w-3 h-3 text-warning fill-warning" />
                            <span className="text-foreground">{vol.rating}</span>
                          </div>
                          <span className="text-muted-foreground text-sm">
                            {vol.completedDeliveries} deliveries
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs bg-muted px-2 py-1 rounded-full capitalize">
                            {vol.vehicleType}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {(Math.random() * 2 + 0.5).toFixed(1)} km away
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        ${(Math.random() * 10 + 5).toFixed(0)}
                      </p>
                      <p className="text-xs text-muted-foreground">delivery fee</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            {selectedVolunteer && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={confirmDelivery}
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Confirm & Start Delivery
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};
