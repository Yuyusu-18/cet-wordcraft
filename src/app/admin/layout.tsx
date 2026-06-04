import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-warm-200 pb-3">
        <h1 className="text-xl font-bold text-gray-800">⚙️ 管理后台</h1>
        <Link href="/admin/generate" className="text-sm text-warm-600 hover:underline">AI 生成</Link>
        <Link href="/admin/review" className="text-sm text-warm-600 hover:underline">审核队列</Link>
        <Link href="/" className="text-sm text-gray-400 hover:underline ml-auto">← 返回首页</Link>
      </div>
      {children}
    </div>
  );
}