import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { PortfolioData, PortfolioTemplateName, defaultPortfolioData } from "@/types/portfolio";
import PortfolioPreview from "@/components/portfolio/PortfolioPreview";
import PortfolioSectionManager from "@/components/portfolio/PortfolioSectionManager";
import PortfolioContentEditor from "@/components/portfolio/PortfolioContentEditor";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Layers, Paintbrush, PenTool, Save, Loader2, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { usePortfolios } from "@/hooks/usePortfolios";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

const templateOptions: { id: PortfolioTemplateName; label: string }[] = [
  { id: "minimal-editorial", label: "Minimal Editorial" },
  { id: "product-designer", label: "Product Designer" },
  { id: "creative-visual", label: "Creative Visual" },
  { id: "technical-pro", label: "Technical Pro" },
  { id: "executive", label: "Executive" },
  { id: "startup-operator", label: "Startup Operator" },
  { id: "research-academic", label: "Research / Academic" },
  { id: "hybrid-professional", label: "Hybrid Professional" },
];

export default function PortfolioEditor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { createPortfolio, updatePortfolio } = usePortfolios();

  const portfolioId = searchParams.get("id");
  const initialTemplate = searchParams.get("template") as PortfolioTemplateName | null;

  const [id, setId] = useState<string | null>(portfolioId);
  const [title, setTitle] = useState("My Portfolio");
  const [data, setData] = useState<PortfolioData>(defaultPortfolioData);
  const [template, setTemplate] = useState<PortfolioTemplateName>(initialTemplate || "minimal-editorial");
  const [loadingData, setLoadingData] = useState(!!portfolioId);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load existing portfolio
  useEffect(() => {
    if (!portfolioId) return;
    (async () => {
      setLoadingData(true);
      const { data: row, error } = await supabase
        .from("portfolios")
        .select("*")
        .eq("id", portfolioId)
        .single();

      if (error || !row) {
        toast({ title: "Portfolio not found", variant: "destructive" });
        navigate("/portfolios");
        return;
      }
      const r = row as any;
      setTitle(r.title);
      setTemplate(r.template as PortfolioTemplateName);
      if (r.portfolio_data && Object.keys(r.portfolio_data).length > 0) {
        setData({ ...defaultPortfolioData, ...r.portfolio_data });
      }
      setLoadingData(false);
    })();
  }, [portfolioId]);

  // Auto-create portfolio for new "Start Fresh" flow
  useEffect(() => {
    if (portfolioId || id) return;
    if (!initialTemplate || !user) return;
    (async () => {
      const newId = await createPortfolio("My Portfolio", initialTemplate);
      if (newId) {
        setId(newId);
        // Update URL without reload
        window.history.replaceState(null, "", `/portfolio-editor?id=${newId}`);
      }
    })();
  }, [initialTemplate, user]);

  const handleSave = useCallback(async () => {
    const targetId = id || portfolioId;
    if (!targetId) return;
    setSaving(true);
    const success = await updatePortfolio(targetId, {
      title,
      template,
      portfolio_data: data as any,
    });
    setSaving(false);
    if (success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }, [id, portfolioId, title, template, data, updatePortfolio]);

  if (loadingData) {
    return (
      <AppLayout title="Portfolio Editor">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Portfolio Editor">
      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        {/* Left panel — Editor */}
        <ResizablePanel defaultSize={35} minSize={28} maxSize={50}>
          <div className="h-full overflow-y-auto bg-card">
            <Tabs defaultValue="content" className="h-full flex flex-col">
              <div className="px-4 pt-4 pb-2 border-b shrink-0 space-y-3">
                {/* Title + Save */}
                <div className="flex items-center gap-2">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-sm font-semibold h-8 flex-1"
                    placeholder="Portfolio title"
                  />
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving || !(id || portfolioId)}
                    className="gap-1.5 h-8 shrink-0"
                  >
                    {saving ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : saved ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Save className="h-3 w-3" />
                    )}
                    {saved ? "Saved" : "Save"}
                  </Button>
                </div>

                <TabsList className="w-full h-9 bg-secondary/50">
                  <TabsTrigger value="content" className="text-xs gap-1.5 flex-1">
                    <PenTool className="h-3 w-3" /> Content
                  </TabsTrigger>
                  <TabsTrigger value="sections" className="text-xs gap-1.5 flex-1">
                    <Layers className="h-3 w-3" /> Sections
                  </TabsTrigger>
                  <TabsTrigger value="style" className="text-xs gap-1.5 flex-1">
                    <Paintbrush className="h-3 w-3" /> Style
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto">
                <TabsContent value="content" className="mt-0">
                  <PortfolioContentEditor data={data} onChange={setData} />
                </TabsContent>

                <TabsContent value="sections" className="mt-0 p-4">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-3 block">
                    Section Order & Visibility
                  </Label>
                  <PortfolioSectionManager
                    sections={data.sections}
                    onChange={(sections) => setData({ ...data, sections })}
                  />
                </TabsContent>

                <TabsContent value="style" className="mt-0 p-4 space-y-4">
                  <div>
                    <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 block">
                      Template
                    </Label>
                    <Select value={template} onValueChange={(v) => setTemplate(v as PortfolioTemplateName)}>
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templateOptions.map((t) => (
                          <SelectItem key={t.id} value={t.id} className="text-xs">
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right panel — Preview */}
        <ResizablePanel defaultSize={65}>
          <div className="h-full overflow-y-auto bg-secondary/30 p-6">
            <div className="max-w-[1200px] mx-auto rounded-xl overflow-hidden shadow-xl border border-border/50">
              <PortfolioPreview data={data} template={template} />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </AppLayout>
  );
}
