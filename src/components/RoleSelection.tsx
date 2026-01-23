import { motion } from "framer-motion";
import { Building2, Heart, Truck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

export type UserRole = "restaurant" | "organization" | "volunteer";

interface RoleSelectionProps {
  onSelectRole: (role: UserRole) => void;
  onBack: () => void;
}

const roles = [
  {
    id: "restaurant" as UserRole,
    title: "Restaurant",
    description: "Donate surplus food and help reduce waste while feeding those in need",
    icon: Building2,
    color: "from-primary to-emerald-500",
    features: ["Upload food with AI analysis", "Track deliveries", "Digital payments"],
  },
  {
    id: "organization" as UserRole,
    title: "Organization",
    description: "Receive food donations for shelters, food banks, and community kitchens",
    icon: Heart,
    color: "from-accent to-orange-400",
    features: ["Get notified of donations", "Track incoming deliveries", "Manage requests"],
  },
  {
    id: "volunteer" as UserRole,
    title: "Volunteer",
    description: "Pick up and deliver food donations while earning rewards",
    icon: Truck,
    color: "from-info to-cyan-400",
    features: ["View pickup requests", "Earn per delivery", "Track your earnings"],
  },
];

export const RoleSelection = ({ onSelectRole, onBack }: RoleSelectionProps) => {
  return (
    <div className="min-h-screen bg-gradient-hero p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </motion.div>

        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Logo size="md" />
          <h1 className="mt-6 text-3xl font-bold text-foreground">
            Choose Your Role
          </h1>
          <p className="mt-2 text-muted-foreground text-lg">
            Select how you'd like to participate in reducing food waste
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mt-8">
          {roles.map((role, index) => (
            <motion.button
              key={role.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectRole(role.id)}
              className="bg-card rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 text-left border border-border/50 group"
            >
              <div
                className={`w-16 h-16 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
              >
                <role.icon className="w-8 h-8 text-primary-foreground" />
              </div>

              <h3 className="text-xl font-bold text-foreground mb-2">
                {role.title}
              </h3>
              <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                {role.description}
              </p>

              <ul className="space-y-2">
                {role.features.map((feature) => (
                  <li
                    key={feature}
                    className="text-sm text-muted-foreground flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-4 border-t border-border">
                <span className="text-primary font-semibold text-sm group-hover:underline">
                  Continue as {role.title} →
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};
