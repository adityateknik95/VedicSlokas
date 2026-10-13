"use client";

import { createAuthClient } from "better-auth/react";

/** Browser-side auth client (same origin). Only the Google button needs it. */
export const authClient = createAuthClient();
