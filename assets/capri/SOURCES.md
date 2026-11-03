# Assets da Capri — origem e tratamento

Personagem: **Capri**, de *Cyberpunk: Edgerunners 2*. Direitos da obra pertencem aos
detentores originais (CD PROJEKT RED / Studio Trigger). Uso aqui: protótipo pessoal.

| Arquivo | Origem | Tratamento |
|---|---|---|
| `source/capri-inactive-original.png` (868×692) | Captura enviada pelo usuário (frame do anime, repostado por terceiros com a marca d'água `@drsxlinx`) | nenhum (original preservado) |
| `source/capri-active-original.png` (686×676) | Captura enviada pelo usuário | nenhum (original preservado) |
| `capri-inactive.png` (868×686) | derivado do original desativado | **1)** marca d'água coberta com um retalho de textura de cabelo da mesma imagem (região x0–146, y100–134 copiada sobre y193–227); **2)** 6 px do topo cortados (faixa preta de captura). Proporções e desenho intocados. |
| `capri-active.png` (686×676) | cópia do original ativado | nenhum — **não usado no app desde que o estado ligado passou a ser o clipe 255** (mantido como referência) |

| `source/video/S02E04-65.mp4` (1920×1080, 21,3 s, 23,976 fps) | Clipe "Cyberpunk Edgerunners - S02E04 (65)" de animeclips.online (`/cyberpunk-edgerunners-2/`), baixado pelo usuário. O site oferece os clipes para download gratuito voltado a edições (AMV). | nenhum (original preservado) |
| `src/assets/capri/sequences/eyes-s02e04/01–29.jpg` (1280×720) | Desenhos únicos do clipe acima, de 0 s a 17,4 s (close dos olhos, painel verde) | detectados com `mpdecimate`; extraídos um a um, reduzidos para 1280 px com lanczos e salvos em JPEG q3. Sem retoque. |

| `source/video/S02E04-{162,164,255,274,275,277}.mp4` | Clipes do mesmo episódio em animeclips.online, baixados pelo usuário | nenhum |
| `src/assets/capri/sequences/eyes-pop-s02e04/01–04.jpg` (1280×720) | Os 4 desenhos únicos do clipe 255 (0 s · 1,00 s · 1,13 s · 1,25 s) — olhos de frente subindo no quadro | extraídos um a um, 1280 px lanczos, JPEG q3 |

### Catálogo dos clipes S02E04

| Clipe | Conteúdo | Uso |
|---|---|---|
| 65 | Close dos olhos (painel verde): olhar, estreitar, fechar | **loop do recorte lateral** |
| 255 | Olhos de frente subindo no quadro com quique (4 desenhos) | **estado ligado** (tela inicial e entrada da lateral) |
| 162 | Capri gira para a câmera e termina numa pose verde em 3/4, nítida em 1080p (câmera em movimento) | reservado — candidato a entrada da ativação no modo personagem |
| 164 | Rosto de frente sorrindo (0–1,5 s), olhos estreitando (~1,6 s), sorriso largo com múltiplos olhos e dissolve na forma humana (≥2,5 s); câmera em push-in contínuo | reservado — candidato ao estado "falando" (só o trecho até ~1,5 s) |
| 274, 275, 277 | Colagem glitch (olhos por todo lado, cores invertidas) | **transições em tela cheia** — enviados também como `transition3/2/1.mp4`; recodificados em `src/assets/capri/transitions/` (1280×720, H.264 CRF 20, sem áudio) |

Fora do uso: o trecho de 17,4 s a 19,7 s (efeito de múltiplos olhos) e a reabertura semicerrada (19,7 s a 21 s).
Também fora: o Shorts `5QPRS4oocgg` (edição de fã com efeitos), descartado a pedido do usuário.

### Desenhos do close dos olhos (`eyes-s02e04`)

| Quadros | Tempo no clipe | Conteúdo |
|---|---|---|
| 01 | 0–2,96 s | olhos abertos, centrados (still base) |
| 02–06 | 2,96–4,80 s | olhada para o lado |
| 07–10 | 4,80–8,68 s | olhos se estreitando |
| 11–25 | 8,68–15,31 s | variações de olhar |
| 26–29 | 15,31–17,43 s | olhos fechando até "^^" |

Duração de cada desenho em `src/features/animation/poses.ts` (`EYES_DURATIONS`).

Os arquivos usados pelo app ficam em `src/assets/capri/` (cópias idênticas dos tratados acima).

## Medições (coordenadas normalizadas, usadas em `src/features/animation/poses.ts`)

| Pose | Olho esquerdo (centro do anel) | Olho direito |
|---|---|---|
| inactive | (0.27, 0.455) | (0.65, 0.526) |
| active | (0.26, 0.42) | (0.57, 0.56) |

## Material ainda necessário para animações fiéis

Os dois frames vêm de **tomadas diferentes** (ângulo de cabeça e enquadramento distintos),
então não existe interpolação fiel entre eles. Para ir além da transição atual:

1. **Clipe da ativação** — o trecho do anime em que a região dos olhos passa de branca para
   verde, na mesma tomada. Extraído em frames (`ffmpeg -i clip.mp4 -vf fps=24 %04d.png`),
   vira uma sequência de transição real.
1b. ~~Piscada~~ — **resolvido para o modo lateral** com o clipe S02E04 (65): o vai-e-volta fecha e
   reabre os olhos com os desenhos originais.
2. **Piscada na tomada ativa (retrato)** — frames com as mesmas dimensões/enquadramento de
   `capri-active.png`, em `src/assets/capri/sequences/active-blink/0001.png…`. O app já toca
   essa pasta automaticamente em intervalos aleatórios.
3. **Idle na tomada desativada** — mesma lógica em `sequences/inactive-idle/`.

Fontes preferidas: arquivo local do episódio/trailer oficial obtido legalmente. A lista de clipes
de animeclips.online carrega via Google Drive atrás de Cloudflare Turnstile; por isso os
clipes são baixados manualmente pelo usuário, não por script.
