import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "Portal CAEF <notificacoes@seu-dominio-verificado.exemplo>";
function validarPortalPublicUrl(valor) {
    if (!valor) return null;
    try {
        const u = new URL(valor);
        if (u.protocol !== "http:" && u.protocol !== "https:") return null;
        return valor.replace(/\/+$/, "");
    } catch { return null; }
}
const PORTAL_PUBLIC_URL = validarPortalPublicUrl(Deno.env.get("PORTAL_PUBLIC_URL"));
const TAMANHO_LOTE = 20;
const INTERVALO_ENTRE_ENVIOS_MS = 600;
const MAX_TENTATIVAS = 5;
function aguardar(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
async function marcar(supabase, fn, args) {
    const {data,error} = await supabase.rpc(fn,args);
    if (error || data !== true) {
        console.error(`falha ao confirmar ${fn}(${JSON.stringify(args)}):`, error ? error.message : "nenhuma linha foi atualizada (id inexistente, ou já reservada por outra execução?)");
        return false;
    }
    return true;
}
const ERROS_QUOTA_RESEND = new Set(["daily_quota_exceeded","monthly_quota_exceeded"]);
const ERROS_PERMANENTES_RESEND = new Set(["validation_error","invalid_parameter","missing_required_field","missing_required_parameter","invalid_attachment","invalid_idempotency_key","not_found","method_not_allowed","missing_api_key","restricted_api_key","suspended_api_key","invalid_permission","email_above_quota"]);
const ERROS_TRANSITORIOS_RESEND = new Set(["concurrent_idempotent_requests","resource_locked","invalid_idempotent_request"]);
function classificarErroResend(status, corpoTexto) {
    let nome = null, mensagem = corpoTexto;
    try {
        const corpo = JSON.parse(corpoTexto);
        if (corpo && typeof corpo.name === "string") nome = corpo.name;
        if (corpo && typeof corpo.message === "string") mensagem = corpo.message;
    } catch {}
    if (status === 429) {
        if (nome && ERROS_QUOTA_RESEND.has(nome)) return {categoria:"limite_quota",motivo:`Resend ${nome}: ${mensagem}`};
        return {categoria:"limite_taxa",motivo:`Resend ${nome ?? "rate_limit_exceeded"}: ${mensagem}`};
    }
    if (nome && ERROS_PERMANENTES_RESEND.has(nome)) return {categoria:"permanente",motivo:`Resend ${nome}: ${mensagem}`};
    if (nome && ERROS_TRANSITORIOS_RESEND.has(nome)) return {categoria:"transitorio",motivo:`Resend ${nome}: ${mensagem}`};
    if (status >= 500) return {categoria:"transitorio",motivo:`Resend HTTP ${status}: ${mensagem}`};
    return {categoria:"permanente",motivo:`Resend HTTP ${status}: ${mensagem}`};
}
Deno.serve(async (req) => {
    const auth = req.headers.get("Authorization") ?? "";
    if (!SERVICE_ROLE_KEY || auth !== `Bearer ${SERVICE_ROLE_KEY}`) return new Response(JSON.stringify({erro:"não autorizado"}),{status:401});
    if (!PORTAL_PUBLIC_URL) {
        console.error("PORTAL_PUBLIC_URL ausente ou inválida — nenhum e-mail processado nesta execução.");
        return new Response(JSON.stringify({erro:"configuração ausente ou inválida",detalhe:'PORTAL_PUBLIC_URL não está definida (ou não é uma URL http/https válida) nas variáveis de ambiente desta função. Nenhum item da fila foi processado nesta execução — configure o secret antes de tentar de novo (README-implantacao.md, seção "Configurar os segredos").'}),{status:500,headers:{"Content-Type":"application/json"}});
    }
    const supabase = createClient(SUPABASE_URL,SERVICE_ROLE_KEY);
    const execucaoId = crypto.randomUUID();
    const {data:lote,error:erroLote} = await supabase.rpc("email_queue_reservar_lote",{p_execucao_id:execucaoId,p_limite:TAMANHO_LOTE});
    if (erroLote) return new Response(JSON.stringify({erro:"falha ao reservar a fila",detalhe:erroLote.message}),{status:500});
    if (!lote || lote.length === 0) return new Response(JSON.stringify({processados:0,mensagem:"fila vazia"}),{status:200});
    let enviados=0, falhados=0, descartados=0, aguardandoCapacidade=0, avisosDeConfirmacao=0;
    for (const item of lote) {
        try {
            const {data:preferenciaAtiva,error:erroPreferencia} = await supabase.rpc("email_queue_preferencia_ativa",{p_user_id:item.destinatario_user_id});
            if (erroPreferencia) throw new Error(`falha ao conferir preferência: ${erroPreferencia.message}`);
            if (!preferenciaAtiva) {
                if (!(await marcar(supabase,"email_queue_marcar_descartado",{p_id:item.id,p_execucao_id:execucaoId}))) avisosDeConfirmacao++;
                descartados++;
                await aguardar(INTERVALO_ENTRE_ENVIOS_MS);
                continue;
            }
            const assunto = item.modulo === "mural" ? `[Portal CAEF] Mural: ${item.titulo}` : `[Portal CAEF] Radar: ${item.titulo}`;
            const linkAbsoluto = item.link ? new URL(item.link,PORTAL_PUBLIC_URL).toString() : null;
            const corpoHtml = `
        <p>${escaparHtml(item.resumo)}</p>
        <p><strong>${escaparHtml(item.titulo)}</strong></p>
        ${linkAbsoluto ? `<p><a href="${escaparAtributoHtml(linkAbsoluto)}">Ver no Portal CAEF</a></p>` : ""}
        <hr>
        <p style="font-size:12px;color:#666">
          O Portal CAEF é uma iniciativa estudantil, não um serviço oficial da UFPB.
          Você recebeu este e-mail porque ativou notificações em "Minha Conta" no Portal CAEF.
          Para parar de receber, desative a opção em Minha Conta a qualquer momento.
        </p>`;
            const resposta = await fetch("https://api.resend.com/emails",{
                method:"POST",
                headers:{Authorization:`Bearer ${RESEND_API_KEY}`,"Content-Type":"application/json","Idempotency-Key":`caef-email-queue-${item.id}`},
                body:JSON.stringify({from:RESEND_FROM,to:[item.destinatario_email],subject:assunto,html:corpoHtml})
            });
            if (!resposta.ok) {
                const detalhe = await resposta.text();
                const classificacao = classificarErroResend(resposta.status,detalhe);
                if (classificacao.categoria === "limite_taxa" || classificacao.categoria === "limite_quota") {
                    if (!(await marcar(supabase,"email_queue_marcar_aguardando_capacidade",{p_id:item.id,p_execucao_id:execucaoId,p_motivo:classificacao.motivo,p_curto_prazo:classificacao.categoria==="limite_taxa"}))) avisosDeConfirmacao++;
                    aguardandoCapacidade++;
                    await aguardar(INTERVALO_ENTRE_ENVIOS_MS);
                    continue;
                }
                if (classificacao.categoria === "permanente") {
                    if (!(await marcar(supabase,"email_queue_marcar_falha",{p_id:item.id,p_execucao_id:execucaoId,p_erro:classificacao.motivo,p_max_tentativas:0}))) avisosDeConfirmacao++;
                    falhados++;
                    await aguardar(INTERVALO_ENTRE_ENVIOS_MS);
                    continue;
                }
                throw new Error(classificacao.motivo);
            }
            if (!(await marcar(supabase,"email_queue_marcar_enviado",{p_id:item.id,p_execucao_id:execucaoId}))) avisosDeConfirmacao++;
            enviados++;
        } catch (e) {
            if (!(await marcar(supabase,"email_queue_marcar_falha",{p_id:item.id,p_execucao_id:execucaoId,p_erro:String(e instanceof Error?e.message:e),p_max_tentativas:MAX_TENTATIVAS}))) avisosDeConfirmacao++;
            falhados++;
        }
        await aguardar(INTERVALO_ENTRE_ENVIOS_MS);
    }
    if (avisosDeConfirmacao > 0) console.error(`${avisosDeConfirmacao} marcação(ões) no banco não puderam ser confirmadas nesta execução — ver logs acima. O e-mail/decisão em si já aconteceu; só o registro no banco pode estar desatualizado para esses itens (serão reavaliados na próxima execução).`);
    return new Response(JSON.stringify({processados:lote.length,enviados,falhados,descartados,aguardandoCapacidade,avisosDeConfirmacao}),{status:200,headers:{"Content-Type":"application/json"}});
});
function escaparHtml(texto) {
    if (!texto) return "";
    return texto.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
function escaparAtributoHtml(texto) {return escaparHtml(texto);}
