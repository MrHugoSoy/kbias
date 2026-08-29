import type { MetadataRoute } from 'next';
import { getSupabasePublicClient } from '@/lib/supabase';
import { siteUrl } from '@/lib/siteUrl';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = getSupabasePublicClient();
  const { data: groups } = await supabase.from('groups').select('slug');

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: 'always', priority: 1 },
    { url: `${siteUrl}/sobre-nosotros`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/reglas`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/terminos`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/privacidad`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/estadisticas`, changeFrequency: 'hourly', priority: 0.6 },
    { url: `${siteUrl}/reclamar`, changeFrequency: 'monthly', priority: 0.3 },
  ];

  const groupRoutes: MetadataRoute.Sitemap = (groups ?? []).map((g) => ({
    url: `${siteUrl}/grupo/${g.slug}`,
    changeFrequency: 'hourly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...groupRoutes];
}
