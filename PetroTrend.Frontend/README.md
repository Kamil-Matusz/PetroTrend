# PetroTrend - frontend

Interfejs do śledzenia cen paliw (ON, PB95, PB98, LPG), oparty o API z `PetroTrend.Backend`.
React 19 + TypeScript + Vite, wykresy na `recharts`, routing na `react-router`.

## Uruchomienie

```bash
npm install
npm run dev        # http://localhost:5173
```

Dev server proxuje `/api` na `http://localhost:8080`, więc backend musi działać
(`./gradlew bootRun` w `PetroTrend.Backend`, wymaga Dockera). Inny port backendu ustawisz
zmienną `VITE_API_TARGET` - np. w pliku `.env.local`:

```
VITE_API_TARGET=http://localhost:8081
```

Poza proxy działa też CORS: backend przepuszcza `http://localhost:5173` i `:4173`
(`config/WebConfig.java`).

## Skrypty

| Komenda | Co robi |
|---|---|
| `npm run dev` | serwer deweloperski z HMR |
| `npm run build` | `tsc -b` + build produkcyjny do `dist/` |
| `npm run preview` | podgląd builda na `:4173` |
| `npm run lint` | oxlint |

## Ekrany

- **Pulpit** (`/`) - pylon z aktualnymi cenami i deltą, wykres trendu z przełącznikiem
  zakresu i waluty, skrót ostatnich odczytów.
- **Notowania** (`/notowania`) - `GET /search` z filtrami, sortowaniem po dacie i cenie oraz
  paginacją; dodawanie, edycja i usuwanie odczytów.

## Warstwa danych

`src/api/` odwzorowuje kontrakt backendu: `client.ts` zamienia odpowiedzi błędów na `ApiError`
z polem `reasonCode`, a `src/lib/errors.ts` mapuje te kody na komunikaty po polsku. Walidacja
formularza w `PriceForm` powiela ograniczenia Jakarty z `FuelPriceRequest`, żeby niepoprawny
payload nie trafiał do API.

## Wygląd

Motyw ciemny, bez trybu jasnego - całość jest stylizowana na przydrożny pylon cenowy stacji.
Kolory paliw (`src/lib/fuel.ts`) to kodowanie z dystrybutorów, dobrane tak, by pary serii były
rozróżnialne przy protanopii i deuteranopii; kształty znaczników idą za oznaczeniami EN 16942
(diesel kwadrat, benzyna koło, gaz romb), więc identyfikacja serii nie opiera się na samym
kolorze.
