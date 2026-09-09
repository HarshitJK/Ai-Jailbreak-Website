import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = localStorage.getItem("teamId");
    if (!stored) {
      const router = useRouter();
      router.push("/login");
    }
  }, []);
  return children;
}