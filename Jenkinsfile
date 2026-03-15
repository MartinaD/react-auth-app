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
                    if ! command -v docker-compose >/dev/null 2>&1; then
                echo "Installing classic docker-compose..."
                curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-\$(uname -s)-\$(uname -m)" -o /usr/local/bin/docker-compose
                chmod +x /usr/local/bin/docker-compose
            fi
                    docker compose -f docker-compose.blue-green.yml pull
                    docker compose -f docker-compose.blue-green.yml up -d green-backend green-frontend nginx
                """
            }
        }

        stage('Health Check') {
            steps {
                echo "Running pre-switch health checks on green..."
                script {
                    def backendHealthy = sh(script: 'curl -f http://localhost:3001/api/health', returnStatus: true) == 0
                    def frontendHealthy = sh(script: 'curl -f http://localhost', returnStatus: true) == 0

                    if (!backendHealthy || !frontendHealthy) {
                        error "Pre-switch health check failed. Green environment is unhealthy."
                    }
                }
            }
        }

        stage('Switch Traffic') {
            steps {
                echo "Switching traffic to green..."
                sh "bash scripts/switch-to-green.sh"
                script { env.TRAFFIC_SWITCHED = 'true' }
            }
        }

        stage('Post-Switch Health Check') {
            steps {
                echo "Running post-switch health checks while green is live..."
                script {
                    // Retry a few times in case services take time to stabilize
                    def retries = 3
                    def success = false
                    for (int i = 0; i < retries; i++) {
                        def backendHealthy = sh(script: 'curl -f http://localhost:3001/api/health', returnStatus: true) == 0
                        def frontendHealthy = sh(script: 'curl -f http://localhost', returnStatus: true) == 0
                        if (backendHealthy && frontendHealthy) {
                            success = true
                            break
                        } else {
                            echo "Post-switch health check failed. Retrying in 5 seconds..."
                            sleep 5
                        }
                    }

                    if (!success) {
                        error "Post-switch health check failed. Rolling back to blue."
                    }
                }
            }
        }
    }

    post {

        success {
            echo "Deployment successful 🎉"
        }

        failure {
            script {
                if (env.TRAFFIC_SWITCHED == 'true') {
                    echo "Deployment failed (health checks failed or traffic switch failed) — rolling back to Blue"
                    checkout scm
                    if (fileExists('scripts/switch-to-blue.sh')) {
                        sh "bash scripts/switch-to-blue.sh"
                        if (fileExists('nginx/active.conf')) {
                            echo "=== nginx/active.conf (after rollback) ==="
                            echo readFile('nginx/active.conf')
                        }
                    } else {
                        echo "scripts/switch-to-blue.sh not found, skipping rollback"
                    }
                } else {
                    echo "Deployment failed. Rollback skipped (failure occurred before Deploy Green)."
                }
            }
        }

        always {
            cleanWs()
        }
    }
}