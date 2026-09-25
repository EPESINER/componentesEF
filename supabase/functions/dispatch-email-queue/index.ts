// Disparador interno da fila de notificacoes. O token aleatorio so existe no Vault do banco.
// Este arquivo contem somente SHA-256 do token, nunca o token, RESEND_API_KEY ou service_role.
const EXPECTED_HASH = "aed9e73fce4629f522a9be01d64dde809af0b065a44953de37a682c87c0fac69";

async function tokenValido(token: string): Promise<boolean> {
  if (!/^[a-f0-9]{64}$/.test(token)) return false;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  const hashed = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  let difference = 0;
  for (let index = 0; index < 64; index++) difference |= hashed.charCodeAt(index) ^ EXPECTED_HASH.charCodeAt(index);
  return difference === 0;
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return new Response('{"erro":"metodo nao permitido"}', {status: 405, headers: {"Content-Type":"application/json"}});
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const token = request.headers.get("X-CAEF-Scheduler-Token") || "";
  if (!(await tokenValido(token))) {
    return new Response('{"erro":"nao autorizado"}', {status:401, headers: {"Content-Type":"application/json"}});
  }
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const baseUrl = Deno.env.get("SUPABASE_URL");
  if (!serviceRole || !baseUrl) {
    console.error("scheduler: configuracao interna do Supabase indisponivel");
    return new Response('{"erro":"configuracao interna indisponivel"}', {status: 500, headers: {"Content-Type":"application/json"}});
  }
  try {
    const worker = await fetch(`${baseUrl}/functions/v1/process-email-queue`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${serviceRole}`, "apikey": serviceRole, "Content-Type": "application/json" },
      body: "{}",
      signal: AbortSignal.timeout(60000)
    });
    if (!worker.ok) {
      console.error("scheduler: process-email-queue retornou HTTP", worker.status);
      return new Response(JSON.stringify({erro:"trabalhador nao concluiu", status:worker.status}), {status:502, headers: {"Content-Type":"application/json"}});
    }
    const result = await worker.json();
    return new Response(JSON.stringify({processados:result.processados ?? 0, enviados:result.enviados ?? 0, falhados:result.falhados ?? 0, descartados:result.descartados ?? 0, aguardandoCapacidade:result.aguardandoCapacidade ?? 0, avisosDeConfirmacao:result.avisosDeConfirmacao ?? 0}), {status:200, headers: {"Content-Type":"application/json"}});
  } catch(error) {
    console.error("scheduler: erro ao invocar process-email-queue", error instanceof Error ? error.message : "erro inesperado");
    return new Response('{"erro":"falha ao invocar trabalhador"}', {status:502, headers: {"Content-Type":"application/json"}});
  }
});
