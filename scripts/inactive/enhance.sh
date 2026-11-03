#!/bin/sh
# Melhora o still desativado sem redesenhar (filtros clássicos, sem IA):
#   nlmeans  — remove o ruído/blocos da recompressão da captura;
#   lanczos  — amplia 2× (868×686 → 1736×1372) para telas retina;
#   bilateral — alisa as áreas chapadas preservando as bordas (cel animation);
#   cas      — reforça o contraste das bordas.
# Entrada: assets/capri/capri-inactive-868.png (versão tratada anterior, sem marca d'água).
set -e
cd "$(dirname "$0")/../.."
ffmpeg -loglevel error -y -i assets/capri/capri-inactive-868.png \
  -vf "nlmeans=s=4:p=7:r=15,scale=iw*2:ih*2:flags=lanczos,bilateral=sigmaS=3:sigmaR=0.06:planes=7,cas=strength=0.7" \
  -frames:v 1 -compression_level 9 src/assets/capri/capri-inactive.png
cp src/assets/capri/capri-inactive.png assets/capri/capri-inactive.png
