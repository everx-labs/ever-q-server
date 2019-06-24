G_giturl = "https://github.com/tonlabs/ton-gql-server"
G_gitcred = "LaninSSHgit"
G_container = "alanin/container:latest"
G_featureslist = "ci_run"
G_buildstatus = "NotSet"
G_teststatus = "NotSet"
G_codecovstatus = "NotSet"
G_rustfmtstatus = "NotSet"
C_PROJECT = "NotSet"
C_COMMITER = "NotSet"
C_HASH = "NotSet"
C_TEXT = "NotSet"
C_AUTHOR = "NotSet"

def Cargo86_64build(bits) {

    sshagent([G_gitcred]) {
        sh "cargo build --release --features '${G_featureslist}'"
        if (bits != "no32") {
            sh "OPENSSL_DIR='/ssl/' cargo build --release --features '${G_featureslist}' --target=i686-unknown-linux-gnu"
        }
    }
}

def Cargo86_64test(bits) {
    sh "cargo test --release --features '${G_featureslist}'"
    if (bits != "no32") {
        sh "OPENSSL_DIR='/ssl/' cargo test --release --features '${G_featureslist}' --target=i686-unknown-linux-gnu"
    }
}


// Deploy channel
DiscordURL = "https://discordapp.com/api/webhooks/496992026932543489/4exQIw18D4U_4T0H76bS3Voui4SyD7yCQzLP9IRQHKpwGRJK1-IFnyZLyYzDmcBKFTJw"

pipeline {
    agent {
        docker {
            image G_container
            args '--network proxy_nw --security-opt seccomp=${WORKSPACE}/personality.json'
			reuseNode true
        }
    }
    environment {
        RUSTFMT_STATUS = "NotSet"
    }
    options {
        buildDiscarder logRotator(artifactDaysToKeepStr: '', artifactNumToKeepStr: '2', daysToKeepStr: '', numToKeepStr: '10')
        disableConcurrentBuilds()
	lock(quantity: 2, resource: 'sdk_executor')

    }
    stages {
        stage('Initialize') {
            steps {
                script {
                    G_gitproject = G_giturl.substring(0,G_giturl.length()-4)
                    G_gitbranch = sh (script: 'echo ${BRANCH_NAME}', returnStdout: true).trim()
                    C_TEXT = sh (script: 'git show -s --format=%s ${GIT_COMMIT}',returnStdout: true).trim()
                    C_AUTHOR = sh (script: 'git show -s --format=%an ${GIT_COMMIT}',returnStdout: true).trim()
                    C_COMMITER = sh (script: 'git show -s --format=%cn ${GIT_COMMIT}',returnStdout: true).trim()
                    C_HASH = sh (script: 'git show -s --format=%h ${GIT_COMMIT}',returnStdout: true).trim()
                    C_PROJECT = G_giturl.substring(15,G_giturl.length()-4)
                    C_GITURL = sh (script: 'echo ${GIT_URL}',returnStdout: true).trim()
                    C_GITCOMMIT = sh (script: 'echo ${GIT_COMMIT}',returnStdout: true).trim()
                }
            }
        }

        stage('Build') {
			steps {
				Cargo86_64build('no32')
			}
            post {
                success {script{G_buildstatus = "success"}}
                failure {script{G_buildstatus = "failure"}}
            }
        }

        stage('Test') {
            steps {
				Cargo86_64test('no32')
			}
            post {
                success {script{G_teststatus = "success"}}
                failure {script{G_teststatus = "failure"}}
            }
        }
        
		stage ('MakeImage') {
			steps {
			        node ('master'){
				        script {
					        sh "pwd"
					        sh "ls -la"
				        }
				}
			}
		}
    }

    post {
        always {
            script {
                cleanWs notFailBuild: true
                currentBuild.description = C_TEXT
                string DiscordFooter = "Build duration is " + currentBuild.durationString
                DiscordTitle = "Job ${JOB_NAME} from GitHub " + C_PROJECT
                DiscordDescription = C_COMMITER + " pushed commit " + C_HASH + " by " + C_AUTHOR + " with a message '" + C_TEXT + "'" + "\n" \
                + "Build number ${BUILD_NUMBER}" + "\n" \
                + "Build: **" + G_buildstatus + "**" + "\n" \
                + "Tests: **" + G_teststatus + "**" + "\n" \
                + "Test coverage: **" + G_codecovstatus + "**" + "\n" \
                + "Rustfmt: **" + G_rustfmtstatus + "**"
                discordSend description: DiscordDescription, footer: DiscordFooter, link: RUN_DISPLAY_URL, successful: currentBuild.resultIsBetterOrEqualTo('SUCCESS'), title: DiscordTitle, webhookURL: DiscordURL
            }          
        }

    }
}
