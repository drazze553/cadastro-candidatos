const form = document.getElementById('form');
const tbody = document.getElementById('tbody');
const countEl = document.getElementById('count');
const search = document.getElementById('search');
const modal = document.getElementById('modal');
const formEdit = document.getElementById('formEdit');

// URLs dos Webhooks do N8N (hardcoded)
const N8N_WEBHOOK_GET = 'https://automation-adriel.app.n8n.cloud/webhook/listar-candidatos';
const N8N_WEBHOOK_POST = 'https://automation-adriel.app.n8n.cloud/webhook/cadastro-candidatos';
const N8N_WEBHOOK_UPDATE = 'https://automation-adriel.app.n8n.cloud/webhook/editar-candidato';
const N8N_WEBHOOK_DELETE = 'https://automation-adriel.app.n8n.cloud/webhook/deletar-candidato';

let items = [];
let editingId = null;

// Inicialização
loadFromN8N();

// seta a data atual por padrão
(function setDefaultDate() {
  const dateInput = document.getElementById('data');
  if (dateInput.value === '') {
    const d = new Date();
    dateInput.value = d.toISOString().slice(0, 10);
  }
})();

// Carregar dados do N8N (GET)
async function loadFromN8N() {
  try {
    const res = await fetch(N8N_WEBHOOK_GET);
    if (!res.ok) throw new Error('Erro ao consultar servidor');

    const text = await res.text(); // Lê como texto cru primeiro
    if (!text) {
      console.warn('Nenhum dado retornado do n8n — planilha vazia.');
      items = [];
      render();
      return;
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Erro ao fazer parse do JSON retornado:', e);
      items = [];
      render();
      return;
    }

    console.log("Retorno bruto do N8N:", data);

    // Garante que `rows` seja um array de candidatos
    let rows = [];
    if (Array.isArray(data)) {
      if (Array.isArray(data[0]?.data)) rows = data[0].data;
      else rows = data;
    } else if (Array.isArray(data.data)) {
      rows = data.data;
    }

    console.log("Registros normalizados:", rows);

    items = rows.map(r => ({
      id: r.id || Date.now().toString(36),
      nome: r.nome || '',
      email: r.email || '',
      telefone: r.telefone || '',
      area: r.area || '',
      data: r.data || ''
    }));

    render();

  } catch (err) {
    console.error(err);
    alert('Erro ao carregar dados do servidor');
  }
}


// Enviar novo candidato para o N8N (POST)
form.addEventListener('submit', async e => {
  e.preventDefault();

  const data = new FormData(form);
  const item = {
    id: Date.now().toString(36),
    nome: (data.get('nome') || '').trim(),
    email: (data.get('email') || '').trim(),
    telefone: (data.get('telefone') || '').trim(),
    area: data.get('area') || 'Outros',
    data: data.get('data') || new Date().toISOString().slice(0, 10)
  };

  if (!item.nome || !item.email) {
    alert('Nome e e-mail são obrigatórios.');
    return;
  }

  if (items.some(r => r.email === item.email)) {
    alert('Já existe um candidato com este e-mail.');
    return;
  }

  try {
    const res = await fetch(N8N_WEBHOOK_POST, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });

    if (!res.ok) throw new Error('Erro ao enviar dados');

    alert('Registro salvo com sucesso!');
    form.reset();
    document.getElementById('data').value = new Date().toISOString().slice(0, 10);

    await loadFromN8N();
  } catch (err) {
    console.error(err);
    alert('Erro ao salvar registro.');
  }
});

// Botões e interações
document.getElementById('btnClearForm').addEventListener('click', () => {
  form.reset();
  document.getElementById('data').value = new Date().toISOString().slice(0, 10);
});

document.getElementById('btnExport').addEventListener('click', () => {
  const csv = toCSV(items);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cadastro_candidatos.csv';
  a.click();
  URL.revokeObjectURL(url);
});

search.addEventListener('input', () => render());

// Renderização da tabela
function render() {
  tbody.innerHTML = '';
  const q = (search.value || '').toLowerCase().trim();
  const filtered = items.filter(it => {
    if (!q) return true;
    return (
      (it.nome || '').toLowerCase().includes(q) ||
      (it.email || '').toLowerCase().includes(q) ||
      (it.area || '').toLowerCase().includes(q)
    );
  });
  countEl.textContent = filtered.length;

  if (filtered.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="6" class="small">Nenhum registro encontrado.</td>`;
    tbody.appendChild(tr);
    return;
  }

  filtered.sort((a, b) => b.id.localeCompare(a.id));

  filtered.forEach(it => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escapeHtml(it.nome)}</strong></td>
      <td class="small">${escapeHtml(it.email)}</td>
      <td class="small">${escapeHtml(it.telefone || '—')}</td>
      <td class="small">${escapeHtml(it.area)}</td>
      <td class="small">${escapeHtml(it.data)}</td>
      <td class="text-right">
        <button class="btn-icon" data-id="${it.id}" data-action="edit">Editar</button>
        <button class="btn-icon" data-id="${it.id}" data-action="delete">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', ev => {
      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      if (action === 'edit') openEdit(id);
      if (action === 'delete') handleDelete(id);
    });
  });
}

// Edição e exclusão local (para exibir modal)
function openEdit(id) {
  editingId = id;
  const it = items.find(x => x.id === id);
  if (!it) return alert('Registro não encontrado');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.getElementById('e_nome').value = it.nome;
  document.getElementById('e_email').value = it.email;
  document.getElementById('e_telefone').value = it.telefone || '';
  document.getElementById('e_area').value = it.area || 'Outros';
}

document.getElementById('btnCancelEdit').addEventListener('click', closeModal);
modal.addEventListener('click', e => {
  if (e.target === modal) closeModal();
});

formEdit.addEventListener('submit', async e => {
  e.preventDefault();
  if (!editingId) return;

  const original = items.find(x => x.id === editingId);
  if (!original) return alert('Registro não encontrado');

  // pega os valores atuais do formulário
  const updatedValues = {
    nome: document.getElementById('e_nome').value.trim(),
    email: document.getElementById('e_email').value.trim(),
    telefone: document.getElementById('e_telefone').value.trim(),
    area: document.getElementById('e_area').value
  };

  // garante que todos os campos sejam enviados — 
  // se não mudou, envia o valor original
  const payload = {
    id: editingId,
    nome: updatedValues.nome || original.nome,
    email: updatedValues.email || original.email,
    telefone: updatedValues.telefone || original.telefone,
    area: updatedValues.area || original.area,
    data: original.data
  };

  try {
    const res = await fetch(N8N_WEBHOOK_UPDATE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.error('Resposta do servidor:', await res.text());
      throw new Error('Erro ao enviar dados');
    }

    const body = await res.json().catch(() => null);
    console.log('Resposta do n8n (editar):', body);

    alert('Alterações enviadas com sucesso!');
    closeModal();
    await loadFromN8N();
  } catch (err) {
    console.error(err);
    alert('Erro ao atualizar registro.');
  }
});

document.getElementById('btnDelete').addEventListener('click', () => {
  if (!editingId) return;
  if (!confirm('Deseja realmente excluir este registro?')) return;
  items = items.filter(x => x.id !== editingId);
  render();
  closeModal();
});

async function handleDelete(id) {
  if (!confirm('Excluir este registro?')) return;

  try {
    const res = await fetch(N8N_WEBHOOK_DELETE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });

    if (!res.ok) {
      console.error('Resposta do servidor:', await res.text());
      throw new Error('Erro ao excluir registro');
    }

    const body = await res.json().catch(() => null);
    console.log('Resposta do n8n (delete):', body);

    alert('Registro excluído com sucesso!');
    await loadFromN8N(); 
  } catch (err) {
    console.error(err);
    alert('Erro ao excluir registro.');
  }
}


function closeModal() {
  editingId = null;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

// Utilitários
function toCSV(arr) {
  const header = ['Nome', 'Email', 'Telefone', 'Area', 'Data'];
  const lines = [header.join(',')];
  arr.forEach(r => {
    const row = [r.nome, r.email, r.telefone || '', r.area || '', r.data || ''];
    const esc = row.map(v => '"' + ('' + v).replace(/"/g, '""') + '"');
    lines.push(esc.join(','));
  });
  return lines.join('\n');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>\"]/g, s => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  }[s]));
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
});
