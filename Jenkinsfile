pipeline {
    agent any

    environment {
        NEXUS_HOST = 'nexus:8081'
        NEXUS_REPO = 'npm-releases'
        SONAR_HOST = 'http://sonarqube:9000'
    }

    stages {

        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Test') {
            steps {
                sh 'npm test'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                    sh '''
                        npm run sonar -- \
                          -Dsonar.host.url=$SONAR_HOST \
                          -Dsonar.token=$SONAR_TOKEN
                    '''
                }
            }
        }

        stage('Quality Gate') {
            steps {
                withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                    sh 'node scripts/wait-for-quality-gate.mjs'
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
                withCredentials([usernamePassword(credentialsId: 'nexus-creds', usernameVariable: 'NEXUS_USER', passwordVariable: 'NEXUS_PASS')]) {
                    sh '''
                        set -eu
                        PACKAGE_FILE=$(ls -1 *.tgz | tail -n 1)
                        NEXUS_REGISTRY="http://${NEXUS_HOST}/repository/${NEXUS_REPO}/"
                        NEXUS_AUTH=$(printf "%s:%s" "$NEXUS_USER" "$NEXUS_PASS" | base64 -w 0)
                        NPM_CONFIG_USERCONFIG="$WORKSPACE/.npmrc"

                        trap 'rm -f "$NPM_CONFIG_USERCONFIG"' EXIT

                        npm config set registry "$NEXUS_REGISTRY" --userconfig "$NPM_CONFIG_USERCONFIG"
                        npm config set "//${NEXUS_HOST}/repository/${NEXUS_REPO}/:_auth" "$NEXUS_AUTH" --userconfig "$NPM_CONFIG_USERCONFIG"
                        npm config set "//${NEXUS_HOST}/repository/${NEXUS_REPO}/:always-auth" true --userconfig "$NPM_CONFIG_USERCONFIG"
                        npm publish "$PACKAGE_FILE" --registry "$NEXUS_REGISTRY" --userconfig "$NPM_CONFIG_USERCONFIG"
                    '''
                }
            }
        }
    }

    post {
        success { echo '✅ Pipeline OK' }
        failure { echo '❌ Pipeline FAILED' }
    }
}
