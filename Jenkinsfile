pipeline {
    agent any
    
    environment {
        // Docker image names
        BACKEND_IMAGE = 'bozhinovskam/react-auth-backend:latest'
        FRONTEND_IMAGE = 'bozhinovskam/react-auth-frontend:latest'
        
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
                        """
                        echo "Backend image built successfully: ${BACKEND_IMAGE}"
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
                        """
                        echo "Frontend image built successfully: ${FRONTEND_IMAGE}"
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

