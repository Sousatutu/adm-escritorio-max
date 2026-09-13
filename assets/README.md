# Assets do escritório

Os personagens foram desenhados para este projeto com primitivas de pixel art pelo gerador `tools/build-assets.py`. Não há sprites, fontes ou texturas baixados de terceiros.

- `characters.png`: atlas de oito personagens, quatro direções e animações de caminhar, esperar, conversar, carimbar, entregar e reagir. Cada quadro ocupa 32 × 48 pixels, com uma borda de um pixel entre recortes.
- `atlas.js`: posições e velocidades de cada animação.
- `portraits/`: retratos derivados dos personagens do atlas.
- O cenário é desenhado em Canvas por `rendering/scene.js`, com chão e decoração armazenados em uma camada estática.

Para regenerar os PNGs: `python tools/build-assets.py`, com Pillow instalado. Os arquivos gerados já estão incluídos; Python não é necessário para jogar.
