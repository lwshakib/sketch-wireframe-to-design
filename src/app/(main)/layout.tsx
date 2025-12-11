import { getOrCreateUser } from "@/actions/user";
import { notFound } from "next/navigation";
export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getOrCreateUser();
  if (!user) {
   return notFound();
  }

  return <div className="flex min-h-screen w-full">{children}</div>;
}
