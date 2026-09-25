
begin;
create table if not exists public._migracoes_aplicadas (
 nome text not null,
 tabela text not null,
 registro_id text not null,
 aplicada_em timestamptz not null default now(),
 primary key(nome,tabela,registro_id)
);
comment on table public._migracoes_aplicadas is 'Ledger de conteúdo já inserido por script de migração (por id individual) — impede que rodar 06-migracao-dados.sql de novo recrie um aviso/oportunidade que um administrador excluiu pelo painel depois da primeira aplicação. Nunca editada manualmente, exceto para forçar uma remigração intencional (ver comentário no topo do script).';
alter table public._migracoes_aplicadas enable row level security;
do $$
begin
 if exists (select 1 from public._migracoes_aplicadas where nome='v28-conteudo-inicial') then
   raise notice 'Migração "v28-conteudo-inicial" já foi aplicada anteriormente — nada a fazer nesta execução.';
   return;
 end if;
 alter table public.avisos disable trigger avisos_notify_trigger;
 alter table public.radar_itens disable trigger radar_notify_trigger;
 insert into public.avisos(id,titulo,texto,origem,data_original,valido_ate,revisao_editorial,situacao_publicacao,imagem_path,imagem_alt,ordem)
 values(
  'aviso-sala-descanso-estudo',
  'Sala de descanso e estudo',
  'Pedimos a colaboração de todos para manter um nível de barulho mais baixo na sala de descanso e estudo, respeitando quem utiliza o espaço para estudar, descansar ou ter um momento de tranquilidade entre as atividades.',
  'Diretoria Geral do CAEF','16/09/2026',
  null,date '2026-12-16','publicado',null,null,1
 ) on conflict(id) do nothing;
 insert into public.radar_itens(id,type,title,short_title,area,coordinator,contact,description,audience,participation_type,workload,requirements,selection,selection_link,shifts,status_availability,status_note,postgrad,duration,last_updated,authorized,ordem)
 values
 (
 'ext-corre','extensao',
 'CORRE — Transformando Saúde e Qualidade de Vida através do Movimento','CORRE (CORREDEF)',
 'Saúde','Prof. Luciano Meireles de Pontes','projetocorreufpb@gmail.com',
 'Programa estruturado de condicionamento físico com ênfase em treinamento de iniciação à corrida, caminhada e exercícios funcionais, adaptados às necessidades e objetivos individuais da comunidade interna e externa da UFPB.',
 'Discentes, docentes, servidores técnico-administrativos, terceirizados e comunidade externa, 18+ anos.',
 'Voluntário','Mínimo 4h; máximo 8h semanais',
 'CRA atualizado; estar cursando até o 5º período (Bacharelado ou Licenciatura); disponibilidade em pelo menos 2 dias na semana; interesse e compromisso com atendimento humanizado.',
 'Inscrição via formulário de interesse.','https://forms.gle/N7En6TbHYm2rkhjW6',
 array['Manhã','Tarde'],'consultar',null,false,'7 a 12 meses','06/08/2026',true,1
 ),
 (
 'ext-mulher-oke','extensao',
 'Mulher-okê: empoderamento, resistência das mulheres, música e karaokê','Mulher-okê',
 'Educação','Profª Anamélia Soares Nóbrega','projetomulheroke@gmail.com',
 'Dialoga sobre os direitos femininos através da análise das letras de músicas, utilizando o karaokê como instrumento de motivação dos(as) participantes.',
 'Alunos(as) e demais pessoas interessadas no assunto.',
 'Voluntário','4h semanais',
 'Alunos(as) do 2º ao 7º período.','Análise do histórico acadêmico.','',
 array['Tarde'],'consultar',null,false,'7 a 12 meses','07/08/2026',true,2
 ),
 (
 'ext-progym','extensao',
 'PROGYM UFPB — Ginástica Artística como Intervenção na Prática Pedagógica','PROGYM UFPB',
 'Saúde','Prof. Claudio Meireles','claudiomeireles@hotmail.com',
 'Prática de melhoria do condicionamento físico por meio do esporte — ginástica artística como forma de melhoria dos aspectos biológicos, psicológicos e sociais dos participantes. Um dos projetos mais antigos do departamento, integrando ensino, pesquisa e extensão.',
 'Público interno e externo à UFPB, 18+ anos.',
 'Bolsa PROEX','12h semanais',
 'Participação mínima de 6 meses no projeto; ter cursado a disciplina de Ginástica Artística com média mínima 7,0; gostar de fazer, ensinar e praticar a modalidade.',
 'Entrevista, CRA e pontuação por participação anterior no teste do PROGYM.','',
 array['Manhã','Tarde'],'consultar',null,false,'Mais de 12 meses','12/08/2026',true,3
 ),
 (
 'ext-edupopinsus','extensao',
 'EduPopInSUS — Extensão em Educação Popular e Interprofissional no SUS','EduPopInSUS',
 'Saúde','Prof. André Luís Façanha da Silva','andre.facanha@academico.ufpb.br',
 'Promove a vivência extensionista na Estratégia Saúde da Família a partir da educação popular, educação interprofissional e clínica ampliada, com inserção de estudantes na Rede de Atenção à Saúde de João Pessoa (comunidade São Rafael), em equipe interprofissional com outros cursos da área da saúde.',
 'Comunidade da USF São Rafael (~1.619 usuários, 719 famílias) e equipe de saúde.',
 'Bolsa PROEX','20h semanais',
 'Interesse.','Carta de intenção.','',
 array['Manhã','Tarde'],'consultar',null,false,'7 a 12 meses','20/08/2026',true,4
 ),
 (
 'ext-afirmacoes-jampasus','extensao',
 'AfirmAções JampaSUS — pesquisa-ação, formação, comunicação e cuidado em saúde mental','AfirmAções JampaSUS',
 'Saúde','Prof. André Luís Façanha da Silva','andre.facanha@academico.ufpb.br',
 'Projeto de pesquisa-ação junto a populações em situação de vulnerabilidade social, voltado à Atenção Básica de João Pessoa, com foco em saúde mental, educação popular em saúde e fortalecimento do cuidado em rede.',
 'Populações socialmente vulnerabilizadas atendidas pela Atenção Básica de João Pessoa.',
 'Bolsa FLUEX','12h semanais',
 'Interesse.','Carta de intenção.','',
 array['Manhã','Tarde'],'consultar',null,false,'Mais de 12 meses','20/08/2026',true,5
 ),
 (
 'evt-semana-academica','evento',
 'Semana Acadêmica de Educação Física (SEF)','Semana Acadêmica de EF',
 'Institucional','Diretoria de Ensino, Pesquisa e Extensão do CAEF','',
 'Evento integrador com apresentação de resumos, minicursos e mostras de pesquisa e extensão do curso. Projeto de médio/longo prazo da diretoria — ainda sem data, local ou programação definidos.',
 null,null,null,null,
 null,'',array[]::text[],'encerrado','Em planejamento — sem data definida',null,null,'29/07/2026',true,11
 ) on conflict(id) do nothing;
 insert into public.radar_itens(id,type,title,short_title,area,coordinator,contact,description,lab_name,modalities,requirements,selection,selection_link,level,dedication,shifts,status_availability,status_note,last_updated,authorized,ordem)
 values
 (
 'pesq-gepeaf-questionario','pesquisa',
 'GEPEAF — Questionário eletrônico de atividade física e comportamento sedentário em adolescentes','GEPEAF',
 'Atividade Física e Saúde','Prof. José Cazuza de Farias Júnior','jcazuzajr@gmail.com',
 'Construção, confiabilidade e validade de um questionário eletrônico (baseado na web) para mensurar a atividade física e o comportamento sedentário de adolescentes de 10 a 19 anos.',
 'Grupo de Estudos e Pesquisa em Epidemiologia da Atividade Física (GEPEAF)',
 array['PIBIC/PIBITI','Estágio em Laboratório','Orientação de TCC'],
 'Ter interesse em participar.','Procurar o GEPEAF pessoalmente.','',
 array['Graduação','Mestrado','Doutorado','Pós-doutorado'],'Até 5h semanais',
 array[]::text[],'vagas',null,'06/08/2026',true,6
 ),
 (
 'pesq-letfads','pesquisa',
 'Genética do emagrecimento, controle de carga de treino, nutrição esportiva e exercício no tratamento da hipertensão','LETFADS — Treinamento e Saúde',
 'Biodinâmica/Fisiologia','Prof. Alexandre Sérgio Silva','alexandresergiosilva@yahoo.com.br · WhatsApp (83) 9 8875-4775',
 'Quatro linhas de pesquisa investigam fatores genéticos e metabólicos que influenciam o efeito do treinamento físico no emagrecimento, controle da pressão arterial e eficácia de alimentos in natura no desempenho de atletas, além de ferramentas de controle fisiológico do treinamento.',
 'Laboratório de Estudo do Treinamento Físico Aplicado, Desempenho e Saúde',
 array['PIBIC/PIBITI','PIVIC/Voluntário','Estágio em Laboratório','Orientação de TCC'],
 'Aberto desde o primeiro período.','Contato direto por WhatsApp com o Prof. Alexandre.','',
 array['Graduação','Mestrado','Doutorado','Pós-doutorado'],'Até 5h semanais',
 array[]::text[],'vagas',null,'09/08/2026',true,7
 ),
 (
 'pesq-ericc','pesquisa',
 'ERICC — Estudo de Fatores de Risco de Doenças e Agravos Não Transmissíveis em Crianças','ERICC',
 'Atividade Física e Saúde','Prof. Felipe Vogt Cureau','fvc@academico.ufpb.br',
 'Inquérito de base escolar com cerca de 12.000 crianças de 6 a 12 anos, matriculadas em escolas públicas e privadas, em áreas urbanas e rurais de cinco macrorregiões brasileiras.',
 'Grupo de Estudos em Epidemiologia da Atividade Física (GEPEAF)',
 array['PIVIC/Voluntário','Estágio em Laboratório','Orientação de TCC'],
 'Ter cursado as disciplinas de Análise de Dados e Atividade Física e Saúde (ou Educação Física e Saúde).','Contato por e-mail com o professor.','',
 array['Graduação','Mestrado','Doutorado','Pós-doutorado'],'De 11h a 20h semanais',
 array[]::text[],'vagas',null,'10/08/2026',true,8
 ),
 (
 'pesq-lepeftfs','pesquisa',
 'LEPEFTFS — Educação Física, trabalho e formação no SUS','LEPEFTFS',
 'Estudos Socioculturais/Pedagógicos','Prof. André Luís Façanha da Silva','andre.facanha@academico.ufpb.br',
 'Tem como objeto de ensino, pesquisa e extensão a Educação Física, o trabalho e a formação no Sistema Único de Saúde (SUS). Atualmente com projeto de pesquisa e extensão em saúde mental na Atenção Primária à Saúde (programa AfirmaSUS/Ministério da Saúde, 2025–2028).',
 'Laboratório de Extensão e Pesquisa em Educação Física, Trabalho e Formação em Saúde',
 array['PIBIC/PIBITI'],
 'Interesse e disponibilidade de tempo para participar dos encontros.','Procurar o Prof. André Façanha.','',
 array['Graduação'],'Até 5h semanais',
 array[]::text[],'vagas',null,'17/08/2026',true,9
 ),
 (
 'pesq-social-esporte-clube','pesquisa',
 'Social Esporte Clube — Sociologia do Esporte','Social Esporte Clube',
 'Estudos Socioculturais/Pedagógicos','Murilo Moraes de Oliveira (líder) · Billy Graeff Bastos (vice-líder)','billygraeff@gmail.com · murilaum@gmail.com',
 'Grupo dedicado ao avanço e consolidação da Sociologia do Esporte, com ênfase nos contextos do Brasil e da América Latina, discutindo temas alinhados às perspectivas do Sul Global. Possui vocação para intercâmbio acadêmico nacional e internacional (ISSA, ALESDE).',
 'Social Esporte Clube',
 array['PIBIC/PIBITI','PIVIC/Voluntário','Estágio em Laboratório','Orientação de TCC'],
 'Não informado.','Enviar e-mail.','',
 array['Graduação','Mestrado','Doutorado','Pós-doutorado'],'De 6h a 10h semanais',
 array[]::text[],'vagas',null,'18/08/2026',true,10
 ) on conflict(id) do nothing;
 alter table public.avisos enable trigger avisos_notify_trigger;
 alter table public.radar_itens enable trigger radar_notify_trigger;
 insert into public._migracoes_aplicadas(nome,tabela,registro_id) values
  ('v28-conteudo-inicial','avisos','aviso-sala-descanso-estudo'),
  ('v28-conteudo-inicial','radar_itens','ext-corre'),
  ('v28-conteudo-inicial','radar_itens','ext-mulher-oke'),
  ('v28-conteudo-inicial','radar_itens','ext-progym'),
  ('v28-conteudo-inicial','radar_itens','ext-edupopinsus'),
  ('v28-conteudo-inicial','radar_itens','ext-afirmacoes-jampasus'),
  ('v28-conteudo-inicial','radar_itens','evt-semana-academica'),
  ('v28-conteudo-inicial','radar_itens','pesq-gepeaf-questionario'),
  ('v28-conteudo-inicial','radar_itens','pesq-letfads'),
  ('v28-conteudo-inicial','radar_itens','pesq-ericc'),
  ('v28-conteudo-inicial','radar_itens','pesq-lepeftfs'),
  ('v28-conteudo-inicial','radar_itens','pesq-social-esporte-clube')
 on conflict(nome,tabela,registro_id) do nothing;
end;
$$;
commit;
