# SimpleCron

SimpleCron is a simple cron runner. I've tried more or less to adhere to the functionality of the traditional unix [cron utility](http://man7.org/linux/man-pages/man8/cron.8.html). This includes the behaviour during a system time change.

## Installing

```bash
npm install --save simple-cron
```

or

```bash
yarn add simple-cron
```

## Using

Here's a contrived example:

```javascript
// Instantiate SimpleCron
const SimpleCron = require('simple-cron');
const cron = new SimpleCron();

// SimpleCron is also an event emitted so you can
// easily tell when events occur.
// Valid events are start, stop, schedule, cancel, run
cron.on('run', (jobId) => {
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