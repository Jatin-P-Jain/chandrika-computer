import React from "react";
import { Skeleton } from "../ui/skeleton";

export const LoginLogoutSkeleton: React.FC = () => {
  return <Skeleton className="h-10 w-30 rounded-md bg-muted-foreground/20" />;
};

export default LoginLogoutSkeleton;
