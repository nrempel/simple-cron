/* global jest, beforeEach, afterEach, describe, it, expect */

const lolex = require('lolex');
// const moment = require('moment');

const SimpleCron = require('./SimpleCron');
let cron;
let clock;

beforeEach(() => {
  clock = lolex.install(60 * 1000 - 1);
  cron = new SimpleCron();
});

afterEach(() => {
  clock.uninstall();
});

describe('SimpleCron', () => {
  describe('constructor', () => {
    it('Should initialize correctly with deafults', () => {
      expect(cron.running).toBe(false);
      expect(cron.break).toBe(false);
      expect(cron.jobs).toEqual([]);
      expect(cron.runInterval).toBe(100);
    });

    it('Should initialize correctly with runInterval', () => {
      const runInterval = 20;
      const otherCron = new SimpleCron({ runInterval });
      expect(otherCron.runInterval).toBe(runInterval);
    });

    it('Should throw an error if intantiated with something other than an object ', () => {
      // eslint-disable-next-line
      expect(() => { new SimpleCron(20); }).toThrow();
      // eslint-disable-next-line
      expect(() => { new SimpleCron('dogs'); }).toThrow();
    });
  });

  describe('run', () => {
    it('Should throw an error if already running', () => {
      cron.run();
      expect(() => { cron.run(); }).toThrow();
    });

    it('Should emit a run event', () => {
      const fn = jest.fn();
      cron.once('run', fn);
      cron.run();
      expect(fn).toHaveBeenCalled();
    });

    it('Should set the running flag to true', () => {
      cron.run();
      expect(cron.running).toBe(true);
    });

    it('Should set the next invocation time on first pass', () => {
      cron.run();
      cron.schedule('* * * * *', () => {});
      clock.runToLast();
      expect(cron.jobs[0].nextInvocation).not.toBe(null);
    });

    it('Should invoke function', () => {
      const fn = jest.fn();
      cron.run();
      expect(fn).not.toHaveBeenCalled();
      cron.schedule('* * * * *', fn);
      clock.tick(60 * 1000);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('Should emit an invoke event', () => {
      const fn = jest.fn();
      const id = cron.schedule('* * * * *', fn);
      cron.once('invoke', fn);
      cron.run();
      clock.tick(60 * 1000);
      expect(fn).toHaveBeenCalledWith(id);
    });

    it('Should not re-run jobs if time changes backward less than 3 hours', () => {
      const fn = jest.fn();
      cron.schedule('* * * * *', fn);
      clock.setSystemTime(new Date());
      cron.run();
      clock.setSystemTime(-(5 * 60 * 1000));
      clock.tick(7 * 60 * 1000);
      // We go back 5 minutes and let it run for 7. Should run job twice.
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('Should run missed jobs when time changes forward less than 3 hours', () => {
      const fn = jest.fn();
      cron.schedule('* * * * *', fn);
      clock.setSystemTime(44 * 60 * 1000);
      cron.run();
      clock.tick(60 * 1000);
      expect(fn).toHaveBeenCalledTimes(45);
      clock.tick(5 * 60 * 1000);
      expect(fn).toHaveBeenCalledTimes(50);
    });

    it('Should reset interval when time moves forward more than 3 hours', () => {
      const fn = jest.fn();
      cron.schedule('* * * * *', fn);
      cron.run();
      // Turn forward clock at least 3 hours and minute (greater than 3 hours)
      // We go 1 extra second so we don't trigger the following job yet
      clock.setSystemTime(3 * 60 * 60 * 1000 + 61 * 1000);
      clock.tick(200);
      expect(fn).toHaveBeenCalledTimes(0);
      clock.tick(12 * 60 * 1000);
      expect(fn).toHaveBeenCalledTimes(12);
    });

    it('Should reset interval when time moves backward more than 3 hours', () => {
      const fn = jest.fn();
      cron.schedule('* * * * *', fn);
      clock.setSystemTime(new Date());
      cron.run();
      clock.setSystemTime(-(3 * 60 * 60 * 1000 + 65 * 1000));
      clock.tick(100);
      expect(fn).toHaveBeenCalledTimes(0);
      clock.tick(4 * 60 * 1000);
      expect(fn).toHaveBeenCalledTimes(4);
    });
  });

  describe('stop', () => {
    it('Should emit a stop event', () => {
      const fn = jest.fn();
      cron.once('stop', fn);
      cron.run();
      cron.stop();
      clock.runToLast();
      expect(fn).toHaveBeenCalled();
    });

    it('Should set the running flag to false', () => {
      cron.run();
      cron.stop();
      clock.runToLast();
      expect(cron.running).toBe(false);
    });

    it('Should throw an error if not running', () => {
      expect(() => { cron.stop(); }).toThrow();
    });
  });

  describe('schedule', () => {
    it('Should emit a schedule event', () => {
      const fn = jest.fn();
      cron.once('schedule', fn);
      const id = cron.schedule('* * * * *', () => {});
      expect(fn).toHaveBeenCalledWith(id);
    });

    it('Should add a reference in jobs array', () => {
      const id = cron.schedule('* * * * *', () => {});
      expect(cron.jobs[0].id).toBe(id);
    });
  });

  describe('cancel', () => {
    it('Should emit a cancel event', () => {
      const fn = jest.fn();
      cron.once('cancel', fn);
      const id = cron.schedule('* * * * *', () => {});
      cron.cancel(id);
      expect(fn).toHaveBeenCalledWith(id);
    });

    it('Should remove a reference in jobs array', () => {
      const id = cron.schedule('* * * * *', () => {});
      cron.cancel(id);
      expect(cron.jobs).toEqual([]);
    });

    it('Should throw an error if bad id', () => {
      expect(() => { cron.cancel('id'); }).toThrow();
    });
  });
});
