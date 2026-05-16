"use client";

import { AccountDetailsSkeleton } from "@/components/skeletons/account-details-skeleton";
import type { UserData } from "@/types/user";
import { useAuth } from "@/context/useAuth";
import { buildUser } from "@/lib/utils";
import GoogleLoginButton from "./google-login-button";
import { AccountDropdown } from "./account-dropdown";
import { SettingsDropdown } from "./settings-dropdown";

export function UserAccount() {
  const auth = useAuth();
  const { authState, logout } = auth;
  const userStatus = authState.status;
  const isPhoneVerification =
    userStatus === "first-time-setup" ||
    userStatus === "phone-verification-required";
  const currentUser = isPhoneVerification ? authState.currentUser : null;
  const clientUser = userStatus === "ready" ? authState.clientUser : null;
  const user: UserData | null = buildUser(clientUser, currentUser);

  return (
    <div className="flex items-center gap-3 md:gap-3">
      <div className="min-w-0">
        {userStatus === "no-user" ? (
          <GoogleLoginButton variant="outline" />
        ) : userStatus === "loading" ? (
          <AccountDetailsSkeleton />
        ) : userStatus === "ready" || isPhoneVerification ? (
          <AccountDropdown
            user={user}
            userStatus={userStatus}
            onLogout={logout}
          />
        ) : null}
      </div>
      <SettingsDropdown />
    </div>
  );
}
