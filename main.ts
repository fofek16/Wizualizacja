import { importHeads, validateHead, Head } from './schema';
const $ = (id: string) => document.getElementById(id)!;
let heads: Head[] = [];
function render() {
  const sel = $('heads') as HTMLSelectElement;
  sel.innerHTML = heads.map((h, i) => `<option value="${i}">${h.name}</option>`).join('');
  show(0);
}
function show(i: number) {
  const h = heads[i]; if (!h) return;
  const errs = validateHead(h);
  $('info').innerHTML =
    `<p>Ø drutu <b>${h.wireDia}</b> · Ø głowicy <b>${h.headDia}</b> · tuleja <b>${h.sleeveDistance}</b> mm</p>
     <p>Trzpienie: ${h.pins.map(p => `${p.id} Ø${p.d}`).join(', ') || '—'}<br>Bolce: ${h.bolts.map(b => `${b.id} R${b.R}`).join(', ') || '—'}</p>
     <h3>Stacje (przebiegi)</h3><ul>${h.stations.map(s =>
       `<li>${s.name}: typ ${s.toolType}, ${s.direction === 'left' ? 'lewo' : 'prawo'}, bolec ${s.activeBolt}, trzpień ${s.passivePin || '—'}</li>`).join('')}</ul>
     ${errs.length ? `<p class="bad">${errs.join('<br>')}</p>` : '<p class="ok">Konfiguracja spójna ✓</p>'}`;
}
$('file').addEventListener('change', async e => {
  const f = (e.target as HTMLInputElement).files?.[0]; if (!f) return;
  try { heads = importHeads(JSON.parse(await f.text())); render(); $('err').textContent = ''; }
  catch (x) { $('err').textContent = 'Błąd: ' + (x as Error).message; }
});
$('heads').addEventListener('change', e => show(+(e.target as HTMLSelectElement).value));
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
