'use strict';

import {
    app, BrowserWindow, ipcMain,
    Tray, Menu, screen, MenuItem
} from 'electron';
import { autoUpdater } from 'electron-updater';
const log = require('electron-log');
import path from 'path';
import AutoLaunch from 'auto-launch';

app.commandLine.appendSwitch("disable-background-timer-throttling");
// fix transparent window issues
app.commandLine.appendSwitch('enable-transparent-visuals');
app.commandLine.appendSwitch('disable-gpu');
app.allowRendererProcessReuse = false;

let tray;
let mainWindow;
let contextMenu;
let forceQuit = false;
let trayIconOut = process.env.NODE_ENV === 'development'
    ? 'src/renderer/assets/icons/tray_out@2x.png' //change icon
    : path.join(__dirname, '/assets/icons/tray_out@2x.png');
let trayIconIn = process.env.NODE_ENV === 'development'
    ? 'src/renderer/assets/icons/tray_in@2x.png' //change icon
    : path.join(__dirname, '/assets/icons/tray_in@2x.png');
let trayIconInNoTask = process.env.NODE_ENV === 'development'
    ? 'src/renderer/assets/icons/tray_in_no_task@2x.png' //change icon
    : path.join(__dirname, '/assets/icons/tray_in_no_task@2x.png');


/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
    global.__static = path.join(__dirname, '/static').replace(/\\/g, '\\\\');
}


autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...');
});
autoUpdater.on('update-available', () => {
    log.info('Update available.');
});
autoUpdater.on('update-not-available', () => {
    log.info('Update not available.');
});
autoUpdater.on('error', (err) => {
    log.error('Error in auto-updater. ' + err);
});
autoUpdater.on('download-progress', (progressObj) => {
    let log_message = 'Download speed: ' + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + '/' + progressObj.total + ')';
    log.info(log_message);
});
autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update-downloaded');
    log.info('Update downloaded');
});

const bposeatsAutoLauncher = new AutoLaunch({
    name: 'ApplyBPO Time Tracker',
    path: process.env.ARGV0
});

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            if (!mainWindow.isVisible()) {
                mainWindow.show();
            }
            mainWindow.focus();
        }
    });
};

const winURL = process.env.NODE_ENV === 'development'
    ? 'http://localhost:9080'
    : `file://${__dirname}/index.html`;

const screenshotNotifURL = process.env.NODE_ENV === 'development'
    ? `file://${process.env.PWD}/dist/electron/screenshot_notification.html`
    : `file://${__dirname}/screenshot_notification.html`;
const notifURL = process.env.NODE_ENV === 'development'
    ? `file://${process.env.PWD}/dist/electron/notification.html`
    : `file://${__dirname}/notification.html`;

const activityBarURL = process.env.NODE_ENV === 'development'
    ? `file://${process.env.PWD}/dist/electron/activity_bar.html`
    : `file://${__dirname}/activity_bar.html`;

function createWindow() {
    /**
   * Initial window options
   */
    mainWindow = new BrowserWindow({
        title: `ApplyBPO Time Tracker | v${app.getVersion()}`,
        height: 650,
        minHeight: 650,
        minWidth: 800,
        useContentSize: true,
        icon:  process.env.NODE_ENV === 'development'
        ? 'src/renderer/assets/icons/icon.png' //change icon
        : path.join(__dirname, '/assets/icons/icon.png'),
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
            enableRemoteModule: true
        }
    });

    mainWindow.loadURL(winURL);

    mainWindow.webContents.setBackgroundThrottling(false);

    mainWindow.webContents.on('crashed', () => {
        mainWindow.loadURL(winURL);
    });


    mainWindow.on('closed', () => {
        if (process.platform !== 'darwin') {
            mainWindow = null;
        }
    });

    mainWindow.on('close', async function(e) {
        // prevent program from closing or run program in the bg if not forced quit
        if (!forceQuit) {
            e.preventDefault();
            mainWindow.hide();
        } else {
            e.preventDefault();
            mainWindow.webContents.send('toggle-timelog', false);
            await mainWindow.webContents.session.clearStorageData();
            if (activityBarWindow) {
                activityBarWindow.destroy();
            }
            if (notifWindow) {
                notifWindow.destroy();
            }
            tray.destroy();
            mainWindow.destroy();
            app.quit();
        }
    });
};

function createTrayContextMenu() {
    contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show/Hide',
            click: function(event) {
                toggleWindow();
            }
        }, {
            label: 'Quit',
            click: function() {
                forceQuit = true;
                mainWindow.close();
            }
        }
    ]);

    tray.setContextMenu(contextMenu);
}

function createTray() {
    tray = new Tray(trayIconOut) //change icon
    createTrayContextMenu();
    tray.on('click', () => {
        toggleWindow();
    });
};

function createAppMenu() {
    let menuTemplate = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Sync',
                    accelerator: 'CmdOrCtrl+R',
                    click: function () {
                        mainWindow.webContents.send('sync');
                    }
                }
            ]
        }, {
            // don't remove, these are needed to allow shortcuts in darwin
            label: "Edit",
            submenu: [
                { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
                { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
                { type: "separator" },
                { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
                { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
                { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
                { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
            ]
        }
    ]

    let appMenu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(appMenu);
};

let activityBarWindow;
function createActivityBarWindow() {
    let display = screen.getPrimaryDisplay();
    let x = (display.workArea.width / 2) - 210;
    let y = display.workArea.y + 8;
    activityBarWindow = new BrowserWindow({
        width: 420,
        height: 32,
        show: false,
        frame: false,
        resizable: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        x: x,
        y: y,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
            enableRemoteModule: true,
            devTools: false
        }
    });
    activityBarWindow.loadURL(activityBarURL);
    activityBarWindow.setVisibleOnAllWorkspaces(true);
    activityBarWindow.showInactive();
};

let notifWindowIDs = []
let notifWindow;
function createNotificationWindow(data) {
    let display = screen.getPrimaryDisplay();
    let screenWidth = display.workArea.width;
    let screenHeight = display.workArea.height;
    let screenX = display.workArea.x;
    let screenY = display.workArea.y;
    let x = screenWidth + screenX - 15;
    let y = screenHeight + screenY - 130;

    if (data.screenshotNotif) {
        let screenshotNo = Object.keys(data.screenshotLinks).length;
        let windowWidth = screenshotNo * 160;
        notifWindow = new BrowserWindow({
            width: windowWidth,
            height: 118,
            x: x - windowWidth,
            y: y,
            alwaysOnTop: true,
            resizable: false,
            movable: false,
            focusable: false,
            frame: false,
            show: false,
            webPreferences: {
                webSecurity: false
            }
        });
    } else {
        notifWindow = new BrowserWindow({
            width: 410,
            height: 95,
            x: x - 410,
            y: y,
            show: false,
            frame: false,
            movable: false,
            focusable: false,
            resizable: false,
            transparent: true,
            alwaysOnTop: true,
            skipTaskbar: true,            
            type: 'notification',
            webPreferences: {
                contextIsolation: false,
                nodeIntegration: true,
                enableRemoteModule: true,
                devTools: false
            }
        });
    }

    if (data.screenshotNotif) {
        notifWindow.loadURL(screenshotNotifURL);
    } else {
        notifWindow.loadURL(notifURL);
    }
    notifWindow.webContents.on('did-finish-load', () => {
        if (data.screenshotNotif) {
            notifWindow.webContents.send('show-screenshot-notif', data.screenshotLinks);
        } else {
            notifWindow.webContents.send('show-notif', data);
        }
    });
    notifWindow.once('ready-to-show', () => {
        setTimeout(() => {
            notifWindowIDs.push(notifWindow.id);
            notifWindow.setPosition(
                notifWindow.getPosition()[0],
                (y + 130 - (130 * notifWindowIDs.length))
            );
            notifWindow.showInactive();
            notifWindow.setVisibleOnAllWorkspaces(true);
        }, 80);
    });
};

async function getStartupStatus() {
    const isEnabled = await bposeatsAutoLauncher.isEnabled();
    return isEnabled;
};

if (process.env.NODE_ENV == 'development' && process.platform == 'darwin') {
    app.dock.setIcon('src/renderer/assets/icons/icon.png');
};

app.on('renderer-process-crashed', () => {
    mainWindow.loadURL(winURL);
});

app.whenReady().then(() => {
    setTimeout(async () => {
        createWindow();
        createAppMenu();
        createTray();
        autoUpdater.checkForUpdates();
        setInterval(() => {
            autoUpdater.checkForUpdates();
        }, 60 * 60000); // check for updates every hour
        if (await getStartupStatus()){
            await bposeatsAutoLauncher.enable();
        }
    }, 1000 * 1.5);
});

app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    } else {
        showWindow();
    };
});

app.on('before-quit', () => {
    if (process.platform === 'darwin') {
        forceQuit = true;
    };
});

const toggleWindow = () => {
    // show or hide window
    (mainWindow.isVisible() && !mainWindow.isMinimized()) ? mainWindow.minimize() : showWindow();
};

const showWindow = () => {
    const position = mainWindow.getBounds();
    mainWindow.setPosition(position.x, position.y, false);
    mainWindow.show();
    mainWindow.focus();
};

ipcMain.on('show-window', () => {
    showWindow();
});

ipcMain.on('create-notif', (event, arg) => {
    // TODO (jc@bposeats.com) uncomment when issue on mac is resolved
    // createNotificationWindow(arg);

    if (!arg.screenshotNotif) {
        createNotificationWindow(arg);
    }
});

ipcMain.on('close-notif', (event, arg) => {
    let index = notifWindowIDs.indexOf(arg);
    if (index > -1) {
        notifWindowIDs.splice(index, 1);
        for (let i = index; i < notifWindowIDs.length; i++) {
            let window = BrowserWindow.fromId(notifWindowIDs[i]);
            let x = window.getPosition()[0];
            let y = window.getPosition()[1] + (130 * (i + 1));
            let frames = 130 * (i + 1);
            let framesThreshold = frames - 130;
            setTimeout(() => {
                // TODO investigate laggy behavior
                let posInterval = setInterval(() => {
                    if (frames > framesThreshold) {
                        frames--;
                        window.setPosition(x, (y - frames));
                    } else {
                        clearInterval(posInterval);
                        posInterval = null;
                    }
                }, 2);
            }, 200);
        }
    }
});

ipcMain.on('see-notif', (event, arg) => {
    mainWindow.webContents.send('redirect-notif');
});

ipcMain.on('restart', () => {
    if (activityBarWindow) {
        activityBarWindow.destroy();
    }
    if (notifWindow) {
        notifWindow.destroy();
    }
    tray.destroy();
    forceQuit = true;
    autoUpdater.quitAndInstall();
});

// TODO: refactor Keep me signed in implementation (jc@bposeats.com)
// ipcMain.on('quit-application', async (event, arg) => {
//     // if (!arg) {
//     //     await mainWindow.webContents.session.clearStorageData();
//     // }
//     await mainWindow.webContents.session.clearStorageData();
//     if (activityBarWindow) {
//         activityBarWindow.destroy();
//     }
//     if (notifWindow) {
//         notifWindow.destroy();
//     }
//     tray.destroy();
//     mainWindow.destroy();
// });

ipcMain.on('startup-status', async(event, arg) => {
    event.returnValue = await getStartupStatus();
});

ipcMain.on('run-app-on-startup', async(event, arg) => {
    if (arg) {
        await bposeatsAutoLauncher.enable();
    } else {
        await bposeatsAutoLauncher.disable();
    }
});

ipcMain.on('toggle-always-on-top', (event, arg) => {
    if (arg) {
        mainWindow.center();
    }
    mainWindow.setAlwaysOnTop(arg);
    mainWindow.setVisibleOnAllWorkspaces(arg);
});

ipcMain.on('timelog-status-change', (event, arg) => {
    if (arg.timedIn) {
        if (arg.taskName == 'No task selected') {
            tray.setImage(trayIconInNoTask);
        } else {
            tray.setImage(trayIconIn);
        }
    } else {
        tray.setImage(trayIconOut);
    }
});

ipcMain.on('sync-main', (event, arg) => {
    if (activityBarWindow) {
        activityBarWindow.webContents.send('sync-bar', arg);
    }
});

ipcMain.on('toggle-timelog-status', (event, arg) => {
    mainWindow.webContents.send('toggle-timelog', arg);
});

ipcMain.on('close-activity-bar', () => {
    contextMenu.getMenuItemById('hidden-bar').checked = true;
    tray.setContextMenu(contextMenu);
    activityBarWindow.hide();
});

ipcMain.on('create-activity-bar', () => {
    if (!activityBarWindow) {
        createActivityBarWindow();
        let subMenu = new MenuItem({
            label: 'Activity Bar',
            submenu: [
                {
                    id: 'visible-bar',
                    label: 'Visible',
                    type: 'radio',
                    checked: activityBarWindow.isVisible(),
                    click: function() {
                        activityBarWindow.showInactive();
                    }
                }, {
                    id: 'hidden-bar',
                    label: 'Hidden',
                    type: 'radio',
                    checked: !activityBarWindow.isVisible(),
                    click: function() {
                        activityBarWindow.hide();
                    }
                }
            ]
        });
        contextMenu.insert(1, subMenu);
        tray.setContextMenu(contextMenu);
    }
});

ipcMain.on('destroy-activity-bar', () => {
    activityBarWindow.destroy();
    activityBarWindow = null;
    createTrayContextMenu();
});

process.on('unhandledRejection', (reason, promise) => {
    log.info(reason);
});
