const {test}=require('node:test');
const assert=require('node:assert/strict');
const {SyncQueue,fingerprint}=require('../sync.js');
const tick=()=>new Promise(r=>setImmediate(r));
const clone=x=>JSON.parse(JSON.stringify(x));
const state=()=>({vend:[{n:'Test',p:false,perc:0}],sale:{Test:[]},spese:[],magazzino:[],tab:'Test',view:'input'});
function harness(){
 const memory=new Map();let remote=state(),puts=[],fail=false,hold=null,editable=false;const statuses=[];
 const options={storage:{getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)},canRefresh:()=>!editable,accept:()=>{},status:(...x)=>statuses.push(x),request:async(method,body)=>{if(fail)throw Error('offline');if(method==='GET')return {ok:true,json:async()=>clone(remote)};puts.push(JSON.parse(body));if(hold)await hold;remote=JSON.parse(body);return {ok:true};}};
 const q=new SyncQueue(options);q.state=state();q.base=fingerprint(remote);
 return {q,options,puts,statuses,memory,get remote(){return remote},set remote(x){remote=x},set fail(x){fail=x},set hold(x){hold=x},set editable(x){editable=x}};
}
test('rapid changes during PUT are persisted in a second queued write',async()=>{const h=harness();let release;h.hold=new Promise(r=>release=r);h.q.state.sale.Test.push({id:'1',importo:10});h.q.mark(h.q.state);await tick();assert.equal(h.puts.length,1);h.q.state.sale.Test.push({id:'2',importo:20});h.q.mark(h.q.state);release();await tick();await tick();assert.equal(h.remote.sale.Test.length,2);assert.equal(h.q.dirty,false);assert.equal(h.puts.length,2);});
test('offline edits survive reload and retry',async()=>{const h=harness();h.fail=true;h.q.state.sale.Test.push({id:'1',importo:10});h.q.mark(h.q.state);await tick();assert.equal(h.q.dirty,true);const q=new SyncQueue(h.options);assert.equal(q.restore().sale.Test.length,1);h.fail=false;await q.flush();assert.equal(h.remote.sale.Test.length,1);assert.equal(q.dirty,false);});
test('divergent remote blocks write and retains local state',async()=>{const h=harness();h.remote.sale.Test.push({id:'remote'});h.q.state.sale.Test.push({id:'local'});h.q.mark(h.q.state);await tick();assert.equal(h.puts.length,0);assert.equal(h.q.conflict,true);assert.equal(h.q.dirty,true);assert.equal(h.q.state.sale.Test[0].id,'local');});
test('remote read finishing after local edit never overwrites that edit',async()=>{const h=harness();let release;h.options.request=async method=>{if(method==='GET'){await new Promise(r=>release=r);return{ok:true,json:async()=>state()}}return{ok:true}};const refresh=h.q.refresh();h.q.state.sale.Test.push({id:'local'});h.q.mark(h.q.state);release();await tick();assert.equal(h.q.state.sale.Test[0].id,'local');release();await refresh;assert.equal(h.q.dirty,false);});
test('refresh does not replace active form',async()=>{const h=harness();h.editable=true;let count=0;h.options.request=()=>{count++;throw Error()};await h.q.refresh();assert.equal(count,0);});
test('invalid remote response retains local data',async()=>{const h=harness();h.options.request=async()=>({ok:true,json:async()=>({error:'bad'})});await h.q.refresh();assert.equal(h.q.state.vend[0].n,'Test');assert.equal(h.statuses.at(-1)[0],'err');});
test('acknowledgement loss recovers if remote already equals pending state',async()=>{const h=harness();h.q.state.sale.Test.push({id:'1'});h.remote=clone(h.q.state);h.q.dirty=true;await h.q.flush();assert.equal(h.puts.length,0);assert.equal(h.q.dirty,false);});
test('navigation and object key order do not create false conflicts',()=>{const a=state(),b=clone(a);b.tab='Other';b.view='spese';assert.equal(fingerprint(a),fingerprint(b));assert.equal(fingerprint({b:1,a:2}),fingerprint({a:2,b:1}));});
test('storage errors are visible instead of claiming a durable save',async()=>{const h=harness();h.options.storage.setItem=()=>{throw Error('quota')};h.q.state.sale.Test.push({id:'1'});h.q.mark(h.q.state);await tick();assert.equal(h.statuses.at(-1)[0],'err');assert.match(h.statuses.at(-1)[1],/Memoria/);});
test('unchanged refresh preserves UI object references returned by accept',async()=>{const h=harness();const previous=h.q.state;h.options.accept=(next,changed)=>changed?next:previous;await h.q.refresh();assert.equal(h.q.state,previous);});
