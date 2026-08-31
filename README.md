# Nrgea Energy Savings

Bouw een zelfstandige, embeddable energiecalculator voor Nrgea.

BELANGRIJKSTE ARCHITECTUURREGEL

Dit wordt geen landingspagina en geen uitbreiding van de bestaande Nrgea-website.

De calculator wordt als een zelfstandige webapp op een aparte URL gepubliceerd en daarna via een iframe in de bestaande Nrgea-website geplaatst.

Bouw daarom uitsluitend de inhoud van de iframe-widget:

- Geen navigatie.

- Geen websiteheader.

- Geen footer.

- Geen testimonials.

- Geen FAQ.

- Geen marketinglandingspagina.

- Geen extra content boven of onder de calculator.

- Geen duplicatie van de bestaande Nrgea-website.

- Geen links die de iframe onverwacht verlaten.

- Alle diensten en vervolgstappen openen binnen dezelfde iframe.

Alle toekomstige prompts in deze Lovable-chat voegen diensten toe binnen deze bestaande iframe-app. Ook als een latere prompt spreekt over een pagina of route, moet die dienst binnen de iframe-shell verschijnen. Voeg nooit een algemene websiteheader of footer toe.

DOEL

Maak eerst alleen:

1. De iframe-shell.

2. Het dienstenoverzicht.

3. De gedeelde wizardcomponenten.

4. Een centrale serviceregistratie.

5. Automatische iframehoogte.

6. Een veilige lokale mock-submit.

7. De basis voor de volgende dienstprompts.

Implementeer nog geen volledige dienstflow. De volgende prompts voegen de diensten één voor één toe.

INITIEEL SCHERM

Het eerste scherm van de iframe moet qua compositie overeenkomen met de aangeleverde referentieafbeelding:

- Bovenaan een compacte donkergroene hero.

- Daaronder meteen het dienstenraster.

- Geen logo of navigatie in de widget.

- Geen grote witruimte.

- Geen secties buiten de calculator.

- De calculator vult de volledige iframebreedte.

- Na alle dienstprompts bestaat het raster uit vier kaarten op de eerste rij en drie kaarten op de tweede rij.

HERO

Gebruik een compacte hero van ongeveer:

- 220–250 px hoog op desktop.

- 180–210 px op tablet.

- 170–190 px op mobiel.

Achtergrond:

- Donkergroen `#0F2C24`.

- Subtiele gradient naar `#12302C`.

- Zeer subtiel hexagon- of honingraatpatroon.

- Zachte groene gloed rechts.

- Eventueel een heel beperkte warme gloed rechtsonder, zoals in de referentie.

- Geen foto in deze hero.

Content links uitgelijnd in een centrale container.

Titel op twee regels:

“Ontdek je besparing

in enkele klikken.”

Vormgeving:

- Gebruik het bestaande Nrgea-lettertype `Visby Round`.

- Grote witte titel.

- Gewicht 600.

- Compacte regelhoogte.

- Markeer het woord “besparing” in warm geel `#F6C400`, zoals in de referentieafbeelding.

- Gebruik geel alleen voor deze highlight en kleine premiebadges.

Beschrijving:

“Kies een simulatietool en bereken direct hoeveel je kunt besparen op energie.”

- Lichtgrijze of lichtgroene tekst.

- Maximaal ongeveer 420 px breed.

- Rustige kleine typografie.

DIENSTENRASTER

Direct onder de hero komt een licht gebroken witte achtergrond:

`#F7FAF9`

Gebruik een centrale container van ongeveer 1050–1150 px.

Grid:

- Vier kolommen vanaf ongeveer 900 px.

- Twee kolommen tussen ongeveer 540 en 899 px.

- Eén kolom onder 540 px.

- Gelijke tussenruimte.

- Compacte verticale padding.

- Geen overdreven grote kaarten.

Na implementatie van alle diensten moet het raster zijn:

Eerste rij:

1. Zonnepanelen

2. Thuisbatterij

3. Lucht-waterwarmtepomp

4. Warmtepompboiler

Tweede rij:

5. Totaalpakket

6. Airco

7. Premie berekenen

Toon alleen kaarten waarvan de dienst daadwerkelijk geïmplementeerd en enabled is. Toon geen kapotte, lege of “binnenkort beschikbaar”-kaarten.

DIENSTKAARTEN

Iedere kaart:

- Witte achtergrond.

- Dunne border in ongeveer `#D8E2DF`.

- Radius 14–16 px.

- Zeer subtiele shadow.

- Compacte padding.

- Minimaal ongeveer 210–230 px hoog op desktop.

- Flexkolom zodat “Start simulatie” altijd onderaan staat.

- Geen zware hoveranimatie.

- Bij hover maximaal 2–3 px omhoog en iets sterkere shadow.

- Volledig klikbaar.

- Duidelijke focusring voor toetsenbordgebruik.

Bovenaan links:

- Vierkant afgerond icoonblok.

- Ongeveer 48 × 48 px.

- Wit lijnicoon.

- Per dienst een eigen kleur of gradient.

Optionele badge rechtsboven:

“Nieuwe premies”

- Kleine gele pill.

- Donkere tekst.

- Alleen bij lucht-waterwarmtepomp, warmtepompboiler en totaalpakket.

Onderaan:

“Start simulatie →”

- Kleine rustige tekst.

- Bij hover groen.

- Geen grote CTA-knop in de cards.

KAARTINHOUD

Gebruik uiteindelijk onderstaande diensten en teksten.

1. Zonnepanelen

Subtitel:

“+ batterij optioneel”

Beschrijving:

“Bespaar op je energiefactuur met zonnepanelen.”

Icoonblok:

Teal/groen.

2. Thuisbatterij

Beschrijving:

“Optimaliseer eigen verbruik van bestaande zonnepanelen.”

Icoonblok:

Blauw.

3. Lucht-waterwarmtepomp

Badge:

“Nieuwe premies”

Beschrijving:

“Vervang je gasketel door een lucht-waterwarmtepomp.”

Icoonblok:

Koraal/rood.

4. Warmtepompboiler

Badge:

“Nieuwe premies”

Beschrijving:

“Energiezuinig warm water voor je woning.”

Icoonblok:

Blauw/paars.

5. Totaalpakket

Badge:

“Nieuwe premies”

Subtitel:

“Lucht-waterwarmtepomp + PV + batterij”

Beschrijving:

“Maximale besparing met zonnepanelen en een lucht-waterwarmtepomp.”

Icoonblok:

Paars.

6. Airco

Subtitel:

“Koelen en verwarmen”

Beschrijving:

“Vraag een vrijblijvend advies aan voor airco.”

Icoonblok:

Lichtblauw.

7. Premie berekenen

Beschrijving:

“Bereken je Vlaamse premie voor een warmtepomp.”

Icoonblok:

Oranje.

NRGEA-BRANDING

Gebruik de visuele taal van `https://nrgea.lovable.app/`.

Design tokens:

- Font: bestaand `Visby Round`.

- Achtergrond: `#F7FAF9`.

- Hoofdtekst: `#0A2722`.

- Donkergroen: `#0F2C24`.

- Donkere surface: `#12302C`.

- Primary groen: `#3FAF7A`.

- Muted tekst: `#5A7A75`.

- Lichtgroen: `#C8F5D8`.

- Zeer lichtgroen: `#E3FEEA`.

- Wit: `#FFFFFF`.

- Highlightgeel: `#F6C400`, uitsluitend voor het woord “besparing” en premiebadges.

Gebruik nergens:

- Het Ensys-logo.

- De naam Ensys.

- Ensys-links.

- Een algemene NRGEA-websiteheader.

- Een footer in de iframe.

- Grote marketingsecties.

- Reviews of testimonials.

IFRAME-SHELL

De app moet speciaal voor embedding worden gebouwd.

Eisen:

- `html`, `body` en `#root` hebben geen standaardmarges.

- Geen vaste viewporthoogte zoals `100vh` die lege ruimte veroorzaakt.

- Hoogte wordt volledig bepaald door de zichtbare calculatorinhoud.

- Geen horizontale scrollbar.

- Vermijd een verticale scrollbar binnen de iframe.

- Alle modals, dropdowns en popovers moeten binnen de iframe blijven.

- Scroll bij een stapwissel naar de bovenkant van de iframe-content.

- Gebruik geen `target="_top"` voor interne acties.

- Interne navigatie blijft in de iframe.

ROUTING

Gebruik bij voorkeur één embedroute als entrypoint, bijvoorbeeld:

`/embed`

Het dienstenoverzicht is de beginstate van deze route.

Een dienst opent binnen dezelfde app, bijvoorbeeld via:

- Interne React-state, of

- Hashrouting zoals `/embed#/zonnepanelen`.

Gebruik bij voorkeur hashrouting omdat de calculator mogelijk op een afzonderlijk Lovable-domein wordt gehost en in een andere website wordt ingebed.

De browser van de hoofdwebsite mag niet navigeren wanneer een dienst wordt gestart.

Voeg binnen elke wizard een rustige tekstlink toe:

“Terug naar alle simulaties”

Deze gaat alleen terug naar het dienstenraster binnen de iframe.

AUTOMATISCHE IFRAMEHOOGTE

Implementeer automatische hoogtecommunicatie met de hostpagina.

In de iframe-app:

- Gebruik `ResizeObserver`.

- Meet de werkelijke hoogte van de calculatorcontent.

- Stuur bij iedere relevante hoogtewijziging:

`window.parent.postMessage({ type: "nrgea-calculator-resize", height }, "*")`

Stuur de hoogte opnieuw bij:

- Eerste render.

- Stapwissels.

- Validatiefouten.

- Openen of sluiten van conditionele velden.

- Laden van afbeeldingen.

- Verandering van viewportbreedte.

- Resultaatschermen.

Beperk de doorgestuurde hoogte tot een realistische positieve waarde.

Maak een kleine documentatiecomment met het integratievoorbeeld voor de hostpagina:

<iframe

  id="nrgea-calculator"

  src="https://DE-CALCULATOR-URL/embed"

  title="Nrgea energiecalculator"

  width="100%"

  scrolling="no"

  loading="lazy"

  style="width:100%; border:0; display:block;"

></iframe>

<script>

  window.addEventListener("message", function (event) {

    if (

      event.data &&

      event.data.type === "nrgea-calculator-resize" &&

      Number.isFinite(event.data.height)

    ) {

      const iframe = document.getElementById("nrgea-calculator");

      if (iframe) {

        iframe.style.height = Math.ceil(event.data.height) + "px";

      }

    }

  });

</script>

Zet dit voorbeeld alleen in technische documentatie of een codecomment. Toon het niet in de calculatorinterface.

GEDEELDE WIZARDLAYOUT

Wanneer een kaart wordt geopend, vervang het dienstenraster binnen dezelfde iframe door de wizard.

De wizard krijgt:

- Een compacte donkergroene kop.

- Kleine pill “Nrgea simulator”.

- Diensttitel.

- Korte beschrijving.

- Geen aparte websiteheader.

- Een horizontale of compacte responsive stepper.

- Content maximaal ongeveer 720–760 px breed.

- Knoppen “Vorige” en “Volgende”.

- Tekstlink “Terug naar alle simulaties”.

Op mobiel:

- Compacte stepper.

- Geen horizontale overflow.

- Actieknoppen mogen sticky onderaan de iframe-content staan.

- Houd rekening met de automatische iframehoogte.

GEDEELDE COMPONENTEN

Maak minimaal:

- `EmbedApp`

- `CalculatorServiceGrid`

- `ServiceCard`

- `CalculatorWizardShell`

- `CalculatorHero`

- `WizardStepper`

- `WizardNavigation`

- `OptionCard`

- `RadioCards`

- `NumberField`

- `UnitToggle`

- `InfoNotice`

- `WarningNotice`

- `ScenarioOverview`

- `ContactForm`

- `ResultsShell`

- `KpiCard`

- `IframeResizeReporter`

CENTRALE SERVICEREGISTRATIE

Maak bijvoorbeeld:

`src/config/calculatorServices.ts`

Elke dienst bevat:

- `id`

- `slug`

- `title`

- `subtitle`

- `description`

- `icon`

- `accent`

- `badge`

- `enabled`

- `component`

Het raster toont alleen:

`enabled === true`

De volgende prompts moeten telkens:

1. De nieuwe dienstflow implementeren.

2. De dienst registreren.

3. Pas daarna `enabled: true` zetten.

STATE

- Bewaar wizardstate per dienst.

- Voorkom dat antwoorden tussen diensten worden vermengd.

- Bewaar state optioneel in `sessionStorage`.

- “Nieuwe simulatie” wist alleen de actieve dienst.

- “Terug naar alle simulaties” bewaart of wist state op een voorspelbare manier.

- Documenteer die keuze kort in de code.

GEDEELD CONTACTFORMULIER

Maak de gedeelde basis alvast, maar toon die pas wanneer een dienstflow hem gebruikt.

Velden:

- Voornaam *

- Achternaam *

- E-mail *

- Telefoon *

- Straat *

- Huisnummer *

- Postcode *

- Gemeente *

- Bericht, optioneel

Checkbox:

“Ik ga akkoord dat Nrgea mij mag contacteren met informatie over mijn berekening en persoonlijk advies op maat. *”

CTA:

“Bekijk mijn resultaat”

GEEN ECHTE VERZENDING

Maak:

`src/services/submitCalculatorLead.ts`

Deze functie:

- Verstuurt niets naar een webhook.

- Verstuurt geen e-mail.

- Slaat niets op in een externe database.

- Logt alleen in development.

- Simuleert kort een loadingstate.

- Geeft daarna een lokale succesresponse terug.

RESULTAATBASIS

Maak een gedeelde resultaatshell met ruimte voor:

- Gekozen scenario.

- Antwoordensamenvatting.

- Technisch advies.

- Financiële KPI’s.

- Grafiek vóór/na.

- Disclaimer.

- CTA “Vraag persoonlijk advies”.

- CTA “Nieuwe simulatie”.

- CTA “Terug naar alle simulaties”.

RESPONSIVE ACCEPTATIECRITERIA

Desktop:

- Hero bovenaan.

- Vier cards op de eerste rij.

- Drie cards op de tweede rij zodra alle diensten bestaan.

- Cards hebben gelijke hoogte.

Tablet:

- Twee kolommen.

- Goede leesbaarheid.

- Geen zeer kleine kaarttekst.

Mobiel:

- Eén kolom.

- Titel schaalt terug.

- Inputs en buttons minimaal 44–48 px hoog.

- Geen horizontale scrollbar.

- Geen geneste scrollproblemen.

TECHNISCHE ACCEPTATIECRITERIA

- Dit is uitsluitend een iframe-app.

- Er is geen landingspagina gebouwd.

- Er is geen navigatie of footer.

- Het eerste scherm lijkt qua compositie op de aangeleverde referentie.

- De styling is volledig NRGEA.

- De iframehoogte wordt automatisch gerapporteerd.

- De hostpagina hoeft geen vaste hoogte te raden.

- Interne navigatie blijft in de iframe.

- Er wordt niets extern verstuurd.

- Nog niet geïmplementeerde diensten zijn niet zichtbaar.

- De build slaagt.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/df6a8f5a-714f-4cda-a33f-75fd68ad2da5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
