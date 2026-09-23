# Swap Meet

Registro vendite per un banco al mercatino: venditori, percentuali, spese, magazzino e stampa PDF. Sito statico pubblicato con GitHub Pages; nessuna compilazione necessaria.

## Versione 6

- Interfaccia responsive nero/arancione, navigazione SVG, campi e controlli leggibili, modifica venditore esplicita.
- Icona SM, icone Home iOS/Android, manifest e cache offline della pagina dopo il primo caricamento online.
- Coda persistente dei salvataggi con recupero alla riconnessione; le modifiche successive a un PUT vengono inviate in un secondo PUT.
- Aggiornamenti remoti sospesi durante la compilazione. Le bozze dei moduli restano disponibili cambiando sezione nella stessa sessione.
- Controllo dei conflitti già presenti online prima di inviare il registro; esportazione JSON di backup.
- Protezione da nomi venditore duplicati e rimozione di venditori con vendite, validazione quantità/prezzi, conferma eliminazione vendite e spese, escaping del riepilogo stampabile.

## Compatibilità dei dati

L'app legge la chiave locale precedente `swphd2` senza cancellarla e conserva la struttura del registro remoto (`vend`, `sale`, `spese`, `magazzino`). Il nuovo stato locale e le informazioni di sincronizzazione sono conservati insieme in `swap-meet-sync-v1`. Nessuna migrazione o scrittura viene eseguita sul registro remoto all'avvio.

I dati locali non sostituiscono un backup: dal Riepilogo usare **Esporta backup del registro**. In caso di conflitto conservare il backup locale prima di scegliere **Carica versione online**, che sostituisce le modifiche non inviate su questo dispositivo. L'importazione automatica dei backup non è inclusa in questa versione.

## Limite del servizio remoto

Il Worker esistente (URL in `app.js`) accetta GET e PUT dell'intero registro. Il suo codice non si trova in questo repository. Il confronto prima del PUT rileva modifiche remote già visibili, ma non può rendere atomica la coppia GET/PUT. Due dispositivi che scrivono esattamente in contemporanea possono ancora sovrascriversi. Per eliminarne il rischio occorre una revisione verificata atomicamente dal Worker (per esempio compare-and-swap/If-Match), con gestione dei conflitti lato server. Non assumere che l'etichetta «Salvato online» equivalga a una garanzia di esclusione delle scritture concorrenti.

Le percentuali mantengono il comportamento precedente: applicazione della percentuale corrente a tutte le vendite del venditore. Gli «incassi meno spese» non sono il margine sugli articoli. Archivio mercatini, percentuali storiche e calcolo dei margini sono interventi separati.

## Sviluppo e verifiche

```sh
python -m http.server 8090
node --check app.js
node --check sync.js
node --check sw.js
node --test tests/sync.test.cjs
```

I test della coda usano un servizio simulato: non scrivono sul registro reale. Non usare operazioni di vendita fittizie per verificare il sito di produzione.

Per una nuova versione cambiare il nome della cache in `sw.js` e le versioni dei file in `index.html` e nella lista `FILES`. Il service worker non forza la sostituzione di una pagina aperta; chiudere e riaprire l'app per adottare una versione in attesa.
