import Link from "next/link";
import { GraduationCap, MoveLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <GraduationCap className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="text-6xl font-bold tracking-tight text-foreground">404</h1>
      <h2 className="mt-2 text-xl font-semibold text-foreground">Page not found</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">
          <MoveLeft className="h-4 w-4" />
          Go home
        </Link>
      </Button>
    </div>
  );
}
