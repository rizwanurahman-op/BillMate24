"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useAuthStore } from "@/store/auth.store";

export default function ShopkeeperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isShopkeeper, isAdmin } = useAuth();
  const { isHydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isHydrated && user && isAdmin) {
      router.push("/admin/dashboard");
    }
  }, [user, isAdmin, isHydrated, mounted, router]);

  // Wait for hydration before making any decisions
  if (!mounted || !isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // After hydration, if not a shopkeeper, the parent layout should redirect to login
  // This layout should only show spinner during the transition
  if (!isShopkeeper) {
    // If not authenticated at all, the parent layout will redirect
    // Just show a brief loading state during the transition
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}
