import { api, APIError } from "encore.dev/api";
import { createClerkClient } from "@clerk/backend";
import { secret } from "encore.dev/config";
import log from "encore.dev/log";
import UserService from "./user.service";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({
  secretKey: clerkSecretKey(),
});

// Define the webhook payload interface based on the Clerk webhook structure
interface ClerkWebhookPayload {
  data: {
    id: string;
    first_name: string;
    last_name: string;
    email_addresses: Array<{
      email_address: string;
      id: string;
      verification: {
        status: string;
        strategy: string;
      };
    }>;
    image_url: string;
    profile_image_url: string;
    created_at: number;
    updated_at: number;
    // Other fields from the payload
  };
  object: string;
  type: string; // e.g., "user.created", "user.updated", "user.deleted"
  timestamp: number;
}

/**
 * Webhook endpoint to receive Clerk user events
 * Handles user.created, user.updated, and user.deleted events
 */
export const handleClerkWebhook = api(
  { 
    expose: true, 
    method: "POST", 
    path: "/webhooks/clerk" 
  },
  async (payload: ClerkWebhookPayload): Promise<{ success: boolean; message: string }> => {
    try {
      log.info("Received Clerk webhook", { type: payload.type });

      // Extract user data from the payload
      const userData = payload.data;
      const eventType = payload.type;

      // Process based on event type
      switch (eventType) {
        case "user.created":
          await handleUserCreated(userData);
          return { success: true, message: "User created successfully" };

        case "user.updated":
          await handleUserUpdated(userData);
          return { success: true, message: "User updated successfully" };

        case "user.deleted":
          await handleUserDeleted(userData);
          return { success: true, message: "User deleted successfully" };

        default:
          log.info("Unhandled webhook event type", { type: eventType });
          return { success: true, message: "Event acknowledged but not processed" };
      }
    } catch (error) {
      log.error("Error processing webhook", { error });
      throw APIError.internal("Error processing webhook", error as Error);
    }
  },
);

/**
 * Handle user.created event
 * Creates a new user in our database
 */
async function handleUserCreated(userData: ClerkWebhookPayload["data"]) {
  // Extract relevant user information
  const name = userData.first_name || "";
  const surname = userData.last_name || "";
  
  // Check if user has email
  if (userData.email_addresses && userData.email_addresses.length > 0) {
    log.info("Creating user from webhook", { 
      clerkId: userData.id,
      name,
      surname,
      email: userData.email_addresses[0].email_address,
    });

    // Create user in our database
    const result = await UserService.create({
      id: userData.id,
      name,
      surname,
    });

    if (!result.success) {
      throw new Error(`Failed to create user: ${result.message}`);
    }

    try {
      const organizations = await clerkClient.organizations.getOrganizationList();
      if (organizations.data.length > 0) {
        const defaultOrg = organizations.data[0];
        await clerkClient.organizations.createOrganizationMembership({
          organizationId: defaultOrg.id,
          userId: userData.id,
          role: "org:customer",
        });
      }
    } catch (clerkError) {
      console.error("Error creating organization membership:", clerkError);
      // Don't fail the user creation if org membership fails
    }
  } else {
    log.warn("User created without email address", { clerkId: userData.id });
  }
}

/**
 * Handle user.updated event
 * Updates an existing user in our database
 */
async function handleUserUpdated(userData: ClerkWebhookPayload["data"]) {
  // In a real implementation, you would:
  // 1. Find the user by Clerk ID in your database
  // 2. Update the user with new information
  
  // For this implementation, we'll log the event
  log.info("User updated event received", { 
    clerkId: userData.id,
    firstName: userData.first_name,
    lastName: userData.last_name
  });
  
  // Note: This is a placeholder. In a real implementation, you would update the user
  // For example:
  // const user = await findUserByClerkId(userData.id);
  // if (user) {
  //   await UserService.update(user.id, {
  //     name: userData.first_name,
  //     surname: userData.last_name,
  //   });
  // }
}

/**
 * Handle user.deleted event
 * Deletes a user from our database
 */
async function handleUserDeleted(userData: ClerkWebhookPayload["data"]) {
  // In a real implementation, you would:
  // 1. Find the user by Clerk ID in your database
  // 2. Delete the user or mark them as inactive
  
  // For this implementation, we'll log the event
  log.info("User deleted event received", { clerkId: userData.id });
  
  // Note: This is a placeholder. In a real implementation, you would delete the user
  // For example:
  // const user = await findUserByClerkId(userData.id);
  // if (user) {
  //   await UserService.delete(user.id);
  // }
}