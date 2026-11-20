/* Joiwood prototipo 2: muebles paramétricos armados tablero por tablero (medidas en cm).
   Cada pieza guarda su posición armada y su desplazamiento de despiece, así el mismo modelo sirve
   para el héroe, la ficha, el cuarto y la foto. */
(() => {
'use strict';
const J = window.JW; if (!window.THREE) return;
const T = THREE;

/* ---------- texturas hechas en canvas ---------- */
const texs = {};
function rnd(seed){ let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function sombra(hex, k){ const c = new T.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); }
function texMadera(hex){
  if (texs['m'+hex]) return texs['m'+hex];
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), r = rnd(hex.charCodeAt(1) * 977 + hex.charCodeAt(3));
  g.fillStyle = hex; g.fillRect(0, 0, S, S);
  const claro = new T.Color(hex).getHSL({h:0,s:0,l:0}).l > .8;
  for (let i = 0; i < 150; i++) {
    const y = r() * S, amp = 1 + r() * 5, per = (1 + Math.floor(r() * 3)) * 2 * Math.PI / S, fase = r() * 6.28;
    g.strokeStyle = sombra(hex, r() > .5 ? .72 + r() * .2 : 1.04 + r() * .1);
    g.globalAlpha = (claro ? .05 : .12) + r() * (claro ? .08 : .2); g.lineWidth = .6 + r() * 2.2;
    g.beginPath();
    for (let x = 0; x <= S; x += 8) { const yy = y + Math.sin(x * per + fase) * amp; x ? g.lineTo(x, yy) : g.moveTo(x, yy); }
    g.stroke();
  }
  g.globalAlpha = 1;
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.encoding = T.sRGBEncoding; t.anisotropy = 4;
  return texs['m'+hex] = t;
}
function texTela(hex){
  if (texs['t'+hex]) return texs['t'+hex];
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), r = rnd(hex.charCodeAt(2) * 613 + 7);
  g.fillStyle = hex; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = sombra(hex, r() > .5 ? .8 : 1.12); g.globalAlpha = .1 + r() * .16;
    const h = r() > .5; g.fillRect(r() * S, r() * S, h ? 5 + r() * 9 : 1, h ? 1 : 5 + r() * 9);
  }
  g.globalAlpha = 1;
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(5, 5); t.encoding = T.sRGBEncoding;
  return texs['t'+hex] = t;
}

/* ---------- materiales ---------- */
const mats = {};
function crearMat(tipo, fin){
  const M = J.MAD;
  if (tipo === 'madera') { const f = M[fin] && M[fin].t === 'madera' ? fin : 'roble'; return new T.MeshStandardMaterial({map: texMadera(M[f].c), roughness:.6, metalness:0}); }
  if (tipo === 'tela') { const f = M[fin] && M[fin].t === 'tela' ? fin : 'arena'; return new T.MeshStandardMaterial({map: texTela(M[f].c), roughness:.95, metalness:0}); }
  if (tipo === 'fondo') { const f = M[fin] && M[fin].t === 'madera' ? fin : 'roble'; return new T.MeshStandardMaterial({color: new T.Color(M[f].c).lerp(new T.Color(0xF2E9DC), .45), roughness:.8}); }
  if (tipo === 'metal') return new T.MeshStandardMaterial({color:0x1F1C1A, roughness:.42, metalness:.55});
  if (tipo === 'ceramica') return new T.MeshStandardMaterial({color:0xF8F6F1, roughness:.22});
  return new T.MeshStandardMaterial({color:0xF3EEE5, roughness:.92}); /* colchon */
}
J.material = (tipo, fin) => { const k = tipo + '|' + (fin || ''); return mats[k] || (mats[k] = crearMat(tipo, fin)); };

/* ---------- geometrías ---------- */
const ESC = 1 / .9; /* una repetición de veta cada 90 cm */
function caja(w, h, d){
  const g = new T.BoxGeometry(w, h, d), uv = g.attributes.uv;
  /* caras: +x -x (u=d, v=h), +y -y (u=w, v=d), +z -z (u=w, v=h). La veta corre a lo largo del lado mayor. */
  const dims = [[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
  for (let f = 0; f < 6; f++) for (let i = f*4; i < f*4+4; i++) {
    const u = uv.getX(i), v = uv.getY(i), [a, b] = dims[f];
    if (b > a) uv.setXY(i, v * b * ESC, u * a * ESC); else uv.setXY(i, u * a * ESC, v * b * ESC);
  }
  return g;
}
function redonda(w, h, d, r){
  r = Math.min(r, w/2 - .001, h/2 - .001, d/2 - .001);
  const s = new T.Shape(), x = -w/2, y = -h/2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new T.ExtrudeGeometry(s, {depth: d - 2*r, bevelEnabled:true, bevelThickness:r, bevelSize:r, bevelOffset:-r, bevelSegments:4, curveSegments:6});
  g.center(); return g;
}

/* ---------- despieces: [nombre, tipo, [ancho,alto,fondo], [x,y,z], [despiece x,y,z], rótulo, forma, giro x] ---------- */
const Tb = 1.6;
function par(n, tipo, tam, pos, des, extra){ /* espejo en x */
  return [[n + ' izquierdo', tipo, tam, [-pos[0], pos[1], pos[2]], [-des[0], des[1], des[2]], ...(extra || [])],
          [n + ' derecho', tipo, tam, pos, des]];
}
function patas(tipo, tam, x, z, des){
  return [[-x,-z],[x,-z],[-x,z],[x,z]].map(([px, pz], i) => ['Pata', tipo, tam, [px, tam[1]/2, pz], [Math.sign(px)*des[0], des[1], Math.sign(pz)*des[2]], i === 3 && des[3] ? des[3] : null]);
}
const DEF = {
  'mueble-tv-coronado': () => [
    ['Tapa','madera',[180,Tb,38.4],[0,51.2,-.8],[0,26,0],'Tablero hidrófugo de 16 mm'],
    ['Base','madera',[180,Tb,38.4],[0,12.8,-.8],[0,-10,0]],
    ...par('Lateral','madera',[Tb,36.8,38.4],[89.2,32,-.8],[34,0,0],['Cantos sellados contra la humedad']),
    ...par('Divisor','madera',[Tb,36.8,36.8],[30,32,-1.6],[0,11,0]),
    ['Repisa','madera',[58.4,Tb,34],[0,32,-2],[0,0,34]],
    ['Fondo','fondo',[176.8,36.8,.6],[0,32,-19.7],[0,0,-36],'Fondo con paso de cables'],
    ['Puerta izquierda','madera',[59.6,36.4,Tb],[-60,32,19.2],[-12,0,46],'Puertas con bisagra regulable'],
    ['Puerta derecha','madera',[59.6,36.4,Tb],[60,32,19.2],[12,0,46]],
    ['Jaladera','metal',[1.2,14,1.6],[-33.4,32,20.8],[-12,0,46]],
    ['Jaladera','metal',[1.2,14,1.6],[33.4,32,20.8],[12,0,46]],
    ...patas('metal',[3,12,3],82,13,[0,-26,0,'Patas de metal con pintura en polvo'])
  ],
  'bufetera-volcan': () => [
    ['Tapa','madera',[160,Tb,40.4],[0,77.2,-.8],[0,28,0],'Tablero hidrófugo de 16 mm'],
    ['Base','madera',[160,Tb,40.4],[0,14.8,-.8],[0,-8,0]],
    ...par('Lateral','madera',[Tb,60.8,40.4],[79.2,46,-.8],[30,0,0]),
    ['Divisor','madera',[Tb,60.8,38.8],[0,46,-1.6],[0,14,0]],
    ['Fondo','fondo',[156.8,60.8,.6],[0,46,-20.7],[0,0,-34]],
    ...par('Repisa','madera',[77,Tb,36],[39.6,46,-2],[0,0,0]),
    ...[-60,-20,20,60].map((x, i) => ['Puerta','madera',[39.6,60.4,Tb],[x,46,20.2],[x*.3,0,44], i === 3 ? 'Cuatro puertas' : null]),
    ...[-42,-38,38,42].map(x => ['Jaladera','metal',[1.2,16,1.6],[x,56,21.8],[(x < 0 ? (x < -40 ? -60 : -20) : (x > 40 ? 60 : 20))*.3,0,44]]),
    ...patas('madera',[4,14,4],72,14,[0,-24,0,'Base de madera maciza'])
  ],
  'mesa-noche-pedasi': () => [
    ['Tapa','madera',[50,Tb,38.4],[0,57.2,-.8],[0,20,0]],
    ['Base','madera',[50,Tb,38.4],[0,12.8,-.8],[0,-8,0]],
    ...par('Lateral','madera',[Tb,42.8,38.4],[24.2,35,-.8],[18,0,0]),
    ['Fondo','fondo',[46.8,42.8,.6],[0,35,-19.7],[0,0,-22]],
    ['Repisa','madera',[46.8,Tb,36],[0,36,-2],[0,0,0]],
    ['Frente de gaveta','madera',[49.6,19.2,Tb],[0,46.8,19.2],[0,0,36],'Gaveta con riel de extensión'],
    ['Caja de gaveta','fondo',[43,12,32],[0,45.5,1.5],[0,0,22]],
    ...patas('madera',[3,12,3],21,15,[0,-18,0])
  ],
  'closet-cerro-azul': () => [
    ['Tapa','madera',[86.8,Tb,53.4],[0,189.2,-.8],[0,30,0]],
    ['Base','madera',[86.8,Tb,53.4],[0,8.8,-.8],[0,0,0]],
    ...par('Lateral','madera',[Tb,190,53.4],[44.2,95,-.8],[30,0,0],['Tablero hidrófugo de 16 mm']),
    ['Zócalo','madera',[86.8,8,Tb],[0,4,24],[0,-6,16]],
    ['Fondo','fondo',[86.8,180,.6],[0,99,-27.2],[0,0,-36]],
    ['Repisa','madera',[86.8,Tb,50],[0,158,-2],[0,0,0],'Dos repisas'],
    ['Repisa','madera',[86.8,Tb,50],[0,40,-2],[0,0,0]],
    ['Barra','metal',[86.8,2.4,2.4],[0,142,-2],[0,0,0],'Barra para colgar','cil'],
    ['Puerta izquierda','madera',[44.6,181,Tb],[-22.5,99.5,26.7],[-26,0,46]],
    ['Puerta derecha','madera',[44.6,181,Tb],[22.5,99.5,26.7],[26,0,46],'Se ancla a la pared'],
    ['Jaladera','metal',[1.2,22,1.6],[-3.6,100,28.3],[-26,0,46]],
    ['Jaladera','metal',[1.2,22,1.6],[3.6,100,28.3],[26,0,46]]
  ],
  'mueble-bano-venus-60': () => [
    ...par('Lateral','madera',[Tb,40,44],[29.2,20,-1],[22,0,0],['Aglomerado hidrófugo']),
    ['Base','madera',[56.8,Tb,44],[0,.8,-1],[0,-10,0]],
    ['Travesaño','madera',[56.8,8,Tb],[0,36,-22.2],[0,0,-14]],
    ['Fondo','fondo',[56.8,30,.6],[0,17,-22.7],[0,0,-24]],
    ['Frente de gaveta','madera',[59.6,19.4,Tb],[0,10.1,21.8],[0,0,38],'Dos gavetas'],
    ['Frente de gaveta','madera',[59.6,19.4,Tb],[0,29.9,21.8],[0,0,26]],
    ['Caja de gaveta','fondo',[52,12,36],[0,9,2],[0,0,26]],
    ['Caja de gaveta','fondo',[52,12,36],[0,29,2],[0,0,14]],
    ['Lavamanos','ceramica',[60,2,46],[0,41,0],[0,24,0],'Lavamanos de cerámica'],
    ['Lavamanos','ceramica',[60,6,2],[0,45,22],[0,24,0]],
    ['Lavamanos','ceramica',[60,6,9],[0,45,-18.5],[0,24,0]],
    ['Lavamanos','ceramica',[2,6,35],[-29,45,3.5],[0,24,0]],
    ['Lavamanos','ceramica',[2,6,35],[29,45,3.5],[0,24,0]]
  ],
  'mesa-centro-taboga': () => [
    ['Tapa','madera',[110,2.5,60],[0,40.75,0],[0,20,0],'Cubierta con chapa de roble'],
    ['Repisa','madera',[98,Tb,48],[0,12,0],[0,0,0],'Repisa para revistas'],
    ...patas('madera',[5,39.5,5],50,25,[16,-6,12])
  ],
  'comedor-boquete': () => [
    ['Tapa','madera',[180,2.5,90],[0,74.75,0],[0,26,0],'Cubierta de 25 mm'],
    ['Faldón','madera',[153,8,2],[0,69.5,38],[0,0,16]],
    ['Faldón','madera',[153,8,2],[0,69.5,-38],[0,0,-16]],
    ['Faldón','madera',[2,8,69],[80,69.5,0],[16,0,0]],
    ['Faldón','madera',[2,8,69],[-80,69.5,0],[-16,0,0]],
    ...patas('madera',[7,73.5,7],80,38,[18,-10,14,'Patas de madera maciza'])
  ],
  'escritorio-chame': () => [
    ['Tapa','madera',[120,2.5,55],[0,74.75,0],[0,24,0],'Cubierta con chapa de roble'],
    ['Gaveta','madera',[46,8,40],[-30,69.5,2],[0,0,34],'Gaveta delgada'],
    ['Trasero','madera',[106,22,Tb],[0,60,-24],[0,0,-22]],
    ...patas('metal',[3,73.5,3],56,24,[18,0,0,'Patas de metal negro']),
    ['Travesaño','metal',[3,3,45],[-56,1.5,0],[-18,0,0]],
    ['Travesaño','metal',[3,3,45],[56,1.5,0],[18,0,0]]
  ],
  'cama-pedasi': () => [
    ['Cabecera','tela',[166,78,9],[0,71,-103],[0,0,-40],'Cabecera tapizada','red:3'],
    ...par('Larguero','madera',[4,24,203],[81,24,1.5],[26,0,0],['Base con chapa de roble']),
    ['Piecero','madera',[166,24,4],[0,24,105],[0,0,26]],
    ['Travesaño','madera',[158,24,4],[0,24,-98],[0,0,-14]],
    ...[-84,-56,-28,0,28,56,84].map((z, i) => ['Tablilla','fondo',[158,2,9],[0,34,z+1.5],[0,18,0], i === 3 ? 'Tablillas de pino' : null]),
    ['Colchón','colchon',[152,24,203],[0,47,1.5],[0,56,0],'Colchón queen no incluido','red:6'],
    ['Almohada','colchon',[62,11,38],[-37,64,-72],[0,74,0],null,'red:5'],
    ['Almohada','colchon',[62,11,38],[37,64,-72],[0,74,0],null,'red:5'],
    ...patas('madera',[5,12,5],78,98,[0,-14,0])
  ],
  'sofa-bocas': () => [
    ['Base','tela',[214,20,92],[0,23,0],[0,0,0],'Estructura de pino tratado','red:3'],
    ['Brazo izquierdo','tela',[18,34,92],[-98,50,0],[-34,0,0],null,'red:4'],
    ['Brazo derecho','tela',[18,34,92],[98,50,0],[34,0,0],null,'red:4'],
    ['Respaldo','tela',[178,44,18],[0,55,-37],[0,0,-34],null,'red:4'],
    ...[-59.4,0,59.4].map((x, i) => ['Cojín de asiento','tela',[58.6,15,68],[x,40.5,9],[x*.25,28,14], i === 2 ? 'Cojines sueltos' : null,'red:5']),
    ...[-59.4,0,59.4].map((x, i) => ['Cojín de respaldo','tela',[58.6,34,15],[x,64,-21],[x*.25,52,-4], i === 0 ? 'Tela tipo lino' : null,'red:5',-.16]),
    ...patas('madera',[5,13,5],98,38,[0,-16,0,'Patas de madera maciza'])
  ]
};

/* ---------- construir ---------- */
J.build = (id, fin, o) => {
  o = o || {}; const def = DEF[id]; if (!def) return null;
  const p = J.byId[id], g = new T.Group(), parts = [], propios = {};
  const mat = tipo => { if (!o.propios) return J.material(tipo, fin); const k = tipo; return propios[k] || (propios[k] = crearMat(tipo, fin)); };
  def().forEach(d => {
    const [nombre, tipo, tam, pos, des, rot, forma, giro] = d;
    const [w, h, dd] = tam.map(v => v / 100);
    let geo;
    if (forma && forma.startsWith('red')) geo = redonda(w, h, dd, +forma.split(':')[1] / 100);
    else if (forma === 'cil') { geo = new T.CylinderGeometry(h/2, h/2, w, 16); geo.rotateZ(Math.PI / 2); }
    else geo = caja(w, h, dd);
    const m = new T.Mesh(geo, mat(tipo));
    m.castShadow = true; m.receiveShadow = true;
    m.position.set(pos[0]/100, pos[1]/100, pos[2]/100);
    if (giro) m.rotation.x = giro;
    m.userData = {nombre, tipo, base: m.position.clone(), des: new T.Vector3(des[0]/100, des[1]/100, des[2]/100), rot: rot || null, azar: new T.Vector3(Math.random()-.5, Math.random()*.6+.2, Math.random()-.5)};
    if (o.aristas) {
      const e = new T.LineSegments(new T.EdgesGeometry(geo, 28), o.aristas);
      e.visible = false; m.add(e); m.userData.aristas = e;
    }
    g.add(m); parts.push(m);
  });
  g.userData = {id, fin: fin || p.mats[0], parts, propios, tam:{w:p.dim.a/100, h:p.dim.h/100, d:p.dim.f/100}, colgado:(p.colgado || 0)/100};
  return g;
};
J.despiece = (g, f) => { g.userData.parts.forEach(m => { const u = m.userData; m.position.set(u.base.x + u.des.x*f, u.base.y + u.des.y*f, u.base.z + u.des.z*f); }); };
J.acabado = (g, fin) => {
  const u = g.userData; u.fin = fin;
  if (Object.keys(u.propios).length) { /* materiales propios: se cambia solo la textura */
    ['madera','tela','fondo'].forEach(t => { const m = u.propios[t]; if (m) { const n = crearMat(t, fin); m.map = n.map; m.color.copy(n.color); m.needsUpdate = true; n.dispose(); } });
  } else u.parts.forEach(m => { const t = m.userData.tipo; if (t === 'madera' || t === 'tela' || t === 'fondo') m.material = J.material(t, fin); });
};
J.tieneModelo = id => !!DEF[id];
})();
