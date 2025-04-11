import { createClerkClient, verifyToken } from "@clerk/backend";
import { APIError, Gateway, Header } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { secret } from "encore.dev/config";

import log from "encore.dev/log";
import { AUTHORIZED_PARTIES } from "./config"

const clerkSecretKey = secret("ClerkSecretKey");

const clerkClient = createClerkClient({
  secretKey: clerkSecretKey(),
});

interface AuthParams {
  authorization: Header<"Authorization">;
}

interface AuthData {
  userID: string;
  imageUrl: string;
  emailAddress: string | null;
  organizationId: string | null;
  role: string | null;
}

const myAuthHandler = authHandler(async (params: AuthParams): Promise<
  AuthData
> => {
  const token = params.authorization.replace("Bearer ", "");

  if (!token) {
    throw APIError.unauthenticated("no token provided");
  }

  log.trace("Token: ", { token });

  try {
    const result = await verifyToken(token, {
      authorizedParties: AUTHORIZED_PARTIES,
      secretKey: clerkSecretKey(),
    });

    const user = await clerkClient.users.getUser(result.sub);
    
    // Get the user's organization membership
    const organizations = await clerkClient.users.getOrganizationMembershipList({ userId: user.id });
    const primaryOrg = organizations.data.length > 0 ? organizations.data[0] : null;

    return {
      userID: user.id,
      imageUrl: user.imageUrl,
      emailAddress: user.emailAddresses[0].emailAddress || null,
      organizationId: primaryOrg?.organization.id || null,
      role: primaryOrg?.role || null,
    };
  } catch (e) {
    log.error(e);
    throw APIError.unauthenticated("invalid token", e as Error);
  }
});

export const mygw = new Gateway({ authHandler: myAuthHandler });