
# PC Advisor — strona z kwestionariuszem (GitHub Pages)

Lekka, statyczna strona w kolorystyce niebiesko/granatowo–szarej:
- **Home** (`index.html`) — kwestionariusz doboru komputera.
- **Blog** (`blog.html`) — krótkie artykuły/porady.
- **Kontakt** (`kontakt.html`) — dane kontaktowe.

Po udanej wysyłce kwestionariusza pojawia się blok **„Dziękuję! Odpowiem w ciągu jednego dnia.”** bez przeładowania strony.
E‑mail w kwestionariuszu jest **wymagany**.

## 1) Szybki start
1. Utwórz repozytorium na GitHub (np. `pc-advisor`).
2. Wgraj pliki: `index.html`, `blog.html`, `kontakt.html`, `styles.css`, `script.js`.
3. W pliku `index.html` podmień w `<form action="https://formspree.io/f/YOUR_FORM_ID">` swój **Formspree endpoint**.
4. Włącz GitHub Pages: **Settings → Pages → Deploy from a branch** (np. `main` / root).
5. Odwiedź wygenerowany adres (`https://twoja-nazwa.github.io/pc-advisor/`).

## 2) Integracja z Formspree (darmowo)
- Załóż konto na Formspree i utwórz formularz (dostaniesz endpoint `https://formspree.io/f/XXXXXXX`).
- W `index.html` podmień `action` na ten endpoint.
- Wysyłka w `script.js` idzie jako **JSON** (lepsza kontrola nad treścią).
- Pola wielokrotnego wyboru są scalane do jednego stringa z separatorem `; `, co jest **CSV‑friendly**.

### Pola wysyłane
- `usage` (lista `; `), `usage_other`
- `gaming` (lista `; `), `resolution`
- `priority` (lista `; `, max 2)
- `budget`, `budget_amount`
- `placement`
- `parts_have`, `parts_list`
- `os`
- `notes`
- `contact_email` (wymagane), `contact_name`
- `submitted_at` (ISO datetime), `form_version`

## 3) Dostosowanie wyglądu
- Kolory i akcenty w `styles.css` (`:root` z paletą niebiesko/granatowo–szarą).
- Topbar jest lekko „szklany” (blur), karty mają granatową ramkę i gradientowe przyciski.

## 4) Import do Excela / Power Query
- Dzięki separatorowi `; ` w polach wielokrotnego wyboru, można:
  - zaimportować JSON/CSV i **podzielić kolumnę** po `; `,
  - lub zostawić jako jeden tekst.

## 5) Struktura projektu
```
/ (repo)
├─ index.html      # Home — kwestionariusz + blok „Dziękuję”
├─ blog.html       # Blog
├─ kontakt.html    # Kontakt
├─ styles.css      # styl UI
└─ script.js       # logika formularza: walidacja, wysyłka, status
```

## 6) Walidacja i UX
- E‑mail jest wymagany (`required` + dodatkowy regex w `script.js`).
- Limit wyboru **max 2 priorytetów** (JS) z komunikatem.
- Po udanej wysyłce ukrywamy formularz i pokazujemy sekcję „Dziękuję”.

## 7) Rozszerzenia (opcjonalnie)
Chcesz zwiększyć trafność rekomendacji? Rozważ dodanie:
- **Monitor/peryferia**: odświeżanie (60/120/144/240+ Hz), liczba monitorów, wymagane porty (HDMI/DP/USB‑C).
- **Forma/hałas**: Mini‑ITX/mATX/ATX, preferencja ciszy.
- **Magazyn danych**: 500 GB / 1 TB / 2 TB / 3 TB+, SSD vs SSD+HDD.
- **Oprogramowanie**: nazwy kluczowych programów (np. Premiere, Blender, AutoCAD, VS Code, DaVinci).

Daj znać, które punkty dodać — zaktualizuję pliki.

## 8) Bezpieczeństwo i prywatność
- Strona nie przechowuje danych po swojej stronie — wysyłka idzie bezpośrednio do Formspree.
- Dodaj własną klauzulę prywatności w stopce, jeśli planujesz przechowywanie odpowiedzi.

## 9) Licencja
Ten szablon możesz używać i modyfikować dowolnie. Jeśli chcesz, dodaj `LICENSE` (np. MIT).

## 10) Troubleshooting
- **Brak maila?** Sprawdź spam i panel Formspree (logi/zapisy). Upewnij się, że endpoint jest poprawny.
- **Nie działa GitHub Pages?** Sprawdź czy wybrano odpowiedni branch i czy pliki są w **root**.
- **Błąd wysyłki?** W konsoli przeglądarki zobaczysz szczegóły odpowiedzi (`status` w `script.js`).
