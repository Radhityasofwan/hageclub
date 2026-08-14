import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewBlogPage() {
  const categories = await db.blogCategory.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  const { BlogForm } = await import("@/components/admin/blog-form");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold">New Article</h1>
        <p className="text-sm text-muted">Write a new blog post.</p>
      </div>
      <BlogForm categories={categories} />
    </div>
  );
}
