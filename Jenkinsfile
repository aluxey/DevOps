pipeline {
    agent any

    parameters {
        string(name: 'SONAR_HOST_URL', defaultValue: 'http://localhost:9000', description: 'SonarQube URL. Use http://sonarqube:9000 if Jenkins runs in the Docker Compose network.')
        string(name: 'NEXUS_HOST', defaultValue: 'localhost:8081', description: 'Nexus host:port. Use nexus:8081 if Jenkins runs in the Docker Compose network.')
        string(name: 'NEXUS_REPO', defaultValue: 'npm-releases', description: 'Nexus npm hosted repository name.')
    }

    stages {

        stage('Install') {
            steps {
                echo "Using SonarQube at ${params.SONAR_HOST_URL} and Nexus at ${params.NEXUS_HOST}/${params.NEXUS_REPO}"
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
                          -Dsonar.host.url=${SONAR_HOST_URL} \
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
