/* Joiwood prototipo 2: datos de ejemplo, fechas y utilidades compartidas. */
window.JW = window.JW || {};
(() => {
'use strict';
const J = window.JW;
J.$ = (s, r=document) => r.querySelector(s);
J.$$ = (s, r=document) => [...r.querySelectorAll(s)];
J.movil = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
J.calma = matchMedia('(prefers-reduced-motion: reduce)').matches;
J.clamp = (v, a=0, b=1) => Math.min(b, Math.max(a, v));
J.lerp = (a, b, t) => a + (b - a) * t;
J.suave = (a, b, x) => { const t = J.clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
J.P1 = '../prototipo-1/';

J.logoSVG = dark => {
  const g = dark ? '#B9B2AB' : '#8A8582';
  return `<svg viewBox="0 0 268 64" role="img" aria-label="Joiwood International" xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="50" font-family="Montserrat, Arial Black, sans-serif" font-weight="900" font-size="56" fill="${g}" letter-spacing="-2">J</text>
    <circle cx="57" cy="31" r="17.5" fill="none" stroke="#F08A0C" stroke-width="9.5"/>
    <rect x="81" y="9" width="10" height="41" fill="${g}"/>
    <text x="98" y="38" font-family="Montserrat, Arial Black, sans-serif" font-weight="900" font-size="36" fill="${g}" letter-spacing="-1.2">WOOD</text>
    <text x="99.5" y="55" font-family="Montserrat, Arial, sans-serif" font-weight="700" font-size="13.4" fill="#F08A0C" letter-spacing=".2">INTERNATIONAL</text>
  </svg>`;
};

/* acabados: t = madera | tela */
J.MAD = {
  roble:{n:'Roble natural',c:'#C99B66',t:'madera'}, nogal:{n:'Nogal',c:'#6E4631',t:'madera'},
  blanco:{n:'Blanco nieve',c:'#F2EFEA',t:'madera'}, ceniza:{n:'Gris ceniza',c:'#9D978F',t:'madera'},
  arena:{n:'Lino arena',c:'#D8C9B2',t:'tela'}, piedra:{n:'Lino piedra',c:'#A7A096',t:'tela'},
  terracota:{n:'Terracota',c:'#B4633D',t:'tela'}
};
J.CATS = [{id:'sala',n:'Sala'},{id:'comedor',n:'Comedor'},{id:'recamara',n:'Recámara'},{id:'bano',n:'Baño'},{id:'oficina',n:'Oficina'}];

J.P = [
  {id:'sofa-bocas', n:'Sofá Bocas 3 puestos', corto:'Sofá Bocas', cat:'sala', price:849, was:null, dias:2, stock:6, flag:'Más vendido',
   img:'img/p-sofa.jpg', mats:['arena','piedra','terracota'], dim:{a:214,f:92,h:84}, peso:'48 kg',
   mat:'Estructura de pino tratado y aglomerado hidrófugo. Tapizado en tela tipo lino. Patas de madera maciza.',
   arm:'Llega casi armado: nuestro equipo coloca las patas y revisa todo en tu casa.', short:'Sofá bajo de líneas rectas, cojines sueltos y patas de roble.'},
  {id:'mueble-tv-coronado', n:'Mueble de TV Coronado 180', corto:'Mueble TV Coronado', cat:'sala', price:429, was:489, dias:2, stock:9, flag:'Oferta',
   img:'img/p-tv.jpg', mats:['roble','nogal','blanco'], dim:{a:180,f:40,h:52}, peso:'41 kg',
   mat:'Tablero aglomerado hidrófugo de 16 mm con chapa de roble. Patas de metal con pintura en polvo negra.',
   arm:'Lo armamos en tu casa en unos 40 minutos. Incluye anclaje a la pared.', short:'Para pantallas de hasta 75". Dos puertas y paso de cables.'},
  {id:'mesa-centro-taboga', n:'Mesa de centro Taboga', corto:'Mesa Taboga', cat:'sala', price:219, was:null, dias:2, stock:14, flag:null,
   img:'img/p-centro.jpg', mats:['roble','nogal'], dim:{a:110,f:60,h:42}, peso:'19 kg',
   mat:'Tablero aglomerado hidrófugo con chapa de roble y cantos redondeados.', arm:'Llega armada.', short:'Repisa abajo para revistas y canastas.'},
  {id:'comedor-boquete', n:'Mesa de comedor Boquete 6 puestos', corto:'Comedor Boquete', cat:'comedor', price:689, was:null, dias:3, stock:5, flag:'Nuevo',
   img:'img/p-comedor.jpg', mats:['roble','nogal'], dim:{a:180,f:90,h:76}, peso:'52 kg',
   mat:'Cubierta de tablero hidrófugo de 25 mm con chapa de roble. Patas de madera maciza.', arm:'La armamos en tu casa en unos 30 minutos.', short:'Seis puestos con espacio para codos.'},
  {id:'bufetera-volcan', n:'Bufetera Volcán 160', corto:'Bufetera Volcán', cat:'comedor', price:579, was:null, dias:3, stock:4, flag:null,
   img:'img/p-bufetera.jpg', mats:['nogal','roble'], dim:{a:160,f:42,h:78}, peso:'58 kg',
   mat:'Tablero aglomerado hidrófugo de 16 mm con chapa de nogal. Base de roble.', arm:'La armamos en tu casa en unos 50 minutos.', short:'Cuatro puertas y una repisa por cuerpo.'},
  {id:'cama-pedasi', n:'Cama Pedasí Queen', corto:'Cama Pedasí', cat:'recamara', price:749, was:null, dias:3, stock:7, flag:'Más vendido',
   img:'img/p-cama.jpg', mats:['arena','piedra'], dim:{a:166,f:215,h:110}, peso:'62 kg',
   mat:'Base de tablero hidrófugo con chapa de roble y tablillas de pino. Cabecera tapizada en tela tipo lino.', arm:'La armamos en tu casa en unos 45 minutos.', short:'Cabecera tapizada y base de roble. Colchón queen no incluido.'},
  {id:'mesa-noche-pedasi', n:'Mesa de noche Pedasí', corto:'Mesa de noche', cat:'recamara', price:149, was:null, dias:2, stock:22, flag:null,
   img:'img/p-noche.jpg', mats:['roble','nogal','blanco'], dim:{a:50,f:40,h:58}, peso:'12 kg',
   mat:'Tablero aglomerado hidrófugo con chapa de roble. Gaveta con riel de extensión.', arm:'Llega armada.', short:'Una gaveta y repisa abierta.'},
  {id:'closet-cerro-azul', n:'Clóset Cerro Azul 2 puertas', corto:'Clóset Cerro Azul', cat:'recamara', price:489, was:null, dias:4, stock:3, flag:'Últimas 3',
   img:'img/p-closet.jpg', mats:['roble','blanco','ceniza'], dim:{a:90,f:55,h:190}, peso:'74 kg',
   mat:'Tablero aglomerado hidrófugo de 16 mm. Barra para colgar, dos repisas y jaladeras de metal negro.', arm:'Lo armamos en tu casa en una hora y lo anclamos a la pared.', short:'Barra para colgar y dos repisas. Se ancla a la pared.'},
  {id:'mueble-bano-venus-60', n:'Mueble de baño Venus 60', corto:'Baño Venus 60', cat:'bano', price:199.99, was:null, dias:2, stock:12, flag:'Modelo Joiwood',
   img:'img/p-bano.jpg', mats:['roble','ceniza','blanco'], dim:{a:60,f:46,h:48}, peso:'21 kg', colgado:40,
   mat:'Aglomerado hidrófugo resistente a la humedad y al calor. Lavamanos de cerámica blanca. No incluye grifería.', arm:'La instalación en pared no está incluida. Te recomendamos un plomero.', short:'Suspendido, dos gavetas y lavamanos de cerámica.'},
  {id:'escritorio-chame', n:'Escritorio Chame 120', corto:'Escritorio Chame', cat:'oficina', price:259, was:299, dias:2, stock:10, flag:'Oferta',
   img:'img/p-escritorio.jpg', mats:['roble','nogal','blanco'], dim:{a:120,f:55,h:76}, peso:'22 kg',
   mat:'Cubierta de tablero hidrófugo con chapa de roble. Patas de metal negro.', arm:'Lo armamos en tu casa en unos 20 minutos.', short:'Gaveta delgada. Cabe una laptop y un monitor.'}
];
J.byId = Object.fromEntries(J.P.map(p => [p.id, p]));

J.ZONAS = [
  {id:'pty', n:'Ciudad de Panamá', c:'Ciudad de Panamá', costo:25, gratisDesde:500, min:2, max:3, arm:true},
  {id:'oeste', n:'Panamá Oeste', c:'Oeste', costo:35, gratisDesde:null, min:3, max:4, arm:true},
  {id:'colon', n:'Colón', c:'Colón', costo:45, gratisDesde:null, min:4, max:5, arm:true},
  {id:'centro', n:'Coclé, Herrera, Los Santos, Veraguas', c:'Provincias centrales', costo:65, gratisDesde:null, min:5, max:7, arm:false},
  {id:'occ', n:'Chiriquí y Bocas del Toro', c:'Chiriquí y Bocas', costo:85, gratisDesde:null, min:6, max:8, arm:false}
];

/* feriados nacionales de Panamá (cierre de 2026 y comienzo de 2027) */
const FERIADOS = new Set(['2026-11-03','2026-11-05','2026-11-10','2026-11-28','2026-12-08','2026-12-20','2026-12-25','2027-01-01','2027-01-09']);
const iso = d => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
J.sumarHabiles = (desde, n) => {
  const d = new Date(desde); let k = 0;
  while (k < n) { d.setDate(d.getDate()+1); const w = d.getDay(); if (w !== 0 && w !== 6 && !FERIADOS.has(iso(d))) k++; }
  return d;
};
const DIAS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
J.DIAS = DIAS; J.MESES = MESES;
J.fecha = d => `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
J.fechaCorta = d => `${DIAS[d.getDay()].slice(0,3)} ${d.getDate()} ${MESES[d.getMonth()].slice(0,3)}`;
/* dias: plazo del producto (2 = estándar). Pedido después de las 2:00 p.m. arranca el siguiente día hábil. */
J.ventana = (dias, zona) => {
  const now = new Date(); const corte = now.getHours() >= 14;
  const base = corte ? J.sumarHabiles(now, 1) : now;
  const extra = Math.max(0, dias - 2);
  return {base, sale: J.sumarHabiles(base, 1), a: J.sumarHabiles(base, zona.min + extra), b: J.sumarHabiles(base, zona.max + extra), corte};
};
J.usd = n => '$' + n.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
J.esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

J.store = {
  get(k, f){ try { const v = localStorage.getItem('jw2_' + k); return v ? JSON.parse(v) : f; } catch(e){ return f; } },
  set(k, v){ try { localStorage.setItem('jw2_' + k, JSON.stringify(v)); } catch(e){} }
};
J.cart = J.store.get('cart', []).filter(i => J.byId[i.id] && J.MAD[i.m]);
J.zonaId = J.store.get('zona', 'pty');
J.zona = () => J.ZONAS.find(z => z.id === J.zonaId) || J.ZONAS[0];

/* bus mínimo para que las secciones se avisen entre sí */
const oyentes = {};
J.on = (ev, fn) => { (oyentes[ev] = oyentes[ev] || []).push(fn); };
J.emit = (ev, d) => { (oyentes[ev] || []).forEach(fn => { try { fn(d); } catch(e){ console.error(e); } }); };

/* ¿se ve el elemento? Se revisa con su caja en cada scroll y cada 700 ms. Dentro del marco de un artifact
   IntersectionObserver puede entregar primero "no visible" y nunca volver a avisar. */
const vistos = [];
function revisar(){ const h = innerHeight; vistos.forEach(o => { const r = o.el.getBoundingClientRect(), v = r.width > 0 && r.bottom > -60 && r.top < h + 60; if (v !== o.v) { o.v = v; try { o.fn(v); } catch(e){ console.error(e); } } }); }
J.vigilar = (el, fn) => { vistos.push({el, fn, v:null}); revisar(); };
addEventListener('scroll', revisar, {passive:true}); addEventListener('resize', revisar); setInterval(revisar, 700);

/* ¿hay WebGL? Si no, las secciones 3D muestran la foto del producto. */
J.webgl = (() => { try { const c = document.createElement('canvas'); return !!(window.THREE && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch(e){ return false; } })();
})();
