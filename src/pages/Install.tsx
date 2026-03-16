import { useEffect, useState } from "react";
import { motion } from "@/lib/motion-stub";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Smartphone, Tablet, Monitor, Apple, CheckCircle2, Zap, Wifi, Bell } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const fade = (i: number) => ({ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) setPlatform("ios");
    else if (/Android/.test(ua)) setPlatform("android");
    else setPlatform("desktop");

    if (window.matchMedia("(display-mode: standalone)").matches) setIsInstalled(true);

    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e as BeforeInstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  const steps = {
    ios: [
      "Open this page in Safari",
      "Tap the Share button (square with arrow)",
      'Scroll down and tap "Add to Home Screen"',
      'Tap "Add" to confirm',
    ],
    android: [
      "Tap the install banner or menu button (⋮)",
      'Select "Install app" or "Add to Home Screen"',
      'Tap "Install" to confirm',
      "The app will appear on your home screen",
    ],
    desktop: [
      "Click the install icon in the address bar (or use the button below)",
      'Click "Install" in the dialog',
      "The app will open as a standalone window",
      "Find it in your Start Menu / Launchpad / App drawer",
    ],
  };

  const devices = [
    { icon: Smartphone, label: "Phone", desc: "Full native-like experience", color: "bg-blue-500/10 text-blue-500" },
    { icon: Tablet, label: "Tablet", desc: "Optimized for larger screens", color: "bg-emerald-500/10 text-emerald-500" },
    { icon: Monitor, label: "Desktop", desc: "Standalone desktop app", color: "bg-violet-500/10 text-violet-500" },
  ];

  const benefits = [
    { icon: Zap, label: "Instant Launch", desc: "Open directly from home screen — no browser needed" },
    { icon: Wifi, label: "Works Offline", desc: "Access cached data and tools even without internet" },
    { icon: Bell, label: "Notifications", desc: "Get alerts for job matches, analysis, and updates" },
  ];

  return (
    <AppLayout title="Install App" subtitle="Add CareerOS to your device for the best experience">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">
        {isInstalled && (
          <motion.div {...fade(0)} className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
            <div>
              <p className="text-sm font-semibold text-primary">CareerOS is installed on this device!</p>
              <p className="text-xs text-muted-foreground">You're getting the full native experience.</p>
            </div>
          </motion.div>
        )}

        {/* Devices */}
        <motion.div {...fade(1)} className="grid grid-cols-3 gap-3">
          {devices.map((d) => (
            <div key={d.label} className="rounded-xl border bg-card p-4 sm:p-5 text-center">
              <div className={`w-12 h-12 rounded-xl ${d.color} flex items-center justify-center mx-auto mb-3`}>
                <d.icon className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold">{d.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{d.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Benefits */}
        <motion.div {...fade(2)} className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3">Why install?</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            {benefits.map(b => (
              <div key={b.label} className="flex items-start gap-2.5 p-3 rounded-lg bg-secondary/30">
                <b.icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold">{b.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Installation Steps */}
        <motion.div {...fade(3)} className="rounded-xl border bg-card p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              {platform === "ios" ? <Apple className="h-4 w-4 text-primary" /> : <Download className="h-4 w-4 text-primary" />}
            </div>
            <div>
              <h3 className="text-sm font-semibold">
                Install on {platform === "ios" ? "iOS" : platform === "android" ? "Android" : "Desktop"}
              </h3>
              <p className="text-xs text-muted-foreground">Follow these steps</p>
            </div>
            <Badge variant="secondary" className="text-[10px] ml-auto">{platform.toUpperCase()}</Badge>
          </div>

          <div className="space-y-3">
            {steps[platform].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 h-7 w-7 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-sm pt-1 leading-relaxed">{step}</span>
              </div>
            ))}
          </div>

          {deferredPrompt && !isInstalled && (
            <Button onClick={handleInstall} className="w-full mt-5 h-11 rounded-xl gap-2 shadow-md shadow-primary/15" size="lg">
              <Download className="h-4 w-4" /> Install CareerOS Now
            </Button>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
}
