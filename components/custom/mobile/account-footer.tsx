"use client";

import GoogleLoginButton from "../google-login-button";
import { LogoutButton } from "../action-items/logout-button";
import { AccountDetails } from "../account-details";
import { AccountDetailsSkeleton } from "@/components/skeletons/account-details-skeleton";
import LoginLogoutSkeleton from "@/components/skeletons/login-logout-skeleton";
import type { UserData } from "@/types/user";
import { useAuth } from "@/context/useAuth";
import { buildUser } from "@/lib/utils";

type UserStatus =
  | "loading"
  | "no-user"
  | "first-time-setup"
  | "phone-verification-required"
  | "ready";

function AuthAction({
  userStatus,
  onLogout,
}: {
  userStatus: UserStatus;
  onLogout: () => Promise<void>;
}) {
  if (userStatus === "loading") return <LoginLogoutSkeleton />;
  if (userStatus === "no-user") return <GoogleLoginButton variant="outline" />;
  return <LogoutButton onLogout={onLogout} />;
}

export function AccountFooter({}: {}) {
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
    <div className=" rounded-t-2xl justify-center max-w-2xl fixed bottom-0 left-[50%] -translate-x-[50%] w-full bg-background z-50 border-t border-border shadow-[0_-4px_24px_-12px_rgba(0,0,0,0.25)] dark:shadow-primary/10">
      <div className="grid grid-cols-[2fr_1fr] px-4 py-3 items-center gap-3">
        <div className="min-w-0">
          {userStatus === "loading" ? (
            <AccountDetailsSkeleton />
          ) : (
            <AccountDetails user={user} userStatus={userStatus} />
          )}
        </div>
        <div className="flex justify-end">
          <AuthAction userStatus={userStatus} onLogout={logout} />
        </div>
      </div>
    </div>
  );
}
