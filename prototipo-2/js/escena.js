/* Joiwood prototipo 2: visor 3D reutilizable (héroe y ficha) y la historia con scroll del héroe. */
(() => {
'use strict';
const J = window.JW; if (!J.webgl) return;
const T = THREE, { $, $$, clamp, lerp, suave } = J;

/* ---------- visor ---------- */
J.Visor = function(canvas, o){
  o = Object.assign({corr:{x:0,y:0}, sombra:.3, fov:30}, o);
  const R = new T.WebGLRenderer({canvas, antialias:true, alpha:true});
  R.setPixelRatio(Math.min(devicePixelRatio || 1, J.movil ? 1.5 : 2));
  R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap;
  R.outputEncoding = T.sRGBEncoding;
  const esc = new T.Scene(), cam = new T.PerspectiveCamera(o.fov, 1, .05, 80);
  esc.add(new T.HemisphereLight(0xFFF3E2, 0x7A6450, .46));
  const sol = new T.DirectionalLight(0xFFFFFF, .62); sol.position.set(2.6, 4.6, 3.2); sol.castShadow = true;
  sol.shadow.mapSize.set(J.movil ? 1024 : 2048, J.movil ? 1024 : 2048);
  Object.assign(sol.shadow.camera, {left:-3.2, right:3.2, top:3.2, bottom:-3.2, near:.5, far:14}); sol.shadow.bias = -.0005; sol.shadow.radius = 5;
  esc.add(sol);
  const contra = new T.DirectionalLight(0xF08A0C, .32); contra.position.set(-3.5, 2.2, -3); esc.add(contra);
  const piso = new T.Mesh(new T.PlaneGeometry(40, 40), new T.ShadowMaterial({opacity:o.sombra}));
  piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true; esc.add(piso);
  const rejilla = new T.GridHelper(8, 32, 0xF08A0C, 0xF08A0C); rejilla.material.transparent = true; rejilla.material.opacity = 0; rejilla.visible = false; esc.add(rejilla);
  const pivote = new T.Group(); esc.add(pivote);
  const matAristas = new T.LineBasicMaterial({color:0xF08A0C, transparent:true, opacity:0});
  const matCotas = new T.LineBasicMaterial({color:0xFFFDFA, transparent:true, opacity:0});
  const cotas = new T.Group(); pivote.add(cotas);

  const V = this;
  V.R = R; V.esc = esc; V.cam = cam; V.pivote = pivote; V.modelo = null;
  V.e = {giro:.6, alto:.26, zoom:1, despiece:0, plano:0, intro:1, y:0};
  V.tam = {w:1, h:1, d:1}; V.puntosCota = [];
  let W = 1, H = 1, activo = false, raf = 0;

  V.poner = (id, fin) => {
    if (V.modelo) { pivote.remove(V.modelo); V.modelo.traverse(m => { if (m.geometry) m.geometry.dispose(); }); }
    const g = J.build(id, fin, {propios:true, aristas:matAristas});
    V.modelo = g; V.tam = g.userData.tam; pivote.add(g);
    const {w, h, d} = V.tam, y0 = g.userData.colgado;
    g.position.y = y0; V.e.y = y0;
    /* cotas: ancho al frente, fondo a la derecha, alto en la esquina */
    while (cotas.children.length) cotas.remove(cotas.children[0]);
    const s = .09, L = (a, b) => cotas.add(new T.Line(new T.BufferGeometry().setFromPoints([a, b]), matCotas));
    const v = (x, y, z) => new T.Vector3(x, y, z);
    L(v(-w/2, y0, d/2 + s), v(w/2, y0, d/2 + s)); L(v(-w/2, y0, d/2 + s - .04), v(-w/2, y0, d/2 + s + .04)); L(v(w/2, y0, d/2 + s - .04), v(w/2, y0, d/2 + s + .04));
    L(v(w/2 + s, y0, -d/2), v(w/2 + s, y0, d/2)); L(v(w/2 + s - .04, y0, -d/2), v(w/2 + s + .04, y0, -d/2)); L(v(w/2 + s - .04, y0, d/2), v(w/2 + s + .04, y0, d/2));
    L(v(-w/2 - s, y0, d/2), v(-w/2 - s, y0 + h, d/2)); L(v(-w/2 - s - .04, y0, d/2), v(-w/2 - s + .04, y0, d/2)); L(v(-w/2 - s - .04, y0 + h, d/2), v(-w/2 - s + .04, y0 + h, d/2));
    const p = J.byId[id].dim;
    V.puntosCota = [{p:v(0, y0, d/2 + s), t:p.a + ' cm'}, {p:v(w/2 + s, y0, 0), t:p.f + ' cm'}, {p:v(-w/2 - s, y0 + h/2, d/2), t:p.h + ' cm'}];
    V.pintar();
  };
  V.acabado = fin => { if (V.modelo) { J.acabado(V.modelo, fin); V.pintar(); } };

  const tmp = new T.Vector3();
  V.proyectar = (v3, local) => {
    tmp.copy(v3); if (local) local.localToWorld(tmp);
    tmp.project(cam);
    return {x:(tmp.x * .5 + .5) * W, y:(-tmp.y * .5 + .5) * H, z:tmp.z};
  };
  V.medir = () => {
    const r = canvas.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height);
    R.setSize(W, H, false); cam.aspect = W / H;
    const c = typeof o.corr === 'function' ? o.corr(W, H) : o.corr;
    if (c.x || c.y) cam.setViewOffset(W, H, -c.x * W, -c.y * H, W, H); else cam.clearViewOffset();
    cam.updateProjectionMatrix();
  };
  V.pintar = () => {
    if (!V.modelo) return;
    const e = V.e, {w, h, d} = V.tam;
    J.despiece(V.modelo, e.despiece);
    if (e.intro < 1 || V.enIntro) V.modelo.userData.parts.forEach((m, i, a) => {
      V.enIntro = e.intro < 1;
      const k = V.enIntro ? 1 - suave(0, 1, clamp(e.intro * 1.9 - (i / a.length) * .9)) : 0, u = m.userData;
      m.position.x += (u.des.x * 3.2 + u.azar.x * 2.4) * k; m.position.y += (u.des.y * 2 + u.azar.y * 3.4) * k; m.position.z += (u.des.z * 3.2 + u.azar.z * 2.4) * k;
      m.rotation.z = u.azar.x * 1.6 * k; m.rotation.y = u.azar.z * 1.6 * k;
    });
    /* plano: el sólido se vuelve fantasma y aparecen aristas, rejilla y cotas */
    const b = e.plano, pr = V.modelo.userData.propios;
    Object.values(pr).forEach(m => { m.transparent = b > .01; m.opacity = 1 - .9 * b; m.depthWrite = b < .5; });
    matAristas.opacity = b; matCotas.opacity = b; rejilla.material.opacity = b * .16; rejilla.visible = b > .01;
    V.modelo.userData.parts.forEach(m => { if (m.userData.aristas) m.userData.aristas.visible = b > .01; });
    cotas.visible = b > .01; piso.material.opacity = o.sombra * (1 - b);
    pivote.rotation.y = e.giro;
    const radio = Math.hypot(w, h, d) / 2 * (1 + e.despiece * .62);
    const vf = cam.fov * Math.PI / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * cam.aspect);
    const dist = radio / Math.sin(Math.min(vf, hf) / 2) * 1.12 / e.zoom;
    const cy = e.y + h / 2 + e.despiece * .12;
    cam.position.set(0, cy + Math.sin(e.alto) * dist, Math.cos(e.alto) * dist);
    cam.lookAt(0, cy, 0);
    R.render(esc, cam);
    if (V.alPintar) V.alPintar();
  };
  const tic = t => { if (!activo) return; raf = requestAnimationFrame(tic); if (V.cadaCuadro) V.cadaCuadro(t); V.pintar(); };
  V.andar = si => { if (si === activo) return; activo = si; cancelAnimationFrame(raf); if (si) raf = requestAnimationFrame(tic); };
  new ResizeObserver(() => { V.medir(); V.pintar(); }).observe(canvas);
  V.medir();

  /* arrastrar para girar: horizontal gira, vertical deja pasar el scroll */
  let ax = null;
  canvas.addEventListener('pointerdown', ev => { ax = ev.clientX; V.arrastre = 0; canvas.setPointerCapture && canvas.setPointerCapture(ev.pointerId); });
  canvas.addEventListener('pointermove', ev => { if (ax === null) return; const dx = ev.clientX - ax; ax = ev.clientX; V.giroManual = (V.giroManual || 0) + dx * .008; V.arrastre += Math.abs(dx); if (!activo) { V.e.giro += dx * .008; V.pintar(); } });
  const soltar = () => { ax = null; };
  canvas.addEventListener('pointerup', soltar); canvas.addEventListener('pointercancel', soltar);
};

/* ---------- historia del héroe ---------- */
J.heroe = () => {
  const sec = $('#inicio'), canvas = $('#escenario'); if (!sec || !canvas) return;
  const HEROE = 'mueble-tv-coronado';
  const V = new J.Visor(canvas, {corr:(w, h) => w > 900 ? {x:.19, y:0} : {x:0, y:-.2}, sombra:.42});
    V.poner(HEROE, 'roble');
  sec.classList.remove('sin3d');

  /* polvo de taller: motas que flotan en la luz */
  const N = J.movil ? 120 : 260, pos = new Float32Array(N * 3), vel = [];
  for (let i = 0; i < N; i++) { pos[i*3] = (Math.random() - .5) * 7; pos[i*3+1] = Math.random() * 3.2; pos[i*3+2] = (Math.random() - .5) * 5; vel.push(.03 + Math.random() * .09); }
  const gp = new T.BufferGeometry(); gp.setAttribute('position', new T.BufferAttribute(pos, 3));
  const polvo = new T.Points(gp, new T.PointsMaterial({color:0xF7B866, size:.022, transparent:true, opacity:.75, blending:T.AdditiveBlending, depthWrite:false}));
  V.esc.add(polvo);

  /* rótulos del despiece */
  const capa = $('#rotulos'), lineas = $('#lineas');
  const rot = V.modelo.userData.parts.filter(m => m.userData.rot).map((m, i) => {
    const el = document.createElement('div'); el.className = 'rotulo'; el.innerHTML = `<i></i><span>${J.esc(m.userData.rot)}</span>`; capa.appendChild(el);
    const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line'); lineas.appendChild(ln);
    return {m, el, ln, i};
  });
  const cotas = V.puntosCota.map(c => { const el = document.createElement('div'); el.className = 'cota'; el.textContent = c.t; capa.appendChild(el); return {c, el}; });

  const paneles = $$('.panel', sec), puntos = $$('.riel i', sec);
  const meta = {d:0, b:0, g:0, a:.24, z:.74};
  let p = 0, t0 = null, fase = -1;
  const leer = () => {
    const r = sec.getBoundingClientRect(), largo = r.height - innerHeight;
    p = largo > 0 ? clamp(-r.top / largo) : 0;
    meta.d = suave(.1, .32, p) * (1 - suave(.42, .5, p));
    meta.b = suave(.53, .61, p) * (1 - suave(.74, .82, p));
    meta.g = 1.15 * suave(.08, .44, p) + (Math.PI * 2 - 1.15) * suave(.48, .86, p); meta.a = lerp(.22, .46, meta.d) + meta.b * .12;
    meta.z = (innerWidth > 900 ? .74 : .86) + suave(.08, .3, p) * .1;
    const f = p < .1 ? 0 : p < .48 ? 1 : p < .8 ? 2 : 3;
    sec.classList.toggle('bajando', p > .04);
    if (f !== fase) { fase = f; paneles.forEach((el, i) => el.classList.toggle('on', i === f)); puntos.forEach((el, i) => el.classList.toggle('on', i === f)); }
  };
  addEventListener('scroll', leer, {passive:true}); addEventListener('resize', leer); leer();

  V.cadaCuadro = t => {
    const e = V.e;
    if (t0 === null) { t0 = t; if (!J.calma) e.intro = 0; }
    const s = (t - t0) / 1000;
    if (e.intro < 1) e.intro = clamp(s / 2.1);
    const k = J.calma ? 1 : .09;
    e.despiece = lerp(e.despiece, meta.d, k); e.plano = lerp(e.plano, meta.b, k); e.alto = lerp(e.alto, meta.a, k); e.zoom = lerp(e.zoom, meta.z, k);
    const libre = J.calma ? 0 : Math.sin(s * .32) * .34 * (1 - suave(.05, .2, p));
    e.giro = lerp(e.giro, -.55 + meta.g + libre + (V.giroManual || 0), k);
    const a = gp.attributes.position;
    for (let i = 0; i < N; i++) { let y = a.getY(i) + vel[i] * .016; if (y > 3.2) y = 0; a.setY(i, y); a.setX(i, a.getX(i) + Math.sin(s * .4 + i) * .0006); }
    a.needsUpdate = true; polvo.material.opacity = .75 * (1 - e.plano);
  };
  V.alPintar = () => {
    const e = V.e, ver = e.despiece > .55 && e.plano < .25;
    const r = canvas.getBoundingClientRect(), ancho = r.width, angosto = ancho < 760;
    const puestos = [];
    rot.forEach(o => {
      const q = V.proyectar(o.m.position, V.modelo), on = ver && e.despiece > .55 + o.i * .05 && (!angosto || o.i < 3);
      o.el.classList.toggle('on', on); o.ln.style.opacity = on ? .9 : 0;
      if (!on) return;
      const aw = o.w || (o.w = o.el.offsetWidth) || 200; let x0, ly, der;
      if (angosto) { x0 = 14; ly = 86 + puestos.length * 34; der = true; }
      else {
        const minX = ancho > 900 ? ancho * .45 : 10, maxX = ancho - aw - 28;
        der = q.x > ancho * (ancho > 900 ? .7 : .5);
        if (der && q.x + 46 > maxX) der = false; else if (!der && q.x - 46 - aw < minX) der = true;
        x0 = clamp(der ? q.x + 46 : q.x - 46 - aw, minX, Math.max(minX, maxX));
        ly = clamp(q.y - 30 - (o.i % 2) * 16, 70, r.height - 30);
        const choca = () => puestos.some(c => x0 < c.x1 + 8 && x0 + aw > c.x0 - 8 && Math.abs(ly - c.y) < 30);
        for (let n = 0; n < 8 && choca(); n++) ly += 30;
      }
      puestos.push({x0, x1: x0 + aw, y: ly});
      const lx = der ? x0 : x0 + aw;
      o.el.style.transform = `translate(${x0}px,${ly}px)`; o.el.classList.toggle('izq', !der);
      o.ln.setAttribute('x1', q.x); o.ln.setAttribute('y1', q.y); o.ln.setAttribute('x2', lx); o.ln.setAttribute('y2', ly);
    });
    cotas.forEach(o => {
      const q = V.proyectar(o.c.p, V.pivote); o.el.classList.toggle('on', e.plano > .6);
      o.el.style.transform = `translate(${q.x}px,${q.y}px) translate(-50%,-50%)`;
    });
  };
  J.vigilar(sec, si => V.andar(si));

  /* acabados del panel final */
  const fin = $('#heroAcabados');
  if (fin) {
    const pr = J.byId[HEROE];
    fin.innerHTML = pr.mats.map((m, i) => `<button type="button" class="muestra${i ? '' : ' on'}" data-fin="${m}" style="--c:${J.MAD[m].c}" aria-label="${J.MAD[m].n}"><span>${J.MAD[m].n}</span></button>`).join('');
    fin.addEventListener('click', ev => {
      const b = ev.target.closest('[data-fin]'); if (!b) return;
      $$('.muestra', fin).forEach(x => x.classList.toggle('on', x === b)); V.acabado(b.dataset.fin); J.heroFin = b.dataset.fin;
      canvas.classList.remove('pulso'); void canvas.offsetWidth; canvas.classList.add('pulso');
    });
  }
  J.heroFin = 'roble';
};
})();
