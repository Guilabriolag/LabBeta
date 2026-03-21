/* ═══════════════════════════════════════════════════════════════
   LABRIOLAG — Cardápio Builder v2
   app.js — Lógica principal
   ═══════════════════════════════════════════════════════════════ */

'use strict';

// ──────────────────────────────────────────────
// CONSTANTES
// ──────────────────────────────────────────────
const TIPOS = [
  { id: 'pizzaria',    icon: '🍕', label: 'Pizzaria' },
  { id: 'lanche',      icon: '🍔', label: 'Lanchonete' },
  { id: 'restaurante', icon: '🍽', label: 'Restaurante' },
  { id: 'cafeteria',   icon: '☕', label: 'Cafeteria' },
  { id: 'sorveteria',  icon: '🍦', label: 'Sorveteria' },
  { id: 'bar',         icon: '🍺', label: 'Bar / Pub' },
];

const FONTES = [
  { id: 'DM Sans',      label: 'Moderna' },
  { id: 'Syne',         label: 'Display' },
  { id: 'Georgia',      label: 'Clássica' },
  { id: 'DM Mono',      label: 'Tech' },
];

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const STORAGE_KEY = 'labx_cardapio_v2';

// ──────────────────────────────────────────────
// ESTADO PADRÃO
// ──────────────────────────────────────────────
const ESTADO_PADRAO = {
  tipo: 'restaurante',
  marca: {
    nome:         'MEU NEGÓCIO',
    subtitulo:    'Estabelecimento',
    whatsapp:     '',
    instagram:    '',
    corPrimaria:  '#e84040',
    corSecundaria:'#e8a020',
    fonte:        'DM Sans',
    logoBase64:   '',
  },
  horario: {
    diasFechados:  [],
    abreHora:      11, abreMinuto:  0,
    fechaHora:     22, fechaMinuto: 0,
  },
  bairros: [],
  categorias: [
    {
      nome:   'Pratos Principais',
      aberta: true,
      itens:  [
        { nome: 'Item de exemplo', desc: 'Descrição do produto', preco: 29.90, img: '' },
      ],
    },
  ],
};

// ──────────────────────────────────────────────
// ESTADO (carrega do localStorage ou usa padrão)
// ──────────────────────────────────────────────
let estado = JSON.parse(JSON.stringify(ESTADO_PADRAO));
try {
  const salvo = localStorage.getItem(STORAGE_KEY);
  if (salvo) estado = JSON.parse(salvo);
} catch (_) {}

let tabAtual = 'marca';
let pvCatIdx = 0;   // -1 = entrega

// ──────────────────────────────────────────────
// UTILITÁRIOS
// ──────────────────────────────────────────────
const esc = s => String(s || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const tipoObj = () => TIPOS.find(t => t.id === estado.tipo) || TIPOS[2];

let toastTimer = null;
function toast(msg, tipo = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${tipo}`;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

function fecharModal(id) {
  document.getElementById(id).classList.remove('show');
}

function estaAberto() {
  const now = new Date();
  const dia  = now.getDay();
  const min  = now.getHours() * 60 + now.getMinutes();
  const { diasFechados, abreHora, abreMinuto, fechaHora, fechaMinuto } = estado.horario;
  if (diasFechados.includes(dia)) return false;
  return min >= abreHora * 60 + abreMinuto && min <= fechaHora * 60 + fechaMinuto;
}

// ──────────────────────────────────────────────
// TABS
// ──────────────────────────────────────────────
function switchTab(tab) {
  tabAtual = tab;
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  renderEditor();
}

// ──────────────────────────────────────────────
// RENDER EDITOR
// ──────────────────────────────────────────────
function renderEditor() {
  const body = document.getElementById('editor-body');
  const renderers = { marca: renderMarca, cardapio: renderCardapio, horario: renderHorario, entrega: renderEntrega };
  body.innerHTML = renderers[tabAtual]?.() || '';
  bindEditor();
}

// ── TAB MARCA ──────────────────────────────────
function renderMarca() {
  const m = estado.marca;

  const tipos = TIPOS.map(t =>
    `<button class="tipo-btn${estado.tipo === t.id ? ' active' : ''}" data-tipo="${t.id}">
      <span class="ti">${t.icon}</span>${t.label}
    </button>`
  ).join('');

  const logoInner = m.logoBase64
    ? `<img src="${m.logoBase64}" alt="logo"><div class="drop-hint">Clique para trocar</div>`
    : `<div class="drop-icon">🖼</div><div class="drop-hint">Clique para fazer upload da logo<br>(PNG, JPG — máx 400KB)</div>`;

  const fontes = FONTES.map(f =>
    `<button class="font-btn${m.fonte === f.id ? ' active' : ''}" data-fonte="${f.id}" style="font-family:'${f.id}'">
      ${f.label}
    </button>`
  ).join('');

  return `
    <div class="sd">Tipo de Estabelecimento</div>
    <div class="fg">
      <div class="tipo-grid">${tipos}</div>
    </div>

    <div class="sd">Identidade Visual</div>
    <div class="fg">
      <label class="fl">Logo</label>
      <div class="logo-drop" id="logo-drop">
        ${logoInner}
        <input type="file" accept="image/*" id="inp-logo">
      </div>
    </div>
    <div class="fg">
      <label class="fl">Nome do Estabelecimento</label>
      <input class="fi" data-path="marca.nome" value="${esc(m.nome)}" placeholder="Ex: BURGER HOUSE">
    </div>
    <div class="fg">
      <label class="fl">Subtítulo / Slogan</label>
      <input class="fi" data-path="marca.subtitulo" value="${esc(m.subtitulo)}" placeholder="Ex: Artesanal desde 2019">
    </div>
    <div class="fr">
      <div class="fg">
        <label class="fl">WhatsApp (DDI+número)</label>
        <input class="fi" data-path="marca.whatsapp" value="${esc(m.whatsapp)}" placeholder="5511999999999">
      </div>
      <div class="fg">
        <label class="fl">Instagram</label>
        <input class="fi" data-path="marca.instagram" value="${esc(m.instagram)}" placeholder="@seunegocio">
      </div>
    </div>

    <div class="sd">Cores & Fonte</div>
    <div class="fg">
      <label class="fl">Cor Primária</label>
      <div class="color-row">
        <div class="swatch" id="sw1">
          <div class="swatch-bg" id="sw1-bg" style="background:${m.corPrimaria}"></div>
          <input type="color" id="cp1" value="${m.corPrimaria}" data-path="marca.corPrimaria">
        </div>
        <div class="fg">
          <input class="fi" id="ct1" data-path="marca.corPrimaria" value="${m.corPrimaria}" maxlength="7" placeholder="#e84040">
        </div>
      </div>
    </div>
    <div class="fg">
      <label class="fl">Cor Secundária</label>
      <div class="color-row">
        <div class="swatch" id="sw2">
          <div class="swatch-bg" id="sw2-bg" style="background:${m.corSecundaria}"></div>
          <input type="color" id="cp2" value="${m.corSecundaria}" data-path="marca.corSecundaria">
        </div>
        <div class="fg">
          <input class="fi" id="ct2" data-path="marca.corSecundaria" value="${m.corSecundaria}" maxlength="7" placeholder="#e8a020">
        </div>
      </div>
    </div>
    <div class="fg">
      <label class="fl">Fonte</label>
      <div class="font-grid">${fontes}</div>
    </div>
  `;
}

// ── TAB CARDÁPIO ──────────────────────────────
function renderCardapio() {
  const cats = estado.categorias.map((cat, ci) => {
    const bodyClass = `cat-body${cat.aberta ? '' : ' hidden'}`;
    const arrClass  = `cat-arrow${cat.aberta ? ' open' : ''}`;

    const itens = cat.itens.map((item, ii) => {
      const imgContent = item.img
        ? `<img src="${item.img}" alt="">`
        : '📷';
      return `
        <div class="prod-row">
          <div class="prod-top">
            <div class="prod-img" title="Foto do item">
              ${imgContent}
              <input type="file" accept="image/*" data-ci="${ci}" data-ii="${ii}" class="inp-item-img">
            </div>
            <div style="flex:1">
              <input class="prod-nome" placeholder="Nome do item..."
                data-ci="${ci}" data-ii="${ii}" data-field="nome" value="${esc(item.nome)}">
            </div>
            <button class="prod-del" data-ci="${ci}" data-ii="${ii}">✕</button>
          </div>
          <div class="prod-bot">
            <textarea class="prod-desc" placeholder="Descrição, ingredientes..."
              data-ci="${ci}" data-ii="${ii}" data-field="desc">${esc(item.desc)}</textarea>
            <input class="prod-preco" type="number" min="0" step="0.5" placeholder="0.00"
              data-ci="${ci}" data-ii="${ii}" data-field="preco" value="${item.preco}">
          </div>
        </div>`;
    }).join('');

    return `
      <div class="cat-block">
        <div class="cat-head" data-ci="${ci}">
          <input class="cat-name-inp" data-catname="${ci}" value="${esc(cat.nome)}"
            placeholder="Nome da categoria..." onclick="event.stopPropagation()">
          <span class="${arrClass}">▶</span>
          <button class="cat-del-btn" data-delcat="${ci}">✕</button>
        </div>
        <div class="${bodyClass}" id="catbody-${ci}">
          ${itens}
          <button class="add-item-btn" data-additem="${ci}">＋ Adicionar item</button>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="sd">Categorias e Itens</div>
    ${cats}
    <button class="add-cat-btn" id="btn-addcat">＋ Nova Categoria</button>
  `;
}

// ── TAB HORÁRIO ──────────────────────────────
function renderHorario() {
  const h = estado.horario;
  const diasBtns = DIAS.map((d, i) =>
    `<button class="dia-btn${h.diasFechados.includes(i) ? ' fechado' : ''}" data-dia="${i}">${d}</button>`
  ).join('');

  return `
    <div class="sd">Dias Fechados</div>
    <div class="fg">
      <label class="fl">Toque para marcar como fechado</label>
      <div class="dias-grid">${diasBtns}</div>
    </div>
    <div class="sd">Horário de Funcionamento</div>
    <div class="fr">
      <div class="fg">
        <label class="fl">Abre — hora</label>
        <input class="fi" type="number" min="0" max="23" data-path="horario.abreHora" value="${h.abreHora}">
      </div>
      <div class="fg">
        <label class="fl">Abre — minuto</label>
        <input class="fi" type="number" min="0" max="59" data-path="horario.abreMinuto" value="${h.abreMinuto}">
      </div>
    </div>
    <div class="fr">
      <div class="fg">
        <label class="fl">Fecha — hora</label>
        <input class="fi" type="number" min="0" max="23" data-path="horario.fechaHora" value="${h.fechaHora}">
      </div>
      <div class="fg">
        <label class="fl">Fecha — minuto</label>
        <input class="fi" type="number" min="0" max="59" data-path="horario.fechaMinuto" value="${h.fechaMinuto}">
      </div>
    </div>
  `;
}

// ── TAB ENTREGA ──────────────────────────────
function renderEntrega() {
  const rows = estado.bairros.map((b, i) => `
    <div class="bairro-row">
      <input class="fi" data-bairro="${i}" data-field="nome" value="${esc(b.nome)}" placeholder="Bairro / região">
      <input class="fi taxa-fi" type="number" data-bairro="${i}" data-field="taxa" value="${b.taxa}" placeholder="R$">
      <button class="del-btn" data-delbairro="${i}">✕</button>
    </div>`
  ).join('');

  return `
    <div class="sd">Bairros & Taxas de Entrega</div>
    ${rows}
    <button class="add-item-btn" id="btn-addbairro" style="margin-top:4px">＋ Adicionar bairro</button>
  `;
}

// ──────────────────────────────────────────────
// BIND EDITOR EVENTS
// ──────────────────────────────────────────────
function bindEditor() {

  // data-path → estado (inputs genéricos)
  document.querySelectorAll('[data-path]').forEach(el => {
    el.addEventListener('input', () => {
      const parts = el.dataset.path.split('.');
      let obj = estado;
      for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
      const key = parts[parts.length - 1];
      obj[key] = el.type === 'number' ? Number(el.value) : el.value;

      // Sync color swatch ↔ text input
      if (key === 'corPrimaria') syncSwatch('sw1-bg', 'cp1', 'ct1', el.value);
      if (key === 'corSecundaria') syncSwatch('sw2-bg', 'cp2', 'ct2', el.value);
      renderPreview();
    });

    // Color picker nativo
    if (el.type === 'color') {
      el.addEventListener('input', () => {
        const parts = el.dataset.path.split('.');
        let obj = estado;
        for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
        const key = parts[parts.length - 1];
        obj[key] = el.value;
        if (key === 'corPrimaria') syncSwatch('sw1-bg', 'cp1', 'ct1', el.value);
        if (key === 'corSecundaria') syncSwatch('sw2-bg', 'cp2', 'ct2', el.value);
        renderPreview();
      });
    }
  });

  function syncSwatch(bgId, cpId, ctId, val) {
    const bg = document.getElementById(bgId); if (bg) bg.style.background = val;
    const cp = document.getElementById(cpId); if (cp) cp.value = val;
    const ct = document.getElementById(ctId); if (ct) ct.value = val;
  }

  // Tipo
  document.querySelectorAll('[data-tipo]').forEach(btn => {
    btn.addEventListener('click', () => {
      estado.tipo = btn.dataset.tipo;
      renderEditor(); renderPreview();
    });
  });

  // Fonte
  document.querySelectorAll('[data-fonte]').forEach(btn => {
    btn.addEventListener('click', () => {
      estado.marca.fonte = btn.dataset.fonte;
      renderEditor(); renderPreview();
    });
  });

  // Logo upload
  const inpLogo = document.getElementById('inp-logo');
  if (inpLogo) {
    inpLogo.addEventListener('change', () => {
      const f = inpLogo.files[0]; if (!f) return;
      if (f.size > 450000) { toast('Logo muito grande! Máx ~400KB.', 'err'); return; }
      const r = new FileReader();
      r.onload = e => { estado.marca.logoBase64 = e.target.result; renderEditor(); renderPreview(); };
      r.readAsDataURL(f);
    });
  }

  // Cat headers (toggle)
  document.querySelectorAll('.cat-head[data-ci]').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.classList.contains('cat-name-inp') || e.target.classList.contains('cat-del-btn')) return;
      const ci = Number(el.dataset.ci);
      estado.categorias[ci].aberta = !estado.categorias[ci].aberta;
      renderEditor(); renderPreview();
    });
  });

  // Cat name
  document.querySelectorAll('[data-catname]').forEach(el => {
    el.addEventListener('input', () => {
      estado.categorias[Number(el.dataset.catname)].nome = el.value;
      renderPreview();
    });
  });

  // Del cat
  document.querySelectorAll('[data-delcat]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const ci = Number(btn.dataset.delcat);
      if (!confirm(`Remover "${estado.categorias[ci].nome}"?`)) return;
      estado.categorias.splice(ci, 1);
      if (pvCatIdx >= estado.categorias.length) pvCatIdx = Math.max(0, estado.categorias.length - 1);
      renderEditor(); renderPreview();
    });
  });

  // Add cat
  const btnAddCat = document.getElementById('btn-addcat');
  if (btnAddCat) btnAddCat.addEventListener('click', () => {
    estado.categorias.push({ nome: 'Nova Categoria', aberta: true, itens: [] });
    renderEditor(); renderPreview();
  });

  // Add item
  document.querySelectorAll('[data-additem]').forEach(btn => {
    btn.addEventListener('click', () => {
      const ci = Number(btn.dataset.additem);
      estado.categorias[ci].itens.push({ nome: '', desc: '', preco: 0, img: '' });
      renderEditor(); renderPreview();
    });
  });

  // Item fields
  document.querySelectorAll('[data-ci][data-ii][data-field]').forEach(el => {
    el.addEventListener('input', () => {
      const ci = Number(el.dataset.ci);
      const ii = Number(el.dataset.ii);
      const f  = el.dataset.field;
      estado.categorias[ci].itens[ii][f] = f === 'preco' ? Number(el.value) : el.value;
      renderPreview();
    });
  });

  // Del item
  document.querySelectorAll('.prod-del').forEach(btn => {
    btn.addEventListener('click', () => {
      const ci = Number(btn.dataset.ci), ii = Number(btn.dataset.ii);
      estado.categorias[ci].itens.splice(ii, 1);
      renderEditor(); renderPreview();
    });
  });

  // Item image upload
  document.querySelectorAll('.inp-item-img').forEach(inp => {
    inp.addEventListener('change', () => {
      const f = inp.files[0]; if (!f) return;
      if (f.size > 550000) { toast('Imagem grande demais! Máx ~500KB.', 'err'); return; }
      const ci = Number(inp.dataset.ci), ii = Number(inp.dataset.ii);
      const r = new FileReader();
      r.onload = e => {
        estado.categorias[ci].itens[ii].img = e.target.result;
        renderEditor(); renderPreview();
      };
      r.readAsDataURL(f);
    });
  });

  // Dias
  document.querySelectorAll('[data-dia]').forEach(btn => {
    btn.addEventListener('click', () => {
      const d = Number(btn.dataset.dia);
      const idx = estado.horario.diasFechados.indexOf(d);
      if (idx === -1) estado.horario.diasFechados.push(d);
      else estado.horario.diasFechados.splice(idx, 1);
      renderEditor(); renderPreview();
    });
  });

  // Bairros
  document.querySelectorAll('[data-bairro]').forEach(el => {
    el.addEventListener('input', () => {
      const i = Number(el.dataset.bairro), f = el.dataset.field;
      estado.bairros[i][f] = f === 'taxa' ? Number(el.value) : el.value;
      renderPreview();
    });
  });
  document.querySelectorAll('[data-delbairro]').forEach(btn => {
    btn.addEventListener('click', () => {
      estado.bairros.splice(Number(btn.dataset.delbairro), 1);
      renderEditor(); renderPreview();
    });
  });
  const btnAddBairro = document.getElementById('btn-addbairro');
  if (btnAddBairro) btnAddBairro.addEventListener('click', () => {
    estado.bairros.push({ nome: '', taxa: 5 });
    renderEditor(); renderPreview();
  });
}

// ──────────────────────────────────────────────
// PREVIEW (inline no phone)
// ──────────────────────────────────────────────
function renderPreview() {
  const m     = estado.marca;
  const c1    = m.corPrimaria || '#e84040';
  const c2    = m.corSecundaria || '#e8a020';
  const fonte = m.fonte || 'DM Sans';
  const aberto = estaAberto();
  const tipo   = tipoObj();

  // Header logo
  const logoHtml = m.logoBase64
    ? `<img src="${m.logoBase64}" style="width:62px;height:62px;object-fit:cover;border-radius:50%;border:2px solid ${c1};margin:0 auto 12px;display:block;">`
    : `<div style="width:62px;height:62px;border-radius:50%;background:radial-gradient(circle,${c1}22,#08090d);border:2px solid ${c1};display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:1.6rem;">${tipo.icon}</div>`;

  // Nav categorias
  const navBtns = estado.categorias.map((cat, ci) =>
    `<button onclick="pvSel(${ci})" style="
      padding:8px 12px;border-radius:9px;border:none;
      font-family:'${fonte}',sans-serif;font-size:.68rem;font-weight:800;letter-spacing:.8px;
      cursor:pointer;background:${pvCatIdx === ci ? c1 : '#1c1e28'};
      color:${pvCatIdx === ci ? '#fff' : '#5a6080'};transition:all .15s;">
      ${cat.nome.toUpperCase()}
    </button>`
  ).join('');

  const navEntrega = estado.bairros.length
    ? `<button onclick="pvSel(-1)" style="
        padding:8px 12px;border-radius:9px;border:none;
        font-family:'${fonte}',sans-serif;font-size:.68rem;font-weight:800;letter-spacing:.8px;
        cursor:pointer;background:${pvCatIdx === -1 ? c1 : '#1c1e28'};
        color:${pvCatIdx === -1 ? '#fff' : '#5a6080'};transition:all .15s;">
        🚗 ENTREGA
      </button>`
    : '';

  // Conteúdo da categoria selecionada
  let conteudo = '';
  if (pvCatIdx === -1) {
    conteudo = `<div style="padding:6px 10px 60px">
      ${estado.bairros.map(b => `
        <div style="background:#141618;border-radius:10px;padding:13px 15px;margin-bottom:8px;
          display:flex;justify-content:space-between;align-items:center;border:1px solid #1e2130;">
          <span style="font-family:'${fonte}',sans-serif;font-weight:700;font-size:.86rem;color:#dde1f5;">📍 ${b.nome}</span>
          <span style="font-family:'DM Mono',monospace;font-weight:700;color:${c2};font-size:.9rem;">+ R$ ${Number(b.taxa).toFixed(2)}</span>
        </div>`).join('')}
    </div>`;
  } else {
    const cat = estado.categorias[pvCatIdx];
    if (cat) {
      conteudo = `<div style="padding:6px 10px 70px">
        ${cat.itens.map(item => {
          const imgSection = item.img
            ? `<img src="${item.img}" style="width:68px;height:68px;object-fit:cover;border-radius:9px;flex-shrink:0;">`
            : '';
          return `
            <div style="background:#141618;border-radius:12px;padding:12px;margin-bottom:8px;
              border:1px solid #1e2130;display:flex;gap:10px;align-items:center;">
              ${imgSection}
              <div style="flex:1;min-width:0;">
                <div style="font-family:'${fonte}',sans-serif;font-weight:800;font-size:.86rem;color:#dde1f5;
                  margin-bottom:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${item.nome}</div>
                <div style="font-size:.7rem;color:#4a5070;line-height:1.4;margin-bottom:8px;">${item.desc}</div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <span style="font-family:'DM Mono',monospace;font-weight:700;font-size:.98rem;color:${c2};">R$ ${Number(item.preco).toFixed(2)}</span>
                  <button style="background:${c1};color:#fff;border:none;padding:5px 12px;border-radius:7px;
                    font-size:.66rem;font-weight:800;font-family:'${fonte}',sans-serif;cursor:pointer;">PEDIR</button>
                </div>
              </div>
            </div>`;
        }).join('')}
      </div>`;
    }
  }

  document.getElementById('pv-root').innerHTML = `
    <div style="min-height:100%;background:#08090d;font-family:'${fonte}',sans-serif;">
      <div style="text-align:center;padding:28px 14px 16px;background:linear-gradient(180deg,${c1}18 0%,transparent 100%);">
        ${logoHtml}
        <div style="font-family:'Syne',sans-serif;font-size:1.35rem;font-weight:900;letter-spacing:5px;color:#dde1f5;">${m.nome}</div>
        <div style="font-size:.62rem;letter-spacing:3px;color:${c2};margin-top:5px;">${m.subtitulo}</div>
        <div style="display:inline-flex;align-items:center;gap:6px;padding:4px 14px;border-radius:20px;margin-top:11px;
          font-size:.63rem;font-weight:700;letter-spacing:.8px;
          ${aberto
            ? 'background:rgba(15,169,110,.1);border:1px solid rgba(15,169,110,.3);color:#0fa96e;'
            : 'background:rgba(232,64,64,.1);border:1px solid rgba(232,64,64,.3);color:#e84040;'}">
          <span style="width:5px;height:5px;border-radius:50%;background:${aberto ? '#0fa96e' : '#e84040'};"></span>
          ${aberto ? 'ABERTO AGORA' : 'FECHADO'}
        </div>
      </div>
      <div style="padding:8px 8px 4px;display:flex;flex-wrap:wrap;gap:6px;">
        ${navBtns}${navEntrega}
      </div>
      ${conteudo}
    </div>`;
}

function pvSel(ci) { pvCatIdx = ci; renderPreview(); }

// ──────────────────────────────────────────────
// SALVAR
// ──────────────────────────────────────────────
function salvar() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
  toast('💾 Salvo no navegador!', 'ok');
}

// ──────────────────────────────────────────────
// GERAR HTML DO CARDÁPIO (completo, offline)
// ──────────────────────────────────────────────
function gerarHTMLCardapio() {
  const m     = estado.marca;
  const c1    = m.corPrimaria;
  const c2    = m.corSecundaria;
  const fonte = m.fonte;
  const h     = estado.horario;
  const tipo  = tipoObj();

  // Nav buttons (para o cardápio final)
  const navButtons = estado.categorias.map((cat, ci) =>
    `<button class="nb" onclick="showCat(${ci})">${cat.nome.toUpperCase()}</button>`
  ).join('') + (estado.bairros.length
    ? `<button class="nb" onclick="showCat(-1)">🚗 ENTREGA</button>`
    : '');

  // Seções das categorias
  const catSections = estado.categorias.map((cat, ci) =>
    `<div class="cs" id="cs${ci}" style="display:${ci === 0 ? 'block' : 'none'}">
      ${cat.itens.map(item => {
        const imgHtml = item.img ? `<img src="${item.img}" class="iimg">` : '';
        const waHref = m.whatsapp
          ? `href="https://wa.me/${m.whatsapp}?text=Quero+pedir:+${encodeURIComponent(item.nome)}" target="_blank"`
          : '';
        return `
          <div class="ic">
            ${imgHtml}
            <div class="ii">
              <div class="in">${item.nome}</div>
              <div class="id">${item.desc}</div>
              <div class="if">
                <span class="ip">R$ ${Number(item.preco).toFixed(2)}</span>
                ${m.whatsapp ? `<a class="ib" ${waHref}>PEDIR</a>` : ''}
              </div>
            </div>
          </div>`;
      }).join('')}
    </div>`
  ).join('');

  const bairroSection = estado.bairros.length
    ? `<div class="cs" id="cs-1" style="display:none">
        ${estado.bairros.map(b =>
          `<div class="bc"><span>📍 ${b.nome}</span><span class="bt">+ R$ ${Number(b.taxa).toFixed(2)}</span></div>`
        ).join('')}
      </div>`
    : '';

  // JS inline (sem deps)
  const hrJSON = JSON.stringify(h);
  const numCats = estado.categorias.length;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${m.nome} — Cardápio</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;700&family=DM+Mono:wght@500&display=swap" rel="stylesheet">
<style>
:root{--c1:${c1};--c2:${c2};--f:'${fonte}','DM Sans',sans-serif;}
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#08090d;color:#dde1f5;font-family:var(--f);min-height:100vh;}
header{text-align:center;padding:36px 16px 16px;background:linear-gradient(180deg,${c1}18,transparent);}
.logo-img{width:68px;height:68px;object-fit:cover;border-radius:50%;border:2.5px solid var(--c1);margin:0 auto 12px;display:block;}
.logo-ph{width:68px;height:68px;border-radius:50%;background:radial-gradient(circle,${c1}22,#08090d);border:2.5px solid var(--c1);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:1.8rem;}
h1{font-family:'Syne',sans-serif;font-size:1.5rem;font-weight:800;letter-spacing:5px;color:#dde1f5;}
.sub{font-size:.62rem;letter-spacing:3px;color:var(--c2);margin-top:5px;}
.badge{display:inline-flex;align-items:center;gap:6px;padding:4px 15px;border-radius:20px;margin-top:12px;font-size:.63rem;font-weight:700;letter-spacing:.8px;}
.ab{background:rgba(15,169,110,.1);border:1px solid rgba(15,169,110,.3);color:#0fa96e;}
.fc{background:rgba(232,64,64,.1);border:1px solid rgba(232,64,64,.3);color:#e84040;}
.dot{width:5px;height:5px;border-radius:50%;}
.nav{padding:10px 10px 5px;display:flex;flex-wrap:wrap;gap:6px;}
.nb{padding:8px 13px;border-radius:9px;border:none;font-family:var(--f);font-size:.68rem;font-weight:800;letter-spacing:.8px;cursor:pointer;background:#1c1e28;color:#5a6080;transition:background .15s;}
.nb.active{background:var(--c1);color:#fff;}
.cs{padding:7px 10px 80px;}
.ic{background:#141618;border-radius:12px;padding:12px;margin-bottom:9px;border:1px solid #1e2130;display:flex;gap:10px;align-items:center;}
.iimg{width:68px;height:68px;object-fit:cover;border-radius:9px;flex-shrink:0;}
.ii{flex:1;min-width:0;}
.in{font-weight:800;font-size:.86rem;color:#dde1f5;margin-bottom:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.id{font-size:.7rem;color:#4a5070;line-height:1.4;margin-bottom:8px;}
.if{display:flex;justify-content:space-between;align-items:center;}
.ip{font-family:'DM Mono',monospace;font-weight:700;font-size:.98rem;color:var(--c2);}
.ib{background:var(--c1);color:#fff;border:none;padding:5px 12px;border-radius:7px;font-size:.66rem;font-weight:800;font-family:var(--f);cursor:pointer;text-decoration:none;}
.bc{background:#141618;border-radius:10px;padding:13px 15px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;border:1px solid #1e2130;}
.bt{font-family:'DM Mono',monospace;font-weight:700;color:var(--c2);}
footer{text-align:center;padding:30px 16px;color:#2a2e40;font-size:.72rem;border-top:1px solid #141720;}
</style>
</head>
<body>
<header>
  ${m.logoBase64
    ? `<img class="logo-img" src="${m.logoBase64}">`
    : `<div class="logo-ph">${tipo.icon}</div>`}
  <h1>${m.nome}</h1>
  <div class="sub">${m.subtitulo}</div>
  <div class="badge" id="bdg"><span class="dot" id="bdot"></span><span id="bst">...</span></div>
</header>
<nav class="nav">${navButtons}</nav>
${catSections}
${bairroSection}
<footer>Cardápio digital · <strong>Labriolag</strong> · labriolag.shop</footer>
<script>
var H=${hrJSON},N=${numCats},cur=0;
function ck(){
  var d=new Date(),dia=d.getDay(),mn=d.getHours()*60+d.getMinutes();
  var ok=H.diasFechados.indexOf(dia)===-1&&mn>=H.abreHora*60+H.abreMinuto&&mn<=H.fechaHora*60+H.fechaMinuto;
  var b=document.getElementById('bdg'),dt=document.getElementById('bdot'),st=document.getElementById('bst');
  b.className='badge '+(ok?'ab':'fc');
  dt.style.background=ok?'#0fa96e':'#e84040';
  st.textContent=ok?'ABERTO AGORA':'FECHADO';
}
function showCat(i){
  cur=i;
  document.querySelectorAll('.cs').forEach(function(s){s.style.display='none';});
  document.querySelectorAll('.nb').forEach(function(b,bi){
    b.classList.toggle('active',bi===(i===-1?N:i));
  });
  var t=document.getElementById('cs'+i);if(t)t.style.display='block';
}
ck();setInterval(ck,30000);
showCat(0);
<\/script>
</body>
</html>`;
}

// ──────────────────────────────────────────────
// QR DO CARDÁPIO (embed HTML no QR)
// ──────────────────────────────────────────────
function abrirModalQR() {
  document.getElementById('modal-qr').classList.add('show');

  const container = document.getElementById('qr-canvas-container');
  container.innerHTML = '';
  const info = document.getElementById('qr-size-info');

  const htmlCardapio = gerarHTMLCardapio();
  const encoded = btoa(unescape(encodeURIComponent(htmlCardapio)));
  const dataUrl = `data:text/html;base64,${encoded}`;

  info.textContent = '';

  // QR tem limite prático ~2900 chars para leitura confiável
  if (dataUrl.length <= 2900) {
    try {
      new QRCode(container, {
        text: dataUrl,
        width: 240,
        height: 240,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.L,
      });
      info.textContent = `QR gerado ✓ — tamanho ${(dataUrl.length / 1024).toFixed(1)}KB. Imprima e cole nas mesas!`;
    } catch (e) {
      info.textContent = '⚠️ Cardápio grande demais para QR. Use a aba HTML.';
    }
  } else {
    container.innerHTML = `<div style="color:#e8a020;font-size:.82rem;text-align:center;padding:16px;line-height:1.6;">
      ⚠️ Seu cardápio tem muitas fotos (${(dataUrl.length / 1024).toFixed(0)}KB).<br>
      Use a aba <strong>HTML</strong> para baixar o arquivo<br>e hospedar no GitHub Pages.
    </div>`;
  }
}

// ──────────────────────────────────────────────
// BACKUP QR (só config, sem imagens)
// ──────────────────────────────────────────────
function abrirModalBackup() {
  document.getElementById('modal-bkp').classList.add('show');

  const container = document.getElementById('bkp-canvas-container');
  container.innerHTML = '';

  // Copia estado sem imagens
  const backup = JSON.parse(JSON.stringify(estado));
  backup.marca.logoBase64 = '';
  backup.categorias.forEach(cat => cat.itens.forEach(item => item.img = ''));

  const json = JSON.stringify(backup);
  const payload = 'labx://cardapio/v2/' + btoa(unescape(encodeURIComponent(json)));

  if (payload.length > 2900) {
    container.innerHTML = `<div style="color:#e8a020;font-size:.82rem;text-align:center;padding:16px;line-height:1.6;">
      ⚠️ Configuração grande (${estado.categorias.length} cats / ${estado.bairros.length} bairros).<br>
      Reduza categorias ou use o backup HTML.
    </div>`;
    return;
  }

  try {
    new QRCode(container, {
      text: payload,
      width: 220,
      height: 220,
      colorDark: '#0e1018',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M,
    });
  } catch (e) {
    container.innerHTML = '<div style="color:#e84040;font-size:.82rem;padding:12px;text-align:center;">Erro ao gerar QR. Reduza as categorias.</div>';
  }
}

function baixarQRImagem(containerId, nomeBase) {
  const container = document.getElementById(containerId);
  if (!container) return;
  // QRCode.js coloca um <canvas> dentro
  const canvas = container.querySelector('canvas');
  const img    = container.querySelector('img');

  if (canvas) {
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `${nomeBase}-${estado.marca.nome.replace(/\s/g, '_')}.png`;
    a.click();
    toast('📦 QR Code salvo!', 'ok');
  } else if (img) {
    const a = document.createElement('a');
    a.href = img.src;
    a.download = `${nomeBase}-${estado.marca.nome.replace(/\s/g, '_')}.png`;
    a.click();
    toast('📦 QR Code salvo!', 'ok');
  } else {
    toast('Nada para baixar.', 'err');
  }
}

// ──────────────────────────────────────────────
// DOWNLOAD HTML
// ──────────────────────────────────────────────
function downloadHTML() {
  const html = gerarHTMLCardapio();
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `cardapio_${estado.marca.nome.replace(/\s/g, '_')}.html`;
  a.click();
  toast('⬇ HTML baixado!', 'ok');
}

// ──────────────────────────────────────────────
// PDF
// ──────────────────────────────────────────────
function gerarPDF() {
  const m  = estado.marca;
  const c1 = m.corPrimaria;
  const c2 = m.corSecundaria;
  const tipo = tipoObj();

  const itensHTML = estado.categorias.map(cat => {
    if (!cat.itens.length) return '';
    return `<div class="sec">${cat.nome.toUpperCase()}</div>
      <div class="grid">
        ${cat.itens.map(item =>
          `<div class="card">
            ${item.img ? `<img src="${item.img}" style="width:100%;height:90px;object-fit:cover;border-radius:6px;margin-bottom:10px;">` : ''}
            <h3>${item.nome}</h3>
            <p>${item.desc}</p>
            <div class="preco">R$ ${Number(item.preco).toFixed(2)}</div>
          </div>`
        ).join('')}
      </div>`;
  }).join('');

  const bairrosHTML = estado.bairros.length ? `
    <div class="sec">🚗 ENTREGA & DELIVERY</div>
    <div class="bgrid">
      ${estado.bairros.map(b =>
        `<div class="brow"><span>📍 ${b.nome}</span><span class="taxa">+ R$ ${Number(b.taxa).toFixed(2)}</span></div>`
      ).join('')}
    </div>` : '';

  const h = estado.horario;
  const hrStr  = `${h.abreHora}h–${h.fechaHora}h`;
  const fcDias = h.diasFechados.map(d => DIAS[d]).join(', ');

  const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<title>Cardápio ${m.nome}</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;700&display=swap" rel="stylesheet">
<style>
body{font-family:'DM Sans',sans-serif;background:#fff;color:#111;margin:0;padding:0;}
.cover{background:#08090d;color:#fff;text-align:center;padding:60px 40px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.cover h1{font-family:'Syne',sans-serif;font-size:2.6rem;font-weight:800;letter-spacing:8px;margin:16px 0 0;}
.cover .sub{font-size:.85rem;letter-spacing:4px;color:${c2};margin-top:8px;}
.cover .ctt{font-size:.8rem;color:#555;margin-top:14px;}
.sec{background:${c1};color:#fff;padding:13px 24px;font-size:.95rem;font-weight:800;letter-spacing:3px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:0;}
.card{border-bottom:1px solid #eee;border-right:1px solid #eee;padding:14px 18px;}
.card h3{font-size:.85rem;font-weight:800;color:${c1};text-transform:uppercase;margin-bottom:4px;}
.card p{font-size:.7rem;color:#777;margin-bottom:8px;line-height:1.4;}
.preco{font-weight:800;font-size:.95rem;color:${c2};}
.bgrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;}
.brow{border-bottom:1px solid #eee;border-right:1px solid #eee;padding:11px 15px;display:flex;justify-content:space-between;}
.taxa{font-weight:800;color:${c2};}
.footer{background:#08090d;color:#444;text-align:center;padding:22px;font-size:.72rem;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
@media print{*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}}
</style></head><body>
<div class="cover">
  ${m.logoBase64 ? `<img src="${m.logoBase64}" style="width:76px;height:76px;object-fit:cover;border-radius:50%;border:3px solid ${c1};">` : `<div style="font-size:2.5rem">${tipo.icon}</div>`}
  <h1>${m.nome}</h1>
  <div class="sub">${m.subtitulo}</div>
  ${m.whatsapp ? `<div class="ctt">📱 ${m.whatsapp}</div>` : ''}
  ${m.instagram ? `<div class="ctt">📸 ${m.instagram}</div>` : ''}
</div>
${itensHTML}
${bairrosHTML}
<div class="footer">${hrStr}${fcDias ? ' · Fechado: ' + fcDias : ''} · Gerado em ${new Date().toLocaleDateString('pt-BR')} · Labriolag</div>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  if (win) {
    setTimeout(() => { win.focus(); win.print(); }, 900);
    toast('📄 Use Ctrl+P → Salvar como PDF', 'ok');
  } else {
    const a = document.createElement('a');
    a.href = url; a.download = `cardapio_${m.nome}.html`; a.click();
    toast('📄 HTML salvo — abra e imprima.', 'ok');
  }
}

// ──────────────────────────────────────────────
// PREVIEW MODAL (abre em nova aba)
// ──────────────────────────────────────────────
function abrirPreview() {
  const html  = gerarHTMLCardapio();
  const blob  = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url   = URL.createObjectURL(blob);
  window.open(url, '_blank');
  toast('👁 Preview aberto em nova aba!', 'ok');
}

// ──────────────────────────────────────────────
// IMPORTAR BACKUP — parse do payload
// ──────────────────────────────────────────────

/**
 * Recebe o texto lido do QR Code de backup (formato: labx://cardapio/v2/<base64>)
 * Faz o parse, valida e restaura o estado.
 * Retorna { ok: true } ou { ok: false, erro: string }
 */
function parsearBackup(texto) {
  const PREFIX = 'labx://cardapio/v2/';
  if (!texto || !texto.startsWith(PREFIX)) {
    return { ok: false, erro: 'QR Code não reconhecido. Use um backup gerado por este Builder.' };
  }
  try {
    const b64  = texto.slice(PREFIX.length);
    const json = decodeURIComponent(escape(atob(b64)));
    const dados = JSON.parse(json);

    // Validação mínima
    if (!dados.marca || !dados.marca.nome) {
      return { ok: false, erro: 'Dados do backup incompletos ou corrompidos.' };
    }

    return { ok: true, dados };
  } catch (e) {
    return { ok: false, erro: 'Falha ao decodificar o backup: ' + e.message };
  }
}

function aplicarBackup(dados) {
  // Mescla mantendo imagens atuais (o backup não tem fotos)
  const logoAtual = estado.marca?.logoBase64 || '';
  estado = dados;
  // Preserva logo se já existia e o backup não trouxe
  if (!estado.marca.logoBase64 && logoAtual) estado.marca.logoBase64 = logoAtual;
  pvCatIdx = 0;
  salvar();
  renderEditor();
  renderPreview();
  toast('✅ Cardápio restaurado com sucesso!', 'ok');
}

// ──────────────────────────────────────────────
// IMPORTAR POR IMAGEM (upload)
// ──────────────────────────────────────────────
let uploadDadosPendentes = null;  // guarda os dados decodificados antes de confirmar

function processarImagemQR(file) {
  uploadDadosPendentes = null;
  document.getElementById('btn-processar-upload').style.display = 'none';

  const reader = new FileReader();
  reader.onload = (e) => {
    const resultArea = document.getElementById('upload-result');
    const prevImg    = document.getElementById('upload-preview-img');
    const statusEl   = document.getElementById('upload-status');

    prevImg.src = e.target.result;
    resultArea.style.display = 'block';

    // Usa canvas para extrair pixels e passar pro jsQR
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const qr = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (!qr) {
        statusEl.textContent = '⚠️ Nenhum QR Code encontrado na imagem.';
        statusEl.style.background = 'rgba(232,160,32,.12)';
        statusEl.style.color = '#e8a020';
        statusEl.style.border = '1px solid rgba(232,160,32,.3)';
        return;
      }

      const resultado = parsearBackup(qr.data);
      if (!resultado.ok) {
        statusEl.textContent = '✕ ' + resultado.erro;
        statusEl.style.background = 'rgba(232,64,64,.1)';
        statusEl.style.color = '#e84040';
        statusEl.style.border = '1px solid rgba(232,64,64,.3)';
        return;
      }

      uploadDadosPendentes = resultado.dados;
      statusEl.textContent = `✓ Backup de "${resultado.dados.marca.nome}" detectado! Clique em Restaurar.`;
      statusEl.style.background = 'rgba(15,169,110,.1)';
      statusEl.style.color = '#0fa96e';
      statusEl.style.border = '1px solid rgba(15,169,110,.3)';
      document.getElementById('btn-processar-upload').style.display = '';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ──────────────────────────────────────────────
// IMPORTAR POR CÂMERA (scan ao vivo via jsQR)
// ──────────────────────────────────────────────
let cameraStream   = null;
let cameraLoop     = null;
let cameraAtiva    = false;

function iniciarCamera() {
  const video       = document.getElementById('camera-video');
  const canvas      = document.getElementById('camera-canvas');
  const placeholder = document.getElementById('camera-placeholder');
  const statusEl    = document.getElementById('camera-status');
  const btnStart    = document.getElementById('btn-start-camera');

  if (cameraAtiva) {
    pararCamera();
    return;
  }

  navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
  })
  .then(stream => {
    cameraStream  = stream;
    cameraAtiva   = true;
    video.srcObject = stream;
    video.style.display = 'block';
    placeholder.style.display = 'none';
    statusEl.style.display = 'block';
    btnStart.textContent = '⏹ Parar Câmera';

    video.onloadedmetadata = () => {
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      // Adiciona linha de scan animada
      const mira = document.getElementById('camera-mira');
      if (mira && !mira.querySelector('.scan-line')) {
        const line = document.createElement('div');
        line.className = 'scan-line';
        mira.querySelector('div').appendChild(line);
      }
      scanLoop();
    };
  })
  .catch(err => {
    toast('Câmera não disponível: ' + err.message, 'err');
  });
}

function scanLoop() {
  const video    = document.getElementById('camera-video');
  const canvas   = document.getElementById('camera-canvas');
  const statusEl = document.getElementById('camera-status');
  if (!cameraAtiva || !canvas) return;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const qr = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'dontInvert',
  });

  if (qr) {
    const resultado = parsearBackup(qr.data);
    if (resultado.ok) {
      pararCamera();
      // Feedback visual antes de restaurar
      statusEl.textContent = '✓ QR Code lido! Restaurando…';
      statusEl.style.background = 'rgba(15,169,110,.8)';
      statusEl.style.display = 'block';
      setTimeout(() => {
        fecharModal('modal-bkp');
        aplicarBackup(resultado.dados);
      }, 800);
      return;
    } else {
      statusEl.textContent = '⚠️ QR não reconhecido';
    }
  } else {
    statusEl.textContent = 'Procurando QR Code…';
    statusEl.style.background = 'rgba(0,0,0,.7)';
  }

  cameraLoop = requestAnimationFrame(scanLoop);
}

function pararCamera() {
  cameraAtiva = false;
  if (cameraLoop) { cancelAnimationFrame(cameraLoop); cameraLoop = null; }
  if (cameraStream) {
    cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
  }
  const video       = document.getElementById('camera-video');
  const placeholder = document.getElementById('camera-placeholder');
  const statusEl    = document.getElementById('camera-status');
  const btnStart    = document.getElementById('btn-start-camera');
  if (video)       { video.srcObject = null; video.style.display = 'none'; }
  if (placeholder)   placeholder.style.display = 'flex';
  if (statusEl)      statusEl.style.display = 'none';
  if (btnStart)      btnStart.textContent = '📷 Iniciar Câmera';
}

// Troca de aba no modal Backup
function switchBkpTab(aba) {
  // Para câmera se mudar de aba
  if (aba !== 'camera') pararCamera();

  // Reset upload state
  if (aba !== 'upload') {
    uploadDadosPendentes = null;
    const r = document.getElementById('upload-result');
    if (r) r.style.display = 'none';
    const b = document.getElementById('btn-processar-upload');
    if (b) b.style.display = 'none';
  }

  const paineis = { gerar: 'bkp-panel-gerar', camera: 'bkp-panel-camera', upload: 'bkp-panel-upload' };
  const tabs    = { gerar: 'bkp-tab-gerar',   camera: 'bkp-tab-camera',   upload: 'bkp-tab-upload'   };

  Object.keys(paineis).forEach(k => {
    document.getElementById(paineis[k]).style.display = k === aba ? '' : 'none';
    document.getElementById(tabs[k]).classList.toggle('active', k === aba);
  });
}

// ──────────────────────────────────────────────
// BINDS TOPBAR / MODAIS
// ──────────────────────────────────────────────
function bindTopbar() {
  // Tabs do editor
  document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.getElementById('btn-save').addEventListener('click', salvar);
  document.getElementById('btn-preview').addEventListener('click', abrirPreview);
  document.getElementById('btn-qr').addEventListener('click', abrirModalQR);
  document.getElementById('btn-bkp').addEventListener('click', () => {
    // Sempre começa na aba Gerar
    switchBkpTab('gerar');
    abrirModalBackup();
    document.getElementById('modal-bkp').classList.add('show');
  });
  document.getElementById('btn-pdf').addEventListener('click', () => {
    document.getElementById('modal-pdf').classList.add('show');
  });

  // ── Modal QR — tabs ──
  document.getElementById('qtab-qr').addEventListener('click', () => {
    document.getElementById('qtab-qr').classList.add('active');
    document.getElementById('qtab-html').classList.remove('active');
    document.getElementById('qpanel-qr').style.display = '';
    document.getElementById('qpanel-html').style.display = 'none';
  });
  document.getElementById('qtab-html').addEventListener('click', () => {
    document.getElementById('qtab-html').classList.add('active');
    document.getElementById('qtab-qr').classList.remove('active');
    document.getElementById('qpanel-html').style.display = '';
    document.getElementById('qpanel-qr').style.display = 'none';
  });
  document.getElementById('btn-close-qr').addEventListener('click',  () => fecharModal('modal-qr'));
  document.getElementById('btn-close-qr2').addEventListener('click', () => fecharModal('modal-qr'));
  document.getElementById('btn-baixar-qr').addEventListener('click',  () => baixarQRImagem('qr-canvas-container', 'qr-cardapio'));
  document.getElementById('btn-baixar-html').addEventListener('click', downloadHTML);

  // ── Modal Backup — tabs ──
  document.getElementById('bkp-tab-gerar').addEventListener('click',  () => switchBkpTab('gerar'));
  document.getElementById('bkp-tab-camera').addEventListener('click', () => switchBkpTab('camera'));
  document.getElementById('bkp-tab-upload').addEventListener('click', () => switchBkpTab('upload'));

  // Gerar
  document.getElementById('btn-close-bkp').addEventListener('click', () => {
    pararCamera();
    fecharModal('modal-bkp');
  });
  document.getElementById('btn-baixar-bkp').addEventListener('click', () =>
    baixarQRImagem('bkp-canvas-container', 'backup-cardapio')
  );

  // Câmera
  document.getElementById('btn-close-camera').addEventListener('click', () => {
    pararCamera();
    fecharModal('modal-bkp');
  });
  document.getElementById('btn-start-camera').addEventListener('click', iniciarCamera);

  // Upload de imagem
  document.getElementById('btn-close-upload').addEventListener('click', () => fecharModal('modal-bkp'));

  const inpUpload = document.getElementById('inp-qr-upload');
  inpUpload.addEventListener('change', () => {
    if (inpUpload.files[0]) processarImagemQR(inpUpload.files[0]);
  });

  // Drag & drop na área de upload
  const dropArea = document.getElementById('upload-drop-area');
  dropArea.addEventListener('dragover', e => { e.preventDefault(); dropArea.style.borderColor = 'var(--accent)'; });
  dropArea.addEventListener('dragleave', () => { dropArea.style.borderColor = ''; });
  dropArea.addEventListener('drop', e => {
    e.preventDefault();
    dropArea.style.borderColor = '';
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) processarImagemQR(f);
  });

  document.getElementById('btn-processar-upload').addEventListener('click', () => {
    if (!uploadDadosPendentes) return;
    fecharModal('modal-bkp');
    aplicarBackup(uploadDadosPendentes);
    uploadDadosPendentes = null;
  });

  // ── Modal PDF ──
  document.getElementById('btn-close-pdf').addEventListener('click', () => fecharModal('modal-pdf'));
  document.getElementById('btn-ok-pdf').addEventListener('click', () => {
    fecharModal('modal-pdf');
    gerarPDF();
  });

  // Fechar qualquer modal clicando no fundo
  document.querySelectorAll('.modal-bg').forEach(bg => {
    bg.addEventListener('click', e => {
      if (e.target === bg) {
        pararCamera();
        bg.classList.remove('show');
      }
    });
  });
}

// ──────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  bindTopbar();
  renderEditor();
  renderPreview();
  // Auto-save a cada 2 min
  setInterval(salvar, 2 * 60 * 1000);
});
