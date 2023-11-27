import {mapActions, mapGetters} from 'vuex';
import database from 'better-sqlite3';
import activeWin from 'active-win';
import url from 'url';
import os from 'os';
import fs from 'fs';

const PLATFORM = os.platform();

export default {
    name: 'TrackUserActivityMixin',

    data() {
        return {
            chromePath: null,
            firefoxPath: null,
            prevURL: null,
            isUnproductive: false,
        };
    },

    computed: mapGetters('Employment', ['currentEmployment']),

    created() {
        if (PLATFORM == 'win32') {
            this.chromePath = os.homedir() + '\\AppData\\Local\\Google\\Chrome\\User Data\\';
            this.firefoxPath = this.getFirefoxPath(os.homedir() + '\\AppData\\Roaming\\Mozilla\\Firefox\\');
        } else if (PLATFORM == 'darwin') {
            this.chromePath = os.homedir() + '/Library/Application Support/Google/Chrome/';
            this.firefoxPath = this.getFirefoxPath(os.homedir() + '/Library/Application Support/Firefox/');
        } else if (PLATFORM == 'linux') {
            this.chromePath = os.homedir() + '/.config/google-chrome/';
            this.firefoxPath = this.getFirefoxPath(os.homedir() + '/.mozilla/firefox/');
        }
    },

    methods: {
        saveActivity(type, activity, isUnproductive) {
            let apps = JSON.parse(sessionStorage.getItem('userActivities'));
            if (!apps) {
                apps = {};
            } else {
                try {
                    if (apps[activity]) {
                        apps[activity].time += 1;
                    } else {
                        apps[activity] = {
                            type: type,
                            time: 1,
                            isUnproductive: isUnproductive
                        };
                    }
                } catch (e) {
                    return;
                }
            }
            sessionStorage.setItem('userActivities', JSON.stringify(apps));
        },

        async getCurrentActiveWindow() {
            let data = await activeWin();
            let splitStr = data.owner.name.split('.');
            let appName = splitStr[splitStr.length - 1] == 'exe' ? splitStr[0] : data.owner.name;
            if (data) {
                this.saveActivity('app', appName, false);
            }
        },

        async getActiveBrowserTabURL(unproductiveSites, isSiteRestrictionAllowed) {
            let data = await activeWin();
            let tabTitle = '';
            let browserName = '';
            let historyPath = '';
            let historyCopyPath = '';
            let query;

            try {
                tabTitle = data.title.split(' - Google Chrome')[0];
                tabTitle = tabTitle.split(' - Mozilla Firefox')[0];
                tabTitle = tabTitle.split('\'').join('\'\'');
                browserName = data.owner.name;
            } catch (e) {
                return;
            }

            if (!tabTitle) return;

            if (browserName == 'Google-chrome' || browserName == 'Google Chrome' || browserName == 'chrome.exe') {
                let chromeLocalState = fs.readFileSync(this.chromePath + 'Local State', 'utf-8');
                let chromeProfile = JSON.parse(chromeLocalState).profile.last_used;
                chromeProfile = chromeProfile ? chromeProfile : 'Default';
                historyPath = this.chromePath + chromeProfile + `${PLATFORM == 'win32' ? '\\History' : '/History'}`;
                historyCopyPath = this.chromePath + 'History-copy';
                query = `SELECT * FROM urls WHERE title='${tabTitle}'`;
            } else if (browserName == 'Firefox' || browserName == 'firefox.exe') {
                historyPath = this.firefoxPath + 'places.sqlite';
                historyCopyPath = this.firefoxPath + 'places-copy.sqlite';
                query = `SELECT * FROM moz_places WHERE title='${tabTitle}'`;
            } else {
                return;
            }

            return new Promise((resolve, reject) => {
                fs.copyFile(historyPath, historyCopyPath, (err) => {
                    if (err) {
                        reject(null);
                    }

                    let historyDB = new database(historyCopyPath, { fileMustExist: true });
                    let sqlCommand = historyDB.prepare(query);
                    let fullURL = '';

                    let validLinks = sqlCommand.all().filter(function(item) {
                        return !item.url.includes('localhost');
                    });

                    if (validLinks.length < 1) {
                        if (this.prevURL) {
                            this.saveActivity('site', this.prevURL, this.isUnproductive);
                        }
                        reject(null);
                    }

                    try {
                        fullURL = tabTitle.split(' - Google Search').length > 1
                            ? validLinks[0].url
                            : validLinks.pop().url;
                    } catch (e) {
                        reject(null);
                    }

                    let finalUrl = url.parse(fullURL, true).host;
                    if (finalUrl && finalUrl.indexOf('.') < 0) {
                        reject(null);
                    }

                    let unproductiveSite;
                    if (isSiteRestrictionAllowed && finalUrl && unproductiveSites) {
                        unproductiveSite = unproductiveSites.find(site => {
                            // next line is for websites with 'www' subdomain only
                            let siteWithoutSubdomain = site.site_url.replace(/^www\./, '');
                            return finalUrl.includes(siteWithoutSubdomain) || siteWithoutSubdomain.includes(finalUrl);
                        });
                    }

                    this.isUnproductive = unproductiveSite ? true : false;

                    if (finalUrl) {
                        this.prevURL = finalUrl;
                        this.saveActivity('site', finalUrl, this.isUnproductive);
                    }

                    let resolveValue = {
                        siteName: tabTitle,
                        isUnproductive: false
                    };

                    if (isSiteRestrictionAllowed && unproductiveSite) {
                        resolveValue = {
                            siteName: unproductiveSite.name,
                            isUnproductive: this.isUnproductive
                        };
                    }
                    resolve(resolveValue);
                });
            });
        },

        getFirefoxPath(initialPath) {
            let data = fs.readFileSync(initialPath + 'profiles.ini', 'utf8');
            let lines = data.split('\n');
            let line = '';

            if (PLATFORM == 'win32') {
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].indexOf('Default=') > -1) {
                        line = lines[i];
                        break;
                    }
                }
                line = line.split('/')[1].trim();
                return this.initialPath + 'Profiles\\' + line + '\\';
            }  else {
                lines = PLATFORM == 'darwin' ? lines : [...lines].reverse();

                for (let i = lines.length - 1; i >= 0; i--) {
                    if (lines[i].indexOf('Default=') > -1) {
                        line = lines[i];
                        break;
                    }
                }
                line = line.split('Default=')[1];
                return initialPath + line + '/';
            }
        },
    }
}
