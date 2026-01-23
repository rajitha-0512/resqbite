import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, X, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/store/appStore";
import { useToast } from "@/hooks/use-toast";
import type { FoodRequest, Organization } from "@/types";

interface FoodRequestFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

const foodTypeOptions = [
  "Prepared meals",
  "Fresh produce",
  "Canned goods",
  "Dry goods",
  "Dairy products",
  "Bakery items",
  "Beverages",
  "Frozen foods",
];

export const FoodRequestForm = ({ onBack, onSuccess }: FoodRequestFormProps) => {
  const { currentUser, addFoodRequest } = useAppStore();
  const { toast } = useToast();
  const org = currentUser as Organization;

  const [selectedFoodTypes, setSelectedFoodTypes] = useState<string[]>([]);
  const [quantity, setQuantity] = useState("");
  const [urgency, setUrgency] = useState<"low" | "medium" | "high">("medium");
  const [notes, setNotes] = useState("");

  const toggleFoodType = (type: string) => {
    setSelectedFoodTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFoodTypes.length === 0) {
      toast({
        title: "Please select food types",
        description: "Select at least one type of food you need.",
        variant: "destructive",
      });
      return;
    }

    const request: FoodRequest = {
      id: `req-${Date.now()}`,
      organizationId: org.id,
      organizationName: org.name,
      organizationAddress: org.address,
      foodTypes: selectedFoodTypes,
      quantity: quantity || "Any amount welcome",
      urgency,
      notes: notes || undefined,
      status: "active",
      createdAt: new Date().toISOString(),
    };

    addFoodRequest(request);

    toast({
      title: "Request Posted! 📢",
      description: "Restaurants will be notified of your food needs.",
    });

    onSuccess();
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <div className="bg-card border-b border-border shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Button variant="ghost" onClick={onBack} className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-xl font-bold text-foreground">
            Request Food Donation
          </h1>
          <p className="text-muted-foreground">
            Let restaurants know what food your organization needs
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Food Types */}
          <motion.div
            className="bg-card rounded-xl p-6 shadow-md border border-border/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Label className="text-base font-semibold mb-4 block">
              What types of food do you need?
            </Label>
            <div className="flex flex-wrap gap-2">
              {foodTypeOptions.map((type) => {
                const isSelected = selectedFoodTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleFoodType(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {isSelected && <CheckCircle className="w-3 h-3 inline mr-1" />}
                    {type}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Quantity */}
          <motion.div
            className="bg-card rounded-xl p-6 shadow-md border border-border/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Label htmlFor="quantity" className="text-base font-semibold mb-4 block">
              Quantity needed
            </Label>
            <Input
              id="quantity"
              placeholder="e.g., 50 servings, 20 kg, Any amount welcome"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </motion.div>

          {/* Urgency */}
          <motion.div
            className="bg-card rounded-xl p-6 shadow-md border border-border/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Label className="text-base font-semibold mb-4 block">
              How urgent is this request?
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "low", label: "Low", color: "bg-muted" },
                { value: "medium", label: "Medium", color: "bg-warning/10 border-warning/30" },
                { value: "high", label: "High", color: "bg-destructive/10 border-destructive/30" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setUrgency(option.value as typeof urgency)}
                  className={`p-3 rounded-lg text-sm font-medium border-2 transition-all ${
                    urgency === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : `border-transparent ${option.color}`
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Notes */}
          <motion.div
            className="bg-card rounded-xl p-6 shadow-md border border-border/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Label htmlFor="notes" className="text-base font-semibold mb-4 block">
              Additional notes (optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Any specific requirements or information for donors..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </motion.div>

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={selectedFoodTypes.length === 0}
            >
              <Plus className="w-5 h-5 mr-2" />
              Post Request
            </Button>
          </motion.div>
        </form>
      </div>
    </div>
  );
};