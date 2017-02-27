const EventEmitter = require('events').EventEmitter;
const parser = require('cron-parser');
const moment = require('moment');
const uuid = require('uuid');
const find = require('lodash/find');
const findIndex = require('lodash/findIndex');
const pull = require('lodash/pull');

class SimpleCron extends EventEmitter {
  constructor () {
    super();
    this.running = false;
    this.break = false;
    this.jobs = [];
  }

  run () {
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
      // Iterate over scheduled jobs and execute if necessary
      this.jobs.forEach(job => {
        // If we haven't encountered this job yet, set up next invocation time
        if (job.nextInvocation === null) {
          job.nextInvocation = moment(job.interval.next()._date);
        }
        // If time has changed more than 3 hours, don't run
        // missed jobs. Reset job time step. (will re-run jobs if clock turned back)
        if (Math.abs(job.nextInvocation.diff(moment(), 'hours')) > 3) {
          const jobIndex = findIndex(this.jobs, { id: job.id });
          const interval = parser.parseExpression(job.expression);
          this.jobs[jobIndex].interval = interval;
          this.jobs[jobIndex].nextInvocation = null;
        } else if (job.nextInvocation.isBefore(moment())) {
          // Otherwise, run the missed jobs to catch up.
          // If time changed backwards, won't re-un jobs.
          job.fn();
          job.nextInvocation = moment(job.interval.next()._date);
        }
      });
      setTimeout(loop, 0);
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

