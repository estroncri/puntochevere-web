/* ===== Punto Chevere · Menú a domicilio — lógica ===== */

// ============ EDITAR: datos del negocio ============
const WHATSAPP = '573000000000';   // <-- número de WhatsApp que RECIBE los pedidos (formato 57 + número, sin +)
const DOMICILIO = 5000;            // <-- valor del domicilio (pon 0 si es gratis o "por confirmar")
// ===================================================

const MENU = window.MENU || [];
const money = (n) => '$ ' + Math.round(n || 0).toLocaleString('es-CO');
let cart = []; // {key, nombre, precio, cantidad}
let pago = 'Efectivo';

const $ = (s) => document.querySelector(s);

/* ---------- Render del menú ---------- */
function slug(t){ return t.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g,'-'); }

function renderMenu(){
  const cats = $('#catsIn'), menu = $('#menu');
  cats.innerHTML = MENU.map((c,i)=>`<button class="cat-pill${i===0?' active':''}" data-cat="${slug(c.categoria)}">${c.categoria}</button>`).join('');
  menu.innerHTML = MENU.map((c)=>`
    <section class="seccion" id="cat-${slug(c.categoria)}">
      <div class="seccion-h"><span class="bar"></span><h2>${c.categoria}</h2></div>
      <div class="grid">
        ${c.productos.map((p)=>{
          const key = slug(c.categoria)+'-'+slug(p.n);
          return `<div class="card reveal" data-key="${key}">
            <div class="card-info">
              <div class="card-nom">${p.n}</div>
              ${p.d?`<div class="card-desc">${p.d}</div>`:''}
              <div class="card-precio">${money(p.p)}</div>
            </div>
            <button class="card-add" data-add='${JSON.stringify({key,nombre:p.n,precio:p.p}).replace(/'/g,"&#39;")}' aria-label="Agregar">
              <i class="bi bi-plus-lg"></i>
            </button>
          </div>`;
        }).join('')}
      </div>
    </section>`).join('');

  // click en categoría -> scroll a la sección
  cats.querySelectorAll('.cat-pill').forEach((b)=>b.addEventListener('click',()=>{
    document.getElementById('cat-'+b.dataset.cat).scrollIntoView({behavior:'smooth',block:'start'});
  }));
  // click en agregar
  menu.querySelectorAll('.card-add').forEach((b)=>b.addEventListener('click',()=>{
    addAlCarrito(JSON.parse(b.dataset.add));
  }));
  revelar();
  scrollSpy();
}

/* ---------- Carrito ---------- */
function addAlCarrito(p){
  const i = cart.findIndex((x)=>x.key===p.key);
  if(i>=0) cart[i].cantidad++;
  else cart.push({...p,cantidad:1});
  actualizarFab(); actualizarBadges();
  toast(p.nombre+' agregado');
}
function cambiar(key,d){
  const i = cart.findIndex((x)=>x.key===key);
  if(i<0) return;
  cart[i].cantidad += d;
  if(cart[i].cantidad<=0) cart.splice(i,1);
  actualizarFab(); actualizarBadges();
  if($('#overlay').hidden===false) renderCarrito();
}
const subtotal = () => cart.reduce((s,it)=>s+it.precio*it.cantidad,0);
const numItems = () => cart.reduce((s,it)=>s+it.cantidad,0);

function actualizarFab(){
  const fab=$('#fab');
  if(numItems()===0){ fab.hidden=true; return; }
  fab.hidden=false;
  $('#fabCant').textContent=numItems();
  $('#fabTotal').textContent=money(subtotal());
}
function actualizarBadges(){
  document.querySelectorAll('.card').forEach((c)=>{
    const key=c.dataset.key;
    const n=cart.filter((x)=>x.key===key).reduce((s,x)=>s+x.cantidad,0);
    let b=c.querySelector('.card-badge');
    if(n>0){ if(!b){ b=document.createElement('span'); b.className='card-badge'; c.appendChild(b);} b.textContent=n+' en tu pedido'; }
    else if(b){ b.remove(); }
  });
}

/* ---------- Modal del carrito ---------- */
function renderCarrito(){
  const body=$('#sheetBody');
  if(cart.length===0){
    body.innerHTML=`<div class="vacio"><i class="bi bi-bag"></i><p>Tu pedido está vacío.<br/>Agrega algo del menú.</p></div>`;
    return;
  }
  body.innerHTML = `
    ${cart.map((it)=>`
      <div class="ci">
        <div class="ci-main">
          <div class="ci-nom">${it.nombre}</div>
          <div class="qty">
            <button data-menos="${it.key}"><i class="bi bi-dash-lg"></i></button>
            <span class="n">${it.cantidad}</span>
            <button data-mas="${it.key}"><i class="bi bi-plus-lg"></i></button>
            <button class="del" data-del="${it.key}" aria-label="Quitar"><i class="bi bi-trash3"></i></button>
          </div>
        </div>
        <div class="ci-precio">${money(it.precio*it.cantidad)}</div>
      </div>`).join('')}

    <div class="form-tit"><i class="bi bi-person-fill"></i> Tus datos para el domicilio</div>
    <input class="campo" id="fNombre" placeholder="Tu nombre *" />
    <input class="campo" id="fTel" placeholder="Teléfono / WhatsApp *" inputmode="tel" />
    <input class="campo" id="fDir" placeholder="Dirección (calle, número, apto) *" />
    <input class="campo" id="fBarrio" placeholder="Barrio / referencia" />
    <input class="campo" id="fNota" placeholder="Nota (ej: sin cebolla, timbre dañado…)" />

    <div class="form-tit"><i class="bi bi-cash-coin"></i> ¿Cómo vas a pagar?</div>
    <div class="pagos" id="pagos">
      ${['Efectivo','Nequi','Bancolombia','Bre-B'].map((m)=>`<button class="pago${m===pago?' sel':''}" data-pago="${m}">${m}</button>`).join('')}
    </div>

    <div class="tot">
      <div class="tot-row"><span>Subtotal</span><span>${money(subtotal())}</span></div>
      <div class="tot-row"><span>Domicilio</span><span>${DOMICILIO>0?money(DOMICILIO):'según zona'}</span></div>
      <div class="tot-row big"><span>Total</span><span>${money(subtotal()+(DOMICILIO>0?DOMICILIO:0))}</span></div>
    </div>
    <button class="btn-wa" id="enviarWa"><i class="bi bi-whatsapp"></i> Enviar pedido por WhatsApp</button>
    <p class="aviso-pago">Confirmamos el pedido y el tiempo de entrega por WhatsApp.</p>
  `;

  body.querySelectorAll('[data-menos]').forEach((b)=>b.onclick=()=>cambiar(b.dataset.menos,-1));
  body.querySelectorAll('[data-mas]').forEach((b)=>b.onclick=()=>cambiar(b.dataset.mas,1));
  body.querySelectorAll('[data-del]').forEach((b)=>b.onclick=()=>cambiar(b.dataset.del,-9999));
  body.querySelectorAll('[data-pago]').forEach((b)=>b.onclick=()=>{
    pago=b.dataset.pago;
    body.querySelectorAll('.pago').forEach((x)=>x.classList.toggle('sel',x.dataset.pago===pago));
  });
  $('#enviarWa').onclick=enviarWhatsApp;
}

function enviarWhatsApp(){
  const nombre=$('#fNombre').value.trim(), tel=$('#fTel').value.trim(), dir=$('#fDir').value.trim();
  const barrio=$('#fBarrio').value.trim(), nota=$('#fNota').value.trim();
  if(!nombre||!tel||!dir){ toast('Completa nombre, teléfono y dirección','error'); return; }

  const total = subtotal()+(DOMICILIO>0?DOMICILIO:0);
  let m = '*PEDIDO A DOMICILIO — PUNTO CHEVERE*\n';
  m += '━━━━━━━━━━━━━━━━━━━\n';
  cart.forEach((it)=>{ m += `• ${it.cantidad}x ${it.nombre} — ${money(it.precio*it.cantidad)}\n`; });
  m += '━━━━━━━━━━━━━━━━━━━\n';
  m += `Subtotal: ${money(subtotal())}\n`;
  m += `Domicilio: ${DOMICILIO>0?money(DOMICILIO):'según zona (por confirmar)'}\n`;
  m += `*TOTAL: ${money(total)}*\n`;
  m += '━━━━━━━━━━━━━━━━━━━\n';
  m += `*Cliente:* ${nombre}\n*Teléfono:* ${tel}\n*Dirección:* ${dir}${barrio?', '+barrio:''}\n*Pago:* ${pago}\n`;
  if(nota) m += `*Nota:* ${nota}\n`;
  m += '\n¡Gracias! 🍔';

  window.open('https://wa.me/'+WHATSAPP+'?text='+encodeURIComponent(m),'_blank');
}

/* ---------- Toast ---------- */
let toastT;
function toast(msg,tipo){
  let el=$('#toast');
  if(!el){ el=document.createElement('div'); el.id='toast'; document.body.appendChild(el); }
  el.textContent=msg;
  el.style.cssText='position:fixed;top:70px;left:50%;transform:translateX(-50%);z-index:120;padding:12px 20px;border-radius:12px;color:#fff;font-weight:700;font-size:14px;box-shadow:0 12px 30px rgba(0,0,0,.25);background:'+(tipo==='error'?'#E11414':'#25D366');
  clearTimeout(toastT); toastT=setTimeout(()=>el.remove(),2400);
}

/* ---------- Animaciones y scroll-spy ---------- */
function revelar(){
  const io=new IntersectionObserver((es)=>es.forEach((e)=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} }),{threshold:.1});
  document.querySelectorAll('.reveal').forEach((el)=>io.observe(el));
}
function scrollSpy(){
  const secs=[...document.querySelectorAll('.seccion')];
  const pills=[...document.querySelectorAll('.cat-pill')];
  const io=new IntersectionObserver((es)=>es.forEach((e)=>{
    if(e.isIntersecting){
      const id=e.target.id.replace('cat-','');
      pills.forEach((p)=>p.classList.toggle('active',p.dataset.cat===id));
      const activa=pills.find((p)=>p.dataset.cat===id);
      if(activa) activa.scrollIntoView({inline:'center',block:'nearest',behavior:'smooth'});
    }
  }),{rootMargin:'-45% 0px -50% 0px'});
  secs.forEach((s)=>io.observe(s));
}

/* ---------- Init ---------- */
$('#fab').addEventListener('click',()=>{ $('#overlay').hidden=false; document.body.style.overflow='hidden'; renderCarrito(); });
$('#cerrar').addEventListener('click',cerrar);
$('#overlay').addEventListener('click',(e)=>{ if(e.target.id==='overlay') cerrar(); });
function cerrar(){ $('#overlay').hidden=true; document.body.style.overflow=''; }

renderMenu();
