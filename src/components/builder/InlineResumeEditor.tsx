import React from 'react';
import { ResumeData, TemplateName } from '@/types/resume';
import { ResumePreview } from '@/components/builder/ResumePreview';

interface InlineResumeEditorProps {
  data: ResumeData;
  setData: (data: ResumeData | ((prev: ResumeData) => ResumeData)) => void;
  template: TemplateName;
}

export const InlineResumeEditor: React.FC<InlineResumeEditorProps> = ({ data, setData, template }) => {
  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 right-4 z-50 bg-background/80 backdrop-blur-sm border px-3 py-1.5 rounded-full shadow-sm text-xs font-medium text-muted-foreground flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
        Inline Editing (Coming Soon)
      </div>
      <ResumePreview data={data} template={template} />
    </div>
  );
};
