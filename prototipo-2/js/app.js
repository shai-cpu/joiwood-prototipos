/* Joiwood prototipo 2: tienda, ficha 3D, entrega con fecha y carrito. */
(() => {
'use strict';
const J = window.JW, { $, $$, usd, esc, clamp, lerp } = J;

$('#logo').innerHTML = J.logoSVG(true);
$('#logoPie').innerHTML = J.logoSVG(true).replace('<svg', '<svg style="height:40px;width:auto"');
$('#linkP1').href = J.P1;
J.toast = t => { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(J.toast.t); J.toast.t = setTimeout(() => el.classList.remove('on'), 2800); };

const medirProto = () => document.documentElement.style.setProperty('--proto', $('.proto').offsetHeight + 'px');
medirProto(); addEventListener('resize', medirProto);

/* cinta */
$('#cinta').innerHTML = [0, 1].map(() => ['Entrega con fecha', 'Armado en tu casa', 'Garantía escrita', 'Míralo por dentro', 'Pruébalo en tu foto', 'Hecho en Panamá'].map(t => `<span>${t}</span>`).join('')).join('');

/* ---------- carrito ---------- */
const X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="22" height="22"><path d="M6 6l12 12M18 6 6 18"/></svg>';
const guardar = () => { J.store.set('cart', J.cart); cuenta(); };
function cuenta(){ const n = J.cart.reduce((s, i) => s + i.q, 0), b = $('#cuenta'); b.textContent = n; b.hidden = !n; }
J.agregarAlCarrito = (id, q, m, callado) => {
  const p = J.byId[id]; m = m && p.mats.includes(m) ? m : p.mats[0]; q = q || 1;
  const ex = J.cart.find(i => i.id === id && i.m === m);
  if (ex) ex.q = Math.min(p.stock, ex.q + q); else J.cart.push({id, q, m});
  guardar(); if (!callado) J.abrirCarrito();
};
function dibujarCarrito(){
  const items = J.cart.map(i => ({...i, p: J.byId[i.id]})), sub = items.reduce((s, i) => s + i.p.price * i.q, 0);
  const z = J.zona(), meta = 500, falta = Math.max(0, meta - sub);
  const env = !items.length ? 0 : (z.gratisDesde && sub >= z.gratisDesde ? 0 : z.costo);
  const msg = z.id === 'pty' ? (falta ? `Te faltan <b class="num">${usd(falta)}</b> para envío gratis en Ciudad de Panamá.` : '<b>Tu envío en Ciudad de Panamá es gratis.</b>') : `Envío a ${esc(z.n)}: <b class="num">${usd(z.costo)}</b>.`;
  $('#cajon').innerHTML = `<div class="cj-h"><h3>Tu carrito</h3><button class="icono" type="button" id="cerrarCarrito" aria-label="Cerrar carrito">${X}</button></div>` + (items.length ? `
    <div class="envio">${msg}${z.id === 'pty' ? `<div class="bar"><i style="width:${Math.min(100, sub / meta * 100)}%"></i></div>` : ''}</div>
    <div class="cj-items">${items.map((i, k) => `<div class="it"><img src="${i.p.img}" alt=""><div><b>${esc(i.p.n)}</b><small>${J.MAD[i.m].n} · llega ${J.fechaCorta(J.ventana(i.p.dias, z).a)}</small>
      <div class="q"><button type="button" data-menos="${k}" aria-label="Menos">−</button><span class="num">${i.q}</span><button type="button" data-mas="${k}" aria-label="Más">+</button></div>
      <button class="rm" type="button" data-quita="${k}">Quitar</button></div><div class="p num">${usd(i.p.price * i.q)}</div></div>`).join('')}</div>
    <div class="cj-f"><div class="tot"><span>Subtotal</span><span class="num">${usd(sub)}</span></div><div class="tot"><span>Envío</span><span class="num">${env ? usd(env) : 'Gratis'}</span></div>
      <div class="tot big"><span>Total</span><span class="num">${usd(sub + env)}</span></div>
      <small style="color:var(--gris)">ITBMS incluido. Armado ${z.arm ? 'incluido' : 'coordinado con aliado local'}.</small>
      <a class="btn btn-n" href="${J.P1}#checkout" target="_blank" rel="noopener">Ir a pagar</a>
      <small style="color:var(--gris);text-align:center">El pago se ve en el prototipo 1 y abre en otra pestaña.</small></div>`
    : `<div class="cj-vacio"><p>Tu carrito está vacío.</p><a class="btn btn-c" href="#tienda" id="irTienda">Ver muebles</a></div>`);
  $('#cerrarCarrito').onclick = cerrarCarrito; const ir = $('#irTienda'); if (ir) ir.onclick = cerrarCarrito;
}
J.abrirCarrito = () => { dibujarCarrito(); $('#cajon').classList.add('on'); $('#cajon').setAttribute('aria-hidden', 'false'); $('#fondoOsc').classList.add('on'); setTimeout(() => { const c = $('#cerrarCarrito'); c && c.focus(); }, 60); };
function cerrarCarrito(){ $('#cajon').classList.remove('on'); $('#cajon').setAttribute('aria-hidden', 'true'); $('#fondoOsc').classList.remove('on'); }
$('#btnCarrito').onclick = J.abrirCarrito; $('#fondoOsc').onclick = cerrarCarrito;
$('#cajon').addEventListener('click', ev => {
  const t = ev.target.closest('button'); if (!t) return;
  if (t.dataset.mas) { const i = J.cart[+t.dataset.mas]; i.q = Math.min(J.byId[i.id].stock, i.q + 1); }
  else if (t.dataset.menos) { const i = J.cart[+t.dataset.menos]; i.q = Math.max(1, i.q - 1); }
  else if (t.dataset.quita) J.cart.splice(+t.dataset.quita, 1);
  else return;
  guardar(); dibujarCarrito();
});
cuenta();

/* ---------- tienda ---------- */
let filtro = 'todo';
const llega = p => { const v = J.ventana(p.dias, J.zona()); return `Llega el ${J.fechaCorta(v.a)}`; };
function tienda(){
  $('#filtros').innerHTML = [{id:'todo', n:'Todo'}, ...J.CATS].map(c => `<button type="button" class="tab${c.id === filtro ? ' on' : ''}" data-f="${c.id}">${c.n}</button>`).join('');
  $('#rej').innerHTML = J.P.filter(p => filtro === 'todo' || p.cat === filtro).map(p => `<article class="tarj" data-id="${p.id}">
    ${p.flag ? `<span class="band${p.was || p.flag === 'Más vendido' ? ' n' : ''}">${esc(p.flag)}</span>` : ''}
    <button class="im" type="button" data-ficha="${p.id}" aria-label="Ver ${esc(p.n)} en 3D"><img src="${p.img}" alt="${esc(p.n)}" loading="lazy"><span class="muestraTag">Foto de muestra</span></button>
    <div class="cu"><h3>${esc(p.n)}</h3><div class="pr num">${usd(p.price)}${p.was ? `<s>${usd(p.was)}</s>` : ''}</div><div class="fe">${llega(p)}</div>
      <div class="ac"><button class="btn btn-c btn-ch" type="button" data-ficha="${p.id}">Ver en 3D</button><button class="btn btn-n btn-ch mas" type="button" data-suma="${p.id}" aria-label="Agregar ${esc(p.n)} al carrito">+</button></div></div></article>`).join('');
}
$('#filtros').addEventListener('click', ev => { const b = ev.target.closest('[data-f]'); if (!b) return; filtro = b.dataset.f; tienda(); });
document.addEventListener('click', ev => {
  const f = ev.target.closest('[data-ficha]'); if (f) { abrirFicha(f.dataset.ficha); return; }
  const s = ev.target.closest('[data-suma]'); if (s) J.agregarAlCarrito(s.dataset.suma);
});
/* inclinación de la tarjeta con el puntero */
if (!J.movil && !J.calma) {
  $('#rej').addEventListener('pointermove', ev => {
    const t = ev.target.closest('.tarj'); if (!t) return; const r = t.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
    t.style.setProperty('--ry', ((x - .5) * 9).toFixed(2) + 'deg'); t.style.setProperty('--rx', ((.5 - y) * 9).toFixed(2) + 'deg');
    t.style.setProperty('--mx', (x * 100).toFixed(0) + '%'); t.style.setProperty('--my', (y * 100 * (r.height / r.width)).toFixed(0) + '%');
  });
  $('#rej').addEventListener('pointerout', ev => { const t = ev.target.closest('.tarj'); if (t && !t.contains(ev.relatedTarget)) { t.style.setProperty('--rx', '0deg'); t.style.setProperty('--ry', '0deg'); } });
}
tienda();

/* ---------- ficha 3D ---------- */
let VF = null, fichaId = null, fichaFin = null, metaF = {d:0, b:0};
const cotasF = [];
function abrirFicha(id){
  const p = J.byId[id]; if (!p) return;
  fichaId = id; fichaFin = id === 'mueble-tv-coronado' && J.heroFin ? J.heroFin : p.mats[0]; metaF = {d:0, b:0};
  const f = $('#ficha'); f.classList.add('on'); f.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
  ['fichaAbrir', 'fichaPlano'].forEach(k => $('#' + k).setAttribute('aria-pressed', 'false'));
  if (J.webgl && J.tieneModelo(id)) {
    if (!VF) {
      VF = new J.Visor($('#fichaLienzo'), {sombra:.4});
      VF.cadaCuadro = () => { const e = VF.e; e.despiece = lerp(e.despiece, metaF.d, .1); e.plano = lerp(e.plano, metaF.b, .1); if (!J.calma && !VF.tocado) e.giro += .0035; if (VF.giroManual) { e.giro += VF.giroManual; VF.giroManual = 0; VF.tocado = true; } };
      VF.alPintar = () => cotasF.forEach((el, i) => { const c = VF.puntosCota[i]; if (!c) return; const q = VF.proyectar(c.p, VF.pivote); el.textContent = c.t; el.classList.toggle('on', VF.e.plano > .6); el.style.transform = `translate(${q.x}px,${q.y}px) translate(-50%,-50%)`; });
      for (let i = 0; i < 3; i++) { const el = document.createElement('div'); el.className = 'cota'; $('#fichaRotulos').appendChild(el); cotasF.push(el); }
    }
    VF.e.despiece = 0; VF.e.plano = 0; VF.e.giro = -.6; VF.e.alto = .3; VF.e.zoom = .9; VF.tocado = false;
    VF.poner(id, fichaFin); setTimeout(() => { VF.medir(); VF.andar(true); }, 30);
    $('#fichaResp').style.display = 'none'; $('#fichaLienzo').style.display = '';
  } else { $('#fichaResp').src = p.img; $('#fichaResp').style.display = 'block'; $('#fichaLienzo').style.display = 'none'; }
  infoFicha(); setTimeout(() => $('#fichaCerrar').focus(), 80);
}
function infoFicha(){
  const p = J.byId[fichaId], z = J.zona(), v = J.ventana(p.dias, z);
  $('#fichaInfo').innerHTML = `<p class="ceja" style="margin:0">${esc(J.CATS.find(c => c.id === p.cat).n)}</p><h2>${esc(p.n)}</h2><p style="margin:0;color:var(--carbon-2)">${esc(p.short)}</p>
    <div class="pr num">${usd(p.price)}${p.was ? `<s>${usd(p.was)}</s>` : ''}<small>ITBMS incluido</small></div>
    <div class="filaPt"><span>Acabado</span><span style="display:flex;gap:8px" id="fichaAcabados">${p.mats.map(m => `<button type="button" class="pt${m === fichaFin ? ' on' : ''}" data-fin="${m}" style="--c:${J.MAD[m].c}" aria-label="${J.MAD[m].n}" title="${J.MAD[m].n}"></button>`).join('')}</span><span style="color:var(--gris);font-weight:500">${J.MAD[fichaFin].n}</span></div>
    <div class="cajaFecha"><b>Llega entre el ${J.fecha(v.a)} y el ${J.fecha(v.b)}</b>${v.corte ? 'Pedido después de las 2:00 p.m.: sale el siguiente día hábil.' : 'Si pides hoy antes de las 2:00 p.m.'}
      <label class="sr" for="fichaZona">Zona de entrega</label><select id="fichaZona">${J.ZONAS.map(o => `<option value="${o.id}"${o.id === z.id ? ' selected' : ''}>${esc(o.n)} · ${o.gratisDesde && p.price >= o.gratisDesde ? 'envío gratis' : usd(o.costo)}</option>`).join('')}</select></div>
    <div class="ac"><button class="btn btn-n" type="button" id="fichaComprar">Agregar al carrito</button>
      <div class="ac2"><button class="btn btn-l btn-ch" type="button" id="fichaCuarto">Ponerlo en el cuarto</button><button class="btn btn-l btn-ch" type="button" id="fichaFoto">Probarlo en mi foto</button></div></div>
    <dl class="datos"><dt>Medidas</dt><dd class="mono num">${p.dim.a} × ${p.dim.f} × ${p.dim.h} cm (ancho × fondo × alto)</dd><dt>Peso</dt><dd class="mono">${p.peso}</dd><dt>Material</dt><dd>${esc(p.mat)}</dd><dt>Armado</dt><dd>${esc(p.arm)}</dd><dt>En bodega</dt><dd>${p.stock} unidades</dd></dl>`;
  $('#fichaAcabados').onclick = ev => { const b = ev.target.closest('[data-fin]'); if (!b) return; fichaFin = b.dataset.fin; if (VF) VF.acabado(fichaFin); infoFicha(); };
  $('#fichaZona').onchange = ev => { J.zonaId = ev.target.value; J.store.set('zona', J.zonaId); J.emit('zona'); infoFicha(); };
  $('#fichaComprar').onclick = () => { J.agregarAlCarrito(fichaId, 1, fichaFin); };
  const sin = () => J.toast('Hace falta un navegador con 3D para esta parte.');
  $('#fichaCuarto').onclick = () => { const id = fichaId, fin = fichaFin; cerrarFicha(); J.ponerEnCuarto ? J.ponerEnCuarto(id, fin) : sin(); };
  $('#fichaFoto').onclick = () => { const id = fichaId, fin = fichaFin; cerrarFicha(); J.probarEnFoto ? J.probarEnFoto(id, fin) : sin(); };
}
function cerrarFicha(){ const f = $('#ficha'); f.classList.remove('on'); f.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; if (VF) VF.andar(false); fichaId = null; }
$('#fichaCerrar').onclick = cerrarFicha;
$('#fichaAbrir').onclick = ev => { metaF.d = metaF.d ? 0 : 1; ev.currentTarget.setAttribute('aria-pressed', metaF.d ? 'true' : 'false'); };
$('#fichaPlano').onclick = ev => { metaF.b = metaF.b ? 0 : 1; ev.currentTarget.setAttribute('aria-pressed', metaF.b ? 'true' : 'false'); };
$('#fichaLuz').onclick = ev => { const on = $('#fichaVis').classList.toggle('claro'); ev.currentTarget.setAttribute('aria-pressed', on ? 'true' : 'false'); };

/* ---------- entrega ---------- */
const CAMION = '<svg viewBox="0 0 54 40" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M3 9h28v20H3zM31 16h10l8 8v5H31" fill="#F08A0C" fill-opacity=".18"/><circle cx="13" cy="31" r="4.5" fill="#EFDCC6"/><circle cx="40" cy="31" r="4.5" fill="#EFDCC6"/></svg>';
let primera = true;
function entrega(){
  const z = J.zona(), v = J.ventana(2, z);
  $('#zonas').innerHTML = J.ZONAS.map(o => `<button type="button" class="tab${o.id === z.id ? ' on' : ''}" data-z="${o.id}">${esc(o.c)}</button>`).join('');
  $('#fechaGrande').innerHTML = `Entre el <span class="marca${primera ? '' : ' gira'}">${J.fecha(v.a)}</span> y el <span class="${primera ? '' : 'gira'}">${J.fecha(v.b)}</span>`;
  const hoy = v.corte ? 'Hoy, después de las 2:00 p.m.' : 'Hoy, antes de las 2:00 p.m.';
  $('#ruta').innerHTML = `<div class="camion" id="camion" aria-hidden="true">${CAMION}</div>` + [['Haces el pedido', hoy], ['Sale de la planta', J.fechaCorta(v.sale)], ['Va en camino', `${z.min} a ${z.max} días hábiles`], [z.arm ? 'Lo armamos en tu casa' : 'Llega a tu casa', `${J.fechaCorta(v.a)} al ${J.fechaCorta(v.b)}`]]
    .map(([a, b], i) => `<div class="paso" data-i="${i}"><b>${a}</b><span>${b}</span></div>`).join('');
  $('#entregaPie').innerHTML = `<span>Envío a ${esc(z.n)}: <b class="num">${usd(z.costo)}</b>${z.gratisDesde ? ` · gratis desde <b class="num">${usd(z.gratisDesde)}</b>` : ''}</span><span>Armado: <b>${z.arm ? 'incluido' : 'con aliado local'}</b></span><span>Cuenta días hábiles y salta los feriados de Panamá.</span>`;
  const cam = $('#camion'), pasos = $$('#ruta .paso');
  const correr = () => { cam.style.left = 'calc(75% - 66px)'; pasos.forEach((el, i) => setTimeout(() => el.classList.add('ya'), J.calma ? 0 : i * 460)); };
  if (J.calma || !vistaEntrega) { if (vistaEntrega || J.calma) correr(); } else requestAnimationFrame(() => requestAnimationFrame(correr));
  primera = false;
}
let vistaEntrega = false;
J.vigilar($('#ruta'), si => { if (si && !vistaEntrega) { vistaEntrega = true; entrega(); } });
$('#zonas').addEventListener('click', ev => { const b = ev.target.closest('[data-z]'); if (!b) return; J.zonaId = b.dataset.z; J.store.set('zona', J.zonaId); J.emit('zona'); });
function heroLlega(){ const z = J.zona(), v = J.ventana(2, z); $('#heroLlega').textContent = `Si pides hoy, llega a ${z.c} entre el ${J.fechaCorta(v.a)} y el ${J.fechaCorta(v.b)}`; }
J.on('zona', () => { entrega(); tienda(); heroLlega(); });
entrega(); heroLlega();

/* ---------- héroe: botones del panel final ---------- */
$('#heroComprar').onclick = () => J.agregarAlCarrito('mueble-tv-coronado', 1, J.heroFin);
$('#heroFicha').onclick = () => abrirFicha('mueble-tv-coronado');

/* ---------- notas y teclado ---------- */
$('#abrirNotas').onclick = () => { $('#notas').hidden = !$('#notas').hidden; };
$('#cerrarNotas').onclick = () => { $('#notas').hidden = true; };
document.addEventListener('keydown', ev => { if (ev.key !== 'Escape') return; if ($('#cajon').classList.contains('on')) cerrarCarrito(); else if (fichaId) cerrarFicha(); $('#notas').hidden = true; });

/* ---------- arranque del 3D ---------- */
const arrancar = (nombre, fn) => { try { fn && fn(); } catch (err) { console.error('3D ' + nombre, err); } };
if (J.webgl) { arrancar('heroe', J.heroe); arrancar('mundo', J.mundo); arrancar('foto', J.foto); }
})();
