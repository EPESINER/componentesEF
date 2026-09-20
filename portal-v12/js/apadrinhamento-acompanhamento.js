(function(){
  'use strict';
  var form = document.getElementById('mentorFinalForm');
  if (!form) return;
  form.addEventListener('submit', function(event){
    event.preventDefault();
    if (!form.reportValidity()) return;
    var data = new FormData(form);
    var fields = [
      ['Padrinho / madrinha', 'mentor'], ['Afilhado / afilhada', 'fera'],
      ['Curso', 'curso'], ['Período de participação', 'periodo'],
      ['Atividades desenvolvidas', 'atividades'], ['Síntese da experiência', 'experiencia'],
      ['Observações adicionais', 'observacoes']
    ];
    var doc = document.createElement('section');
    doc.className = 'mentor-print-document';
    var heading = document.createElement('header');
    var h = document.createElement('h1'); h.textContent = 'CAEF · Programa de Apadrinhamento Acadêmico'; heading.appendChild(h);
    var sub = document.createElement('h2'); sub.textContent = 'Relatório Final de Atividades · 2026.2'; heading.appendChild(sub);
    doc.appendChild(heading);
    fields.forEach(function(item){
      var value = String(data.get(item[1]) || '').trim();
      if (!value && item[1] === 'observacoes') return;
      var group = document.createElement('div'); group.className = 'mentor-print-field';
      var label = document.createElement('strong'); label.textContent = item[0]; group.appendChild(label);
      var p = document.createElement('p'); p.textContent = value; group.appendChild(p); doc.appendChild(group);
    });
    var dateLine = document.createElement('div'); dateLine.className = 'mentor-print-date';
    dateLine.textContent = 'Data: ____ / ____ / ________';
    doc.appendChild(dateLine);
    var signature = document.createElement('div'); signature.className = 'mentor-signatures';
    var sig1 = document.createElement('div'); sig1.textContent = 'Assinatura do afilhado / da afilhada';
    var sig2 = document.createElement('div'); sig2.textContent = 'Assinatura do padrinho / da madrinha';
    signature.appendChild(sig1); signature.appendChild(sig2); doc.appendChild(signature);
    var foot = document.createElement('p'); foot.className = 'mentor-print-footer';
    foot.textContent = 'Documento preenchido digitalmente para impressão e assinatura. A certificação depende da conferência dos critérios do programa pela equipe responsável.'; doc.appendChild(foot);
    document.body.appendChild(doc);
    window.addEventListener('afterprint', function cleanup(){doc.remove();window.removeEventListener('afterprint', cleanup);}, {once:true});
    window.print();
  });
})();
