/**
 * Combine All Location Data Sources
 * 
 * This script runs all three location scripts in sequence to build a complete
 * database of Swedish locations for geocoding.
 */

import { spawn } from 'child_process';
import path from 'path';

// Scripts to run in sequence
const scripts = [
  'fetch-swedish-locations.js',
  'add-major-swedish-locations.js',
  'add-swedish-municipalities.js',
  'add-kronoberg-locations.js',
  'add-police-locations.js',
  'add-special-cases.js',
  'add-fix-locations.js'
];

console.log('🇸🇪 Starting combined location database update...\n');

// Function to run a script and return a promise
function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    console.log(`\n==================================`);
    console.log(`Running: ${scriptName}...`);
    console.log(`==================================\n`);
    
    const scriptPath = path.join(process.cwd(), 'scripts', scriptName);
    const childProcess = spawn('node', [scriptPath], { stdio: 'inherit' });
    
    childProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ ${scriptName} completed successfully`);
        resolve();
      } else {
        console.error(`\n❌ ${scriptName} exited with code ${code}`);
        // Continue even if a script fails
        resolve();
      }
    });
    
    childProcess.on('error', (err) => {
      console.error(`\n❌ Failed to run ${scriptName}: ${err}`);
      // Continue even if a script fails
      resolve();
    });
  });
}

// Run scripts in sequence
async function runAllScripts() {
  for (const script of scripts) {
    try {
      await runScript(script);
    } catch (error) {
      console.error(`Error running ${script}: ${error}`);
    }
  }
  
  console.log('\n===============================================');
  console.log('🎉 All location scripts completed!');
  console.log('A comprehensive Swedish location database has been created');
  console.log('===============================================\n');
}

// Start the process
runAllScripts().catch(err => {
  console.error('Unexpected error in the main process:', err);
  process.exit(1);
}); 