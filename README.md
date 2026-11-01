# Altair — site vitrine

Site one-page en HTML, CSS et JavaScript, sans framework. Il suffit de déposer le dossier chez n'importe quel hébergeur.

## Contenu

```
index.html          la page
styles.css          tous les styles (mobile d'abord)
main.js             animations, menu mobile, formulaire
vercel.json         réglages d'hébergement Vercel (cache, sécurité)
favicon.ico         logo dans l'onglet du navigateur (tous navigateurs)
site.webmanifest    nom « Altair » et logo quand on ajoute le site à l'écran d'accueil
assets/
  fonts/            police Sora (allégée : latin + français, graisses 400 à 700) + licence OFL
  vendor/           GSAP, ScrollTrigger, DrawSVG (animations) et Lenis (défilement fluide)
  favicon.svg, logo-mark*.svg, og-square.png (image de partage, compressée : 45 Ko au lieu de 580 Ko)
  apple-touch-icon.png, icon-192.png, icon-512.png (logo pour iPhone, Android et Google)
```

## Mettre le site en ligne avec Vercel (sans rien installer)

1. Décompressez `altair-site.zip`.
2. Sur https://github.com, connectez-vous puis **New repository** : nom `altair-site`, puis **Create repository**.
3. Sur la page du dépôt, cliquez sur **uploading an existing file**. Ouvrez le dossier `altair` et glissez **son contenu** (`index.html`, `styles.css`, `main.js`, `vercel.json`, `favicon.ico`, `site.webmanifest`, `README.md` et le dossier `assets`), puis **Commit changes**.
4. Sur https://vercel.com, **Continue with GitHub**, puis **Add New… → Project** et **Import** à côté de `altair-site`.
5. Laissez les réglages par défaut (Framework Preset : *Other*, aucune commande de build) et cliquez sur **Deploy**.
6. Au bout d'environ 30 secondes, le site est en ligne à une adresse du type `https://altair-site.vercel.app`.

Pour modifier le site plus tard : envoyez les fichiers modifiés sur GitHub (**Add file → Upload files**), Vercel remet le site à jour tout seul.

Nom de domaine (par exemple `altair.dz`) : sur Vercel, **Settings → Domains → Add**, puis suivez les indications DNS.

Une fois l'adresse définitive connue, dans `index.html` :

1. remplacez `assets/og-square.png` dans la balise `og:image` par l'adresse complète, par exemple `https://altair-site.vercel.app/assets/og-square.png` (Facebook, WhatsApp et LinkedIn exigent une adresse complète) ;
2. ajoutez `<link rel="canonical" href="https://altair-site.vercel.app/">` dans le `<head>`.

`vercel.json` règle la mise en cache (police et scripts gardés un an par les navigateurs) et quelques en-têtes de sécurité.

## Recevoir les messages du formulaire (Formspree)

Le formulaire est relié au formulaire Formspree **mzeejwkg** (`https://formspree.io/f/mzeejwkg`). Chaque message arrive par e-mail dans la boîte du compte Formspree, avec le nom, l'e-mail, le service choisi et le message. Il suffit de cliquer sur « Répondre » pour écrire au client. Tous les messages restent aussi dans le tableau de bord Formspree (formule gratuite : 50 messages par mois).

Au premier message envoyé depuis le site en ligne, Formspree demande de confirmer l'adresse e-mail : faites-le une seule fois.

Le formulaire vérifie les champs avant l'envoi (messages d'erreur sous chaque champ, y compris ceux renvoyés par Formspree), désactive le bouton pendant l'envoi et affiche un message de succès ou d'erreur juste en dessous. Un champ piège invisible (`_gotcha`) bloque les robots, et l'objet des e-mails est « Nouveau message depuis le site Altair ».

## WhatsApp

Le numéro 0776700620 est aussi joignable sur WhatsApp (lien `https://wa.me/213776700620` avec un message pré-rempli) :

- bouton flottant en bas à droite, qui apparaît après le hero et se cache sur la section contact ;
- bouton « WhatsApp » dans les contacts (mobile et ordinateur) et dans le menu mobile ;
- lien « Écrivez-nous directement » sous le bouton du formulaire.

## Animations

- Intro du hero en CSS pur (titre mot par mot, étoile qui tourne en apparaissant, halo qui respire) : elle démarre dès le premier affichage, sans attendre le JavaScript.
- Ciel étoilé animé avec étoiles filantes (canvas léger, en pause quand le hero n'est plus visible).
- Grande étoile qui flotte, suit la souris et s'éloigne en tournant quand on descend.
- Défilement inertiel (Lenis) et ancres qui s'arrêtent juste sous l'en-tête.
- Titres révélés mot par mot, cartes qui se redressent en 3D, icônes qui se dessinent, formulaire qui apparaît champ par champ.
- Ordinateur : lumière qui suit la souris sur les cartes, inclinaison 3D des cartes services, boutons magnétiques.
- Fine barre de progression violette sous l'en-tête, avec un point lumineux au bout ; lien actif dans le menu.
- Menu mobile qui s'ouvre en cercle depuis le bouton.

Si le visiteur a activé « réduire les animations » sur son appareil, tout le mouvement est coupé et la page s'affiche directement dans son état final. Sans JavaScript, tout le contenu reste visible.

## Performance

- Police auto-hébergée et préchargée (22 Ko), avec une police de secours calée sur ses mesures : pas de saut de mise en page.
- Scripts chargés en différé ; l'initialisation des animations est découpée en petites tâches pour ne jamais bloquer le navigateur.
- Animations limitées à `transform` et `opacity` (fluides même sur mobile).

## Licences

- GSAP : licence standard gratuite de GreenSock, usage commercial autorisé (https://gsap.com/standard-license)
- Lenis : MIT
- Sora : SIL Open Font License (`assets/fonts/OFL.txt`)
