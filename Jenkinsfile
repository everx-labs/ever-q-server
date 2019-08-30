G_giturl = "https://github.com/tonlabs/ton-q-server.git"
G_gitcred = "LaninSSHgit"
G_container = "alanin/container:latest"
G_gqlimage = "tonlabs/q-server"
G_buildstatus = "NotSet"
G_MakeImage = "NotSet"
C_PROJECT = "NotSet"
C_COMMITER = "NotSet"
C_HASH = "NotSet"
C_TEXT = "NotSet"
C_AUTHOR = "NotSet"

// Deploy channel
DiscordURL = "https://discordapp.com/api/webhooks/496992026932543489/4exQIw18D4U_4T0H76bS3Voui4SyD7yCQzLP9IRQHKpwGRJK1-IFnyZLyYzDmcBKFTJw"

pipeline {
    agent none

    options {
        buildDiscarder logRotator(artifactDaysToKeepStr: '', artifactNumToKeepStr: '2', daysToKeepStr: '', numToKeepStr: '10')
        disableConcurrentBuilds()

    }
    stages {
		stage('build container up') {
			agent {
				docker {
					image G_container
					args '--network proxy_nw'
					reuseNode true
				}
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
						sh 'npm install'
					}
					post {
						success {script{G_buildstatus = "success"}}
						failure {script{G_buildstatus = "failure"}}
					}
				}


				stage ('Stashing') {
					steps {
						script {
							stash excludes: '.git, Jenkinsfile', includes: '*, server/**, node_modules/**', name: 'wholedir'
							}
					}
				}
			}
		post {
			always {script{cleanWs notFailBuild: true}}
		}

		}

		stage ('MakeImage') {
            when {
                branch 'master'
                beforeAgent true
            }
			agent {
				node {label 'master'}
			}
				steps {
					script {
						dir ('node') {
							unstash 'wholedir'
							sh '''
							echo 'FROM node:10.11.0-stretch' > Dockerfile
							echo 'WORKDIR /home/node' >> Dockerfile
							echo 'USER node' >> Dockerfile
							echo 'ADD . /home/node' >>Dockerfile
							echo 'EXPOSE 4000' >> Dockerfile
							echo 'ENTRYPOINT ["node", "index.js"]' >> Dockerfile
							'''
							docker.withRegistry('', 'dockerhubLanin') {
								def wimage = docker.build(
                                    "${G_gqlimage}:${env.BUILD_ID}",
                                    "--label 'git-commit=${GIT_COMMIT}'"
                                )
								wimage.push()
								wimage.push('latest')
							}
						}
					}
				}
			post {
                success {script{G_MakeImage = "success"}}
                failure {script{G_MakeImage = "failure"}}
				always {script{cleanWs notFailBuild: true}}
            }
		}
    }

    post {
        always {
            script {
                currentBuild.description = C_TEXT
                string DiscordFooter = "Build duration is " + currentBuild.durationString
                DiscordTitle = "Job ${JOB_NAME} from GitHub " + C_PROJECT
                DiscordDescription = C_COMMITER + " pushed commit " + C_HASH + " by " + C_AUTHOR + " with a message '" + C_TEXT + "'" + "\n" \
                + "Build number ${BUILD_NUMBER}" + "\n" \
                + "Build: **" + G_buildstatus + "**" + "\n" \
                + "Put Image: **" + G_MakeImage + "**"
                discordSend description: DiscordDescription, footer: DiscordFooter, link: RUN_DISPLAY_URL, successful: currentBuild.resultIsBetterOrEqualTo('SUCCESS'), title: DiscordTitle, webhookURL: DiscordURL
            }
        }

    }
}
