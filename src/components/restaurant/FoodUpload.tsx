import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, Loader2, CheckCircle, AlertTriangle, XCircle, 
  Sparkles, ThumbsUp, Lightbulb, ChefHat
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/store/appStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { FoodItem, QualityAnalysis } from "@/types";

interface FoodUploadProps {
  onClose: () => void;
  onSuccess: (item: FoodItem) => void;
}

export const FoodUpload = ({ onClose, onSuccess }: FoodUploadProps) => {
  const { currentUser } = useAppStore();
  const [step, setStep] = useState<"form" | "analyzing" | "result" | "not_food">("form");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [qualityAnalysis, setQualityAnalysis] = useState<QualityAnalysis | null>(null);
  const [notFoodMessage, setNotFoodMessage] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    quantity: "",
    unit: "portions",
    preparationTime: "",
    expiryTime: "",
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 4MB for base64)
      if (file.size > 4 * 1024 * 1024) {
        toast.error("Image too large. Please use an image under 4MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeFood = async () => {
    if (!imagePreview) return;
    
    setStep("analyzing");
    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("analyze-food", {
        body: { imageBase64: imagePreview },
      });

      if (error) {
        console.error("Analysis error:", error);
        toast.error("Failed to analyze food. Please try again.");
        setStep("form");
        return;
      }

      if (data.error) {
        toast.error(data.error);
        setStep("form");
        return;
      }

      // Check if it's not food
      if (data.isFood === false) {
        setNotFoodMessage(data.message || "This doesn't appear to be food. Please upload a food image.");
        setStep("not_food");
        return;
      }

      setQualityAnalysis(data as QualityAnalysis);
      setStep("result");
    } catch (err) {
      console.error("Analysis failed:", err);
      toast.error("Analysis failed. Please try again.");
      setStep("form");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    analyzeFood();
  };

  const retryWithNewImage = () => {
    setImagePreview(null);
    setNotFoodMessage("");
    setStep("form");
  };

  const confirmDonation = () => {
    if (!qualityAnalysis || !currentUser) return;
    
    const foodItem: FoodItem = {
      id: `food-${Date.now()}`,
      restaurantId: currentUser.id,
      restaurantName: currentUser.name,
      name: formData.name,
      description: formData.description,
      quantity: parseInt(formData.quantity),
      unit: formData.unit,
      preparationTime: formData.preparationTime,
      expiryTime: formData.expiryTime,
      imageUrl: imagePreview || "",
      qualityAnalysis,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    
    onSuccess(foodItem);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-success";
    if (score >= 70) return "text-warning";
    return "text-destructive";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 85) return "bg-success";
    if (score >= 70) return "bg-warning";
    return "bg-destructive";
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "Excellent": return "text-success bg-success/10 border-success/30";
      case "Good": return "text-primary bg-primary/10 border-primary/30";
      case "Fair": return "text-warning bg-warning/10 border-warning/30";
      case "Poor": return "text-destructive bg-destructive/10 border-destructive/30";
      default: return "text-muted-foreground bg-muted";
    }
  };

  const aspectLabels: Record<string, { label: string; icon: React.ReactNode }> = {
    presentation: { label: "Presentation", icon: <ChefHat className="w-4 h-4" /> },
    freshness: { label: "Freshness", icon: <Sparkles className="w-4 h-4" /> },
    color: { label: "Color", icon: <span className="w-4 h-4 text-center">🎨</span> },
    texture: { label: "Texture", icon: <span className="w-4 h-4 text-center">✨</span> },
    plating: { label: "Plating", icon: <span className="w-4 h-4 text-center">🍽️</span> },
  };

  return (
    <motion.div
      className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-card rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">
              {step === "form" && "Upload Food Donation"}
              {step === "analyzing" && "AI Quality Analysis"}
              {step === "result" && "Analysis Complete"}
              {step === "not_food" && "Not Food Detected"}
            </h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {step === "form" && (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                className="space-y-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>Food Image</Label>
                  <div
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                      imagePreview
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Food preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="space-y-2">
                        <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center">
                          <Camera className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground text-sm">
                          Click to upload food image for AI analysis
                        </p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </div>
                </div>

                {/* Food Details */}
                <div className="space-y-2">
                  <Label htmlFor="name">Food Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Vegetable Curry"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the food..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="10"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <select
                      id="unit"
                      className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    >
                      <option value="portions">Portions</option>
                      <option value="kg">Kilograms</option>
                      <option value="containers">Containers</option>
                      <option value="boxes">Boxes</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prepTime">Prepared At</Label>
                    <Input
                      id="prepTime"
                      type="time"
                      value={formData.preparationTime}
                      onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Best Before</Label>
                    <Input
                      id="expiry"
                      type="time"
                      value={formData.expiryTime}
                      onChange={(e) => setFormData({ ...formData, expiryTime: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" variant="hero" className="w-full" size="lg" disabled={!imagePreview}>
                  <Sparkles className="w-4 h-4" />
                  Analyze with AI
                </Button>
              </motion.form>
            )}

            {step === "analyzing" && (
              <motion.div
                key="analyzing"
                className="text-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-primary/20"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div
                    className="absolute inset-2 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Analyzing Food Quality
                </h3>
                <p className="text-muted-foreground text-sm">
                  AI is evaluating presentation, freshness, color, texture, and plating...
                </p>
              </motion.div>
            )}

            {step === "not_food" && (
              <motion.div
                key="not_food"
                className="text-center py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="w-20 h-20 mx-auto mb-6 bg-warning/10 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-warning" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Not a Food Image
                </h3>
                <p className="text-muted-foreground mb-6">
                  {notFoodMessage}
                </p>
                <Button variant="hero" onClick={retryWithNewImage}>
                  <Camera className="w-4 h-4" />
                  Upload Food Image
                </Button>
              </motion.div>
            )}

            {step === "result" && qualityAnalysis && (
              <motion.div
                key="result"
                className="space-y-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Overall Score & Rating */}
                <div className="text-center p-6 bg-muted/50 rounded-xl">
                  <div className={`text-5xl font-bold mb-2 ${getScoreColor(qualityAnalysis.overallScore)}`}>
                    {qualityAnalysis.overallScore}
                    <span className="text-2xl text-muted-foreground">/100</span>
                  </div>
                  <div className={`inline-block px-4 py-1 rounded-full text-sm font-medium border ${getRatingColor(qualityAnalysis.qualityRating)}`}>
                    {qualityAnalysis.qualityRating} Quality
                  </div>
                </div>

                {/* Aspect Scores */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">Quality Analysis</h4>
                  {Object.entries(qualityAnalysis.aspects).map(([key, aspect]) => (
                    <div key={key} className="p-3 bg-muted/30 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {aspectLabels[key]?.icon}
                          <span className="font-medium text-foreground text-sm">
                            {aspectLabels[key]?.label || key}
                          </span>
                        </div>
                        <span className={`font-bold text-sm ${getScoreColor(aspect.score)}`}>
                          {aspect.score}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mb-2">
                        <motion.div
                          className={`h-2 rounded-full ${getScoreBgColor(aspect.score)}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${aspect.score}%` }}
                          transition={{ duration: 0.6, delay: 0.1 }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{aspect.comment}</p>
                    </div>
                  ))}
                </div>

                {/* Positive Points */}
                {qualityAnalysis.positivePoints.length > 0 && (
                  <div className="p-4 bg-success/5 border border-success/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <ThumbsUp className="w-4 h-4 text-success" />
                      <h4 className="font-semibold text-success text-sm">What's Great</h4>
                    </div>
                    <ul className="space-y-1">
                      {qualityAnalysis.positivePoints.map((point, i) => (
                        <li key={i} className="text-sm text-foreground flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 text-success mt-1 flex-shrink-0" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvements */}
                {qualityAnalysis.improvements.length > 0 && (
                  <div className="p-4 bg-warning/5 border border-warning/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="w-4 h-4 text-warning" />
                      <h4 className="font-semibold text-warning text-sm">Suggestions</h4>
                    </div>
                    <ul className="space-y-1">
                      {qualityAnalysis.improvements.map((item, i) => (
                        <li key={i} className="text-sm text-foreground flex items-start gap-2">
                          <span className="text-warning mt-0.5">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Summary */}
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                  <p className="text-sm text-foreground">{qualityAnalysis.summary}</p>
                </div>

                {/* Recommendation */}
                <div className={`p-4 rounded-xl ${
                  qualityAnalysis.recommendation.includes("Approved") 
                    ? "bg-success/10 border border-success/30" 
                    : "bg-warning/10 border border-warning/30"
                }`}>
                  <p className={`font-medium text-sm ${
                    qualityAnalysis.recommendation.includes("Approved") ? "text-success" : "text-warning"
                  }`}>
                    📋 {qualityAnalysis.recommendation}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button variant="hero" className="flex-1" onClick={confirmDonation}>
                    Confirm Donation
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};
