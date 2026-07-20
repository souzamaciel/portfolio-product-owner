#!/bin/zsh
# Sobe o portfólio em http://localhost:8321 (v2 em /v2/). Feche esta janela para parar.
cd "$(dirname "$0")"
if lsof -t -iTCP:8321 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "O servidor já está rodando em http://localhost:8321"
  open "http://localhost:8321/v2/"
  exit 0
fi
open "http://localhost:8321/v2/"
python3 -m http.server 8321
