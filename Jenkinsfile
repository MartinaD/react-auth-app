pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
    }

    tools {
        nodejs "Node"
    }

    environment {
        REGISTRY = "localhost:8082/docker-hosted"

        BACKEND_IMAGE = "${REGISTRY}/react-auth-backend:${BUILD_NUMBER}"
        FRONTEND_IMAGE = "${REGISTRY}/react-auth-frontend:${BUILD_NUMBER}"

        BACKEND_LATEST = "${REGISTRY}/react-auth-backend:latest"
        FRONTEND_LATEST = "${REGISTRY}/react-auth-frontend:latest"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install & Test') {
            parallel {

                stage('Backend Test') {
                    steps {
                        dir('backend') {
                            sh '''
                                npm ci
                                npm test
                            '''
                        }
                    }
                }

                stage('Frontend Test') {
                    steps {
                        dir('frontend') {
                            sh '''
                                npm ci
                                npm test
                            '''
                        }
                    }
                }
            }
        }

        stage('Build Docker Images') {
            parallel {

                stage('Backend Image') {
                    steps {
                        dir('backend') {
                            sh """
                                docker build -t ${BACKEND_IMAGE} .
                                docker tag ${BACKEND_IMAGE} ${BACKEND_LATEST}
                            """
                        }
                    }
                }

                stage('Frontend Image') {
                    steps {
                        dir('frontend') {
                            sh """
                                docker build -t ${FRONTEND_IMAGE} .
                                docker tag ${FRONTEND_IMAGE} ${FRONTEND_LATEST}
                            """
                        }
                    }
                }
            }
        }

        stage('Push Images') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'nexus-docker',
                    usernameVariable: 'NEXUS_USER',
                    passwordVariable: 'NEXUS_PASS'
                )]) {

                    sh """
                        echo \$NEXUS_PASS | docker login ${REGISTRY} -u \$NEXUS_USER --password-stdin

                        docker push ${BACKEND_IMAGE}
                        docker push ${BACKEND_LATEST}

                        docker push ${FRONTEND_IMAGE}
                        docker push ${FRONTEND_LATEST}
                    """
                }
            }
        }

        stage('Deploy Green') {
            steps {
                sh """
                    if ! docker compose version 2>/dev/null; then
                        echo "Installing docker-compose-plugin..."
                        apt-get update -qq && apt-get install -y docker-compose-plugin || true
                    fi
                    docker compose -f docker-compose.blue-green.yml pull
                    docker compose -f docker-compose.blue-green.yml up -d green-backend green-frontend
                """
            }
        }

        stage('Health Check') {
            steps {
                retry(5) {
                    sh '''
                        sleep 5
                        docker exec green-backend curl -f http://localhost:3001/api/health
                    '''
                }
            }
        }

        stage('Switch Traffic') {
            steps {
                sh "bash scripts/switch-to-green.sh"
            }
        }
    }

    post {

        success {
            echo "Deployment successful 🎉"
        }

        failure {
            echo "Deployment failed — rolling back"
            script {
                checkout scm

                echo "=== DEBUG: workspace (after checkout) ==="
                sh "pwd && echo '---' && ls -la && echo '--- scripts/ ---' && ls -la scripts/ 2>/dev/null || echo 'scripts/ does not exist'"

                echo "=== DEBUG: Docker — does Jenkins see app-nginx? ==="
                sh "docker ps -a | grep -E 'app-nginx|CONTAINER' || echo 'No app-nginx in docker ps'"

                echo "=== DEBUG: nginx reload attempt (to see actual error) ==="
                sh "docker exec app-nginx nginx -s reload 2>&1 || true"

                if (fileExists('scripts/switch-to-blue.sh')) {
                    echo "Found scripts/switch-to-blue.sh, running rollback..."
                    sh "bash scripts/switch-to-blue.sh"
                    if (fileExists('nginx/active.conf')) {
                        echo "=== nginx/active.conf (after rollback) ==="
                        echo readFile('nginx/active.conf')
                    } else {
                        echo "nginx/active.conf does not exist in workspace"
                    }
                } else {
                    echo "scripts/switch-to-blue.sh not found, skipping rollback"
                }
            }
        }

        always {
            cleanWs()
        }
    }
}