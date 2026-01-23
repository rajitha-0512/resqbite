export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "restaurant" | "organization" | "volunteer";
  location?: string;
  avatar?: string;
}

export interface Restaurant extends User {
  role: "restaurant";
  address: string;
  cuisineType?: string;
}

export interface Organization extends User {
  role: "organization";
  address: string;
  documentVerified: boolean;
  organizationType: "shelter" | "food_bank" | "community_kitchen" | "other";
  needsFood?: boolean;
  foodNeeds?: string[];
}

export interface Volunteer extends User {
  role: "volunteer";
  vehicleType?: "bike" | "car" | "scooter" | "walk";
  earnings: number;
  completedDeliveries: number;
  rating: number;
  isAvailable?: boolean;
}

export interface FoodItem {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress?: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  preparationTime: string;
  expiryTime: string;
  imageUrl: string;
  qualityAnalysis?: QualityAnalysis;
  status: "pending" | "matched" | "picked_up" | "delivered";
  createdAt: string;
}

export interface QualityAnalysis {
  overallScore: number;
  freshness: { score: number; details: string };
  packaging: { score: number; details: string };
  hygiene: { score: number; details: string };
  recommendation: string;
}

export interface FoodRequest {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationAddress: string;
  foodTypes: string[];
  quantity: string;
  urgency: "low" | "medium" | "high";
  notes?: string;
  status: "active" | "fulfilled" | "cancelled";
  createdAt: string;
}

export interface Delivery {
  id: string;
  foodItemId: string;
  foodItem: FoodItem;
  restaurantId: string;
  restaurantName?: string;
  restaurantAddress?: string;
  organizationId: string;
  organizationName: string;
  organizationAddress?: string;
  volunteerId?: string;
  volunteerName?: string;
  volunteerPhone?: string;
  status: "pending" | "volunteer_assigned" | "picked_up" | "in_transit" | "delivered";
  pickupTime?: string;
  deliveryTime?: string;
  payment?: number;
  distance?: string;
  estimatedTime?: string;
  createdAt: string;
}

export interface DeliveryRequest {
  id: string;
  delivery: Delivery;
  distance: string;
  payment: number;
  estimatedTime: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "delivery_created" | "volunteer_assigned" | "picked_up" | "delivered" | "new_request";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedDeliveryId?: string;
}
