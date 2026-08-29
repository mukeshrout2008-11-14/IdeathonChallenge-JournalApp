import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  X, 
  BookOpen, 
  Moon, 
  ShieldAlert, 
  Compass, 
  Sun
} from 'lucide-react';
import { GuidedTemplate, JournalCategory } from '../types';
import { GUIDED_TEMPLATES } from '../data/templates';

interface TemplatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: GuidedTemplate) => void;
}

export const TemplatePickerModal: React.FC<TemplatePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Moon': return <Moon className="w-5 h-5" />;
      case 'ShieldAlert': return <ShieldAlert className="w-5 h-5" />;
      case 'Compass': return <Compass className="w-5 h-5" />;
      case 'Sun': return <Sun className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#182624]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] border border-[#E8E2D8] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#EAE4DC] flex items-center justify-between bg-[#FFFFFF]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#2D4A43] text-[#FAF7F2] flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-[#182624]">Guided Reflection Templates</h2>
              <p className="text-xs text-[#737C78]">Structured, proven reflection frameworks to jumpstart clarity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#DCD3C4] text-[#737C78] hover:text-[#182624] hover:bg-[#FAF7F2] transition-colors"
          >
            Close
          </button>
        </div>

        {/* List of Templates */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {GUIDED_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E8E2D8] hover:border-[#2D4A43] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs group"
            >
              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#F0EBE1] text-[#2D4A43] flex items-center justify-center flex-shrink-0 group-hover:bg-[#2D4A43] group-hover:text-[#FAF7F2] transition-colors">
                  {getIcon(tmpl.iconName)}
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-bold text-sm text-[#182624]">{tmpl.title}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EAE3D5] text-[#4A3B32]">
                      {tmpl.category}
                    </span>
                  </div>
                  <p className="text-xs text-[#737C78] leading-relaxed mb-2">{tmpl.description}</p>
                  <div className="text-[11px] text-[#8C5E3C] italic">
                    Includes {tmpl.frameworkQuestions.length} guided reflection prompts
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onSelectTemplate(tmpl);
                  onClose();
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#2D4A43] text-[#2D4A43] hover:text-[#FAF7F2] border border-[#DCD3C4] hover:border-[#2D4A43] text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-2xs flex-shrink-0"
              >
                <span>Use Template</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
