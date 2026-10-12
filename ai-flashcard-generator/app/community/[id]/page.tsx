import type { Metadata } from "next";
import PostView from "@/components/PostView";

export const metadata: Metadata = {
  title: "Shared set",
};

export default function PostPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <PostView />
    </div>
  );
}
