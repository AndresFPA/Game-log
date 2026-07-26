import React, { useState, useRef, useEffect } from 'react';
import { AppTheme, THEME_CONFIGS, ThemeConfig } from '../types';
import { Palette, Check, ChevronDown, Sparkles } from 'lucide-react';

interface ThemeSelectorProps {
  currentTheme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
  variant?: 'dropdown' | 'sidebar' | 'inline';
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onSelectTheme,
  variant = 'dropdown'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeConfig = THEME_CONFIGS[currentTheme] || THEME_CONFIGS.crimson;
  const themesList = Object.values(THEME_CONFIGS);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (variant === 'sidebar') {
    return (
      <div className="p-3.5 rounded-xl border shadow-sm space-y-3" style={{ backgroundColor: 'var(--theme-card)', borderColor: 'var(--theme-border)' }}>
        <div className="flex items-center justify-between theme-accent-text font-semibold text-xs uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <Palette className="w-4 h-4" style={{ color: activeConfig.accentHex }} />
            <span className="text-slate-200">Visual Theme</span>
          </div>
          <span className="text-[10px] font-mono capitalize" style={{ color: activeConfig.accentHex }}>{activeConfig.name}</span>
        </div>

        <p className="text-[11px] text-slate-400 leading-tight">
          Select app color palette and dark tone styling:
        </p>

        <div className="space-y-2">
          {themesList.map((t) => {
            const isSelected = t.id === currentTheme;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectTheme(t.id)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'shadow-md'
                    : 'hover:bg-slate-800/50'
                }`}
                style={{
                  backgroundColor: isSelected ? 'var(--theme-bg)' : 'var(--theme-input)',
                  borderColor: isSelected ? t.accentHex : 'var(--theme-border)'
                }}
                id={`sidebar-theme-option-${t.id}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Swatch dots */}
                  <div className="flex items-center -space-x-1 shrink-0">
                    <span className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-xs" style={{ backgroundColor: t.swatchColors[0] }} />
                    <span className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-xs" style={{ backgroundColor: t.swatchColors[1] }} />
                    <span className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-xs" style={{ backgroundColor: t.swatchColors[2] }} />
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-100 truncate flex items-center gap-1.5">
                      <span>{t.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate font-mono">
                      {t.subtitle}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="p-1 rounded-full shrink-0" style={{ backgroundColor: `${t.accentHex}25`, color: t.accentHex }}>
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left z-50" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="py-1.5 px-2.5 sm:px-3 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm shrink-0"
        id="theme-selector-dropdown-btn"
        title="Switch Visual Theme"
      >
        <Palette className="w-3.5 h-3.5" style={{ color: activeConfig.accentHex }} />
        
        <span className="hidden md:inline">{activeConfig.name}</span>
        
        {/* Swatch preview dots */}
        <div className="flex items-center -space-x-1 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full border border-black/40" style={{ backgroundColor: activeConfig.swatchColors[0] }} />
          <span className="w-2.5 h-2.5 rounded-full border border-black/40" style={{ backgroundColor: activeConfig.swatchColors[1] }} />
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 sm:w-72 bg-[#160A18] border border-rose-950/90 rounded-2xl shadow-2xl p-2 z-[100] animate-fade-in space-y-1 backdrop-blur-xl">
          <div className="px-2 py-1.5 border-b border-rose-950/80 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Color Palette Themes</span>
            <Sparkles className="w-3.5 h-3.5" style={{ color: activeConfig.accentHex }} />
          </div>

          {themesList.map((t) => {
            const isSelected = t.id === currentTheme;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onSelectTheme(t.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left p-2 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-[#100612] text-white border shadow-sm'
                    : 'text-slate-300 hover:bg-[#1C0E1E] hover:text-white border border-transparent'
                }`}
                style={isSelected ? { borderColor: `${t.accentHex}80` } : {}}
                id={`dropdown-theme-option-${t.id}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex items-center -space-x-1 shrink-0">
                    <span className="w-3 h-3 rounded-full border border-black/40" style={{ backgroundColor: t.swatchColors[0] }} />
                    <span className="w-3 h-3 rounded-full border border-black/40" style={{ backgroundColor: t.swatchColors[1] }} />
                    <span className="w-3 h-3 rounded-full border border-black/40" style={{ backgroundColor: t.swatchColors[2] }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold leading-tight truncate">{t.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{t.subtitle}</p>
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-4 h-4 shrink-0" style={{ color: t.accentHex }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
