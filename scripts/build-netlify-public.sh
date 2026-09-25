#!/bin/sh
# Gera netlify-public/ contendo EXATAMENTE os arquivos de scripts/netlify-allowlist.txt.
# É o único conteúdo publicado pelo Netlify (ver netlify.toml). Falha (exit 1) a
# qualquer inconsistência, e nesse caso o Netlify mantém o deploy anterior no ar.
# Não lê nem imprime variáveis de ambiente; só imprime caminhos relativos e contagens.

set -eu
LC_ALL=C
export LC_ALL

OUT="netlify-public"
ALLOWLIST="scripts/netlify-allowlist.txt"

fail() {
  echo "ERRO: $*" >&2
  exit 1
}

cd "$(dirname "$0")/.." || fail "não foi possível entrar na raiz do repositório"
[ -f "$ALLOWLIST" ] || fail "allowlist não encontrada: $ALLOWLIST"
[ -f index.html ] || fail "index.html não encontrado na raiz"

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

if command -v sha256sum >/dev/null 2>&1; then
  hash_of() { sha256sum "$1" | cut -d' ' -f1; }
elif command -v shasum >/dev/null 2>&1; then
  hash_of() { shasum -a 256 "$1" | cut -d' ' -f1; }
else
  fail "sha256sum/shasum indisponível"
fi

# Caminhos que nunca podem ser publicados (checado na allowlist e na saída).
FORBIDDEN='(^|/)\.|\.(md|markdown|sql|ts|tsx|mts|cts|sh|toml|env|map|log|bak|orig|swp|ya?ml|lock|pem|key)$|\.env|(^|/)(supabase|portal-v12|dist|node_modules|scripts|netlify|netlify-public)(/|$)|(^|/)js/js(/|$)|(^|/)package(-lock)?\.json$'
# Únicas extensões que o portal usa em produção.
ALLOWED_EXT='\.(html|css|js|png|jpg)$'

# 1) Lê a allowlist (sem comentários e linhas vazias) e valida cada entrada.
tr -d '\r' < "$ALLOWLIST" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' | grep -v '^#' | grep -v '^$' > "$TMP/entries" || true
[ -s "$TMP/entries" ] || fail "allowlist vazia"

DUPS=$(sort "$TMP/entries" | uniq -d)
[ -z "$DUPS" ] || fail "entradas duplicadas na allowlist: $DUPS"

while IFS= read -r p; do
  case "$p" in
    /*|*..*|./*|*//*|*\\*|*' '*) fail "caminho inválido na allowlist: $p" ;;
  esac
  if printf '%s\n' "$p" | grep -Eiq "$FORBIDDEN"; then
    fail "caminho proibido na allowlist: $p"
  fi
  if ! printf '%s\n' "$p" | grep -Eiq "$ALLOWED_EXT"; then
    fail "extensão não permitida na allowlist: $p"
  fi
  [ ! -L "$p" ] || fail "link simbólico não permitido: $p"
  [ -f "$p" ] || fail "arquivo da allowlist não existe: $p"
done < "$TMP/entries"

sort "$TMP/entries" > "$TMP/expected"

# 2) Começa de um diretório de saída limpo e copia somente a allowlist.
[ "$OUT" = "netlify-public" ] || fail "diretório de saída inesperado"
rm -rf "$OUT"
mkdir "$OUT"
while IFS= read -r p; do
  mkdir -p "$OUT/$(dirname "$p")"
  cp "$p" "$OUT/$p"
done < "$TMP/entries"

# --- verificações ---

# 3) A saída contém exatamente o conjunto da allowlist (nada a mais, nada a menos).
[ -z "$(find "$OUT" ! -type f ! -type d)" ] || fail "a saída contém item que não é arquivo regular"
[ -z "$(find "$OUT" -type d -empty)" ] || fail "a saída contém diretório vazio"
(cd "$OUT" && find . -type f | sed 's|^\./||' | sort) > "$TMP/out_files"
if ! diff "$TMP/expected" "$TMP/out_files" > "$TMP/diff.txt"; then
  echo "Diferenças entre a allowlist (<) e a saída (>):" >&2
  cat "$TMP/diff.txt" >&2
  fail "a saída não corresponde à allowlist"
fi

# 4) Nenhum caminho proibido na saída.
BAD=$(grep -Ei "$FORBIDDEN" "$TMP/out_files" || true)
[ -z "$BAD" ] || fail "caminho proibido na saída: $BAD"

# 5) Cada arquivo copiado é idêntico (SHA-256) ao arquivo-fonte.
while IFS= read -r p; do
  [ "$(hash_of "$p")" = "$(hash_of "$OUT/$p")" ] || fail "hash diferente entre fonte e saída: $p"
done < "$TMP/entries"

# 6) Toda referência local do index.html existe na saída.
{
  grep -oE '(src|href)="[^"]*"' "$OUT/index.html" || true
  grep -oE 'property="og:image"[^>]*content="[^"]*"' "$OUT/index.html" || true
} | sed -E 's/^.*(src|href|content)="//; s/"$//' | sort -u > "$TMP/refs"

NREFS=0
while IFS= read -r r; do
  case "$r" in
    ''|'#'*|'?'*|http://*|https://*|mailto:*|tel:*|data:*|javascript:*|//*) continue ;;
  esac
  f="${r%%[?#]*}"
  [ -n "$f" ] || continue
  NREFS=$((NREFS + 1))
  [ -f "$OUT/$f" ] || fail "referência local do index.html ausente na saída: $f"
done < "$TMP/refs"
[ "$NREFS" -gt 0 ] || fail "nenhuma referência local encontrada no index.html (verificação inválida)"

# 7) Toda foto usada por js/data/gestao.js existe na saída.
grep -oE 'foto: *"[^"]+"' "$OUT/js/data/gestao.js" | sed -E 's/^foto: *"//; s/"$//' | sort -u > "$TMP/fotos" || true
[ -s "$TMP/fotos" ] || fail "nenhuma foto encontrada em js/data/gestao.js (verificação inválida)"
NFOTOS=0
while IFS= read -r f; do
  case "$f" in
    */*|*..*) fail "nome de foto inválido em gestao.js: $f" ;;
  esac
  NFOTOS=$((NFOTOS + 1))
  [ -f "$OUT/assets/img/gestao/$f" ] || fail "foto de gestao.js ausente na saída: assets/img/gestao/$f"
done < "$TMP/fotos"

# 8) Resumo.
NFILES=$(wc -l < "$TMP/expected" | tr -d ' ')
BYTES=0
while IFS= read -r p; do
  BYTES=$((BYTES + $(wc -c < "$OUT/$p")))
done < "$TMP/entries"

echo "OK: $NFILES arquivos em $OUT/ ($BYTES bytes); hashes fonte/saída idênticos;" \
     "$NREFS referências locais do index.html e $NFOTOS fotos de gestao.js verificadas."
