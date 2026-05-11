import { io } from "socket.io-client";

// Assuming your backend server runs on localhost:3000
const URL = "http://localhost:3000";
const CONCURRENT_CONNECTIONS = 10000; 
const BATCH_SIZE = 100; // Connect 100 at a time to avoid freezing
const DELAY_MS = 10;   // Wait 10ms between batches
let connectedCount = 0;
let errorsCount = 0;
const sockets = [];

console.log(`🚀 STARTING MASSIVE SCALABILITY STRESS TEST (10,000 Connections)...`);
console.log(`Targeting server: ${URL}`);

async function runTest() {
  for (let i = 0; i < CONCURRENT_CONNECTIONS; i++) {
    const socket = io(URL, { 
        transports: ["websocket"],
        reconnection: false
    });
    
    sockets.push(socket);

    socket.on("connect", () => {
      connectedCount++;
      if (connectedCount % 100 === 0) {
        process.stdout.write(`\rConnections established: ${connectedCount}/${CONCURRENT_CONNECTIONS}`);
      }
      if (connectedCount + errorsCount === CONCURRENT_CONNECTIONS) finalizeTest();
    });

    socket.on("connect_error", () => {
      errorsCount++;
      if (connectedCount + errorsCount === CONCURRENT_CONNECTIONS) finalizeTest();
    });

    // Pause every 100 connections to let the OS breathe
    if (i > 0 && i % BATCH_SIZE === 0) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }
}

runTest();

function finalizeTest() {
  console.log("\n\n==============================================");
  console.log("    TC-1.0.0-0007: CONCURRENCY TEST RESULTS   ");
  console.log("==============================================");
  console.log(`Total Connections Attempted:  ${CONCURRENT_CONNECTIONS}`);
  console.log(`Successful Connections:       ${connectedCount}`);
  console.log(`Failed Connections:           ${errorsCount}`);
  
  // Get memory usage of the Node process running the test (simulating basic overhead)
  const memoryUsed = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
  console.log(`Test Script Memory Usage:     ~${memoryUsed} MB`);
  console.log("----------------------------------------------");

  if (connectedCount === CONCURRENT_CONNECTIONS) {
    console.log("STATUS: PASS (Server successfully handled the concurrent WebSocket load)\n");
  } else {
    console.log("STATUS: FAIL (Server dropped or refused some connections)\n");
  }

  // Cleanup connections
  sockets.forEach(s => s.disconnect());
  process.exit(0);
}
