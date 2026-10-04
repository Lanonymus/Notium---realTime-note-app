# Notium Home — układ z Twojego projektu, stylistyka Brilliant

## Instalacja

Skopiuj wszystkie pliki `.tsx` i `.ts` z tego folderu do folderu, w którym masz obecny `Dashboard.tsx`.
Podmień `Dashboard.tsx`, `ProjectCard.tsx`, `RecentSessionItem.tsx` oraz `AllowedDataTypes.tsx`.
Pozostałe pliki są nowymi zależnościami tego ekranu. `Charts.tsx` nie wymaga zmian — nowy Home go nie używa.

Dotychczasowe `<Dashboard />` nadal działa. Musi być wewnątrz Routera, tak jak poprzednio.
Ekran zawiera własny górny pasek Notium; jeśli obecny layout już renderuje inny pasek, wyłącz go na trasie dashboardu.

Wykorzystane zależności: React, React Router, Framer Motion, Lucide React, Axios, UUID i **Tailwind CSS 4**.
Całe stylowanie jest zapisane w klasach Tailwinda bezpośrednio w komponentach. Nie ma osobnego pliku CSS dashboardu, importu `dashboard.css`, reguł `@apply` ani ręcznie pisanych keyframes.
Korzystaj z obecnej konfiguracji Tailwind 4 w aplikacji. Pliki muszą znajdować się w skanowanym katalogu źródłowym, np. `src/components/Dashboard`.
Jeśli wklejasz tę wersję na poprzednią, usuń nieużywany `dashboard.css`. Zależności i konfiguracja globalnego Tailwinda w Twojej aplikacji pozostają potrzebne.

Responsywność korzysta z `@container/home` i wariantów `@max-[...]/home`. Gradienty, cienie, focus, backdrop modali i animacje również są klasami Tailwinda.
Nazwy `nh-*` pozostały wyłącznie jako znaczniki elementów dla selektorów Tailwinda i istniejącego kodu skupiania pola. Nie mają zewnętrznych definicji CSS.
SVG zachowują atrybuty `fill` / `stroke` i definicje gradientów — to dane ilustracji.

## Co jest gotowe

- Trzykolumnowy Home: streak / Premium / ranga, centralny composer, kontynuacja / projekty.
- Home / Explore / You z animacją podkreślenia. Explore i You są celowo puste.
- Ilustracje SVG: ogień, zamrożenie streaku, klucz, Premium, ranga, wykres, notes, gwiazda, piramida i podstawki.
- Działające wybieranie plików, drag & drop, tekst, YouTube, wybór zdjęcia / PDF / audio.
- Modal daily streak, panel kluczy, menu materiałów projektu, lista wszystkich projektów z filtrowaniem i sortowaniem.
- Responsywność według szerokości kontenera: trzy kolumny >1050px; composer nad dwiema kolumnami 721–1050px; jedna kolumna do 720px.
- Na telefonie kolejność: composer, projekty, aktywność i nagrody.
- Obsługa klawiatury, focus, Escape, natywne modale i reduced motion.

Wiodące kolory pobrane z dostarczonego obrazu Brilliant:

| Element | Kolor |
| --- | --- |
| Niebieski przycisk | `#456dff` |
| Dolna krawędź przycisku | `#375ce3` |
| Obramowania kart | `#e5e5e5` |
| Tło | `#ffffff` |

Nie jest to eksport oryginalnego design systemu Brilliant. Promienie, odstępy, gradient i ilustracje są odtworzone na podstawie screenów. Font dziedziczy Inter, jeśli aplikacja go ładuje; inaczej używa fontu systemowego.

## Zachowane API

- `GET /api/getUserData`, cookies; oczekiwane `{ userProjects: [...] }`.
- `POST /api/dataToText`, FormData z `files` lub `youtubeUrl`; oczekiwane `{ extractedText: string }`.
- `POST /api/createProject`, cookies; JSON `{ prompt, contextText, youtubeUrls }`; oczekiwane `{ data: { id } }`.
- Domyślna baza: `http://localhost:8000`, zmieniana przez `apiBaseUrl`.

Ekstrakcja zachowuje dotychczasowe ustawienia Axios dotyczące cookies. Jeśli endpoint wymaga cookies i działa na innym originie, skonfiguruj `withCredentials` razem z CORS backendu.
Nowy hook rozróżnia przesłanie bajtów od zakończenia ekstrakcji. Nie pozwala utworzyć projektu przed otrzymaniem treści. Błędy są widoczne, a tekst i źródła pozostają po błędzie generowania. Usunięcie źródła przerywa jego aktywne żądanie.

Domyślne trasy materiałów: `/project/:id/notes`, `/flashcards`, `/quiz`, `/podcast`.
Jeśli używasz innych nazw, przekaż `onOpenProject(project, resource)`; nie zmieniaj backendu.
Kontynuacja pokazuje fiszki i quiz, jeśli są dostępne; dla pozostałych projektów notatki / podcast.
Checkboxy z projektu wizualnego są semantycznie radiobuttonami: Start otwiera jeden wybrany materiał.

## Dane aktywności i Premium

W plikach wejściowych nie było endpointu streaku / XP / kluczy ani płatności. Nie dopisuję fikcyjnych osiągnięć do konta.
Domyślnie aktywność wynosi zero, a nieznany stan kluczy wyświetla `—`.
Przekaż rzeczywiste dane istniejącego backendu przez `stats`:

```tsx
<Dashboard
  stats={{
    xp: user.xp,
    rankThreshold: 175,
    streakDays: user.streakDays,
    longestStreak: user.longestStreak,
    lessonsCompleted: user.lessonsCompleted,
    keysLeft: user.keysLeft,
    freezes: user.freezes,
    dailyTarget: 3,
    problemsToday: user.problemsToday,
    activeDates: user.activeDates, // lokalne daty YYYY-MM-DD
  }}
  onUpgrade={() => setUpgradeOpen(true)}
  onCreateBlank={createBlankProject}
/>
```

Przykład zakłada istniejące dane/handlery rodzica — ich nazwy dostosuj do aplikacji.
Bez `onUpgrade` pojawia się uczciwy komunikat „Premium is not available yet”.
Bez `onCreateBlank` opcja pustego dokumentu jest pomijana.
Rank jest prezentacją progu XP, nie nowym systemem naliczania doświadczenia. Klucze i freeze również niczego nie odejmują i nie zapisują samodzielnie.

## Podgląd

`Notium-preview.html` otwórz lokalnie w przeglądarce. Ma kompletny JS, wynik kompilacji Tailwinda i SVG w jednym pliku, bez CDN. Osadzony arkusz w tym podglądzie jest wygenerowany automatycznie, tak samo jak w buildzie aplikacji.
Zawiera wyłącznie dane poglądowe z przykładowymi projektami, 110 XP, 2 kluczami i 2 freeze.
Jego upload i tworzenie projektu są symulowane lokalnie, bez wysyłania plików. Do aplikacji kopiuj pliki źródłowe, nie ten HTML.

## Weryfikacja

Sprawdzenie typów TypeScript (strict, także nieużywane importy), produkcyjny build esbuild i kompilacja Tailwind 4 wykonane w lokalnym projekcie kontrolnym. Osobno sprawdzono rozpoznawanie klas Tailwinda w komponentach.
Testy interakcji obejmują oryginalny payload tworzenia projektu, wczytanie projektów, filtrowanie, zachowanie tekstu przy zmianie zakładki, dialog streaku, blokadę podczas ekstrakcji, błędy i nawigację do quizu.
Testy korzystają z atrap API. Nie wykonano połączenia z Twoim działającym backendem.
Środowisko nie udostępniło działającej przeglądarki do końcowej kontroli screenshotów. Responsywność i zgodność wizualna wymagają obejrzenia w Twojej przeglądarce.
