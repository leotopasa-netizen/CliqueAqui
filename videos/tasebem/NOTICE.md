# Vídeos Tá-se Bem por nicho

26 vídeos verticais (1080×1920, 30 i/s, 60 s), sem voz, com música original, um por nicho:

- **A · Marcações:** barbearia, cabeleireiro, estética, unhas, massagens, tatuagens, personal trainer
- **B · Restauração:** restaurante, pizzaria, sushi, café, pastelaria, confeitaria
- **C · Técnicos e clínicos:** oficina, dentista, clínica, fisioterapia, jardinagem, limpezas, obras
- **D1 · Noite e eventos:** discoteca, bar, salão de festas
- **D2 · Alojamento:** alojamento local, hotel, guest house

Os negócios, nomes, preços e domínios que aparecem nos vídeos são exemplos fictícios.

## Onde estão as coisas

| Ficheiro | O que é |
|---|---|
| `gerar.mjs` | os textos e dados de cada nicho e o esqueleto comum de 60 s → escreve `scene/<id>.html` |
| `scene/engine.js` | o motor: cada imagem é uma função pura do tempo (`window.__seek(t)`) |
| `tools/musica.mjs` | as 5 músicas originais (uma por conceito), sintetizadas → `audio/musica-<conceito>.wav` |
| `tools/render-todos.sh` | render final de todos os nichos → `out/final/<id>.mp4` |
| `tools/planche.sh <id>` | folha de controlo com 20 imagens do vídeo → `out/planche-<id>.jpg` |
| `tools/rendu.mjs` … | ferramentas de render do kit (Chromium sem janela → ffmpeg) |

## Mudar um texto e voltar a renderizar

1. Edita o nicho em `gerar.mjs`, por exemplo o `hook`, os `servicos`, o `negocio` ou o `dominio`.
2. Corre `node gerar.mjs`.
3. Apaga `out/final/<id>.mp4` e corre `tools/render-todos.sh`. Só se renderizam os que faltam, em cerca de 3 minutos por vídeo.

Os cortes estão numa grelha de 0,5 s, que é uma batida a 120 bpm. A música cai no "Com a Tá-se Bem", aos 11 s, e o último golpe coincide com o logótipo, aos 54,5 s.
