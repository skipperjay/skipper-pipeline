// pipeline/scheduler.js
// Runs all pipelines on a schedule automatically
// Integrated into the main server — no separate process needed

const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');

function runPipeline(name) {
  const scriptPath = path.join(__dirname, `${name}.js`);
  console.log(`\n⏰ [SCHEDULER] Running ${name} pipeline — ${new Date().toISOString()}`);

  exec(`node ${scriptPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ [SCHEDULER] ${name} pipeline failed:`, error.message);
      return;
    }
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
  });
}

function startScheduler() {
  console.log('⏰ Pipeline scheduler started');

  // Run YouTube pipeline every day at 7:00 AM
  cron.schedule('0 7 * * *', () => runPipeline('youtube'), {
    timezone: 'America/New_York'
  });

  // Run Instagram pipeline every day at 7:15 AM
  cron.schedule('15 7 * * *', () => runPipeline('instagram'), {
    timezone: 'America/New_York'
  });

  // Run both pipelines on Sundays at 8:00 AM for weekly review prep
  cron.schedule('0 8 * * 0', () => {
    console.log('📅 Sunday full pipeline run starting...');
    runPipeline('youtube');
    setTimeout(() => runPipeline('instagram'), 30000); // 30s stagger
  }, {
    timezone: 'America/New_York'
  });

  console.log('  📅 YouTube:   Daily at 7:00 AM ET');
  console.log('  📅 Instagram: Daily at 7:15 AM ET');
  console.log('  📅 Full run:  Sundays at 8:00 AM ET');
}

module.exports = { startScheduler };
