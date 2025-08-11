# Sistema de Pedidos - Quiosque

Sistema de pedidos para quiosque com interface para garçons e administradores.

## Configuração

### Variáveis de Ambiente

Copie o arquivo `env.example` para `.env` e configure as variáveis:

```bash
cp env.example .env
```

#### Configurações Obrigatórias
- `VITE_API_URL`: URL da API backend
- `VITE_RESTAURANT_NAME`: Nome do restaurante

#### Configurações Opcionais
- `VITE_APP_TITLE`: Título do sistema
- `VITE_RESTAURANT_LOGO`: Caminho para o logo do restaurante

#### Variáveis de Estilo (Opcionais)
Você pode personalizar a tipografia da aplicação usando estas variáveis:

```bash
# Família de fonte
VITE_FONT_FAMILY=Inter, system-ui, sans-serif

# Tamanho base da fonte
VITE_FONT_SIZE_BASE=16px

# Pesos da fonte
VITE_FONT_WEIGHT_NORMAL=400
VITE_FONT_WEIGHT_BOLD=700

# Altura da linha
VITE_LINE_HEIGHT=1.5

# Espaçamento entre letras
VITE_LETTER_SPACING=0.025em
```

### Exemplo de Uso das Variáveis de Estilo

```tsx
import StyledText from './components/StyledText';

// Título principal
<StyledText variant="title" weight="bold">
  Bater das Ondas
</StyledText>

// Subtítulo
<StyledText variant="subtitle">
  Sistema de Pedidos
</StyledText>

// Texto do corpo
<StyledText variant="body">
  Este é um texto normal usando as configurações de fonte.
</StyledText>

// Texto pequeno
<StyledText variant="caption">
  Informações adicionais
</StyledText>
```

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Preview

```bash
npm run preview
```
