"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/custom/action-items/back-button";
import { useSafeRouter } from "@/hooks/useSafeRouter";

const NotFound: React.FC = () => {
  const { push } = useSafeRouter();
  const [isNavigatingHome, setIsNavigatingHome] = React.useState(false);

  return (
    <div className="flex justify-center items-center w-full mt-30 mb-26">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="flex flex-col items-center">
          <AlertTriangle className="text-destructive mb-2" size={48} />
          <CardTitle>404 - Page Not Found</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            The page you are looking for does not exist.
          </p>
        </CardContent>
        <CardFooter className="w-full justify-between">
          <BackButton />
          <Button
            className="w-[40%]"
            onClick={() => {
              if (isNavigatingHome) return;
              setIsNavigatingHome(true);
              push("/");
            }}
            disabled={isNavigatingHome}
          >
            {isNavigatingHome ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" /> Home
              </span>
            ) : (
              "Home Page"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default NotFound;
