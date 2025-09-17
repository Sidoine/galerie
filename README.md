# Galerie photo

Lancer la galerie sur Docker :

```
    docker build -t galerie .
    docker run --rm -p 5000:5000 --env DATABASE_URL=postgres://postgres:plop@192.168.2.77:5433/galerie galerie
```

## Outil PowerShell Seafile (Token API)

Un script utilitaire `scripts/Get-SeafileApiToken.ps1` permet de récupérer un token API Seafile via l'endpoint `/api2/auth-token/`.

Exemple d'utilisation :

```
pwsh ./scripts/Get-SeafileApiToken.ps1 -ServerUrl https://seafile.example.com -Username user@example.com -PasswordSecure (Read-Host -AsSecureString)
```

Options rapides : `-SetEnv` pour créer `$env:SEAFILE_API_TOKEN`, `-OutFile` pour écrire dans un fichier, `-Quiet` pour n'afficher que le token.

Voir `scripts/README-SeafileToken.md` pour les détails.
