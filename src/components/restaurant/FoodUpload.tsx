import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Upload, Camera, Clock, Package, Loader2, 
  CheckCircle, AlertTriangle, XCircle, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/store/appStore";
import type { FoodItem, QualityAnalysis } from "@/types";

interface FoodUploadProps {
  onClose: () => void;
  onSuccess: (item: FoodItem) => void;
}

export const FoodUpload = ({ onClose, onSuccess }: FoodUploadProps) => {
  const { currentUser } = useAppStore();
  const [step, setStep] = useState<"form" | "analyzing" | "result">("form");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [qualityAnalysis, setQualityAnalysis] = useState<QualityAnalysis | null>(null);
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeFood = async () => {
    setStep("analyzing");
    
    // Simulate AI analysis with OpenCV-like scoring
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const analysis: QualityAnalysis = {
      overallScore: Math.floor(Math.random() * 20) + 80,
      freshness: {
        score: Math.floor(Math.random() * 15) + 85,
        details: "Food appears fresh with vibrant colors and no visible signs of spoilage",
      },
      packaging: {
        score: Math.floor(Math.random() * 20) + 75,
        details: "Properly sealed containers maintaining food temperature and preventing contamination",
      },
      hygiene: {
        score: Math.floor(Math.random() * 15) + 80,
        details: "Clean preparation environment detected, following food safety standards",
      },
      recommendation: "✅ Approved for donation. Food meets quality standards for safe consumption.",
    };
    
    setQualityAnalysis(analysis);
    setStep("result");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    analyzeFood();
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

  const getScoreIcon = (score: number) => {
    if (score >= 85) return CheckCircle;
    if (score >= 70) return AlertTriangle;
    return XCircle;
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
                  Using AI to assess freshness, packaging, and hygiene...
                </p>
              </motion.div>
            )}

            {step === "result" && qualityAnalysis && (
              <motion.div
                key="result"
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Overall Score */}
                <div className="text-center p-6 bg-muted/50 rounded-xl">
                  <div className={`text-5xl font-bold ${getScoreColor(qualityAnalysis.overallScore)}`}>
                    {qualityAnalysis.overallScore}%
                  </div>
                  <p className="text-muted-foreground mt-2">Overall Quality Score</p>
                </div>

                {/* Detailed Scores */}
                <div className="space-y-4">
                  {[
                    { label: "Freshness", data: qualityAnalysis.freshness },
                    { label: "Packaging", data: qualityAnalysis.packaging },
                    { label: "Hygiene", data: qualityAnalysis.hygiene },
                  ].map((item) => {
                    const ScoreIcon = getScoreIcon(item.data.score);
                    return (
                      <div key={item.label} className="p-4 bg-muted/30 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-foreground">{item.label}</span>
                          <div className={`flex items-center gap-1 ${getScoreColor(item.data.score)}`}>
                            <ScoreIcon className="w-4 h-4" />
                            <span className="font-bold">{item.data.score}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 mb-2">
                          <motion.div
                            className={`h-2 rounded-full ${
                              item.data.score >= 85 ? "bg-success" :
                              item.data.score >= 70 ? "bg-warning" : "bg-destructive"
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${item.data.score}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">{item.data.details}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Recommendation */}
                <div className="p-4 bg-success/10 border border-success/30 rounded-xl">
                  <p className="text-success font-medium">{qualityAnalysis.recommendation}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
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
