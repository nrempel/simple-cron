# SimpleCron

SimpleCron is a simple cron runner. I've tried more or less to adhere to the functionality of the traditional unix [cron utility](http://man7.org/linux/man-pages/man8/cron.8.html). This includes the behaviour during a system time change.

As per the cron man page, in the event of a system time change will do the the following:

- If the time changes **backwards** by **more than 3 hours**, the cron intervals will be reset. This means that jobs will be _re-run_.
- If the time changes **forwards** by  **more than 3 hours**, the cron intervals will be reset. This means that any jobs missed _will not_ get run.
- If the time changes **backwards** by **less than 3 hours**, SimpleCron will continue running normally and those jobs _will not_ get run again.
- If the time changes **forwards** by **less than 3 hours**, SimpleCron will continue running normally and all missed jobs _will_ be run immediately. 



## Installing

```
npm install --save simple-cron
```

or

```
yarn add simple-cron
```

## Using

Here's a contrived example:

```javascript
// Instantiate SimpleCron
const SimpleCron = require('simple-cron');
const cron = new SimpleCron(); // Takes an optional parameter to define runInterval

// SimpleCron is also an event emitted so you can
// easily tell when events occur.
// Valid events are run, stop, schedule, cancel, invoke
cron.on('invoke', (jobId) => {
  console.log(`job '${jobId}' just ran!`);
});

// This is something we want to do every minute
const sendEmails = () => {
  const addresses = getAddresses();
  addresses.forEach((address) => {
    sendEmail();
  });
};

// Schedule this job to run every minute
const emailJobId = cron.schedule('* * * * *', sendEmails);

// Start running SimpleCron
cron.run();

// You can also schedule jobs after SimpleCron is already running if you want
const logJobId = cron.schedule('0 * * * *', () => {
  console.log('Another hour has passed you by...');
});

// Cancel a running job
cron.cancel(emailJobId);

// Shutdown SimpleCron. Returns a promise so you know when it's stopped.
cron.stop().then(() => { console.log('Shutdown complete.'); });

```

SimpleCon uses [cron-parser](https://github.com/harrisiirak/cron-parser) to handle cron expressions.

## API Reference

#### `SimpleCron([options])`

Constructor. Returns reference to cron instance. Take optional options object containing the following keys:

- `runInterval`: The frequency in milliseconds for which SimpleCron will check to run jobs. Defaults to `100`.

#### `cron.run()`

Runs SimpleCron. Starts running any scheduled jobs.

#### `cron.stop()`

Stops SimpleCron. Returns a promise that resolves when SimpleCron has finished stopping.

#### `cron.schedule(expression, function)`

Schedules a function to be called at an interval. Returns an id for this scheduled job.

#### `cron.cancel(id)`

Cancels a scheduled job so it no longer runs on an interval. Requires you to provide the id returned by `cron.schedule()`.

## Testing

SimpleCron has good test coverage. To run the tests, clone the repo then do this:

```
npm i && npm test
```

SimpleCron uses [semistandard](https://github.com/Flet/semistandard) for linting.
