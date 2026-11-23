// @ts-nocheck
import { customTicker, customTimers } from "../customGuard.ts";
const __mk = customTicker("GraficoPraticheScadenze");
const { setTimeout, setInterval, clearTimeout, clearInterval } = customTimers("GraficoPraticheScadenze");
import { useState } from "react";
import { Card, TextInput, useTable } from "../floware";

function leggiData(testo) {__mk();
  const valore = String(testo || "").trim();
  const italiano = valore.includes("/");
  const parti = valore.split(italiano ? "/" : "-");
  if (parti.length !== 3) return null;
  const indiceAnno = italiano ? 2 : 0;
  const indiceGiorno = italiano ? 0 : 2;
  const anno = Number(parti[indiceAnno]);
  const mese = Number(parti[1]);
  const giorno = Number(parti[indiceGiorno]);
  if (!Number.isInteger(anno) || anno < 1000 || anno > 9999 || !Number.isInteger(mese) || !Number.isInteger(giorno)) return null;
  const data = new Date(anno, mese - 1, giorno);
  if (data.getFullYear() !== anno || data.getMonth() !== mese - 1 || data.getDate() !== giorno) return null;
  return Date.UTC(anno, mese - 1, giorno);
}

function statoChiuso(testo) {__mk();
  const stato = String(testo || "").trim().toLowerCase();
  return ["chiusa", "chiuso", "conclusa", "concluso", "archiviata", "archiviato", "annullata", "annullato", "completata", "completato"].includes(stato);
}

export default function GraficoPraticheScadenze(props) {__mk();
  const registro = useTable("registro-scadenze");
  const avvisi = useTable("controlli-e-avvisi");
  const [riferimento, setRiferimento] = useState(() => {__mk();
    const oggi = new Date();
    return String(oggi.getFullYear()) + "-" + String(oggi.getMonth() + 1).padStart(2, "0") + "-" + String(oggi.getDate()).padStart(2, "0");
  });
  if (!registro || !avvisi) return <Card title="Pratiche e segnalazioni"><p>Servono le pagine Registro scadenze e Controlli e avvisi.</p></Card>;
  const pratica = registro.column("Pratica");
  const stato = registro.column("Stato");
  const scadenza = registro.column("Scadenza");
  const statoAvviso = avvisi.column("Stato");
  if (pratica < 0 || stato < 0 || scadenza < 0 || statoAvviso < 0) return <Card title="Pratiche e segnalazioni"><p>Servono Pratica, Stato e Scadenza nel Registro e Stato in Controlli e avvisi.</p></Card>;
  const giorno = leggiData(riferimento);
  const aperte = registro.rows.filter((riga) => (__mk(), String(riga[pratica] || "").trim() !== "" && !statoChiuso(riga[stato])));
  const codiciAperti = new Set(aperte.map((riga) => (__mk(), String(riga[pratica]).trim())));
  const vicine = aperte.filter((riga) => {__mk();
    const data = leggiData(riga[scadenza]);
    return giorno !== null && data !== null && data >= giorno && data <= giorno + 30 * 86400000;
  });
  const codiciVicini = new Set(vicine.map((riga) => (__mk(), String(riga[pratica]).trim())));
  const daChiudere = avvisi.rows.filter((riga) => (__mk(), !statoChiuso(riga[statoAvviso]))).length;
  const senzaData = aperte.filter((riga) => (__mk(), leggiData(riga[scadenza]) === null)).length;
  const senzaPratica = registro.rows.filter((riga) => (__mk(), !String(riga[pratica] || "").trim())).length;
  const serie = [
    { titolo: "Pratiche aperte", valore: codiciAperti.size },
    { titolo: "Pratiche in scadenza", valore: giorno === null ? null : codiciVicini.size },
    { titolo: "Segnalazioni da chiudere", valore: daChiudere }
  ];
  const massimo = Math.max(1, codiciAperti.size, codiciVicini.size, daChiudere);
  const termine = giorno === null ? "" : new Date(giorno + 30 * 86400000).toLocaleDateString("it-IT", { timeZone: "UTC" });
  return (
    <Card title="Pratiche e segnalazioni: dati aggiornati">
      <div className="space-y-5 text-(--mk-text)">
        <TextInput label="Data di riferimento" type="date" value={riferimento} onChange={setRiferimento} />
        {giorno === null ? <p className="text-(--mk-danger)">Scegli una data valida per calcolare le scadenze.</p> : <p className="text-sm text-(--mk-muted)">Scadenze dal {new Date(giorno).toLocaleDateString("it-IT", { timeZone: "UTC" })} al {termine}, estremi inclusi.</p>}
        <figure className="space-y-4" aria-label="Grafico a barre dei conteggi">
          {serie.map((voce) => (
            (__mk(), <div key={voce.titolo}>
              <div className="flex justify-between gap-4 text-sm"><span>{voce.titolo}</span><strong>{voce.valore === null ? "Non disponibile" : voce.valore}</strong></div>
              <div className="mt-2 h-5 overflow-hidden rounded bg-(--mk-subtle)" aria-hidden="true">
                <div className="h-5 rounded bg-(--mk-primary)" style={{ width: String((voce.valore === null ? 0 : voce.valore) / massimo * 100) + "%" }} />
              </div>
            </div>)
          ))}
          <figcaption className="text-sm text-(--mk-muted)">Barre sulla stessa scala. Conteggi ricalcolati a ogni modifica dei dati; non usano gli indicatori statici della pagina.</figcaption>
        </figure>
        <div className="space-y-2 border-t border-(--mk-divider) pt-4 text-sm">
          <p><strong>Pratiche aperte:</strong> codici Pratica distinti nel Registro scadenze con almeno una riga non chiusa.</p>
          <p><strong>Pratiche in scadenza:</strong> tra le aperte, codici distinti con almeno una scadenza tra la data scelta e i 30 giorni successivi. Le scadenze già trascorse sono escluse.</p>
          <p><strong>Segnalazioni da chiudere:</strong> numero di righe non chiuse in Controlli e avvisi, anche se riferite alla stessa pratica.</p>
          <p className="text-(--mk-muted)">Sono chiusi gli stati Chiusa/o, Conclusa/o, Archiviata/o, Annullata/o e Completata/o, senza distinzione tra maiuscole e minuscole. Tutti gli altri stati, incluso quello vuoto, sono considerati aperti.</p>
          {(senzaData > 0 || senzaPratica > 0) && <p className="text-(--mk-muted)">Qualità dati: {senzaData} righe aperte senza data valida escluse dal conteggio in scadenza; {senzaPratica} righe senza codice Pratica escluse dai conteggi delle pratiche.</p>}
        </div>
      </div>
    </Card>
  );
}
