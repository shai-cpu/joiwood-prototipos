/* Joiwood prototipo 2: "Arma tu espacio". Un cuarto con medidas reales donde se sueltan, mueven y giran
   los muebles. Avisa si chocan, mide el paso libre y suma precio y fecha de entrega. */
(() => {
'use strict';
const J = window.JW; if (!J.webgl) return;
const T = THREE, { $, $$, clamp, lerp } = J;

J.mundo = () => {
  const sec = $('#mundo'), canvas = $('#cuarto'); if (!sec || !canvas) return;
  const caja = canvas.parentElement;
  const R = new T.WebGLRenderer({canvas, antialias:true, alpha:true});
  R.setPixelRatio(Math.min(devicePixelRatio || 1, J.movil ? 1.5 : 2));
  R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap; R.outputEncoding = T.sRGBEncoding;
  
  const esc = new T.Scene(), cam = new T.PerspectiveCamera(34, 1, .1, 80);
  const cielo = new T.HemisphereLight(0xFFF6EA, 0x8C7762, .9); esc.add(cielo);
  const sol = new T.DirectionalLight(0xFFF1DC, 1.05); sol.castShadow = true; sol.shadow.mapSize.set(J.movil ? 1024 : 2048, J.movil ? 1024 : 2048);
  Object.assign(sol.shadow.camera, {left:-5, right:5, top:5, bottom:-5, near:.5, far:22}); sol.shadow.bias = -.0006; sol.shadow.radius = 4; esc.add(sol);
  const lampara = new T.PointLight(0xFFB15E, 0, 9, 1.6); esc.add(lampara);

  const S = {w:4, d:3.4, alto:2.5, giro:-.5, elev:.62, noche:0, nocheMeta:0, piso:'porcelanato', pared:'#F3ECE2'};
  const PISOS = {porcelanato:{n:'Porcelanato', c:'#D9CDBC', l:'#C4B6A2', paso:.6}, madera:{n:'Madera', c:'#B48A5E', l:'#946D47', paso:.18}, cemento:{n:'Cemento pulido', c:'#B9B4AC', l:'#A8A29A', paso:1.2}};
  const PAREDES = [['#F3ECE2','Blanco hueso'],['#E3D5C0','Arena'],['#C9CFC4','Salvia'],['#D9B99A','Terracota suave']];

  /* piso y paredes */
  function texPiso(k){
    const o = PISOS[k], c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    g.fillStyle = o.c; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 500; i++) { g.fillStyle = Math.random() > .5 ? '#fff' : '#000'; g.globalAlpha = .03; g.fillRect(Math.random()*256, Math.random()*256, 2 + Math.random()*26, 1 + Math.random()*2); }
    g.globalAlpha = 1; g.strokeStyle = o.l; g.lineWidth = k === 'cemento' ? 1 : 3; g.strokeRect(0, 0, 256, 256);
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.encoding = T.sRGBEncoding; t.anisotropy = 4; return t;
  }
  const matPiso = new T.MeshStandardMaterial({roughness:.55, metalness:0}), matPared = new T.MeshStandardMaterial({color:S.pared, roughness:.95, side:T.DoubleSide});
  const matZoc = new T.MeshStandardMaterial({color:0xFBF8F3, roughness:.7});
  const cuarto = new T.Group(); esc.add(cuarto);
  let paredes = [], ventana = null;
  function armarCuarto(){
    while (cuarto.children.length) { const c = cuarto.children[0]; cuarto.remove(c); c.traverse(m => m.geometry && m.geometry.dispose()); }
    const {w, d, alto} = S, o = PISOS[S.piso];
    if (matPiso.map) matPiso.map.dispose(); matPiso.map = texPiso(S.piso);
    matPiso.map.repeat.set(S.piso === 'madera' ? w / 1.2 : w / o.paso, d / o.paso); matPiso.needsUpdate = true;
    const piso = new T.Mesh(new T.BoxGeometry(w, .08, d), [null, null, matPiso, null, null, null].map(m => m || matZoc));
    piso.position.y = -.04; piso.receiveShadow = true; piso.userData.piso = true; cuarto.add(piso);
    paredes = [];
    const pared = (ancho, x, z, ry, nx, nz) => {
      const g = new T.Group(), m = new T.Mesh(new T.BoxGeometry(ancho, alto, .08), matPared); m.position.y = alto / 2; m.receiveShadow = true; g.add(m);
      const zo = new T.Mesh(new T.BoxGeometry(ancho, .09, .1), matZoc); zo.position.set(0, .045, 0); g.add(zo);
      g.position.set(x, 0, z); g.rotation.y = ry; g.userData = {nx, nz}; cuarto.add(g); paredes.push(g); return g;
    };
    const fondo = pared(w + .16, 0, -d/2 - .04, 0, 0, 1);
    pared(d, -w/2 - .04, 0, Math.PI / 2, 1, 0); pared(d, w/2 + .04, 0, Math.PI / 2, -1, 0);
    /* ventana en la pared del fondo */
    const vw = Math.min(1.5, w * .36), vg = new T.Group();
    ventana = new T.Mesh(new T.PlaneGeometry(vw, 1.25), new T.MeshBasicMaterial({color:0xDCEBF2}));
    ventana.position.z = .012; vg.add(ventana);
    const marco = new T.Mesh(new T.BoxGeometry(vw + .1, 1.35, .05), matZoc); marco.position.z = -.02; vg.add(marco);
    const cruz = new T.Mesh(new T.BoxGeometry(.035, 1.25, .03), matZoc); cruz.position.z = .022; vg.add(cruz);
    vg.position.set(w * .22, 1.45, .06); fondo.add(vg);
    sol.position.set(w * .3 + 2.2, 5.2, 2.6); lampara.position.set(0, alto - .25, 0);
    piezas.forEach(sujetar); medidasCuarto();
  }

  /* piezas */
  const piezas = []; let sel = null, uid = 0;
  const huella = pz => { const t = pz.g.userData.tam, q = pz.r % 2; return {w: q ? t.d : t.w, d: q ? t.w : t.d}; };
  function sujetar(pz){
    const h = huella(pz), mx = Math.max(0, S.w/2 - h.w/2), mz = Math.max(0, S.d/2 - h.d/2);
    pz.x = clamp(pz.x, -mx, mx); pz.z = clamp(pz.z, -mz, mz);
  }
  const marcaSel = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({color:0xF08A0C, transparent:true, opacity:.2, depthWrite:false}));
  marcaSel.rotation.x = -Math.PI / 2; marcaSel.position.y = .004; marcaSel.visible = false; esc.add(marcaSel);
  const borde = new T.LineSegments(new T.EdgesGeometry(new T.PlaneGeometry(1, 1)), new T.LineBasicMaterial({color:0xF08A0C}));
  marcaSel.add(borde);
  function agregar(id, fin, x, z, r, caer){
    if (!J.tieneModelo(id)) return null;
    if (piezas.length >= 12) { J.toast && J.toast('El cuarto ya tiene 12 muebles.'); return null; }
    const p = J.byId[id], g = J.build(id, fin || p.mats[0], {});
    const pz = {uid: ++uid, id, g, x: x || 0, z: z || 0, r: r || 0, cae: caer === false ? 1 : 0, choca:false};
    sujetar(pz); esc.add(g); piezas.push(pz); elegir(pz); cambio(); return pz;
  }
  function quitar(pz){ esc.remove(pz.g); pz.g.traverse(m => m.geometry && m.geometry.dispose()); piezas.splice(piezas.indexOf(pz), 1); if (sel === pz) elegir(null); cambio(); }
  function vaciar(){ piezas.slice().forEach(pz => { esc.remove(pz.g); pz.g.traverse(m => m.geometry && m.geometry.dispose()); }); piezas.length = 0; elegir(null); }
  function elegir(pz){ sel = pz; barra(); }
  function chocar(){
    piezas.forEach(a => a.choca = false);
    for (let i = 0; i < piezas.length; i++) for (let k = i + 1; k < piezas.length; k++) {
      const a = piezas[i], b = piezas[k], ha = huella(a), hb = huella(b);
      if (Math.abs(a.x - b.x) < (ha.w + hb.w) / 2 - .01 && Math.abs(a.z - b.z) < (ha.d + hb.d) / 2 - .01) a.choca = b.choca = true;
    }
  }

  /* ambientes listos: posiciones como fracción del cuarto */
  const AMB = {
    sala:{n:'Sala', w:4.2, d:3.6, p:[['mueble-tv-coronado',0,-1,0],['sofa-bocas',0,.62,2],['mesa-centro-taboga',0,-.08,0]]},
    recamara:{n:'Recámara', w:3.8, d:3.6, p:[['cama-pedasi',0,-1,0],['mesa-noche-pedasi',-1,-1,0,-1.12],['mesa-noche-pedasi',1,-1,0,1.12],['closet-cerro-azul',-1,1,1]]},
    comedor:{n:'Comedor', w:4.4, d:3.4, p:[['comedor-boquete',0,.15,0],['bufetera-volcan',0,-1,0]]},
    oficina:{n:'Oficina', w:3, d:2.8, p:[['escritorio-chame',0,-1,0],['closet-cerro-azul',1,1,3]]}
  };
  function ambiente(k, quieto){
    const a = AMB[k]; vaciar(); S.w = a.w; S.d = a.d; armarCuarto(); controles();
    a.p.forEach(([id, fx, fz, r, pegadoX], i) => {
      const pz = agregar(id, null, 0, 0, r, true); if (!pz) return;
      const h = huella(pz), mx = S.w/2 - h.w/2 - .03, mz = S.d/2 - h.d/2 - .03;
      pz.x = pegadoX ? pegadoX : fx * mx; pz.z = fz * mz; sujetar(pz); pz.cae = J.calma || quieto ? 1 : -i * .22;
    });
    elegir(null); cambio();
  }

  /* cámara */
  let W = 1, H = 1;
  function medir(){ const r = canvas.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height); R.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix(); }
  function camara(){
    const radio = Math.hypot(S.w, S.d) / 2 + .5, vf = cam.fov * Math.PI / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * cam.aspect);
    const dist = radio / Math.sin(Math.min(vf, hf) / 2) * 1.02;
    cam.position.set(Math.sin(S.giro) * Math.cos(S.elev) * dist, Math.sin(S.elev) * dist + .5, Math.cos(S.giro) * Math.cos(S.elev) * dist);
    cam.lookAt(0, .55, 0);
    paredes.forEach(g => { const u = g.userData; g.visible = (cam.position.x - g.position.x) * u.nx + (cam.position.z - g.position.z) * u.nz > 0; });
  }

  /* rótulos de medidas */
  const capa = $('#cuartoRotulos');
  const etq = cls => { const el = document.createElement('div'); el.className = cls; capa.appendChild(el); return el; };
  const mAncho = etq('cota clara'), mFondo = etq('cota clara'), dIzq = etq('cota libre'), dFondo = etq('cota libre'), herr = $('#cuartoBarra');
  const v3 = new T.Vector3();
  const px = (x, y, z) => { v3.set(x, y, z).project(cam); return [(v3.x * .5 + .5) * W, (-v3.y * .5 + .5) * H]; };
  const poner = (el, x, y, z) => { const [a, b] = px(x, y, z); el.style.transform = `translate(${a}px,${b}px) translate(-50%,-50%)`; };
  function medidasCuarto(){ mAncho.textContent = S.w.toFixed(1) + ' m'; mFondo.textContent = S.d.toFixed(1) + ' m'; }
  const lineaPaso = new T.LineSegments(new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3(), new T.Vector3(), new T.Vector3()]), new T.LineDashedMaterial({color:0xC96A00, dashSize:.06, gapSize:.04}));
  lineaPaso.visible = false; esc.add(lineaPaso);

  function pintar(t){
    S.noche = lerp(S.noche, S.nocheMeta, .08);
    const n = S.noche;
    cielo.intensity = lerp(.8, .14, n); sol.intensity = lerp(.5, .04, n); lampara.intensity = n * 1.1;
    if (ventana) ventana.material.color.setHex(0xDCEBF2).lerp(new T.Color(0x1B2740), n);
    caja.style.setProperty('--noche', n.toFixed(3));
    piezas.forEach(pz => {
      let y = pz.g.userData.colgado;
      if (pz.cae < 1) { pz.cae = Math.min(1, pz.cae + .028); const k = clamp(pz.cae), reb = 1 - Math.abs(Math.cos(k * Math.PI * 2.5)) * Math.pow(1 - k, 2.2); y += (1 - reb) * 2.4; pz.g.visible = pz.cae > 0; }
      pz.g.position.set(pz.x, y, pz.z); pz.g.rotation.y = lerp(pz.g.rotation.y, pz.r * Math.PI / 2, .25);
    });
    camara();
    marcaSel.visible = !!sel;
    if (sel) {
      const h = huella(sel); marcaSel.position.set(sel.x, .004, sel.z); marcaSel.scale.set(h.w + .08, h.d + .08, 1);
      marcaSel.material.color.setHex(sel.choca ? 0xC0392B : 0xF08A0C); borde.material.color.setHex(sel.choca ? 0xC0392B : 0xF08A0C);
      const li = sel.x - h.w/2 + S.w/2, lf = sel.z - h.d/2 + S.d/2, a = lineaPaso.geometry.attributes.position;
      a.setXYZ(0, -S.w/2, .01, sel.z); a.setXYZ(1, sel.x - h.w/2, .01, sel.z); a.setXYZ(2, sel.x, .01, -S.d/2); a.setXYZ(3, sel.x, .01, sel.z - h.d/2);
      a.needsUpdate = true; lineaPaso.computeLineDistances(); lineaPaso.visible = true;
      dIzq.textContent = Math.round(li * 100) + ' cm'; dFondo.textContent = Math.round(lf * 100) + ' cm';
      dIzq.classList.toggle('on', li > .12); dFondo.classList.toggle('on', lf > .12);
      poner(dIzq, (-S.w/2 + sel.x - h.w/2) / 2, .01, sel.z); poner(dFondo, sel.x, .01, (-S.d/2 + sel.z - h.d/2) / 2);
      const [bx, by] = px(sel.x, sel.g.userData.colgado + sel.g.userData.tam.h + .12, sel.z);
      herr.style.transform = `translate(${clamp(bx, 120, W - 120)}px,${clamp(by, 54, H - 10)}px) translate(-50%,-100%)`;
    } else { lineaPaso.visible = false; dIzq.classList.remove('on'); dFondo.classList.remove('on'); }
    poner(mAncho, 0, 0, S.d/2 + .16); poner(mFondo, (Math.sin(S.giro) > 0 ? -1 : 1) * (S.w/2 + .16), 0, 0);
    R.render(esc, cam);
  }
  let activo = false, raf = 0;
  const tic = t => { if (!activo) return; raf = requestAnimationFrame(tic); pintar(t); };
  const andar = si => { if (si === activo) return; activo = si; cancelAnimationFrame(raf); if (si) raf = requestAnimationFrame(tic); };
  new ResizeObserver(() => { medir(); if (!activo) pintar(0); }).observe(canvas);

  /* puntero: tocar una pieza la mueve, tocar el piso gira la cámara */
  const rayo = new T.Raycaster(), ndc = new T.Vector2(), plano = new T.Plane(new T.Vector3(0, 1, 0), 0), hit = new T.Vector3();
  const aNdc = ev => { const r = canvas.getBoundingClientRect(); ndc.set((ev.clientX - r.left) / r.width * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1); rayo.setFromCamera(ndc, cam); };
  let arr = null;
  canvas.addEventListener('pointerdown', ev => {
    aNdc(ev); canvas.setPointerCapture && canvas.setPointerCapture(ev.pointerId);
    const objs = []; piezas.forEach(pz => pz.g.userData.parts.forEach(m => { m.userData.pz = pz; objs.push(m); }));
    const h = rayo.intersectObjects(objs, false)[0];
    if (h) { const pz = h.object.userData.pz; elegir(pz); rayo.ray.intersectPlane(plano, hit); arr = {pz, ox: pz.x - hit.x, oz: pz.z - hit.z}; canvas.classList.add('agarra'); }
    else { arr = {cam:true, x: ev.clientX, y: ev.clientY, mov:0}; }
  });
  canvas.addEventListener('pointermove', ev => {
    if (!arr) return;
    if (arr.cam) { const dx = ev.clientX - arr.x, dy = ev.clientY - arr.y; arr.x = ev.clientX; arr.y = ev.clientY; arr.mov += Math.abs(dx) + Math.abs(dy); S.giro = clamp(S.giro - dx * .006, -1.25, 1.25); S.elev = clamp(S.elev + dy * .004, .3, 1.25); return; }
    aNdc(ev); if (!rayo.ray.intersectPlane(plano, hit)) return;
    const pz = arr.pz; pz.x = Math.round((hit.x + arr.ox) * 20) / 20; pz.z = Math.round((hit.z + arr.oz) * 20) / 20; sujetar(pz); chocar(); aviso();
  });
  const soltar = () => { if (arr && arr.cam && arr.mov < 5) elegir(null); if (arr && arr.pz) cambio(); arr = null; canvas.classList.remove('agarra'); };
  canvas.addEventListener('pointerup', soltar); canvas.addEventListener('pointercancel', soltar);
  /* en táctil el canvas no roba el scroll hasta que la persona lo activa */
  const velo = $('#cuartoVelo'), salir = $('#cuartoSalir');
  if (J.movil && velo) { caja.classList.add('dormido'); velo.hidden = false; velo.onclick = () => { caja.classList.remove('dormido'); velo.hidden = true; salir.hidden = false; }; salir.onclick = () => { caja.classList.add('dormido'); velo.hidden = false; salir.hidden = true; elegir(null); }; }

  /* barra de la pieza elegida */
  function barra(){
    if (!sel) { herr.hidden = true; return; }
    const p = J.byId[sel.id]; herr.hidden = false;
    herr.innerHTML = `<b>${J.esc(p.corto)}</b><span class="mu">${p.mats.map(m => `<button type="button" class="pt${sel.g.userData.fin === m ? ' on' : ''}" data-fin="${m}" style="--c:${J.MAD[m].c}" aria-label="${J.MAD[m].n}"></button>`).join('')}</span>
      <button type="button" data-ac="girar" aria-label="Girar 90 grados">Girar</button><button type="button" data-ac="quitar" aria-label="Quitar del cuarto">Quitar</button>`;
  }
  herr.addEventListener('click', ev => {
    const b = ev.target.closest('button'); if (!b || !sel) return;
    if (b.dataset.fin) { J.acabado(sel.g, b.dataset.fin); barra(); cambio(); }
    else if (b.dataset.ac === 'girar') { sel.r = (sel.r + 1) % 4; sujetar(sel); cambio(); }
    else if (b.dataset.ac === 'quitar') quitar(sel);
  });

  /* panel: lista, total y fecha */
  const lista = $('#cuartoLista'), avisoEl = $('#cuartoAviso');
  function aviso(){
    const n = piezas.filter(p => p.choca).length;
    avisoEl.className = 'aviso ' + (n ? 'mal' : 'bien');
    avisoEl.textContent = !piezas.length ? 'Elige un ambiente o suma un mueble de la lista.' : n ? `${n} muebles se chocan. Muévelos o agranda el cuarto.` : `Todo cabe en ${S.w.toFixed(1)} × ${S.d.toFixed(1)} m.`;
  }
  function cambio(){
    chocar(); aviso();
    const z = J.zona(), sub = piezas.reduce((s, pz) => s + J.byId[pz.id].price, 0);
    const dias = piezas.reduce((m, pz) => Math.max(m, J.byId[pz.id].dias), 2), v = J.ventana(dias, z);
    lista.innerHTML = piezas.length ? piezas.map(pz => { const p = J.byId[pz.id]; return `<li${sel === pz ? ' class="on"' : ''} data-uid="${pz.uid}"><span class="pt" style="--c:${J.MAD[pz.g.userData.fin].c}"></span><span>${J.esc(p.corto)}<small>${p.dim.a} × ${p.dim.f} cm · ${J.MAD[pz.g.userData.fin].n}</small></span><b class="num">${J.usd(p.price)}</b></li>`; }).join('')
      + `<li class="tot"><span></span><span>Total con ITBMS<small>Llega entre el ${J.fechaCorta(v.a)} y el ${J.fechaCorta(v.b)} a ${J.esc(z.c)}</small></span><b class="num">${J.usd(sub)}</b></li>` : '';
    $('#cuartoComprar').disabled = !piezas.length;
    barra();
  }
  lista.addEventListener('click', ev => { const li = ev.target.closest('[data-uid]'); if (!li) return; elegir(piezas.find(p => p.uid === +li.dataset.uid) || null); cambio(); });
  $('#cuartoComprar').onclick = () => { piezas.forEach(pz => J.agregarAlCarrito(pz.id, 1, pz.g.userData.fin, true)); J.abrirCarrito(); };
  J.on('zona', cambio);

  /* controles del cuarto */
  function controles(){
    $('#cuartoAncho').value = S.w; $('#cuartoFondo').value = S.d;
    $('#cuartoAnchoV').textContent = S.w.toFixed(1) + ' m'; $('#cuartoFondoV').textContent = S.d.toFixed(1) + ' m';
  }
  ['Ancho','Fondo'].forEach(k => $('#cuarto' + k).addEventListener('input', ev => { S[k === 'Ancho' ? 'w' : 'd'] = +ev.target.value; armarCuarto(); controles(); cambio(); }));
  $('#cuartoPisos').innerHTML = Object.entries(PISOS).map(([k, o]) => `<button type="button" class="pt${k === S.piso ? ' on' : ''}" data-piso="${k}" style="--c:${o.c}" aria-label="Piso: ${o.n}" title="${o.n}"></button>`).join('');
  $('#cuartoParedes').innerHTML = PAREDES.map(([c, n]) => `<button type="button" class="pt${c === S.pared ? ' on' : ''}" data-pared="${c}" style="--c:${c}" aria-label="Pared: ${n}" title="${n}"></button>`).join('');
  $('#cuartoPisos').addEventListener('click', ev => { const b = ev.target.closest('[data-piso]'); if (!b) return; S.piso = b.dataset.piso; $$('#cuartoPisos .pt').forEach(x => x.classList.toggle('on', x === b)); armarCuarto(); });
  $('#cuartoParedes').addEventListener('click', ev => { const b = ev.target.closest('[data-pared]'); if (!b) return; S.pared = b.dataset.pared; matPared.color.set(S.pared); $$('#cuartoParedes .pt').forEach(x => x.classList.toggle('on', x === b)); });
  $('#cuartoLuz').addEventListener('click', ev => { S.nocheMeta = S.nocheMeta ? 0 : 1; ev.currentTarget.setAttribute('aria-pressed', S.nocheMeta ? 'true' : 'false'); ev.currentTarget.textContent = S.nocheMeta ? 'Ver de día' : 'Ver de noche'; });
  $('#cuartoAmbientes').innerHTML = Object.entries(AMB).map(([k, a], i) => `<button type="button" class="tab${i ? '' : ' on'}" data-amb="${k}">${a.n}</button>`).join('');
  $('#cuartoAmbientes').addEventListener('click', ev => { const b = ev.target.closest('[data-amb]'); if (!b) return; $$('#cuartoAmbientes .tab').forEach(x => x.classList.toggle('on', x === b)); ambiente(b.dataset.amb); });
  $('#cuartoPiezas').innerHTML = J.P.map(p => `<button type="button" class="pz" data-pz="${p.id}"><img src="${p.img}" alt="" loading="lazy"><span>${J.esc(p.corto)}<small class="num">${p.dim.a} × ${p.dim.f} cm · ${J.usd(p.price)}</small></span><i aria-hidden="true">+</i></button>`).join('');
  $('#cuartoPiezas').addEventListener('click', ev => { const b = ev.target.closest('[data-pz]'); if (!b) return; const pz = agregar(b.dataset.pz, null, 0, 0, 0, true); if (pz && J.calma) pz.cae = 1; });

  J.ponerEnCuarto = (id, fin) => { const pz = agregar(id, fin, 0, 0, 0, true); if (pz && J.calma) pz.cae = 1; sec.scrollIntoView({behavior: J.calma ? 'auto' : 'smooth'}); };
  sec.classList.remove('sin3d');
  medir(); ambiente('sala', true); pintar(0); J.vigilar(canvas, andar);
};
})();
