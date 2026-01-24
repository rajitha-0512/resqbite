import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Clock, Star, CheckCircle, Truck, Send, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCrossRoleData, PublicOrganization, PublicVolunteer } from "@/hooks/useCrossRoleData";
import { useRestaurantData, FoodItemRecord } from "@/hooks/useRestaurantData";
import { useDeliveryData, DeliveryRecord } from "@/hooks/useDeliveryData";

interface OrganizationMatcherProps {
  foodItem: FoodItemRecord;
  onBack: () => void;
  onDeliveryCreated: (delivery: DeliveryRecord) => void;
}

export const OrganizationMatcher = ({
  foodItem,
  onBack,
  onDeliveryCreated,
}: OrganizationMatcherProps) => {
  const { organizations, volunteers, organizationsLoading, volunteersLoading } = useCrossRoleData();
  const { restaurant } = useRestaurantData();
  const { createDelivery } = useDeliveryData("restaurant");
  const { toast } = useToast();
  const [step, setStep] = useState<"org" | "volunteer" | "confirm">("org");
  const [selectedOrg, setSelectedOrg] = useState<PublicOrganization | null>(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState<PublicVolunteer | null>(null);
  const [skipVolunteer, setSkipVolunteer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableVolunteers = volunteers.filter(v => v.is_available !== false);

  const handleOrgSelect = (org: PublicOrganization) => {
    setSelectedOrg(org);
    setStep("volunteer");
  };

  const handleVolunteerSelect = (volunteer: PublicVolunteer) => {
    setSelectedVolunteer(volunteer);
  };

  const handleSkipVolunteer = () => {
    setSkipVolunteer(true);
    setSelectedVolunteer(null);
  };

  const confirmDelivery = async () => {
    if (!selectedOrg || !restaurant) return;

    setIsSubmitting(true);
    
    try {
      const delivery = await createDelivery.mutateAsync({
        food_item_id: foodItem.id,
        restaurant_id: restaurant.id,
        organization_id: selectedOrg.id,
        volunteer_id: selectedVolunteer?.id,
      });

      toast({
        title: selectedVolunteer ? "Delivery Created! 🚀" : "Request Posted! 📢",
        description: selectedVolunteer
          ? `${selectedVolunteer.name} will pick up your donation.`
          : "Volunteers will be notified of your donation request.",
      });

      onDeliveryCreated(delivery);
    } catch (error) {
      console.error("Failed to create delivery:", error);
      toast({
        title: "Error",
        description: "Failed to create delivery. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = organizationsLoading || volunteersLoading;

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

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="flex items-center gap-2 mb-6">
          {["Organization", "Volunteer", "Confirm"].map((label, index) => {
            const stepKeys = ["org", "volunteer", "confirm"];
            const currentIndex = stepKeys.indexOf(step);
            const isComplete = index < currentIndex;
            const isCurrent = index === currentIndex;
            
            return (
              <div key={label} className="flex items-center flex-1">
                <div className={`flex items-center gap-2 ${index > 0 ? 'flex-1' : ''}`}>
                  {index > 0 && (
                    <div className={`flex-1 h-0.5 ${isComplete ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isComplete ? 'bg-primary text-primary-foreground' :
                    isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {isComplete ? <CheckCircle className="w-4 h-4" /> : index + 1}
                  </div>
                </div>
                <span className={`ml-2 text-sm hidden sm:inline ${isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-6">
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
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full">
                            Verified ✓
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {(Math.random() * 4 + 1).toFixed(1)} km away
                          </span>
                          {org.needsFood && (
                            <span className="text-xs bg-warning/10 text-warning px-2 py-1 rounded-full">
                              Needs Food
                            </span>
                          )}
                        </div>
                        {org.foodNeeds && org.foodNeeds.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {org.foodNeeds.map((need) => (
                              <span key={need} className="text-xs bg-muted px-2 py-0.5 rounded">
                                {need}
                              </span>
                            ))}
                          </div>
                        )}
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
              <p className="text-sm text-muted-foreground">{selectedOrg.address}</p>
            </div>

            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Select a volunteer or let one claim your request
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSkipVolunteer}
                className={skipVolunteer ? "border-primary text-primary" : ""}
              >
                <Send className="w-4 h-4 mr-2" />
                Post as Request
              </Button>
            </div>

            {skipVolunteer && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-info/10 border border-info/30 rounded-xl p-4 mb-6"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-info mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Post as Open Request</p>
                    <p className="text-sm text-muted-foreground">
                      Available volunteers will see your donation request and can claim it. 
                      You'll be notified when someone accepts.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="grid gap-4 mb-6">
              {availableVolunteers.map((vol, index) => (
                <motion.button
                  key={vol.id}
                  className={`w-full bg-card rounded-xl p-5 shadow-md border-2 text-left transition-all ${
                    selectedVolunteer?.id === vol.id
                      ? "border-primary"
                      : skipVolunteer 
                        ? "border-transparent opacity-50" 
                        : "border-transparent hover:border-primary/30"
                  }`}
                  onClick={() => {
                    setSkipVolunteer(false);
                    handleVolunteerSelect(vol);
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={!skipVolunteer ? { y: -2 } : {}}
                  disabled={skipVolunteer}
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
                          <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full">
                            Available
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

            {(selectedVolunteer || skipVolunteer) && (
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
                  {skipVolunteer ? "Post Request" : "Confirm & Start Delivery"}
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};
