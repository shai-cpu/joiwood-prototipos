/* Joiwood prototipo 2: "Pruébalo en tu foto". La persona sube una foto de su cuarto y el mueble 3D se
   dibuja encima con sombra, a escala aproximada. La foto se queda en el navegador: no se sube a ningún lado. */
(() => {
'use strict';
const J = window.JW; if (!J.webgl) return;
const T = THREE, { $, $$, clamp } = J;

J.foto = () => {
  const sec = $('#foto'), canvas = $('#fotoLienzo'), img = $('#fotoImg'), marco = $('#fotoMarco'); if (!sec || !canvas) return;
  const R = new T.WebGLRenderer({canvas, antialias:true, alpha:true});
  R.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap; R.outputEncoding = T.sRGBEncoding;
  const esc = new T.Scene(), cam = new T.PerspectiveCamera(50, 1, .05, 60);
  const amb = new T.HemisphereLight(0xFFFFFF, 0x8A7A6A, .95); esc.add(amb);
  const sol = new T.DirectionalLight(0xFFFFFF, .95); sol.castShadow = true; sol.shadow.mapSize.set(1024, 1024);
  Object.assign(sol.shadow.camera, {left:-3, right:3, top:3, bottom:-3, near:.5, far:16}); sol.shadow.bias = -.0006; sol.shadow.radius = 7; esc.add(sol); esc.add(sol.target);
  const piso = new T.Mesh(new T.PlaneGeometry(60, 60), new T.ShadowMaterial({opacity:.34})); piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true; esc.add(piso);

  /* e: estado de la toma. hz = altura del horizonte en la foto (0 arriba, 1 abajo) */
  const MUESTRAS = {
    sala:{src:'img/cuarto-sala.jpg', n:'Sala vacía', hz:.47, tam:1.7, x:.15, z:-3.4, giro:0, luz:-70, sombra:.3, brillo:1.02},
    recamara:{src:'img/cuarto-recamara.jpg', n:'Recámara vacía', hz:.4, tam:1.3, x:-.3, z:-3.7, giro:34, luz:60, sombra:.34, brillo:.96}
  };
  const e = {id:'mueble-tv-coronado', fin:'roble', hz:.47, tam:1.7, x:0, z:-3.4, giro:0, luz:-70, sombra:.3, brillo:1, propia:false};
  let g = null, W = 1, H = 1;

  function modelo(){
    if (g) { esc.remove(g); g.traverse(m => m.geometry && m.geometry.dispose()); }
    const p = J.byId[e.id]; if (!p.mats.includes(e.fin)) e.fin = p.mats[0];
    g = J.build(e.id, e.fin, {}); esc.add(g);
    $('#fotoAcabados').innerHTML = p.mats.map(m => `<button type="button" class="pt${m === e.fin ? ' on' : ''}" data-fin="${m}" style="--c:${J.MAD[m].c}" aria-label="${J.MAD[m].n}" title="${J.MAD[m].n}"></button>`).join('');
    $('#fotoNombre').textContent = p.n; $('#fotoPrecio').textContent = J.usd(p.price);
    $('#fotoMedidas').textContent = `${p.dim.a} × ${p.dim.f} × ${p.dim.h} cm`;
    $$('#fotoPiezas [data-pz]').forEach(b => b.classList.toggle('on', b.dataset.pz === e.id));
  }
  function medir(){ const r = canvas.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height); R.setSize(W, H, false); cam.aspect = W / H; }
  function pintar(){
    if (!g) return;
    /* lente parecido al de un teléfono: unos 66° en el lado largo */
    const t33 = Math.tan(33 * Math.PI / 180), tv = W >= H ? t33 / cam.aspect : t33;
    cam.fov = 2 * Math.atan(tv) * 180 / Math.PI; cam.updateProjectionMatrix();
    const alto = 1.5 / e.tam, cabeceo = Math.atan((1 - 2 * e.hz) * tv);
    cam.position.set(0, alto, 0); cam.rotation.set(-cabeceo, 0, 0, 'YXZ');
    g.position.set(e.x, g.userData.colgado, e.z); g.rotation.y = e.giro * Math.PI / 180;
    const a = e.luz * Math.PI / 180; sol.position.set(e.x + Math.sin(a) * 4, 5, e.z + Math.cos(a) * 4 + 1.2); sol.target.position.set(e.x, 0, e.z);
    piso.material.opacity = e.sombra; amb.intensity = .6 * e.brillo; sol.intensity = .52 * e.brillo;
    R.render(esc, cam);
  }
  new ResizeObserver(() => { medir(); pintar(); }).observe(canvas);

  /* tono de la luz según la foto */
  function tono(){
    try {
      const c = document.createElement('canvas'); c.width = c.height = 16; const x = c.getContext('2d'); x.drawImage(img, 0, 0, 16, 16);
      const d = x.getImageData(0, 0, 16, 16).data; let r = 0, gg = 0, b = 0;
      for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i+1]; b += d[i+2]; }
      const n = d.length / 4, col = new T.Color(r / n / 255, gg / n / 255, b / n / 255), hsl = col.getHSL({h:0, s:0, l:0});
      amb.color.setHSL(hsl.h, Math.min(.35, hsl.s), .9); amb.groundColor.setHSL(hsl.h, Math.min(.4, hsl.s), .45);
    } catch (err) { /* sin tono: se queda la luz neutra */ }
  }
  function barrido(){ if (J.calma) return; marco.classList.remove('barre'); void marco.offsetWidth; marco.classList.add('barre'); }
  function ponerFoto(src, datos){
    img.onload = () => { marco.style.aspectRatio = img.naturalWidth + ' / ' + img.naturalHeight; marco.style.maxWidth = 'calc(82vh * ' + (img.naturalWidth / img.naturalHeight).toFixed(4) + ')'; if (datos) Object.assign(e, datos); controles(); tono(); requestAnimationFrame(() => { medir(); pintar(); barrido(); }); };
    img.src = src;
  }

  /* render con IA: en el prototipo es una muestra ya hecha para los dos cuartos de ejemplo */
  const RENDERS = {sala:{src:'img/render-sala.jpg', id:'mueble-tv-coronado', fin:'roble'}, recamara:{src:'img/render-recamara.jpg', id:'cama-pedasi', fin:'arena'}};
  const capa = $('#fotoRender'), corte = $('#fotoCorte'), btnR = $('#fotoRenderBtn'), notaR = $('#fotoRenderNota');
  const NOTA0 = notaR.textContent; let muestra = 'sala', enRender = false;
  const ponerCorte = v => capa.style.setProperty('--corte', v + '%');
  corte.addEventListener('input', () => ponerCorte(corte.value));
  function salirRender(){ if (!enRender) return; enRender = false; capa.hidden = true; marco.classList.remove('enRender'); btnR.textContent = 'Ver render con IA'; btnR.setAttribute('aria-pressed', 'false'); notaR.textContent = NOTA0; }
  function entrarRender(){
    const r = RENDERS[muestra];
    if (!r) { notaR.textContent = 'Con tu foto, el render lo hace un servicio de IA en la tienda real: tarda unos segundos y cobra por imagen. En este prototipo hay muestra con los dos cuartos de ejemplo.'; return; }
    const {src, n, ...d} = MUESTRAS[muestra]; Object.assign(e, d, {id:r.id, fin:r.fin}); modelo(); controles(); pintar();
    $('#fotoRenderImg').src = r.src; capa.hidden = false; marco.classList.add('enRender'); enRender = true;
    btnR.textContent = 'Volver al modelo 3D'; btnR.setAttribute('aria-pressed', 'true');
    notaR.textContent = 'Arrastra la línea para comparar. Es una imagen de muestra hecha con IA a partir del modelo 3D.';
    barrido();
    if (J.calma) { corte.value = 50; ponerCorte(50); return; }
    const t0 = performance.now(); const paso = t => { const k = Math.min(1, (t - t0) / 900), v = 100 - 50 * (1 - Math.pow(1 - k, 3)); corte.value = v; ponerCorte(v); if (k < 1 && enRender) requestAnimationFrame(paso); };
    corte.value = 100; ponerCorte(100); requestAnimationFrame(paso); setTimeout(() => { if (enRender && +corte.value > 51) { corte.value = 50; ponerCorte(50); } }, 1400);
  }
  btnR.addEventListener('click', () => enRender ? salirRender() : entrarRender());

  /* controles */
  const C = [['Horizonte','hz',.2,.75,.005],['Tamaño','tam',.6,3.2,.02],['Girar','giro',-180,180,1],['Luz desde','luz',-180,180,2],['Sombra','sombra',0,.7,.01],['Brillo','brillo',.5,1.6,.01]];
  $('#fotoControles').innerHTML = C.map(([n, k, a, b, s]) => `<label class="desl" for="foto_${k}"><span>${n}</span><input type="range" id="foto_${k}" data-k="${k}" min="${a}" max="${b}" step="${s}"></label>`).join('');
  function controles(){ C.forEach(([, k]) => { $('#foto_' + k).value = e[k]; }); }
  $('#fotoControles').addEventListener('input', ev => { const k = ev.target.dataset.k; if (!k) return; salirRender(); e[k] = +ev.target.value; pintar(); });
  $('#fotoPiezas').innerHTML = J.P.map(p => `<button type="button" class="mini" data-pz="${p.id}" title="${J.esc(p.n)}"><img src="${p.img}" alt="${J.esc(p.corto)}" loading="lazy"></button>`).join('');
  $('#fotoPiezas').addEventListener('click', ev => { const b = ev.target.closest('[data-pz]'); if (!b) return; salirRender(); e.id = b.dataset.pz; modelo(); pintar(); barrido(); });
  $('#fotoAcabados').addEventListener('click', ev => { const b = ev.target.closest('[data-fin]'); if (!b) return; salirRender(); e.fin = b.dataset.fin; J.acabado(g, e.fin); $$('#fotoAcabados .pt').forEach(x => x.classList.toggle('on', x === b)); pintar(); });
  $('#fotoMuestras').innerHTML = Object.entries(MUESTRAS).map(([k, m], i) => `<button type="button" class="tab${i ? '' : ' on'}" data-m="${k}">${m.n}</button>`).join('');
  $('#fotoMuestras').addEventListener('click', ev => { const b = ev.target.closest('[data-m]'); if (!b) return; $$('#fotoMuestras .tab').forEach(x => x.classList.toggle('on', x === b)); salirRender(); muestra = b.dataset.m; const m = MUESTRAS[b.dataset.m], {src, n, ...d} = m; e.propia = false; marco.classList.remove('propia'); ponerFoto(src, d); });
  const leer = f => {
    if (!f || !/^image\//.test(f.type)) { J.toast('Ese archivo no es una foto. Sube un JPG o PNG.'); return; }
    salirRender(); muestra = null; const url = URL.createObjectURL(f); e.propia = true; marco.classList.add('propia'); $$('#fotoMuestras .tab').forEach(x => x.classList.remove('on'));
    ponerFoto(url, {hz:.45, tam:1.4, x:0, z:-3, giro:0, luz:-40, sombra:.3, brillo:1});
    J.toast('Listo. Arrastra el mueble al piso y ajusta el tamaño.');
  };
  $('#fotoArchivo').addEventListener('change', ev => leer(ev.target.files[0]));
  ['dragenter','dragover'].forEach(n => marco.addEventListener(n, ev => { ev.preventDefault(); marco.classList.add('suelta'); }));
  ['dragleave','drop'].forEach(n => marco.addEventListener(n, ev => { ev.preventDefault(); marco.classList.remove('suelta'); }));
  marco.addEventListener('drop', ev => leer(ev.dataTransfer.files[0]));

  /* arrastrar el mueble sobre el piso de la foto */
  const rayo = new T.Raycaster(), ndc = new T.Vector2(), plano = new T.Plane(new T.Vector3(0, 1, 0), 0), hit = new T.Vector3();
  let arr = null;
  const alPiso = ev => { const r = canvas.getBoundingClientRect(); ndc.set((ev.clientX - r.left) / r.width * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1); rayo.setFromCamera(ndc, cam); return rayo.ray.intersectPlane(plano, hit) && hit.z < -.4 && hit.z > -30; };
  canvas.addEventListener('pointerdown', ev => { canvas.setPointerCapture && canvas.setPointerCapture(ev.pointerId); if (alPiso(ev)) arr = {ox: e.x - hit.x, oz: e.z - hit.z}; else arr = null; if (arr && Math.hypot(arr.ox, arr.oz) > 1.6) arr = {ox:0, oz:0}; canvas.classList.add('agarra'); if (arr) mover(ev); });
  function mover(ev){ if (!arr || !alPiso(ev)) return; e.x = hit.x + arr.ox; e.z = Math.min(-.6, hit.z + arr.oz); pintar(); }
  canvas.addEventListener('pointermove', mover);
  const soltar = () => { arr = null; canvas.classList.remove('agarra'); };
  canvas.addEventListener('pointerup', soltar); canvas.addEventListener('pointercancel', soltar);
  const velo = $('#fotoVelo'), salir = $('#fotoSalir');
  if (J.movil && velo) { marco.classList.add('dormido'); velo.hidden = false; velo.onclick = () => { marco.classList.remove('dormido'); velo.hidden = true; salir.hidden = false; }; salir.onclick = () => { marco.classList.add('dormido'); velo.hidden = false; salir.hidden = true; }; }

  $('#fotoComprar').onclick = () => J.agregarAlCarrito(e.id, 1, e.fin);
  J.probarEnFoto = (id, fin) => { salirRender(); e.id = id; if (fin) e.fin = fin; modelo(); pintar(); barrido(); sec.scrollIntoView({behavior: J.calma ? 'auto' : 'smooth'}); };

  sec.classList.remove('sin3d');
  modelo(); const {src, n, ...d0} = MUESTRAS.sala; ponerFoto(src, d0);
};
})();
