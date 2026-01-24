import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/store/appStore";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
  const [isSaving, setIsSaving] = useState(false);

  const toggleFoodType = (type: string) => {
    setSelectedFoodTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFoodTypes.length === 0) {
      toast({
        title: "Please select food types",
        description: "Select at least one type of food you need.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Get organization record for current user
      const { data: organization, error: orgError } = await supabase
        .from("organizations")
        .select("id, name, address")
        .eq("user_id", currentUser?.id)
        .single();

      if (orgError || !organization) {
        toast({
          title: "Error",
          description: "Could not find organization record",
          variant: "destructive",
        });
        return;
      }

      // Insert food request into database
      const { data: requestData, error: insertError } = await supabase
        .from("food_requests")
        .insert({
          organization_id: organization.id,
          food_type: selectedFoodTypes.join(", "),
          quantity: quantity || "Any amount welcome",
          urgency,
          notes: notes || null,
          status: "active",
        })
        .select()
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        toast({
          title: "Error",
          description: "Failed to post request: " + insertError.message,
          variant: "destructive",
        });
        return;
      }

      // Also add to local store for immediate UI update
      const request: FoodRequest = {
        id: requestData.id,
        organizationId: organization.id,
        organizationName: organization.name,
        organizationAddress: organization.address || "",
        foodTypes: selectedFoodTypes,
        quantity: quantity || "Any amount welcome",
        urgency,
        notes: notes || undefined,
        status: "active",
        createdAt: requestData.created_at,
      };

      addFoodRequest(request);

      toast({
        title: "Request Posted! 📢",
        description: "Restaurants will be notified of your food needs.",
      });

      onSuccess();
    } catch (err) {
      console.error("Save failed:", err);
      toast({
        title: "Error",
        description: "Failed to post request",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="bg-card border-b border-border shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Button variant="ghost" onClick={onBack} className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-xl font-bold text-foreground">Request Food Donation</h1>
          <p className="text-muted-foreground">Let restaurants know what food your organization needs</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div className="bg-card rounded-xl p-6 shadow-md border border-border/50" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Label className="text-base font-semibold mb-4 block">What types of food do you need?</Label>
            <div className="flex flex-wrap gap-2">
              {foodTypeOptions.map((type) => {
                const isSelected = selectedFoodTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleFoodType(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {isSelected && <CheckCircle className="w-3 h-3 inline mr-1" />}
                    {type}
                  </button>
                );
              })}
            </div>
          </motion.div>

          <motion.div className="bg-card rounded-xl p-6 shadow-md border border-border/50" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Label htmlFor="quantity" className="text-base font-semibold mb-4 block">Quantity needed</Label>
            <Input id="quantity" placeholder="e.g., 50 servings, 20 kg, Any amount welcome" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </motion.div>

          <motion.div className="bg-card rounded-xl p-6 shadow-md border border-border/50" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Label className="text-base font-semibold mb-4 block">How urgent is this request?</Label>
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
                    urgency === option.value ? "border-primary bg-primary/10 text-primary" : `border-transparent ${option.color}`
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div className="bg-card rounded-xl p-6 shadow-md border border-border/50" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Label htmlFor="notes" className="text-base font-semibold mb-4 block">Additional notes (optional)</Label>
            <Textarea id="notes" placeholder="Any specific requirements or information for donors..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={selectedFoodTypes.length === 0 || isSaving}>
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Plus className="w-5 h-5 mr-2" />}
              {isSaving ? "Posting..." : "Post Request"}
            </Button>
          </motion.div>
        </form>
      </div>
    </div>
  );
};
