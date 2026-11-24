(function (root) {
  'use strict';
  const venues = Object.freeze([
    {id:'continent',name:'«Континент»',min:1,max:200,rent:30000,minimum:300000,summer:true,end:'24:00'},
    {id:'olympia',name:'«Олимпия»',min:50,max:100,rent:30000,minimum:300000,summer:true,end:'23:00'},
    {id:'main',name:'Основной зал',min:1,max:80,rent:30000,minimum:300000,summer:false,end:'24:00'},
    {id:'azimuth',name:'«Азимут»',min:1,max:60,rent:10000,minimum:0,summer:false,end:'24:00'},
    {id:'veranda',name:'Веранда',min:30,max:60,rent:null,minimum:0,summer:true,end:'23:00'},
    {id:'estate',name:'«Усадьба»',min:1,max:50,rent:10000,minimum:0,summer:false,end:'24:00'},
    {id:'alliance',name:'«Альянс»',min:1,max:30,rent:10000,minimum:0,summer:false,end:'24:00'}
  ].map(Object.freeze));
  const suitable = (v,n) => n >= v.min && n <= v.max;
  const money = n => new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0}).format(n).replace(/[\s\u202f]/g,'\u00a0')+'\u00a0₽';
  function calculate({venue,guests}) {
    const v=venues.find(item=>item.id===venue);
    if (!v) throw new RangeError('Неизвестная площадка');
    if (!Number.isInteger(guests)||guests<1||guests>200) throw new RangeError('Число гостей: от 1 до 200');
    const banquet=guests*6000;
    const base=v.rent===null?null:Math.max(banquet+v.rent,v.minimum);
    const minimumApplied=base!==null&&banquet+v.rent<v.minimum;
    const valid=suitable(v,guests);
    let suggestion=null;
    if (!valid || minimumApplied) {
      // Ближайшая подходящая: наименьший достаточный зал с известной ценой.
      const candidates=venues.filter(x=>x.id!==v.id&&x.rent!==null&&suitable(x,guests))
        .sort((a,b)=>a.max-b.max || (banquet+a.rent)-(banquet+b.rent));
      suggestion=candidates.find(x=>!valid || Math.max(banquet+x.rent,x.minimum)<base)||null;
    }
    const total=base;
    return {venue:v,guests,banquet,rent:v.rent,base,minimumApplied,
      minimumTopUp:minimumApplied?v.minimum-banquet-v.rent:0,
      total,
      perGuest:total===null?null:Math.round(total/guests),valid,suggestion};
  }
  const api={venues,suitable,money,calculate};
  if (typeof module==='object'&&module.exports) module.exports=api;
  else root.WeddingCalculation=api;
})(typeof globalThis==='object'?globalThis:this);

(() => {
if(typeof document==='undefined')return;
const root=document.getElementById('wedding-calculator');
if(!root)return;

'use strict';
const {venues,calculate,suitable,money}=WeddingCalculation;
const $=id=>document.getElementById('wc-'+id);
const state={venue:'azimuth',guests:45};
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let result,frame=0,displayed=280000,liveTimer;
for(const v of venues){
  const b=document.createElement('button'); b.type='button'; b.className='wc-venue'; b.dataset.id=v.id;
  const title=document.createElement('strong'); title.textContent=v.name;
  const capacity=document.createElement('span'); capacity.textContent=(v.min>1?`от ${v.min} `:'')+`до ${v.max} гостей`;
  b.append(title,capacity);
  if(v.summer){const season=document.createElement('span');season.textContent='май–октябрь';b.append(season);}
  if(v.end){const end=document.createElement('span');end.textContent=`до ${v.end}`;b.append(end);}
  b.addEventListener('click',()=>{if(!suitable(v,state.guests))return;selectVenue(v.id);});
  $('venues').append(b);
}

function selectVenue(id){state.venue=id;render();}
function amountTo(total){
  cancelAnimationFrame(frame);
  if(total===null)return;
  if(reduced.matches){displayed=total;$('amount').textContent=money(total);return;}
  const start=displayed;const time=performance.now();
  function tick(now){const t=Math.min((now-time)/280,1);displayed=start+(total-start)*(1-Math.pow(1-t,3));$('amount').textContent=money(displayed);if(t<1)frame=requestAnimationFrame(tick);}
  frame=requestAnimationFrame(tick);
}
function addLine(label,value){const row=document.createElement('div');row.className='wc-line';const dt=document.createElement('dt');dt.textContent=label;const dd=document.createElement('dd');dd.textContent=value;row.append(dt,dd);$('breakdown').append(row);}
function render(){
  result=calculate(state);const r=result;const v=r.venue;
  $('guests').setAttribute('aria-valuetext',state.guests+' гостей');$('guest-count').textContent=state.guests;$('guests').value=state.guests;
  $('minus').disabled=state.guests<=10;$('plus').disabled=state.guests>=200;
  for(const b of $('venues').children){const item=venues.find(v=>v.id===b.dataset.id);b.setAttribute('aria-pressed',String(item.id===v.id));b.setAttribute('aria-disabled',String(!suitable(item,state.guests)));}
  $('capacity-warning').hidden=r.valid;
  $('capacity-warning').textContent=r.valid?'':`${v.name}: ${state.guests<v.min?'от '+v.min:'до '+v.max} гостей. Для ${state.guests} гостей нужна другая площадка. Выбор пока сохранён, сумма предварительная.`;
  $('suggestion').hidden=!r.suggestion;
  if(r.suggestion){
    const alternative=calculate({...state,venue:r.suggestion.id});
    $('suggestion-text').textContent=`Для ${state.guests} гостей ${r.valid?'удобнее':'подойдёт'} ${r.suggestion.name}: от ${money(alternative.total)}`;
    $('switch-venue').textContent=`Выбрать ${r.suggestion.name}`;
  }
  $('receipt-venue').textContent=`${v.name}, ${state.guests} гостей`;
  $('price-area').querySelector('.wc-total').hidden=r.total===null;
  $('price-area').querySelector('.wc-total').classList.toggle('wc-million',r.total>=1000000);
  $('veranda-price').hidden=r.total!==null;
  const totalText=r.total===null?`Банкет от ${money(r.banquet)}, аренду веранды назовём в расчёте`:`от ${money(r.total)}`;
  $('veranda-price').textContent=totalText;
  amountTo(r.total);
  clearTimeout(liveTimer);liveTimer=setTimeout(()=>{$('live-total').textContent=totalText+(r.valid?'':'. Вместимость не подходит: выберите другую площадку.');},150);
  $('per-guest').hidden=r.perGuest===null;$('per-guest').textContent=r.perGuest===null?'':`≈ ${money(r.perGuest)} на гостя`;
  $('breakdown').replaceChildren();
  addLine(`Банкет: ${state.guests} × 6 000 ₽`,money(r.banquet));
  addLine('Аренда',r.rent===null?'Уточним':money(r.rent));
  if(r.minimumApplied)addLine('До минимального заказа',money(r.minimumTopUp));
  $('mobile-label').textContent=r.total===null?'Банкет, аренда отдельно':r.valid?'Ваша свадьба':'Проверьте вместимость';
  $('mobile-amount').textContent=r.total===null?'Аренду уточним':`от ${money(r.total)}`;

}
$('guests').addEventListener('input',e=>{state.guests=Number(e.target.value);render();});
for(const [id,delta] of [['minus',-1],['plus',1]])$(id).addEventListener('click',()=>{state.guests=Math.max(10,Math.min(200,state.guests+delta));render();});
$('switch-venue').addEventListener('click',()=>{if(result.suggestion){const id=result.suggestion.id;selectVenue(id);root.querySelector(`[data-id="${id}"]`).focus();}});
$('request').addEventListener('click',requestCalculation);
$('view-receipt').addEventListener('click',()=>($('receipt').scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'start'}),$('receipt').focus({preventScroll:true})));

const hallNames={continent:'Шатёр «Континент»',olympia:'Шатёр «Олимпия»',main:'Основной зал ресторана',azimuth:'Зал «Азимут»',veranda:'Летняя веранда',estate:'Зал «Усадьба»',alliance:'Зал «Альянс»'};
function requestCalculation(){
 const r=result;
 const sum=r.total===null?`банкет от ${money(r.banquet)}, аренда уточняется`:`от ${money(r.total)}`;
 const summary=`Калькулятор: ${r.venue.name}, ${r.guests} гостей, ${sum}`;
 document.dispatchEvent(new CustomEvent('wedding:calculation-selected',{detail:{hall:hallNames[r.venue.id],guests:r.guests,summary}}));
}
document.addEventListener('wedding:form-hall',event=>{
 const id=Object.keys(hallNames).find(id=>hallNames[id]===event.detail.hall);
 if(id)selectVenue(id);
});
root.hidden=false;
document.dispatchEvent(new CustomEvent('wedding:calculator-ready'));
reduced.addEventListener('change',()=>amountTo(result.total));
render();

})();
