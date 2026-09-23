/* Persistent single-writer queue. The legacy Worker has no atomic revision API.
 * A preflight comparison detects already-visible conflicts, not simultaneous PUTs.
 * No automatic conflict resolution discards either version. */
(function (root) {
  'use strict';
  function fingerprint(state) {
    function stable(value) {
      if (Array.isArray(value)) return value.map(stable);
      if (value && typeof value === 'object') {
        return Object.keys(value).sort().reduce(function (out, key) {
          out[key] = stable(value[key]); return out;
        }, {});
      }
      return value;
    }
    var copy = Object.assign({}, state); delete copy.tab; delete copy.view;
    return JSON.stringify(stable(copy));
  }
  function SyncQueue(options) {
    this.options = options;
    this.dirty = false; this.busy = false; this.revision = 0;
    this.base = null; this.state = null; this.conflict = false;
    this.storageError = false;
  }
  SyncQueue.prototype.restore = function () {
    try {
      var raw = this.options.storage.getItem('swap-meet-sync-v1');
      if (!raw) return null;
      var saved = JSON.parse(raw);
      if (!saved.state || !Array.isArray(saved.state.vend)) return null;
      this.state = saved.state; this.base = saved.base;
      this.dirty = !!saved.dirty;
      return this.state;
    } catch (_) { return null; }
  };
  SyncQueue.prototype.persist = function () {
    try {
      this.options.storage.setItem('swap-meet-sync-v1', JSON.stringify({state:this.state, base:this.base, dirty:this.dirty}));
      this.storageError = false;
    } catch (_) { this.storageError = true; }
  };
  SyncQueue.prototype.status = function (kind, message) {
    if (this.storageError) {
      message = 'Memoria del dispositivo non disponibile. Esporta un backup prima di chiudere.';
      kind = 'err';
    }
    this.options.status(kind, message || '');
  };
  SyncQueue.prototype.mark = function (state) {
    this.state = state; this.dirty = true; this.revision++;
    this.persist(); this.flush();
  };
  SyncQueue.prototype.remote = async function () {
    var response = await this.options.request('GET');
    if (!response.ok) throw new Error('Connessione non disponibile (' + response.status + ').');
    var json = await response.json();
    var state = json && json.record ? json.record : json;
    if (!state || !Array.isArray(state.vend) || !state.sale || !state.vend.length) {
      throw new Error('Risposta del server non valida. I dati locali sono stati mantenuti.');
    }
    return state;
  };
  SyncQueue.prototype.refresh = async function () {
    if (this.busy) return;
    if (this.dirty) return this.flush();
    if (!this.options.canRefresh()) return;
    this.busy = true; var revision = this.revision;
    this.status('loading');
    try {
      var state = await this.remote();
      if (revision === this.revision && !this.dirty && this.options.canRefresh()) {
        var changed = fingerprint(state) !== fingerprint(this.state || {});
        this.base = fingerprint(state);
        this.state = this.options.accept(state, changed) || state;
        this.persist();
      }
      this.status(this.dirty ? 'pending' : 'ok');
    } catch (error) { this.status('err', error.message); }
    finally { this.busy = false; }
    if (this.dirty) return this.flush();
  };
  SyncQueue.prototype.flush = async function () {
    if (this.busy || !this.dirty || this.conflict) return;
    this.busy = true; this.status('loading');
    try {
      while (this.dirty) {
        var remote = await this.remote();
        var remotePrint = fingerprint(remote);
        // Recover an acknowledged-by-server write whose response was lost.
        if (remotePrint === fingerprint(this.state)) {
          this.base = remotePrint; this.dirty = false; this.persist(); break;
        }
        if (this.base === null || remotePrint !== this.base) {
          this.conflict = true;
          throw new Error('Il registro online è cambiato. Le tue modifiche restano su questo dispositivo: salva un backup prima di caricare la versione online.');
        }
        var revision = this.revision;
        var payload = JSON.stringify(this.state);
        var response = await this.options.request('PUT', payload);
        if (!response.ok) throw new Error('Salvataggio da completare (' + response.status + '). Riproverò alla riconnessione.');
        this.base = fingerprint(JSON.parse(payload));
        if (revision === this.revision) this.dirty = false;
        this.persist();
      }
      this.status('ok');
    } catch (error) { this.status('err', error.message); }
    finally { this.busy = false; }
  };
  root.SwapSync = {SyncQueue:SyncQueue, fingerprint:fingerprint};
  if (typeof module !== 'undefined') module.exports = root.SwapSync;
})(typeof window !== 'undefined' ? window : globalThis);
