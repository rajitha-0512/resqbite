import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, FoodItem, Delivery, Restaurant, Organization, Volunteer, FoodRequest, Notification } from "@/types";

interface AppState {
  currentUser: User | null;
  foodItems: FoodItem[];
  deliveries: Delivery[];
  organizations: Organization[];
  volunteers: Volunteer[];
  restaurants: Restaurant[];
  foodRequests: FoodRequest[];
  notifications: Notification[];
  
  // Auth actions
  setCurrentUser: (user: User | null) => void;
  
  // Food actions
  addFoodItem: (item: FoodItem) => void;
  updateFoodItem: (id: string, updates: Partial<FoodItem>) => void;
  
  // Delivery actions
  addDelivery: (delivery: Delivery) => void;
  updateDelivery: (id: string, updates: Partial<Delivery>) => void;
  
  // Organization actions
  addOrganization: (org: Organization) => void;
  
  // Volunteer actions
  addVolunteer: (volunteer: Volunteer) => void;
  updateVolunteerEarnings: (id: string, amount: number) => void;
  setVolunteerAvailability: (id: string, available: boolean) => void;
  
  // Restaurant actions
  addRestaurant: (restaurant: Restaurant) => void;
  
  // Food Request actions
  addFoodRequest: (request: FoodRequest) => void;
  updateFoodRequest: (id: string, updates: Partial<FoodRequest>) => void;
  
  // Notification actions
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: (userId: string) => void;
  
  // Getters
  getDeliveriesForRestaurant: (restaurantId: string) => Delivery[];
  getDeliveriesForOrganization: (organizationId: string) => Delivery[];
  getDeliveriesForVolunteer: (volunteerId: string) => Delivery[];
  getPendingDeliveries: () => Delivery[];
  getActiveFoodRequests: () => FoodRequest[];
  getNotificationsForUser: (userId: string) => Notification[];
  
  // Reset
  logout: () => void;
}

// Mock organizations
const mockOrganizations: Organization[] = [
  {
    id: "org-1",
    name: "Hope Shelter",
    email: "contact@hopeshelter.org",
    phone: "555-0101",
    role: "organization",
    address: "123 Main Street",
    location: "Downtown",
    documentVerified: true,
    organizationType: "shelter",
    needsFood: true,
    foodNeeds: ["Prepared meals", "Fresh produce"],
  },
  {
    id: "org-2",
    name: "City Food Bank",
    email: "info@cityfoodbank.org",
    phone: "555-0102",
    role: "organization",
    address: "456 Oak Avenue",
    location: "Midtown",
    documentVerified: true,
    organizationType: "food_bank",
    needsFood: true,
    foodNeeds: ["Canned goods", "Dry goods", "Fresh produce"],
  },
  {
    id: "org-3",
    name: "Community Kitchen",
    email: "hello@communitykitchen.org",
    phone: "555-0103",
    role: "organization",
    address: "789 Pine Road",
    location: "Eastside",
    documentVerified: true,
    organizationType: "community_kitchen",
    needsFood: true,
    foodNeeds: ["Prepared meals", "Ingredients"],
  },
];

// Mock volunteers
const mockVolunteers: Volunteer[] = [
  {
    id: "vol-1",
    name: "Alex Driver",
    email: "alex@email.com",
    phone: "555-0201",
    role: "volunteer",
    vehicleType: "car",
    earnings: 245.50,
    completedDeliveries: 23,
    rating: 4.9,
    location: "Downtown",
    isAvailable: true,
  },
  {
    id: "vol-2",
    name: "Sam Rider",
    email: "sam@email.com",
    phone: "555-0202",
    role: "volunteer",
    vehicleType: "bike",
    earnings: 178.00,
    completedDeliveries: 18,
    rating: 4.7,
    location: "Midtown",
    isAvailable: true,
  },
];

// Mock food requests from organizations
const mockFoodRequests: FoodRequest[] = [
  {
    id: "req-1",
    organizationId: "org-1",
    organizationName: "Hope Shelter",
    organizationAddress: "123 Main Street",
    foodTypes: ["Prepared meals", "Fresh produce"],
    quantity: "50+ servings",
    urgency: "high",
    notes: "Evening meal needed for 50 residents",
    status: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "req-2",
    organizationId: "org-2",
    organizationName: "City Food Bank",
    organizationAddress: "456 Oak Avenue",
    foodTypes: ["Canned goods", "Dry goods"],
    quantity: "Any amount welcome",
    urgency: "medium",
    status: "active",
    createdAt: new Date().toISOString(),
  },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      foodItems: [],
      deliveries: [],
      organizations: mockOrganizations,
      volunteers: mockVolunteers,
      restaurants: [],
      foodRequests: mockFoodRequests,
      notifications: [],

      setCurrentUser: (user) => set({ currentUser: user }),

      addFoodItem: (item) =>
        set((state) => ({ foodItems: [...state.foodItems, item] })),

      updateFoodItem: (id, updates) =>
        set((state) => ({
          foodItems: state.foodItems.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),

      addDelivery: (delivery) =>
        set((state) => ({ deliveries: [...state.deliveries, delivery] })),

      updateDelivery: (id, updates) =>
        set((state) => ({
          deliveries: state.deliveries.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        })),

      addOrganization: (org) =>
        set((state) => ({ organizations: [...state.organizations, org] })),

      addVolunteer: (volunteer) =>
        set((state) => ({ volunteers: [...state.volunteers, volunteer] })),

      updateVolunteerEarnings: (id, amount) =>
        set((state) => ({
          volunteers: state.volunteers.map((v) =>
            v.id === id
              ? { ...v, earnings: v.earnings + amount, completedDeliveries: v.completedDeliveries + 1 }
              : v
          ),
        })),

      setVolunteerAvailability: (id, available) =>
        set((state) => ({
          volunteers: state.volunteers.map((v) =>
            v.id === id ? { ...v, isAvailable: available } : v
          ),
        })),

      addRestaurant: (restaurant) =>
        set((state) => ({ restaurants: [...state.restaurants, restaurant] })),

      addFoodRequest: (request) =>
        set((state) => ({ foodRequests: [...state.foodRequests, request] })),

      updateFoodRequest: (id, updates) =>
        set((state) => ({
          foodRequests: state.foodRequests.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),

      addNotification: (notification) =>
        set((state) => ({ notifications: [...state.notifications, notification] })),

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      clearNotifications: (userId) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.userId !== userId),
        })),

      // Getters
      getDeliveriesForRestaurant: (restaurantId) =>
        get().deliveries.filter((d) => d.restaurantId === restaurantId),

      getDeliveriesForOrganization: (organizationId) =>
        get().deliveries.filter((d) => d.organizationId === organizationId),

      getDeliveriesForVolunteer: (volunteerId) =>
        get().deliveries.filter((d) => d.volunteerId === volunteerId),

      getPendingDeliveries: () =>
        get().deliveries.filter((d) => d.status === "pending" && !d.volunteerId),

      getActiveFoodRequests: () =>
        get().foodRequests.filter((r) => r.status === "active"),

      getNotificationsForUser: (userId) =>
        get().notifications.filter((n) => n.userId === userId),

      logout: () => set({ currentUser: null }),
    }),
    {
      name: "resqbite-storage",
    }
  )
);
