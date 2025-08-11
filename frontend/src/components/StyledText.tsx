import React from 'react';

interface StyledTextProps {
  children: React.ReactNode;
  variant?: 'title' | 'subtitle' | 'body' | 'caption';
  weight?: 'normal' | 'bold';
  className?: string;
}

const StyledText: React.FC<StyledTextProps> = ({ 
  children, 
  variant = 'body', 
  weight = 'normal',
  className = ''
}) => {
  // Obter variáveis de ambiente para estilos
  const fontFamily = import.meta.env.VITE_FONT_FAMILY || 'Inter, system-ui, sans-serif';
  const fontSizeBase = import.meta.env.VITE_FONT_SIZE_BASE || '16px';
  const fontWeightNormal = import.meta.env.VITE_FONT_WEIGHT_NORMAL || '400';
  const fontWeightBold = import.meta.env.VITE_FONT_WEIGHT_BOLD || '700';
  const lineHeight = import.meta.env.VITE_LINE_HEIGHT || '1.5';
  const letterSpacing = import.meta.env.VITE_LETTER_SPACING || '0.025em';

  // Definir estilos baseados na variante
  const getVariantStyles = () => {
    switch (variant) {
      case 'title':
        return {
          fontSize: '2rem',
          fontWeight: weight === 'bold' ? fontWeightBold : fontWeightNormal,
          lineHeight: '1.2',
          letterSpacing: '0.01em'
        };
      case 'subtitle':
        return {
          fontSize: '1.5rem',
          fontWeight: weight === 'bold' ? fontWeightBold : fontWeightNormal,
          lineHeight: '1.3',
          letterSpacing: '0.015em'
        };
      case 'body':
        return {
          fontSize: fontSizeBase,
          fontWeight: weight === 'bold' ? fontWeightBold : fontWeightNormal,
          lineHeight: lineHeight,
          letterSpacing: letterSpacing
        };
      case 'caption':
        return {
          fontSize: '0.875rem',
          fontWeight: weight === 'bold' ? fontWeightBold : fontWeightNormal,
          lineHeight: '1.4',
          letterSpacing: '0.05em'
        };
      default:
        return {
          fontSize: fontSizeBase,
          fontWeight: weight === 'bold' ? fontWeightBold : fontWeightNormal,
          lineHeight: lineHeight,
          letterSpacing: letterSpacing
        };
    }
  };

  const styles = {
    fontFamily,
    ...getVariantStyles(),
  };

  return (
    <div style={styles} className={className}>
      {children}
    </div>
  );
};

export default StyledText; 