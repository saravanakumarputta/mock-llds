/**
 * logging libaray - JavaScript
 *
 * Requirements
 * - Multiple levels of logs (info, error, warning)
 * - Catch and log console statements
 * - Log uncaught errors
 * -
 * Implemenation
 * - Class implementation
 *  - Single ton [X]
 *  - API's for logging [X]
 *  - Error Handling mechanism
 *  - retry for max of 3 times and then save it localStorage
 *  - Logic for un caught errors
 *  - Logic for handling console statements
 */

// class Log {
//   constructor(level, message, tag = "") {
//     this.level = level;
//     this.message = message;
//     this.tag = tag;
//     this.time = Date.now();
//   }
//   toLogString() {
//     return JSON.stringify({
//       level: this.level,
//       message: this.message,
//       tag: this.tag,
//       time: this.time,
//     });
//   }
// }
class Logger {
  //   static LoggerInstance = null;
  constructor() {
    // if (Logger.LoggerInstance) {
    //   return LoggerInstance;
    // } else {
    //   Logger.LoggerInstance = this;
    //   return this;
    // }
    // this.loggerAPIUTIL = apiUtil;
    // this.loggerQueue = [];
    // this.isOnline = true;
    // localStorage.setItem("appLogs", []);
    // window.addEventListener("offline", (event) => {
    //   this.isOnline = false;
    // });
    // window.addEventListener("online", (event) => {
    //   this.isOnline = true;
    //   this.syncOfflineLogs();
    // });
  }

  init(apiUtil, batchSize = 5, syncTimeInMin = 2) {
    this.apiUtil = apiUtil;
    this.batchSize = batchSize;
    this.logList = [];
    this.syncTimeInMin = syncTimeInMin;
    this.setEvents();
    this.syncOnTime();
  }

  setEvents() {
    window.addEventListener("offline", (event) => {
      this.isOnline = false;
    });

    window.addEventListener("online", (event) => {
      this.isOnline = true;
      this.syncOfflineLogs();
    });
    window.addEventListener("beforeunload", (event) => {
      if (this.logList.length) {
        this.loggerAPIUTIL([...this.logList]);
        this.logList = [];
      }
    });
  }

  syncOnTime() {
    this.setInterval(() => {
      if (this.logList.length) {
        this.loggerAPIUTIL([...this.logList]);
        this.logList = [];
      }
    }, this.syncTimeInMin);
  }

  syncOfflineLogs() {
    const offlineLogs = JSON.parse(localStorage.getItem("appLogs"));

    try {
      this.loggerAPIUTIL(offlineLogs);
      localStorage.setItem("appLogs", []);
    } catch (error) {}
  }

  logOffline(level, message, tag) {
    const offlineLogs = JSON.parse(localStorage.getItem("appLogs"));
    localStorage.setItem(
      "appLogs",
      JSON.stringify([
        { level, message, tag, timestamp: Date.now() },
        ...offlineLogs,
      ])
    );
  }

  log(level, message, tag) {
    if (this.isOnline) {
      this.logList.push({ level, message, tag, timeStamp: Date.now() });
      if (this.logList.length === this.batchSize) {
        this.postLogs([...this.logList]).catch(() => {
          // store them in rejected logs in local storage
          //we can sync up these logs with help of server side events
        });
        this.logList = [];
      }
    } else {
      this.logOffline(level, message, tag);
    }
  }

  postLogs(logList, retryCount = 3) {
    return new Promise((resolve, reject) => {
      if (retryCount === 0) {
        reject();
      }
      try {
        this.loggerAPIUTIL(logList);
        resolve();
      } catch (error) {
        try {
          this.postLogs(logList, retryCount - 1);
          resolve();
        } catch (error) {
          reject();
        }
      }
    });
  }

  info(message, tag = "") {
    this.log("info", message, tag);
  }

  warn(message, tag = "") {
    this.log("warn", message, tag);
  }

  error(message, tag = "") {
    this.log("error", message, tag);
  }
}

export const LoggerInstance = new Logger();
