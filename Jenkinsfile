cat > Jenkinsfile << 'EOF'
pipeline {
    agent any

    environment {
        SONAR_TOKEN  = credentials('sonar-token')
        NEXUS_CREDS  = credentials('nexus-creds')
        NEXUS_URL    = 'http://nexus:8081'
        NEXUS_REPO   = 'npm-releases'
    }

    stages {

        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Test') {
            steps {
                sh 'npm test'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh 'npx sonar-scanner -Dsonar.projectKey=mon-projet-nodejs -Dsonar.host.url=http://sonarqube:9000 -Dsonar.login=${SONAR_TOKEN}'
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Package') {
            steps {
                sh 'npm pack'
            }
        }

        stage('Deploy to Nexus') {
            steps {
                sh """
                    npm config set registry ${NEXUS_URL}/repository/${NEXUS_REPO}/
                    npm config set //${NEXUS_URL}/repository/${NEXUS_REPO}/:_auth \$(echo -n ${NEXUS_CREDS_USR}:${NEXUS_CREDS_PSW} | base64)
                    npm publish *.tgz
                """
            }
        }
    }

    post {
        success { echo '✅ Pipeline OK' }
        failure { echo '❌ Pipeline FAILED' }
    }
}
EOF

git add Jenkinsfile
git commit -m "fix: Jenkinsfile complet avec tous les stages"
git push origin main
