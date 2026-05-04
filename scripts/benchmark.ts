import { performance } from "perf_hooks";

async function runStressTest() {
  console.log("========================================");
  console.log("🚀 GITLORE CEREBRAS STRESS TEST");
  console.log("========================================");
  
  const endpoint = "http://localhost:3000/api/generate";
  const payload = {
    url: "https://github.com/simon-escano/gitlore",
    title: "Gitlore - The Local AI Portfolio Builder",
    role: "Lead Architect",
    context: "Stress testing Cerebras Llama 3.1 8B pipeline."
  };

  const iterations = 5;
  const latencies: number[] = [];

  console.log(`Executing ${iterations} sequential requests to ${endpoint}...\\n`);

  for (let i = 1; i <= iterations; i++) {
    process.stdout.write(`Run ${i}/${iterations}... `);
    const start = performance.now();
    
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        console.log(`❌ Failed (HTTP ${res.status})`);
        continue;
      }

      const data = await res.json();
      const latency = performance.now() - start;
      latencies.push(latency);
      
      console.log(`✅ Success in ${(latency / 1000).toFixed(2)}s`);
      
      // Print a quick sample of the output to prove it didn't hallucinate
      const _think = data.data?._thinking?.substring(0, 50);
      const perf = data.data?.results?.performance?.text;
      const nodes = data.data?.architecture_diagram_code?.split("\\n").length;
      
      console.log(`  ├─ Thinking: "${_think}..."`);
      console.log(`  ├─ Perf metric: "${perf}"`);
      console.log(`  └─ Diagram: ${nodes} lines of Mermaid code`);
      
    } catch (e) {
      console.log(`❌ Error: ${e}`);
    }
  }

  if (latencies.length === 0) {
    console.log("\\n❌ All tests failed. Is the server running?");
    return;
  }

  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const min = Math.min(...latencies);
  const max = Math.max(...latencies);

  console.log("\\n========================================");
  console.log("📊 PERFORMANCE RESULTS");
  console.log("========================================");
  console.log(`Total Successful Runs: ${latencies.length}/${iterations}`);
  console.log(`Average Latency:       ${(avg / 1000).toFixed(2)}s`);
  console.log(`Fastest Run:           ${(min / 1000).toFixed(2)}s`);
  console.log(`Slowest Run:           ${(max / 1000).toFixed(2)}s`);
  console.log("========================================");
  console.log("Use these numbers to update the README.md!");
}

runStressTest();
