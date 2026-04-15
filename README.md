# devops

Projet de TP CI/CD pour une application TypeScript avec Jenkins, SonarQube et Nexus.

## Prerequisites

- Docker
- Docker Compose
- npm

Sur Fedora, SonarQube a besoin d'un parametre noyau plus haut :

```bash
sudo sysctl -w vm.max_map_count=524288
```

## Start the stack

```bash
cp .env.example .env
docker compose up -d --build
```

Les interfaces seront ensuite disponibles ici :

- Jenkins: <http://localhost:8082> par defaut dans `.env.example`
- SonarQube: <http://localhost:9000>
- Nexus: <http://localhost:8081>

## Initial passwords

- Jenkins :

```bash
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

- SonarQube : `admin / admin` au premier demarrage
- Nexus :

```bash
docker exec nexus cat /nexus-data/admin.password
```

## Jenkins setup

1. Cree un job Pipeline depuis le repository Git.
2. Ajoute un credential `Secret text` avec l'id `sonar-token`.
3. Ajoute un credential `Username with password` avec l'id `nexus-creds`.
4. Le pipeline expose 3 parametres Jenkins:
   `SONAR_HOST_URL`, `NEXUS_HOST`, `NEXUS_REPO`.
5. Si Jenkins tourne sur ta machine Fedora, garde les valeurs par defaut:
   `http://localhost:9000`, `localhost:8081`, `npm-releases`.
6. Si Jenkins tourne dans le `docker compose`, utilise:
   `http://sonarqube:9000`, `nexus:8081`, `npm-releases`.
7. Dans SonarQube, cree un webhook vers `http://jenkins:8080/sonarqube-webhook/` si tu souhaites aussi utiliser le plugin Jenkins. Le pipeline du repo sait cependant verifier la Quality Gate directement via l'API SonarQube.
8. Dans Nexus, cree un repository npm hosted nomme `npm-releases`.

## Project commands

```bash
npm ci
npm run build
npm test
npm pack
```
