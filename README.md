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
| `F` | fala de demonstração com a voz do sistema (pt-BR), com a Capri ativa; F de novo interrompe |

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
- **Boca e fala** (`src/features/speech/`, `MouthLayer.tsx`): ligada, o quadro se estende
  abaixo do clipe na cor do rosto (`#050215`, amostrada do 65), onde fica a boca — a ~0,6 d
  abaixo dos olhos, como no original. São 5 desenhos originais recortados com alfa
  (`scripts/mouth/`): a linha fechada e 4 aberturas do `evil-capri.mp4`. A forma é escolhida
  pelo nível de voz (0–1), trocada no máximo a 12 qps, sem interpolar — como animação 2D.
  A demo (F) fala com a voz do sistema (Web Speech API, Luciana se houver) e move a boca por
  um envelope de sílabas a cada palavra; falar durante a entrada a encerra na hora.
  A boca surge quando a entrada dos olhos (255) termina, num glitch curto (`GlitchBurst.tsx`:
  rasgos + separação RGB real por canal, 0,42 s) que também disfarça o corte para o loop (65).
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
src/features/speech      boca: formas, nível de voz, demo (F), ponte de áudio do TTS
src/features/theme       tema claro/escuro
src/features/topics      tópicos demonstrativos
src/hooks            viewport, métricas fictícias, fontes de intenção
assets/capri/        originais, tratados e documentação de origem
scripts/mouth/       recorte dos desenhos da boca a partir dos frames originais
```

## Voz no futuro

Entradas são `IntentSource`s (`src/features/activation/sources/`). O teclado é uma delas.
Uma fonte de wake word "Capri" só precisa chamar `emit({ type: 'activate' })`; adicione-a em
`SOURCES` no `App.tsx`. A animação não muda. Estados de fala (ouvindo/falando) entram como
novas fases em `model.ts`, com novas poses/sequências.

**Text-to-speech → boca.** Quando o agente tocar o áudio da fala num `<audio>`, ligue-o com
`attachSpeechAudio(audio)` (`src/features/speech/audio.ts`): a energia da voz vira o nível
0–1 e a boca acompanha; `play`/`ended` marcam o estado "Falando". Outra fonte pode chamar
`setSpeaking()` + `setSpeechLevel()` direto (ex.: visemas vindos do serviço de TTS).
