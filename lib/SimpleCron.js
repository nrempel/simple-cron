const EventEmitter = require('events').EventEmitter;
const parser = require('cron-parser');
const moment = require('moment');
const uuid = require('uuid');
const find = require('lodash/find');
const pull = require('lodash/pull');

const DEFAULT_INTERVAL = 100;

class SimpleCron extends EventEmitter {
  constructor (options) {
    const opts = options || {};
    if (typeof opts !== 'object') throw new Error('Invalid parameter. Object expected.');
    super();
    this.running = false;
    this.break = false;
    this.jobs = [];
    this.lastRun = null;
    this.runInterval = opts.runInterval || DEFAULT_INTERVAL;
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
          console.log(job.nextInvocation);
          job.fn();
          this.emit('invoke', job.id);
          job.nextInvocation = moment(job.interval.next()._date);
        }
      });
      this.lastRun = moment();
      setTimeout(loop, this.runInterval);
    };
    loop();
  }

  stop () {
    if (!this.running) throw new Error('SimpleCron is not running.');
    this.break = true;
    return new Promise((resolve, reject) => {
      this.once('stop', resolve);
    });
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

