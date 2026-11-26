import { Suspense } from "react";
import { LoginScreen } from "@/components/login/LoginScreen";

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center bg-[#f7f3ea] text-green">Opening counter…</main>}>
      <LoginScreen />
    </Suspense>
  );
}
