import type { Metadata } from "next";
import AccountView from "@/components/AccountView";

export const metadata: Metadata = {
  title: "Account",
  description: "Sign in to save your sets across devices.",
};

export default function AccountPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <AccountView />
    </div>
  );
}
