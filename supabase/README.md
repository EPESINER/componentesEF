# Supabase — baseline do Portal CAEF

Este diretório versiona, **sem alterações**, o estado atual do projeto Supabase `Ed-fisica.ufpb` (`zutltokolonvbxbvosik`, região `sa-east-1`, Postgres 17) em **24/09/2026**.

É uma baseline documental: os arquivos são cópias fiéis do que já está aplicado/implantado. Nada aqui é aplicado ou implantado a partir deste repositório.

## Conteúdo

- `migrations/` — as 23 migrations registradas em `supabase_migrations.schema_migrations`, com **versão e nome idênticos** ao histórico do Supabase. Cada arquivo é o texto exato do campo `statements`.
- `functions/process-email-queue/index.ts` — Edge Function ativa (v4, `verify_jwt = true`). Processa a fila `public.email_queue` e envia e-mails via Resend.
- `functions/dispatch-email-queue/index.ts` — Edge Function ativa (v2, `verify_jwt = true`). Disparador interno chamado pelo job do `pg_cron`; valida o token do agendador por SHA-256 e aciona `process-email-queue`.
- `.env.example` — apenas os **nomes** das variáveis das Edge Functions, sem valores.

## Migrations recuperadas (SHA-256 do arquivo = SHA-256 do `statements` no banco)

| Versão | Nome | SHA-256 |
|---|---|---|
| 20260920204248 | caef_area_estudante_v24_auth_functions | `74f83b6ce5a51094654ef184a1f00e7ed34c68f3e9a49494e11aae030415a825` |
| 20260921023842 | caef_v26_student_profiles_rls | `30952f141647942eb9e10c9829184180bdea62a1b2871c3e39ac87bb6eed6e8e` |
| 20260921040039 | caef_v27_private_avatars_storage_rls | `857618afd6740da8a4036b8c88b00ee14ac3f77cacfadd1321c045e5006bedfb` |
| 20260922022855 | caef_v28_01_administradores | `5cca4dc1714dee851816def3cb05b79e1a07b1b7ec43c2441a40eda9412f06de` |
| 20260922023046 | caef_v28_02_mural_radar_tabelas | `9f9309bf57948a519ea272536fefa7fce903c303e384b17e0f0e4f73917f2413` |
| 20260922023232 | caef_v28_03_storage_avisos | `5426a82a104c715a87d488b16e6855eb32e84ddefc7b895a82d5a1448cf09a19` |
| 20260922023357 | caef_v28_04_auditoria | `474d7e6794449d7d287b83fc7ff2b1ccd547f9a69e1859f7e8ab1c30af104594` |
| 20260922024054 | caef_v28_05a_notificacoes_estruturas_gatilhos | `0c0a903354a5523d38200c5fc93e600ac1dc9704c85a01ca09fe8144f35be135` |
| 20260922024116 | caef_v28_05b_notificacoes_fila_rpc | `daebb449e6d9a19338e9d1530f9eb0f1be77be0ae3da64bd132bff3ff9ac671e` |
| 20260922024141 | caef_v28_05c_admin_avisos_rpc | `16dce11d6baba67a35fa1a06c31f0e6322b7b2fa3ce5a68a67144dbb94f8e971` |
| 20260922024210 | caef_v28_05d_admin_radar_rpc | `4633fd0189518a152816cdf4122a249b5be885d2d5e0df6893727ec0092c1a86` |
| 20260922024313 | caef_v28_06_migracao_dados | `1593193ce79c446a8a4cf7937fe5946592bad99e053c5cc4e52f8a99d09655e5` |
| 20260922025556 | caef_v28_fix_notification_preference_table_privileges | `b71237992ce19b69e5f2eabfd11202e96aab523e132f63749588f01203ba0ed3` |
| 20260922034042 | caef_v28_restrict_internal_trigger_functions | `1ce668c87e19761291aa581dd8c2b49dfca46a3229aa7d95fccee24259055b21` |
| 20260924015132 | caef_enable_pg_net_pg_cron_for_email_queue | `aca8b6d758f43338e3f4112d0b23581b53483823650752bfb68834c05dd11594` |
| 20260924015509 | caef_schedule_email_queue_every_five_minutes | `e759b1d10446828ce45324b051bc9c1a54a2d56c1b46e924cd4c922ad4b9da64` |
| 20260924020514 | caef_v29_demands_votes_comments_reports_and_private_journey | `3d4270fd5208c1754a14a1dab0e553e113aadcc9e5c176826bc8278967f136e5` |
| 20260924021011 | caef_v29_photo_consent_anon_view_and_rate_limits | `cb5cae9f0722106f9ccf19c4288a781d8a699e025ff5f6ec7535234b2346d8fa` |
| 20260924021821 | caef_v29_public_photo_optin_policy_and_author_guard | `1d74267c38800d0aa6149ef82ee960b1f39fd16055303e470e531a9d8194950a` |
| 20260924024357 | caef_v29_require_confirmed_academic_account_and_explicit_public_identity_v2 | `2c4e52a80e13fc78e293659f67fe190e8e333bb87d7409445bfcc862291122bd` |
| 20260924024620 | caef_v29_public_feed_identity_controls_and_report_limit | `5197ec49d72d799150d44b6d5d0e573971ac92844f33bad0392878a98067560f` |
| 20260924024758 | caef_v29_reports_resolution_state | `8fd05bcd6ece14d61f5f15735bac0538195fb7819a519b14cf86022ae61adb1e` |
| 20260924032126 | caef_v29_remove_obsolete_public_identity_rpc | `6edbf15270a1ff87cb3a79b0db3b748ddf3d0b3a986c065aa99cce5cff6c0f3a` |

A migration `20260922024313_caef_v28_06_migracao_dados` contém contatos públicos de projetos, fornecidos para divulgação.

## Edge Functions

| Função | Versão na plataforma | `verify_jwt` | SHA-256 do `index.ts` versionado |
|---|---|---|---|
| `process-email-queue` | v4 | `true` | `fa741cd88e88fda6ffbc12d7328436168c679cee6bb44ddd880572a64974e41c` |
| `dispatch-email-queue` | v2 | `true` | `ebabb06ccc8c4d29cd1b2af892b71803e4c2efeb5cbe48c42742c03c77509cfe` |

Identificadores de bundle da plataforma (`ezbr_sha256`, calculados sobre o pacote implantado, **não** sobre o arquivo): `process-email-queue` = `8265c1b539dae2b8cbea8e2371f820bfeb4fda7ece73cc233f015ff2e1c9c540`; `dispatch-email-queue` = `0aa3f64e109899f937ea20536966693041814bd5a99687652140a9e7cc641840`.

O `dispatch-email-queue` contém `EXPECTED_HASH`, que é o SHA-256 do token do agendador. O token em si existe apenas no Vault do banco.

## O que NÃO está versionado (por natureza ou por decisão desta etapa)

- **Segredos das Edge Functions**: `RESEND_API_KEY`, `RESEND_FROM`, `PORTAL_PUBLIC_URL` (ver `.env.example`).
- **Vault do banco**: segredos `caef_scheduler_token` e `caef_scheduler_anon_key` (somente os nomes são citados; os valores nunca entram no Git).
- **Configurações de Auth do painel**, incluindo a ativação do hook *Before User Created* que usa `public.caef_restrict_signup`.
- **Dados** das tabelas e usuários do Auth.
- **Objetos provisionados pela plataforma Supabase**, sem migration correspondente: a função `public.rls_auto_enable()` e o event trigger `ensure_rls` (a migration `20260922034042` apenas revoga a execução dessa função).
- **`supabase/config.toml`** e configuração local/declarativa: ficam para etapa posterior.
- O `process-email-queue` menciona um `README-implantacao.md` que não existe neste repositório.

## Como conferir a baseline (somente leitura)

```sql
select version, name,
       encode(sha256(convert_to(statements[1], 'UTF8')), 'hex') as sha256
from supabase_migrations.schema_migrations
order by version;
```

O resultado deve coincidir com a tabela acima e com `sha256sum supabase/migrations/*.sql`.
