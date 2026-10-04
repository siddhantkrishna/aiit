import type { MetadataRoute } from "next";
import { db } from "@/db";
import { vacancies } from "@/db/schema";
import { eq } from "drizzle-orm";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://aiitcollege.in";

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/admission`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/universities`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${baseUrl}/vacancies`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/online-classes`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.65,
    },
  ];

  let jobs: MetadataRoute.Sitemap = [];

  try {
    const rows = await db
      .select({
        slug: vacancies.slug,
        updatedAt: vacancies.updatedAt,
      })
      .from(vacancies)
      .where(eq(vacancies.enabled, true));

    jobs = rows.map((job) => ({
      url: `${baseUrl}/vacancies/${job.slug}`,
      lastModified: job.updatedAt || new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch {
    jobs = [];
  }

  return [...staticPages, ...jobs];
}
