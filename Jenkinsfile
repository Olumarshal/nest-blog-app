pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = "olmarsh"
        DOCKER_IMAGE = "${DOCKER_REGISTRY}/blog-app:latest"
    }

    stages {
        stage('Install Dependencies') {
            steps {
                script {
                    // Install node dependencies
                    sh 'npm install'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    // Build the Docker image
                    sh "docker build -t ${DOCKER_IMAGE} ."
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                script {
                    // Use withCredentials block to securely pass Docker credentials
                    withCredentials([usernamePassword(credentialsId: 'dockerHub', usernameVariable: "DOCKER_USERNAME", passwordVariable: "DOCKER_PASSWORD")]) {
                        // Login to DockerHub
                        sh 'echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin'
                        
                        // Push the Docker image to the registry
                        sh "docker push ${DOCKER_IMAGE}"
                    }
                }
            }
        }

        stage('Cleanup') {
            steps {
                script {
                    // Cleanup dangling Docker images
                    sh "docker rmi ${DOCKER_IMAGE}"
                }
            }
        }
    }

    post {
        always {
            // Archive artifacts or clean up workspace if needed
            cleanWs()
        }
    }
}
