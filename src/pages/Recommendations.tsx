import AppLayout from "@/components/layout/AppLayout";
import { RecommendationsContent } from "@/components/analysis/RecommendationsContent";
import { useAnalysis } from "@/context/AnalysisContext";
import { AnalysisRequiredState } from "@/components/AnalysisRequiredState";

export default function Recommendations() {
  const { analysis } = useAnalysis();

  if (!analysis) {
    return (
      <AppLayout title="Recommendations">
        <AnalysisRequiredState
          pageTitle="Recommendations"
          description="Upload and analyze a resume to get personalized recommendations and next steps."
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Recommendations">
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <RecommendationsContent />
      </div>
    </AppLayout>
  );
}
