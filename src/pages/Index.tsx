import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { RoleSelection, type UserRole } from "@/components/RoleSelection";
import { RestaurantAuth } from "@/components/restaurant/RestaurantAuth";
import { RestaurantDashboard } from "@/components/restaurant/RestaurantDashboard";
import { OrganizationAuth } from "@/components/organization/OrganizationAuth";
import { OrganizationDashboard } from "@/components/organization/OrganizationDashboard";
import { VolunteerAuth } from "@/components/volunteer/VolunteerAuth";
import { VolunteerDashboard } from "@/components/volunteer/VolunteerDashboard";
import { useAppStore } from "@/store/appStore";

type Screen = 
  | "welcome" 
  | "role-selection" 
  | "restaurant-auth" 
  | "restaurant-dashboard"
  | "organization-auth"
  | "organization-dashboard"
  | "volunteer-auth"
  | "volunteer-dashboard";

const Index = () => {
  const { currentUser, logout } = useAppStore();
  const [screen, setScreen] = useState<Screen>(
    currentUser ? `${currentUser.role}-dashboard` as Screen : "welcome"
  );
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleGetStarted = () => {
    setScreen("role-selection");
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setScreen(`${role}-auth` as Screen);
  };

  const handleAuthSuccess = () => {
    if (selectedRole) {
      setScreen(`${selectedRole}-dashboard` as Screen);
    }
  };

  const handleLogout = () => {
    logout();
    setSelectedRole(null);
    setScreen("welcome");
  };

  const handleBackToRoles = () => {
    setSelectedRole(null);
    setScreen("role-selection");
  };

  return (
    <AnimatePresence mode="wait">
      {screen === "welcome" && (
        <WelcomeScreen onGetStarted={handleGetStarted} />
      )}
      
      {screen === "role-selection" && (
        <RoleSelection 
          onSelectRole={handleRoleSelect} 
          onBack={() => setScreen("welcome")}
        />
      )}
      
      {screen === "restaurant-auth" && (
        <RestaurantAuth 
          onBack={handleBackToRoles} 
          onSuccess={handleAuthSuccess}
        />
      )}
      
      {screen === "restaurant-dashboard" && (
        <RestaurantDashboard onLogout={handleLogout} />
      )}
      
      {screen === "organization-auth" && (
        <OrganizationAuth 
          onBack={handleBackToRoles} 
          onSuccess={handleAuthSuccess}
        />
      )}
      
      {screen === "organization-dashboard" && (
        <OrganizationDashboard onLogout={handleLogout} />
      )}
      
      {screen === "volunteer-auth" && (
        <VolunteerAuth 
          onBack={handleBackToRoles} 
          onSuccess={handleAuthSuccess}
        />
      )}
      
      {screen === "volunteer-dashboard" && (
        <VolunteerDashboard onLogout={handleLogout} />
      )}
    </AnimatePresence>
  );
};

export default Index;
