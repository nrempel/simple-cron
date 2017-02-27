const SimpleCron = require('./lib/SimpleCron');

const cron = new SimpleCron();

cron.run();

// const abc = cron.schedule('* * * * *', () => { console.log(1); });

setTimeout(() => {
  cron.schedule('* * * * *', () => { console.log(2); });
  cron.cancel();
}, 59000);
