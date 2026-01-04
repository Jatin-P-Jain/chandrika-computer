import React from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BackButton } from "@/components/custom/action-items/back-button";

const NotFound: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-muted px-4">
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
        <Button asChild className="w-[40%]">
          <Link href="/" className="">
            Home Page
          </Link>
        </Button>
      </CardFooter>
    </Card>
  </div>
);

export default NotFound;
