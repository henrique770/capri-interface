# Capri

Protótipo desktop da Capri (*Cyberpunk: Edgerunners 2*) — foco em estados, transições e
base de projeto. Sem IA, sem backend: a Capri só existe visualmente por enquanto, com a
arquitetura pronta para receber wake word e voz.

## Executar

```bash
npm install
npm run setup:electron   # só se o Electron não baixar o binário no install
npm run dev              # app com hot reload
```

Outros: `npm run build` (gera `out/`), `npm start` (roda o build), `npm run typecheck`.

## Atalhos (desenvolvimento)

| Tecla | Ação |
|---|---|
| `Espaço` | ativar / desativar |
| `H` | abrir / fechar o painel Homelab |
| `T` | histórico de tópicos |
| `Esc` | voltar à visualização principal |
| `D` | tema: sistema → claro → escuro |

O tema segue o sistema por padrão; a escolha manual fica salva no `localStorage`
(`capri.theme`). Os tokens de cor ficam em `src/styles/global.css` — o escuro só
sobrescreve as variáveis em `:root[data-theme='dark']`. A moldura nativa da janela
acompanha via `nativeTheme` (ponte `window.capri.setTheme`).

## Como a animação funciona

- **Poses** (`src/features/animation/poses.ts`): cada estado é um frame **original**, com os
  centros dos olhos medidos.
- **Câmera alinhada aos olhos** (`camera.ts`): toda pose é enquadrada em unidades de
  "distância entre os olhos", com escala uniforme (sem distorção). Assim, frames de tomadas
  diferentes trocam com o olhar praticamente no mesmo lugar.
- **Transição em tela cheia** (`src/features/transitions/`, `TransitionOverlay.tsx`): ligar ou
  desligar toca um clipe do S02E04 (277 → 275 → 274, em rodízio) cobrindo a janela inteira.
  Um shader WebGL faz o glitch: o vídeo entra em blocos sobre a interface, com rasgos
  horizontais e separação RGB; com a tela coberta, o estado troca por baixo (e o quadro muda
  de forma); na saída, o vídeo se desfaz em blocos e revela o novo estado. Teto de 1,7 s.
  Ajustes de tempo em `timeline.ts`.
- **Modo conteúdo** (`layout.ts`): a Capri recolhe para um recorte encostado na borda
  direita da janela mostrando só os olhos — nunca no centro, nunca sob os cards.
- **Close dos olhos animado** (pose `eyes`): com a Capri ativa (quadro grande e lateral), toca os 29
  desenhos originais do S02E04 (0–17,4 s) em vai-e-volta, com a duração exata de cada desenho.
  Ela olha, estreita os olhos e, na virada, **fecha e reabre** — sem cortes inventados. A troca
  entre retrato e close é um corte curto, como uma mudança de plano.
- **Estado ligado** (pose `eyesPop`, S02E04 · 255): ao ativar, o quadro passa de retrato para
  16:9 enquanto a cortina revela o clipe; os olhos sobem para dentro do quadro com o quique
  original. Depois dessa entrada, corta para o loop (65) — no quadro grande e na lateral.
- **Respiração**: oscilação mínima (0,6 %) na imagem, não no recorte.
- **Sequências de frames** (`sequences.ts`, `useFrameSequence.ts`): solte PNGs em
  `src/assets/capri/sequences/<nome>/` e a pose correspondente passa a tocá-los
  (piscadas etc.). Vazias por enquanto — veja `assets/capri/SOURCES.md`.

## Estrutura

```
electron/            processo principal + preload (contextIsolation, sandbox)
src/app/             entrada e composição da janela
src/components/capri personagem (stage, camadas, texto lateral)
src/components/content Homelab demonstrativo, histórico de tópicos
src/components/ui    primitivas (barra superior, status, toggle)
src/features/activation  máquina de estados pura + store + fontes de intenção
src/features/animation   poses, câmera, layout, tempos, transições
src/features/topics      tópicos demonstrativos
src/hooks            viewport, métricas fictícias, fontes de intenção
assets/capri/        originais, tratados e documentação de origem
```

## Voz no futuro

Entradas são `IntentSource`s (`src/features/activation/sources/`). O teclado é uma delas.
Uma fonte de wake word "Capri" só precisa chamar `emit({ type: 'activate' })`; adicione-a em
`SOURCES` no `App.tsx`. A animação não muda. Estados de fala (ouvindo/falando) entram como
novas fases em `model.ts`, com novas poses/sequências.
