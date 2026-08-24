## **Specifikacija projekta**

### **Naziv projekta: Cosmetic Shop**

### **1. Uvod** {#uvod}

Cilj ovog projekta je razvoj moderne web aplikacije **Cosmetic Shop**,
koja predstavlja online prodavnicu kozmetičkih proizvoda.  
Aplikacija omogućava korisnicima da pregledaju dostupne proizvode,
dodaju ih u korpu, izvrše porudžbinu i dobiju potvrdu putem emaila.  
Administratori imaju mogućnost upravljanja proizvodima, korisnicima i
porudžbinama, kao i slanja obaveštenja o dostupnosti proizvoda ili
statusu porudžbine.

Cilj projekta je kreiranje **interaktivne, funkcionalne i vizuelno
savremene aplikacije** koja koristi aktuelne web tehnologije i najbolje
razvojne prakse.

### **2. Opis korišćenih tehnologija** {#opis-korišćenih-tehnologija}

#### **Frontend**

- **Next.js (React framework)** -- omogućava server-side rendering (SSR)
  > i SEO optimizaciju proizvoda i kategorija.

- **Tailwind CSS** -- koristi se za moderan, responzivan i čist dizajn
  > korisničkog interfejsa.

- **Axios** -- za komunikaciju sa backend API servisima.

#### **Backend**

- **Node.js + Express.js** -- omogućavaju razvoj REST API-ja koji
  > povezuje frontend sa bazom podataka i servisima trećih strana.

- **JWT (JSON Web Token)** -- implementacija autentikacije i
  > autorizacije za različite korisničke uloge.

- **Nodemailer + SendPulse SMTP** -- omogućavaju slanje email potvrda o
  > porudžbinama i obaveštenja o dostupnosti proizvoda.

#### **Baza podataka**

- **MongoDB Atlas (cloud baza)** -- koristi se za čuvanje svih podataka
  > o korisnicima, proizvodima, korpama i porudžbinama.

- Prednost cloud baze je laka integracija, sigurnost i dostupnost bez
  > potrebe za lokalnom instalacijom.

#### **Ostale tehnologije i alati**

- **Docker** -- kontejnerizacija backend servisa i baze za jednostavno
  > pokretanje i testiranje.

- **GitHub + GitHub Actions (CI/CD)** -- za verzionisanje koda i
  > automatizovani deploy na hosting servise.

- **Postman** -- za testiranje API zahteva.

- **Hosting:  
  > **

  - **Frontend:** Vercel (Next.js nativna platforma)

  - **Backend:** Render (Dockerized Express server)

### **3. Opis procesa izrade projekta** {#opis-procesa-izrade-projekta}

#### **Struktura baze podataka**

Baza će sadržati sledeće kolekcije:

- **users** -- informacije o korisnicima (ime, email, lozinka, uloga).

- **products** -- detalji o proizvodima (naziv, opis, cena, slika,
  > status dostupnosti).

- **orders** -- podaci o porudžbinama, povezan sa korisnikom i
  > proizvodima.

- **cart** -- privremeno skladište proizvoda koje korisnik dodaje pre
  > kreiranja porudžbine.

#### **Backend logika**

Backend će sadržati REST API sa osnovnim CRUD operacijama nad
kolekcijama proizvoda i porudžbina:

- **Create:** dodavanje novih proizvoda ili kreiranje porudžbine.

- **Read:** prikaz proizvoda, detalja o porudžbini i korisničkih
  > podataka.

- **Update:** izmena informacija o proizvodima ili statusa porudžbine.

- **Delete:** brisanje proizvoda ili korisnika (samo administrator).

Pored osnovnih operacija, implementiran je servis za slanje email poruka
putem **SendPulse SMTP-a**.  
Korisnik dobija automatski email nakon uspešne porudžbine, kao i dodatno
obaveštenje ukoliko administrator potvrdi dostupnost nekog proizvoda.

#### **Frontend deo**

Frontend aplikacija je izrađena pomoću Next.js frameworka i podeljena na
sledeće celine:

- **Javne stranice (Guest):** početna stranica, prikaz proizvoda,
  > detalji o proizvodu.

- **Korisničke stranice:** registracija, prijava, korpa, kreiranje
  > porudžbine, pregled statusa.

- **Administratorski panel:** upravljanje korisnicima, proizvodima,
  > porudžbinama i obaveštenjima.

Stilizacija se vrši pomoću **Tailwind CSS-a**, dok se navigacija i
rendering proizvoda baziraju na Next.js komponentama sa SSR podrškom.

### **4. Funkcionalnosti aplikacije** {#funkcionalnosti-aplikacije}

#### **Korisničke uloge**

1.  **Gost:  
    > **

    - Može pregledati sve javno dostupne stranice i proizvode.

    - Nema mogućnost dodavanja, izmene ili poručivanja.

2.  **Registrovani korisnik:  
    > **

    - Može da se registruje i prijavi.

    - Ima pristup funkcijama korpe i porudžbina.

    - Dobija email potvrdu nakon uspešne porudžbine.

3.  **Administrator:  
    > **

    - Ima pristup administratorskom panelu.

    - Može dodavati, menjati i brisati proizvode.

    - Može upravljati korisnicima i porudžbinama.

    - Može potvrđivati dostupnost proizvoda i slati email obaveštenja
      > korisnicima o ažuriranju statusa.

### **5. Integracija API-ja (opciono)** {#integracija-api-ja-opciono}

Predviđena je mogućnost dodatne integracije API-ja, na primer:

- Prikaz aktuelne vremenske prognoze za grad isporuke.

- Pretraga proizvoda po nazivu uz pomoć eksternog API-ja.

- Autocomplete adrese prilikom unosa podataka za dostavu.

### **6. Docker i CI/CD konfiguracija** {#docker-i-cicd-konfiguracija}

#### **Docker**

Backend servis i baza su kontejnerizovani pomoću **Dockerfile** i
**docker-compose.yml** fajlova.  
Ovaj pristup omogućava lako lokalno testiranje i jednostavno premeštanje
projekta između različitih okruženja.

#### **CI/CD**

GitHub Actions se koristi za automatsko testiranje, build i deploy:

- **Frontend** se automatski build-uje i deploy-uje na **Vercel** nakon
  > svakog commit-a u main granu.

- **Backend** se deploy-uje na **Render** i restartuje kontejner sa
  > novom verzijom aplikacije.

### **7. Zaključak** {#zaključak}

Projekat **Cosmetic Shop** obuhvata razvoj kompletne, funkcionalne i
vizuelno moderne web aplikacije koja povezuje savremene tehnologije
frontenda, backenda i cloud servisa.  
Implementacijom **Next.js**, **Express.js**, **MongoDB Atlas-a**,
**SendPulse-a**, **Docker-a** i **CI/CD procesa**, postiže se pouzdan,
skalabilan i održiv sistem, spreman za dalji razvoj i nadogradnju.

Moguća buduća unapređenja uključuju:

- Integraciju dodatnih spoljnih API-ja (npr. plaćanje, preporuke
  > proizvoda).

- Uvođenje višekorisničkih rola (menadžeri prodaje, operateri podrške).

- Naprednu analitiku i personalizovane preporuke proizvoda.
