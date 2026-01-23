import type { Notification, Delivery } from "@/types";

export const createNotification = (
  userId: string,
  type: Notification["type"],
  title: string,
  message: string,
  relatedDeliveryId?: string
): Notification => ({
  id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  userId,
  type,
  title,
  message,
  read: false,
  createdAt: new Date().toISOString(),
  relatedDeliveryId,
});

export const createDeliveryNotifications = (
  delivery: Delivery,
  eventType: "created" | "volunteer_assigned" | "picked_up" | "delivered"
): Notification[] => {
  const notifications: Notification[] = [];
  const now = new Date().toISOString();
  const baseId = `notif-${Date.now()}`;

  switch (eventType) {
    case "created":
      // Notify organization
      notifications.push({
        id: `${baseId}-org`,
        userId: delivery.organizationId,
        type: "delivery_created",
        title: "New Food Donation Incoming! 🍽️",
        message: `${delivery.foodItem.restaurantName} is donating ${delivery.foodItem.name}. A volunteer will pick it up soon.`,
        read: false,
        createdAt: now,
        relatedDeliveryId: delivery.id,
      });
      break;

    case "volunteer_assigned":
      // Notify restaurant
      notifications.push({
        id: `${baseId}-rest`,
        userId: delivery.restaurantId,
        type: "volunteer_assigned",
        title: "Volunteer Assigned! 🚴",
        message: `${delivery.volunteerName} is on the way to pick up your donation.`,
        read: false,
        createdAt: now,
        relatedDeliveryId: delivery.id,
      });
      // Notify organization
      notifications.push({
        id: `${baseId}-org`,
        userId: delivery.organizationId,
        type: "volunteer_assigned",
        title: "Volunteer Assigned! 🚴",
        message: `${delivery.volunteerName} will deliver ${delivery.foodItem.name} to you.`,
        read: false,
        createdAt: now,
        relatedDeliveryId: delivery.id,
      });
      break;

    case "picked_up":
      // Notify restaurant
      notifications.push({
        id: `${baseId}-rest`,
        userId: delivery.restaurantId,
        type: "picked_up",
        title: "Food Picked Up! 📦",
        message: `Your donation has been picked up and is on the way to ${delivery.organizationName}.`,
        read: false,
        createdAt: now,
        relatedDeliveryId: delivery.id,
      });
      // Notify organization
      notifications.push({
        id: `${baseId}-org`,
        userId: delivery.organizationId,
        type: "picked_up",
        title: "On The Way! 🚗",
        message: `${delivery.foodItem.name} has been picked up and is heading your way.`,
        read: false,
        createdAt: now,
        relatedDeliveryId: delivery.id,
      });
      break;

    case "delivered":
      // Notify restaurant
      notifications.push({
        id: `${baseId}-rest`,
        userId: delivery.restaurantId,
        type: "delivered",
        title: "Delivered Successfully! ✅",
        message: `Your donation has been delivered to ${delivery.organizationName}. Thank you for helping!`,
        read: false,
        createdAt: now,
        relatedDeliveryId: delivery.id,
      });
      // Notify volunteer
      if (delivery.volunteerId) {
        notifications.push({
          id: `${baseId}-vol`,
          userId: delivery.volunteerId,
          type: "delivered",
          title: "Delivery Complete! 💰",
          message: `You earned $${delivery.payment} for this delivery. Great job!`,
          read: false,
          createdAt: now,
          relatedDeliveryId: delivery.id,
        });
      }
      break;
  }

  return notifications;
};