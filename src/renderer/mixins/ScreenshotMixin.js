import electron from 'electron';
import {mapActions, mapGetters, mapState} from 'vuex';
import {execFile} from 'child_process';
import pngquant from 'pngquant-bin';

export default {
    name: 'ScreenshotMixin',

    data () {
        return {
            desktopCapturer: electron.desktopCapturer,
            electronScreen: electron.remote.screen,
            screenshotInterval: null,
            randomTime: 0,
        }
    },

    computed: {
        ...mapGetters('Employment', ['currentEmployment']),
        ...mapGetters('Tasks', ['runningTaskAssignment']),
        ...mapState('Timelogging', ['currentTimelog']),
    },

    methods: {
        ...mapActions('Screenshots', ['fetchUploadScreenshotsAmazon', 'createScreenshot']),
        ...mapActions('Timelogging', ['createEmployeeMouseKeyboardActivities']),

        generateRandomNumber(screenshotIntervalLower, screenshotIntervalUpper) {
            return Math.floor(Math.random()
                * (screenshotIntervalUpper - screenshotIntervalLower + 1)
                + screenshotIntervalLower);
        },

        startRandomScreenshot(screenshotIntervalLower, screenshotIntervalUpper) {
            // randomize based on screenshot intervals
            this.randomTime = this.generateRandomNumber(
                screenshotIntervalLower, screenshotIntervalUpper) * 1000 * 60;
            clearTimeout(sessionStorage['screenshotTimer']);
            sessionStorage.setItem('screenshotTimer', null);
            this.screenshotInterval = setTimeout(() => {
                if (this.isOnline) {
                    this.executeScreenshot();
                }
                this.startRandomScreenshot(
                    screenshotIntervalLower,
                    screenshotIntervalUpper
                );
            }, this.randomTime);
            sessionStorage.setItem('screenshotTimer', this.screenshotInterval);
            sessionStorage.setItem('screenshotTimerIsRunning', true);
        },

        endRandomScreenshot() {
            clearTimeout(sessionStorage['screenshotTimer']);
            this.screenshotInterval = null;
            sessionStorage.setItem('screenshotTimer', null);
            sessionStorage.setItem('screenshotTimerIsRunning', false);
        },

        async executeScreenshot() {
            let screenshotFiles = [];
            let sourcesArray = [];

            const screenSize = this.getScreenSize();
            let options = { types: ['screen'], thumbnailSize: screenSize };

            this.desktopCapturer.getSources(options).then( async (sources) => {
                if (!sources) {
                    console.log('Error in retrieving screenshots');
                    return;
                }
                sourcesArray = sources.map(async(display) => { // map instead of forEach
                    const screenshotImg = display.thumbnail.resize({ height: 450 }).toPNG()
                    const compressedImg = await this.compressImage(screenshotImg);
                    return compressedImg;
                });

                screenshotFiles = await Promise.all(sourcesArray); // resolving all promises
                this.updateMouseAndKeyboardActivities().then((response) => {
                    this.uploadScreenshotToBucket(screenshotFiles, response);
                });
            });
        },

        getScreenSize() {
            const screenSize = this.electronScreen.getPrimaryDisplay().workAreaSize;
            return {
                width: screenSize.width,
                height: screenSize.height
            };
        },

        updateMouseAndKeyboardActivities() {
            return new Promise( async(resolve, reject) => {
                // save duration for mouse and keyboard activity
                let mkActivities = JSON.parse(sessionStorage.getItem('mouseKeyboardActivities'));
                if (mkActivities) {
                    mkActivities['duration'] = this.randomTime / 1000;
                    if (!mkActivities['mouse']) {
                        mkActivities['mouse'] = 0;
                    }
                    if (!mkActivities['keyboard']) {
                        mkActivities['keyboard'] = 0;
                    }
                    sessionStorage.setItem('mouseKeyboardActivities', JSON.stringify(mkActivities));
                    let res = await this.createEmployeeMouseKeyboardActivities({
                        'employment': this.currentEmployment.pk,
                        'mouse_keyboard_activities': JSON.parse(sessionStorage.getItem('mouseKeyboardActivities'))
                    });
                    if (res.error) {
                        reject(res.error);
                    } else {
                        resolve(res);
                    }
                }
            });
        },

        async uploadScreenshotToBucket(sources, mouseKeyboardActivity) {
            let payload = {
                file_type: 'image/png',
                employment_id: this.currentEmployment.pk,
            };
            if (this.runningTaskAssignment) {
                payload['task_id'] = this.runningTaskAssignment.task.pk
            }
            const amazon = await this.fetchUploadScreenshotsAmazon(payload);
            const urlCreator = window.URL || window.webkitURL;

            let screenNo = 0;
            let screenshotLinks = {};
            let keys = [];
            sources.forEach(source => {
                const formData = new FormData();
                const blob = new Blob([source], {type: 'image/png'});
                screenNo++;
                let key = amazon.key + '-screen-' + screenNo;
                keys.push(key);
                formData.append('key', key);
                formData.append('acl', amazon.acl);
                formData.append('Content-Type', amazon.content_type);
                formData.append('Policy', amazon.policy);
                formData.append('X-Amz-Signature', amazon.signature);
                formData.append('x-amz-server-side-encryption', amazon.server_side_encryption);
                formData.append('X-Amz-Algorithm', amazon.algorithm);
                formData.append('X-Amz-Date', amazon.date);
                formData.append('X-Amz-Credential', amazon.credential);

                if (amazon.success_action_redirect) {
                    formData.append('success_action_redirect', amazon.success_action_redirect);
                }

                let imageUrl = urlCreator.createObjectURL(blob);
                screenshotLinks['screen' + screenNo] = imageUrl;

                for (let key in amazon.metas) {
                    formData.append('x-amz-meta-' + key, amazon.metas[key]);
                }
                formData.append('file', blob);

                return new Promise((resolve, reject) => {
                    const request = new XMLHttpRequest();
                    request.addEventListener('readystatechange', async (e) => {
                        if (request.readyState === request.DONE && request.status >= 200 && request.status < 300) {
                            resolve(amazon.key.split('/').pop());
                        }
                    });

                    request.open('POST', amazon.action, true);
                    request.send(formData);
                });

            });
            let screenshotForm = {
                keys,
                timelog: this.currentTimelog.pk,
                mouse_keyboard_activity: mouseKeyboardActivity.pk,
            }

            if (this.runningTaskAssignment) {
                screenshotForm['task'] = this.runningTaskAssignment.task.pk
            }

            let res = await this.createScreenshot(screenshotForm);

            if (res.error) {
                console.error(res.error);
            } else {
                let data = {
                    screenshotLinks: screenshotLinks,
                    screenshotNotif: true
                }
                electron.ipcRenderer.send('create-notif', data);
            }

        },

        compressImage(input) {
            const args = ['-'];
            args.push('--quality', '20-40');

            return new Promise((resolve, reject) => {
                const subprocess = execFile(pngquant, args, {
                    encoding: null,
                    maxBuffer: Infinity,
                    input
                }, (err, stdout) => {
                    if (err) return reject(err);
                    else resolve(stdout);
                })
                if (input) {
                    subprocess.stdin.end(input);
                }
            })
        }
    }
  }
