import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import {
  Rocket, Globe, Link2, ExternalLink, Check, X, Loader2,
  Search, Eye, EyeOff, Settings2, Copy, ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "@/lib/motion-stub";
import { usePortfolios, type Portfolio } from "@/hooks/usePortfolios";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

function SlugChecker({
  portfolio,
  onPublish,
  checkSlug,
}: {
  portfolio: Portfolio;
  onPublish: (slug: string) => Promise<boolean>;
  checkSlug: (slug: string, id?: string) => Promise<{ available: boolean; reason: string | null }>;
}) {
  const [slug, setSlug] = useState(portfolio.slug || "");
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [reason, setReason] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const check = useCallback(async (value: string) => {
    if (!value || value.length < 3) {
      setStatus("idle");
      return;
    }
    setStatus("checking");
    const result = await checkSlug(value, portfolio.id);
    setStatus(result.available ? "available" : "taken");
    setReason(result.reason);
  }, [checkSlug, portfolio.id]);

  useEffect(() => {
    const t = setTimeout(() => check(slug), 500);
    return () => clearTimeout(t);
  }, [slug, check]);

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 50);
    setSlug(val);
  };

  const handlePublish = async () => {
    setPublishing(true);
    await onPublish(slug);
    setPublishing(false);
  };

  const statusIcon = {
    idle: null,
    checking: <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />,
    available: <Check className="h-4 w-4 text-emerald-500" />,
    taken: <X className="h-4 w-4 text-destructive" />,
    invalid: <X className="h-4 w-4 text-destructive" />,
  };

  return (
    <div className="space-y-3">
      <Label className="text-xs font-semibold">Choose your URL slug</Label>
      <div className="flex items-center gap-0 rounded-lg border bg-muted/30 overflow-hidden focus-within:ring-2 focus-within:ring-ring">
        <span className="px-3 text-xs text-muted-foreground font-mono whitespace-nowrap bg-muted/50 h-10 flex items-center border-r">
          careeros.app/
        </span>
        <Input
          value={slug}
          onChange={handleSlugChange}
          placeholder="your-name"
          className="border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-sm h-10"
        />
        <div className="px-3 flex items-center">
          {statusIcon[status]}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {status === "available" && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-emerald-600 font-medium flex items-center gap-1.5"
          >
            <Check className="h-3 w-3" /> This slug is available!
          </motion.p>
        )}
        {(status === "taken" || status === "invalid") && reason && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-destructive font-medium"
          >
            {reason}
          </motion.p>
        )}
      </AnimatePresence>

      {!portfolio.is_published && (
        <Button
          onClick={handlePublish}
          disabled={status !== "available" || publishing}
          className="gap-2 w-full mt-2"
        >
          {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
          Publish Portfolio
        </Button>
      )}
    </div>
  );
}

function SEOSettings({
  portfolio,
  onUpdate,
}: {
  portfolio: Portfolio;
  onUpdate: (id: string, updates: Partial<Portfolio>) => Promise<boolean>;
}) {
  const [seoTitle, setSeoTitle] = useState(portfolio.seo_title || "");
  const [seoDesc, setSeoDesc] = useState(portfolio.seo_description || "");
  const [seoKeywords, setSeoKeywords] = useState(portfolio.seo_keywords || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await onUpdate(portfolio.id, {
      seo_title: seoTitle || null,
      seo_description: seoDesc || null,
      seo_keywords: seoKeywords || null,
    });
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs font-semibold">SEO Settings</p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Page Title</Label>
          <Input
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            placeholder={portfolio.title}
            maxLength={60}
            className="text-sm"
          />
          <p className="text-[10px] text-muted-foreground">{seoTitle.length}/60 characters</p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Meta Description</Label>
          <Textarea
            value={seoDesc}
            onChange={(e) => setSeoDesc(e.target.value)}
            placeholder="A brief description for search engines..."
            maxLength={160}
            rows={2}
            className="text-sm resize-none"
          />
          <p className="text-[10px] text-muted-foreground">{seoDesc.length}/160 characters</p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Keywords</Label>
          <Input
            value={seoKeywords}
            onChange={(e) => setSeoKeywords(e.target.value)}
            placeholder="developer, portfolio, react, design"
            className="text-sm"
          />
        </div>

        {/* Google preview */}
        <div className="rounded-lg border bg-background p-3 space-y-0.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Search Preview</p>
          <p className="text-sm text-primary font-medium truncate">
            {seoTitle || portfolio.title || "My Portfolio"}
          </p>
          <p className="text-xs text-emerald-700 font-mono truncate">
            careeros.app/{portfolio.slug || "your-slug"}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {seoDesc || "No description set. Add a meta description to improve search visibility."}
          </p>
        </div>

        <Button onClick={save} disabled={saving} size="sm" variant="outline" className="gap-1.5">
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Settings2 className="h-3 w-3" />}
          Save SEO Settings
        </Button>
      </div>
    </div>
  );
}

function PublishedCard({
  portfolio,
  onUpdate,
  onUnpublish,
  checkSlug,
  onPublish,
}: {
  portfolio: Portfolio;
  onUpdate: (id: string, updates: Partial<Portfolio>) => Promise<boolean>;
  onUnpublish: (id: string) => Promise<boolean>;
  checkSlug: (slug: string, id?: string) => Promise<{ available: boolean; reason: string | null }>;
  onPublish: (slug: string) => Promise<boolean>;
}) {
  const { toast } = useToast();
  const url = portfolio.slug ? `https://${portfolio.slug}.careeros.app` : null;

  const copyUrl = () => {
    if (url) {
      navigator.clipboard.writeText(url);
      toast({ title: "URL copied!" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">{portfolio.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {portfolio.is_published ? (
                  <Badge variant="default" className="text-[10px] h-5 bg-emerald-500/10 text-emerald-600 border-emerald-200 hover:bg-emerald-500/10">
                    Live
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] h-5">Draft</Badge>
                )}
                {portfolio.is_public ? (
                  <Badge variant="outline" className="text-[10px] h-5 gap-1">
                    <Eye className="h-2.5 w-2.5" /> Public
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] h-5 gap-1">
                    <EyeOff className="h-2.5 w-2.5" /> Private
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* URL display */}
        {portfolio.is_published && url && (
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
            <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs font-mono text-foreground truncate flex-1">{url}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={copyUrl}>
              <Copy className="h-3 w-3" />
            </Button>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                <ArrowUpRight className="h-3 w-3" />
              </Button>
            </a>
          </div>
        )}

        {/* Visibility toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold">Public visibility</p>
            <p className="text-[10px] text-muted-foreground">Anyone with the link can view</p>
          </div>
          <Switch
            checked={portfolio.is_public}
            onCheckedChange={(checked) => onUpdate(portfolio.id, { is_public: checked })}
          />
        </div>
      </div>

      <Separator />

      {/* Slug section */}
      <div className="p-5">
        <SlugChecker
          portfolio={portfolio}
          onPublish={async (slug) => onPublish(slug)}
          checkSlug={checkSlug}
        />
      </div>

      <Separator />

      {/* SEO */}
      <div className="p-5">
        <SEOSettings portfolio={portfolio} onUpdate={onUpdate} />
      </div>

      {/* Unpublish */}
      {portfolio.is_published && (
        <>
          <Separator />
          <div className="p-5">
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/5 gap-1.5"
              onClick={() => onUnpublish(portfolio.id)}
            >
              <EyeOff className="h-3 w-3" /> Unpublish
            </Button>
          </div>
        </>
      )}
    </motion.div>
  );
}

export default function Publish() {
  const { portfolios, loading, checkSlugAvailability, updatePortfolio, publishPortfolio, unpublishPortfolio } = usePortfolios();

  return (
    <AppLayout title="Publish">
      <div className="p-6 max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight">Publish Center</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Publish your portfolio and manage your public career identity.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : portfolios.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border bg-card p-8 space-y-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">No portfolios yet</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Create a portfolio first, then come back to publish it.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-muted/50 p-5 space-y-3">
              <p className="text-xs font-semibold">How publishing works</p>
              <div className="space-y-2">
                {[
                  { icon: Globe, text: "Your portfolio gets a public URL like yourname.careeros.app" },
                  { icon: Link2, text: "Choose a custom slug for your career identity" },
                  { icon: ExternalLink, text: "Share one link with recruiters, on LinkedIn, or in applications" },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <Button asChild className="gap-2">
              <Link to="/portfolio-builder">
                <Rocket className="h-4 w-4" /> Create Portfolio
              </Link>
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {portfolios.map((p) => (
              <PublishedCard
                key={p.id}
                portfolio={p}
                onUpdate={updatePortfolio}
                onUnpublish={unpublishPortfolio}
                checkSlug={checkSlugAvailability}
                onPublish={(slug) => publishPortfolio(p.id, slug)}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
