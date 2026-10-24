# Calculator bij de klant

Owner akkoord: een afgeronde berekening hoort bij de klant in Strilio.
Bestaande gedeelde ContactForm en WizardShell blijven de visuele referentie.
Primaire actie: Bekijk mijn resultaat. Geen extra kaarten of marketingblokken.

Plan: gedeelde validatie; serverontvangst met vaste tenantontvanger en idempotentie;
opslaan als klantnotitie via bestaande contact-only ontvangst; desktop/mobiele proef;
PR en bestaande Git-publicatieroute.

Impact: alle vier wizards, validatiefouten, opnieuw proberen, klantmatching,
bestaande notities, resultaten, ontvangstroute en bestaande nieuwe-klantflows.
Geen afzonderlijk dossier vanuit de calculator. Bestaande klantautomatisering blijft
apart te controleren op de demo-tenant voordat de NRGEA-ontvanger wordt geactiveerd.

Acceptatie: ongeldige telefoon/postcode/gemeente geblokkeerd aan beide kanten;
contact plus antwoorden en indicatieve uitkomst zichtbaar bij klant;
herhaalde verzending eenmaal opgeslagen; storing toont geen schijnsucces;
bestaande klantnotities blijven behouden. Resultaat is een door de calculator
opgegeven indicatie, geen bindende offerte of gecontroleerde verkoopprijs.

## Gecontroleerd op 23 oktober
- 93 tests groen, typecontrole en Netlify-build groen.
- Browser: airco van ruimtes tot gegevens doorlopen; korte telefoon en onbekende
  postcode geweigerd; Gent met 2000 geweigerd; correcte invoer bij ontbrekende
  ontvanger blijft bewaard met foutmelding en actieve opnieuw-proberenknop.
- Nog vereist: echte demo write/read met dubbele aanvraag, mobiele test,
  bestaande notities behouden na serverrelease, ontvanger in productie instellen.
- De productieconfiguratie is nog niet veranderd.

De gevelisolatieconfig sloeg als enige de contactstap over. Die uitzondering is
verwijderd zodat ook deze afgeronde berekening aan een klant kan worden gekoppeld.
