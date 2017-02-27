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

        // If the next invocation time is in the past, run it now
        if (job.nextInvocation.isBefore(moment())) {
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

