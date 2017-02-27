/* global beforeEach, describe, it, expect */

const sinon = require('sinon');

const SimpleCron = require('./SimpleCron');
let cron;

function delay (t) {
  return new Promise(function (resolve) {
    setTimeout(resolve, t);
  });
}

beforeEach(() => {
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
      const spy = sinon.spy();
      cron.on('run', spy);
      cron.run();
      expect(spy.called).toBe(true);
    });

    it('Should set the running flag to true', () => {
      cron.run();
      expect(cron.running).toBe(true);
    });

    it('Should set the next invocation time on first pass', () => {
      cron.run();
      cron.schedule('* * * * *', () => {});
      return delay(10).then(() => {
        expect(cron.jobs[0].nextInvocation).not.toBe(null);
      });
    });

    it('Should invoke function', () => {
      const spy = sinon.spy();
      cron.run();
      cron.schedule('* * * * * *', spy);
      return delay(1000).then(() => {
        expect(spy.called).toBe(true);
      });
    });
  });

  describe('stop', () => {
    it('Should emit a stop event', () => {
      const spy = sinon.spy();
      cron.on('stop', spy);
      cron.run();
      return cron.stop().then(() => {
        expect(spy.called).toBe(true);
      });
    });

    it('Should set the running flag to false', () => {
      cron.run();
      return cron.stop().then(() => {
        expect(cron.running).toBe(false);
      });
    });

    it('Should throw an error if not running', () => {
      expect(() => { cron.stop(); }).toThrow();
    });
  });

  describe('schedule', () => {
    it('Should emit a schedule event', () => {
      const spy = sinon.spy();
      cron.on('schedule', spy);
      const id = cron.schedule('* * * * *', () => {});
      expect(spy.calledWith(id)).toBe(true);
    });

    it('Should add a reference in jobs array', () => {
      const id = cron.schedule('* * * * *', () => {});
      expect(cron.jobs[0].id).toBe(id);
    });
  });

  describe('cancel', () => {
    it('Should emit a cancel event', () => {
      const spy = sinon.spy();
      cron.on('cancel', spy);
      const id = cron.schedule('* * * * *', () => {});
      cron.cancel(id);
      expect(spy.calledWith(id)).toBe(true);
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
