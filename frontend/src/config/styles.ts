// Configuração de estilos baseada nas variáveis de ambiente
export const getStyleVariables = () => {
  const fontFamily = import.meta.env.VITE_FONT_FAMILY || 'Inter, system-ui, sans-serif';
  const fontSizeBase = import.meta.env.VITE_FONT_SIZE_BASE || '16px';
  const fontWeightNormal = import.meta.env.VITE_FONT_WEIGHT_NORMAL || '400';
  const fontWeightBold = import.meta.env.VITE_FONT_WEIGHT_BOLD || '700';
  const lineHeight = import.meta.env.VITE_LINE_HEIGHT || '1.5';
  const letterSpacing = import.meta.env.VITE_LETTER_SPACING || '0.025em';

  return {
    fontFamily,
    fontSizeBase,
    fontWeightNormal,
    fontWeightBold,
    lineHeight,
    letterSpacing
  };
};

// Função para aplicar estilos dinamicamente
export const applyStyleVariables = () => {
  const variables = getStyleVariables();
  
  const root = document.documentElement;
  
  root.style.setProperty('--font-family', variables.fontFamily);
  root.style.setProperty('--font-size-base', variables.fontSizeBase);
  root.style.setProperty('--font-weight-normal', variables.fontWeightNormal);
  root.style.setProperty('--font-weight-bold', variables.fontWeightBold);
  root.style.setProperty('--line-height', variables.lineHeight);
  root.style.setProperty('--letter-spacing', variables.letterSpacing);
  
  console.log('🎨 Estilos aplicados:', variables);
}; 