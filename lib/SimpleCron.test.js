/* global jest, beforeEach, describe, it, expect */

const SimpleCron = require('./SimpleCron');
let cron;

function delay (t) {
  return new Promise(function (resolve) {
    setTimeout(resolve, t);
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  cron = new SimpleCron();
});

describe('Events', () => {
  describe('constructor', () => {
    it('Should initialize correctly', () => {
      expect(cron.running).toBe(false);
      expect(cron.break).toBe(false);
      expect(cron.jobs).toEqual([]);
    });
  });

  describe('run', () => {
    it('Should emit a run event', () => {
      const fn = jest.fn();
      cron.on('run', fn);
      cron.run();
      expect(fn).toBeCalled();
    });

    it('Should set the running flag to true', () => {
      cron.run();
      expect(cron.running).toBe(true);
    });

    it('Should set the next invocation time on first pass', () => {
      cron.run();
      cron.schedule('* * * * *', () => {});
      jest.runOnlyPendingTimers();
      expect(cron.jobs[0].nextInvocation).not.toBe(null);
    });

    it('Should invoke function', () => {
      jest.useRealTimers();
      const fn = jest.fn();
      cron.run();
      expect(fn).not.toBeCalled();
      cron.schedule('* * * * * *', fn);
      return delay(1000).then(() => {
        jest.clearAllTimers();
        expect(fn).toBeCalled();
      });
    });
  });

  describe('stop', () => {
    it('Should emit a stop event', () => {
      const fn = jest.fn();
      cron.on('stop', fn);
      cron.run();
      cron.stop();
      jest.runOnlyPendingTimers();
      expect(fn).toBeCalled();
    });

    it('Should set the running flag to false', () => {
      cron.run();
      cron.stop();
      jest.runOnlyPendingTimers();
      expect(cron.running).toBe(false);
    });

    it('Should throw an error if not running', () => {
      expect(() => { cron.stop(); }).toThrow();
    });
  });

  describe('schedule', () => {
    it('Should emit a schedule event', () => {
      const fn = jest.fn();
      cron.on('schedule', fn);
      const id = cron.schedule('* * * * *', () => {});
      expect(fn).toBeCalledWith(id);
    });

    it('Should add a reference in jobs array', () => {
      const id = cron.schedule('* * * * *', () => {});
      expect(cron.jobs[0].id).toBe(id);
    });
  });

  describe('cancel', () => {
    it('Should emit a cancel event', () => {
      const fn = jest.fn();
      cron.on('cancel', fn);
      const id = cron.schedule('* * * * *', () => {});
      cron.cancel(id);
      expect(fn).toBeCalledWith(id);
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
