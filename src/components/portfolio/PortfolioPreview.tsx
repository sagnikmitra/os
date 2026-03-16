import { PortfolioData, PortfolioTemplateName } from "@/types/portfolio";
import MinimalEditorialTemplate from "./templates/MinimalEditorialTemplate";
import ProductDesignerTemplate from "./templates/ProductDesignerTemplate";
import CreativeVisualTemplate from "./templates/CreativeVisualTemplate";
import TechnicalProTemplate from "./templates/TechnicalProTemplate";
import ExecutiveTemplate from "./templates/ExecutiveTemplate";
import StartupOperatorTemplate from "./templates/StartupOperatorTemplate";
import ResearchAcademicTemplate from "./templates/ResearchAcademicTemplate";
import HybridProfessionalTemplate from "./templates/HybridProfessionalTemplate";

interface Props {
  data: PortfolioData;
  template: PortfolioTemplateName;
}

const templateMap: Record<PortfolioTemplateName, React.ComponentType<{ data: PortfolioData }>> = {
  "minimal-editorial": MinimalEditorialTemplate,
  "product-designer": ProductDesignerTemplate,
  "creative-visual": CreativeVisualTemplate,
  "technical-pro": TechnicalProTemplate,
  "executive": ExecutiveTemplate,
  "startup-operator": StartupOperatorTemplate,
  "research-academic": ResearchAcademicTemplate,
  "hybrid-professional": HybridProfessionalTemplate,
};

export default function PortfolioPreview({ data, template }: Props) {
  const Template = templateMap[template] || MinimalEditorialTemplate;
  return <Template data={data} />;
}
