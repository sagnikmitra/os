import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Portfolio {
  id: string;
  title: string;
  slug: string | null;
  template: string;
  is_published: boolean;
  is_public: boolean;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  og_image_url: string | null;
  portfolio_data: any;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export function usePortfolios() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPortfolios = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("portfolios")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading portfolios", description: error.message, variant: "destructive" });
    } else {
      setPortfolios((data as any) || []);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchPortfolios();
  }, [fetchPortfolios]);

  const createPortfolio = async (title: string, template: string, portfolioData?: any): Promise<string | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("portfolios")
      .insert({
        user_id: user.id,
        title,
        template,
        portfolio_data: portfolioData || {},
      } as any)
      .select("id")
      .single();

    if (error) {
      toast({ title: "Error creating portfolio", description: error.message, variant: "destructive" });
      return null;
    }
    await fetchPortfolios();
    return (data as any)?.id || null;
  };

  const deletePortfolio = async (id: string) => {
    const { error } = await supabase
      .from("portfolios")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error deleting portfolio", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Portfolio deleted" });
    await fetchPortfolios();
    return true;
  };

  const checkSlugAvailability = async (slug: string, portfolioId?: string): Promise<{ available: boolean; reason: string | null }> => {
    const { data, error } = await supabase.functions.invoke("check-slug", {
      body: { slug, portfolio_id: portfolioId },
    });
    if (error) return { available: false, reason: "Failed to check availability" };
    return data;
  };

  const updatePortfolio = async (id: string, updates: Partial<Portfolio>) => {
    const { error } = await supabase
      .from("portfolios")
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq("id", id);

    if (error) {
      toast({ title: "Error updating portfolio", description: error.message, variant: "destructive" });
      return false;
    }
    await fetchPortfolios();
    return true;
  };

  const publishPortfolio = async (id: string, slug: string) => {
    const { error } = await supabase
      .from("portfolios")
      .update({
        slug,
        is_published: true,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", id);

    if (error) {
      toast({ title: "Error publishing", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Portfolio published!", description: `Live at ${slug}.careeros.app` });
    await fetchPortfolios();
    return true;
  };

  const unpublishPortfolio = async (id: string) => {
    const { error } = await supabase
      .from("portfolios")
      .update({ is_published: false, updated_at: new Date().toISOString() } as any)
      .eq("id", id);

    if (error) {
      toast({ title: "Error unpublishing", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Portfolio unpublished" });
    await fetchPortfolios();
    return true;
  };

  return {
    portfolios, loading, fetchPortfolios,
    createPortfolio, deletePortfolio,
    checkSlugAvailability, updatePortfolio,
    publishPortfolio, unpublishPortfolio,
  };
}
