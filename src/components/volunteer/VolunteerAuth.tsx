import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Truck, Mail, Phone, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface VolunteerAuthProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const VolunteerAuth = ({ onBack, onSuccess }: VolunteerAuthProps) => {
  const [isLogin, setIsLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    vehicleType: "bike" as "bike" | "scooter" | "car" | "walk",
  });
  const { signUp, signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        await signIn(formData.email, formData.password);
        toast.success("Welcome back!");
      } else {
        await signUp({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          role: "volunteer",
          vehicleType: formData.vehicleType,
        });
        toast.success("Account created successfully!");
      }
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const vehicleOptions = [
    { value: "bike", label: "Bicycle", icon: "🚲" },
    { value: "scooter", label: "Scooter", icon: "🛵" },
    { value: "car", label: "Car", icon: "🚗" },
    { value: "walk", label: "Walking", icon: "🚶" },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero p-6">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Button variant="ghost" onClick={onBack} className="gap-2" disabled={isLoading}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </motion.div>

        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Logo size="md" />
          <h1 className="mt-6 text-2xl font-bold text-foreground">
            {isLogin ? "Welcome Back" : "Join as a Volunteer"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isLogin
              ? "Sign in to continue delivering"
              : "Help deliver food and earn rewards"}
          </p>
        </motion.div>

        <motion.div
          className="bg-card rounded-2xl p-6 shadow-lg border border-border/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Your Full Name"
                    className="pl-10"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 234 567 8900"
                      className="pl-10"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Vehicle Type</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {vehicleOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, vehicleType: option.value as typeof formData.vehicleType })}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          formData.vehicleType === option.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        }`}
                        disabled={isLoading}
                      >
                        <div className="text-2xl mb-1">{option.icon}</div>
                        <p className="text-xs text-muted-foreground">{option.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full bg-info hover:bg-info/90 text-info-foreground" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isLogin ? "Signing In..." : "Creating Account..."}
                </>
              ) : (
                isLogin ? "Sign In" : "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
              disabled={isLoading}
            >
              {isLogin
                ? "Don't have an account? Register"
                : "Already have an account? Sign In"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
