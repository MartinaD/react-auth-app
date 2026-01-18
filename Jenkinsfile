pipeline {
    agent any
    
    environment {
        // Docker image names
        BACKEND_IMAGE = 'bozhinovskam/react-auth-backend:latest'
        FRONTEND_IMAGE = 'bozhinovskam/react-auth-frontend:latest'
        
        // Nexus configuration
        // Use localhost since Jenkins uses host's Docker daemon
        // Make sure localhost:8082 is in Docker Desktop's insecure-registries
        NEXUS_HOST = "localhost:8082"
        NEXUS_REPOSITORY = 'docker-hosted'
        NEXUS_BACKEND_IMAGE = "${NEXUS_HOST}/${NEXUS_REPOSITORY}/react-auth-backend:${BUILD_NUMBER}"
        NEXUS_FRONTEND_IMAGE = "${NEXUS_HOST}/${NEXUS_REPOSITORY}/react-auth-frontend:${BUILD_NUMBER}"
        NEXUS_BACKEND_IMAGE_LATEST = "${NEXUS_HOST}/${NEXUS_REPOSITORY}/react-auth-backend:latest"
        NEXUS_FRONTEND_IMAGE_LATEST = "${NEXUS_HOST}/${NEXUS_REPOSITORY}/react-auth-frontend:latest"
    }
    
    stages {
        stage('Checkout') {
            steps {
                script {
                    echo "Checking out code from repository..."
                checkout scm
                }
            }
        }
        
        stage('Build Backend') {
            steps {
                dir("backend") {
                    script {
                        echo "Building backend Docker image..."
                    sh """
                        docker build -t ${BACKEND_IMAGE} -f Dockerfile .
                        docker tag ${BACKEND_IMAGE} ${NEXUS_BACKEND_IMAGE}
                        docker tag ${BACKEND_IMAGE} ${NEXUS_BACKEND_IMAGE_LATEST}
                    """
                        echo "Backend image built successfully: ${BACKEND_IMAGE}"
                        echo "Tagged for Nexus: ${NEXUS_BACKEND_IMAGE}"
                    }
                }
            }
        }
        
        stage('Build Frontend') {
            steps {
                dir("frontend") {
                    script {
                        echo "Building frontend Docker image..."
                    sh """
                        docker build -t ${FRONTEND_IMAGE} -f Dockerfile .
                        docker tag ${FRONTEND_IMAGE} ${NEXUS_FRONTEND_IMAGE}
                        docker tag ${FRONTEND_IMAGE} ${NEXUS_FRONTEND_IMAGE_LATEST}
                    """
                        echo "Frontend image built successfully: ${FRONTEND_IMAGE}"
                        echo "Tagged for Nexus: ${NEXUS_FRONTEND_IMAGE}"
                    }
                }
            }
        }
        
        stage('Push to Nexus') {
            steps {
                script {
                    echo "Pushing Docker images to Nexus..."
                    echo "Using Nexus at: ${NEXUS_HOST}"
                    
                    // Login to Nexus
                    sh """
                        echo 'admin123' | docker login ${NEXUS_HOST} -u admin --password-stdin
                    """
                    echo "✅ Successfully logged in to Nexus"
                    
                    // Push all images
                    sh """
                        docker push ${NEXUS_BACKEND_IMAGE}
                        docker push ${NEXUS_BACKEND_IMAGE_LATEST}
                        docker push ${NEXUS_FRONTEND_IMAGE}
                        docker push ${NEXUS_FRONTEND_IMAGE_LATEST}
                    """
                    
                    echo "✅ All images pushed to Nexus successfully!"
                    echo "Backend: ${NEXUS_BACKEND_IMAGE} and ${NEXUS_BACKEND_IMAGE_LATEST}"
                    echo "Frontend: ${NEXUS_FRONTEND_IMAGE} and ${NEXUS_FRONTEND_IMAGE_LATEST}"
                    echo "View in Nexus UI: http://localhost:8081 → Browse → docker-hosted"
                }
            }
        }
    }
    
    
    post {
        success {
            echo "Pipeline completed successfully! ✅"
            script {
                echo "Build #${BUILD_NUMBER} succeeded"
            }
        }
        
        failure {
            echo "Pipeline failed! ❌"
            script {
                echo "Build #${BUILD_NUMBER} failed"
            }
        }
        
        always {
            echo "Cleaning up workspace..."
            cleanWs()
        }
    }
}

