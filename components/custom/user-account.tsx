"use client";

import { AccountDetailsSkeleton } from "@/components/skeletons/account-details-skeleton";
import LoginLogoutSkeleton from "@/components/skeletons/login-logout-skeleton";
import type { UserData } from "@/types/user";
import { useAuth } from "@/context/useAuth";
import { buildUser } from "@/lib/utils";
import GoogleLoginButton from "./google-login-button";
import { LogoutButton } from "./action-items/logout-button";
import { AccountDropdown } from "./account-dropdown";
import { Separator } from "../ui/separator";

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

export function UserAccount({}: {}) {
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
    <div className="">
      <div className="flex justify-center items-center gap-2 md:gap-4">
        <div className="min-w-0">
          {userStatus === "loading" ? (
            <AccountDetailsSkeleton />
          ) : userStatus === "no-user" ? (
            <></>
          ) : (
            <AccountDropdown user={user} userStatus={userStatus} />
          )}
        </div>
        <div className="flex justify-end">
          <AuthAction userStatus={userStatus} onLogout={logout} />
        </div>
      </div>
    </div>
  );
}
