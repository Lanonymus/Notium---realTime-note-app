# Notium onboarding

## Wdrożenie do istniejącego projektu

1. Umieść `NotiumOnboarding.tsx` obok `LandingPageLayout.tsx`.
2. Podmień `LandingPageLayout.tsx` na dostarczoną wersję. Zmiany dotyczą wyłącznie importu, propsów, stanu otwarcia, przycisku **Get Started** w nagłówku i montowania onboardingu.
3. Zachowaj istniejący `StudyShowcase.tsx` i pozostałe komponenty projektu. Nie trzeba dodawać zewnętrznych obrazów ani pliku CSS.
4. Wymagane: React, Tailwind CSS (projekt korzysta ze składni v4), `framer-motion`. Komponent ma eksportowane typy i nie potrzebuje nowej biblioteki formularzy.

## Ekrany

14 głównych ekranów: powitanie → motywacja → wiek → etap edukacji i znajomość tematu → przedmiot → czas dzienny → źródło polecenia → termin egzaminu → konto (e-mail i osobne okno z danymi) → podsumowanie początku → cel streak → animacja produktu → opcjonalny Premium → zakończenie.

Ekran rodzica dodawany jest bezpośrednio po wieku, zanim użytkownik utworzy konto. Daje to 15 głównych ekranów w tej ścieżce. Rozdzielenie rejestracji na e-mail i modal z danymi nie dodaje kolejnego punktu do paska postępu.

## Tryb podglądu i produkcja

Domyślnie `previewMode=true`. Podgląd pozwala przejść wszystkie ekrany bez backendu. Jest oznaczony w nagłówku. Nie tworzy kont, nie wysyła wiadomości, nie nalicza płatności i nie zapisuje haseł. Używaj fikcyjnych danych. Akcja „Preview approved flow” jest wyłącznie demonstracją; nie jest weryfikacją rodzica.

W produkcji przekaż `previewMode: false` oraz pełen obiekt `OnboardingServices`. Bez usług formularz produkcyjny wyświetli błąd zamiast udawać sukces. Podgląd cen $8/$12 jest wyłącznie przykładowy i pojawia się tylko w trybie preview. W produkcji przekaż rzeczywistą listę `plans`; bez niej działa przejście na plan darmowy.

```tsx
import LandingPageLayout from "./LandingPageLayout";
import type { OnboardingServices } from "./NotiumOnboarding";

// Implementacja tych funkcji musi korzystać z Twojego uwierzytelnionego API.
// Nie dodano fikcyjnych endpointów do załączonego projektu.
const services: OnboardingServices = yourOnboardingServices;

<LandingPageLayout
  onboarding={{
    previewMode: false,
    services,
    parentalConsentAge: 16,
    plans: yourCurrentPlans,
    dashboardHref: "/dashboard",
    termsHref: "/terms",
    privacyHref: "/privacy",
    // Opcjonalnie zamiast location.assign:
    // onComplete: () => navigate("/dashboard"),
  }}
/>;
```

### Kontrakt backendu

- `requestParentalConsent(email)` zwraca nieprzewidywalny identyfikator żądania, dopiero gdy serwer przyjmie prośbę. Serwer wdraża powiadomienie rodzica, limity, retencję i sposób weryfikacji. Przycisk nie wysyła e-maila bez tej implementacji.
- `checkParentalConsent(requestId)` odczytuje status z serwera. Nie wolno traktować samego wpisania adresu ani lokalnego stanu jako zgody.
- `register(data)` tworzy konto i sesję lub rzuca błąd. Serwer ponownie waliduje dane, wiek i stosowną zgodę, wiąże zgodę z właściwą rejestracją, chroni hasła i obsługuje weryfikację adresu e-mail. Jeśli weryfikacja wymaga osobnego kroku, adapter musi dokończyć ten przepływ przed rozwiązaniem Promise. Nazwisko jest opcjonalne, aby nie wymagać niepotrzebnych danych.
- `checkout(planId)` otwiera właściwy checkout. Promise może zakończyć się sukcesem dopiero po potwierdzeniu płatności przez backend. Anulowanie lub błąd nie mogą nadawać planu Premium. Dla checkoutu przekierowującego na inną stronę dodaj na swoim backendzie wznowienie onboardingu po powrocie; komponent sam nie przechowuje sesji płatniczej.
- `complete(profile)` zapisuje profil i kończy onboarding przed przejściem do dashboardu. Ponownie egzekwuje uprawnienia konta po stronie serwera.

Kształt `Plan`: `{ id, label, price, billing, detail }`, np. cena wyświetlana jako tekst, jawna kwota i okres rozliczenia. Ceny i uprawnienia ustala serwer, nie dane z przeglądarki. UI ukrywa zakup dla osób poniżej 18 lat i pozwala wybrać darmowy plan; produkcja również musi egzekwować swoją politykę zakupów.

Nie dodano fikcyjnych przycisków OAuth. Rejestracja e-mail działa przez adapter; istniejący Sign in na landing page pozostaje bez zmian.

## Wiek i zgoda

Próg w interfejsie jest konfigurowalny w zakresie 13–16 lat; domyślnie 16, zachowawczo dla projektu kierowanego również do użytkowników UE. Ustawienie `parentalConsentAge: 13` odtwarza opisaną ścieżkę „poniżej 13 lat”, ale samo ustawienie nie gwarantuje zgodności prawnej. Właściwy próg i podstawa przetwarzania zależą od odbiorców i jurysdykcji; nie dodawano pozornej weryfikacji wieku. Wpisanie liczby jest deklaracją, nie dowodem wieku.

Materiały źródłowe:
- Komisja Europejska: https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/legal-grounds-processing-data/are-there-any-specific-safeguards-data-about-children_en
- FTC, weryfikowalna zgoda rodzica: https://www.ftc.gov/business-guidance/privacy-security/verifiable-parental-consent-childrens-online-privacy-rule

## Zachowanie interfejsu

- Własne ilustracje SVG, białe tło, neutralne obramowania, zaznaczenia blue-600 i pomarańczowy bohater Notium.
- Gradient Premium zachowuje dokładnie podaną sekwencję kolorów.
- Framer Motion: przejścia ekranów, bohater, miniaturowa prezentacja produktów.
- `prefers-reduced-motion`: bez zapętlonego ruchu, formaty demo można przełączać ręcznie.
- Radiogroup obsługuje strzałki oraz Home/End. Formularze mają etykiety, modale zatrzymują fokus, Escape otwiera potwierdzenie zamknięcia, blokowany jest scroll tła.
- Brak localStorage/sessionStorage z hasłem, wiekiem czy e-mailami. Wybory zachowują się przy cofaniu w aktualnej sesji; zamknięcie czyści stan. Rejestracja blokuje cofanie do wcześniejszych danych, aby UI nie zmieniał danych utworzonego konta.
- Mini-demo to animacja przykładowej treści, nie rzeczywisty upload ani odtwarzanie audio.
- Endpointy, checkout, treści regulaminów, e-maile i dashboard należą do istniejącej aplikacji i wymagają podłączenia.

## Weryfikacja

TypeScript strict oraz build Vite: poprawne. Test DOM: pełna ścieżka dorosłego, formularz konta, pominięcie paywalla, zachowanie wyborów, callback końcowy i ścieżka rodzica; Enter nie omija wymaganych danych. Nie wykonano weryfikacji wizualnej w rzeczywistej przeglądarce (niedostępny silnik Chromium). Plik `NotiumOnboarding-preview.html` jest samodzielnym podglądem do otwarcia w przeglądarce, bez backendu i bez instalowania zależności.
