const EventEmitter = require('events').EventEmitter;
const parser = require('cron-parser');
const moment = require('moment');
const uuid = require('uuid');
const find = require('lodash/find');
const pull = require('lodash/pull');

class SimpleCron extends EventEmitter {
  constructor () {
    super();
    this.running = false;
    this.break = false;
    this.jobs = [];
    this.lastRun = null;
  }

  run () {
    if (this.running === true) throw new Error('SimpleCron is already running.');
    this.emit('run');
    this.running = true;
    const loop = () => {
      // Stop the loop if requested
      if (this.break === true) {
        this.break = false;
        this.running = false;
        this.emit('stop');
        return;
      }

      // If time has changed more than 3 hours, don't run
      // missed jobs. Reset job interval for all jobs.
      // (will re-run jobs if clock turned back)
      if (this.lastRun && Math.abs(this.lastRun.diff(moment(), 'hours')) >= 3) {
        this.jobs.forEach(job => {
          const interval = parser.parseExpression(job.expression);
          job.interval = interval;
          job.nextInvocation = null;
        });
      }

      // Iterate over scheduled jobs and execute if necessary
      this.jobs.forEach(job => {
        // If we haven't encountered this job yet, set up next invocation time
        if (job.nextInvocation === null) {
          job.nextInvocation = moment(job.interval.next()._date);
        }

        // Run job if it's time.
        // If the time has changed (less than 3 hours)
        // All missed jobs will be run immediately.
        // In the case of time turning back, jobs will not
        // be re-run.
        if (job.nextInvocation.isSameOrBefore(moment())) {
          job.fn();
          job.nextInvocation = moment(job.interval.next()._date);
        }
      });
      this.lastRun = moment();
      setTimeout(loop, 10);
    };
    loop();
  }

  stop () {
    if (this.running === true) {
      this.break = true;
      return new Promise((resolve, reject) => {
        this.on('stop', () => {
          resolve();
        });
      });
    }
    throw new Error('SimpleCron is not running.');
  }

  schedule (expression, fn) {
    const interval = parser.parseExpression(expression);
    const id = uuid();
    this.jobs.push({
      id,
      expression,
      interval,
      fn,
      nextInvocation: null
    });
    this.emit('schedule', id);
    return id;
  }

  cancel (id) {
    const job = find(this.jobs, { id });
    if (!job) throw new Error(`Invalid job id '${id}'.`);
    pull(this.jobs, job);
    this.emit('cancel', id);
  }
}

module.exports = SimpleCron;

