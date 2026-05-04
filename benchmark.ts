import fs from "fs";

async function runBenchmark() {
  console.log("Starting Gitlore Performance & Stress Test...");
  const endpoint = "http://localhost:4000/api/generate";
  const payload = {
    url: "https://github.com/simon-escano/gitlore",
    title: "Gitlore",
    role: "Lead Architect",
    context: "Stress testing."
  };

  const iterations = 5;
  const metrics = [];

  for (let i = 1; i <= iterations; i++) {
    console.log(`\\n--- Run ${i}/${iterations} ---`);
    const startTime = Date.now();
    let ttft = 0;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error(`Run ${i} failed with status: ${res.status}`);
        continue;
      }

      // We measure TTFT as the time until headers are received and the stream starts
      // Note: Because the API returns a monolithic JSON object (not SSE to the client),
      // the client waits for the entire JSON to be buffered by Hono before returning.
      // Wait, Gitlore API returns JSON directly! So client measures Total Latency.
      const data = await res.json();
      const endTime = Date.now();
      const totalLatency = endTime - startTime;
      
      console.log(`Success! Total Latency: ${totalLatency}ms`);
      metrics.push(totalLatency);
    } catch (e) {
      console.error(`Run ${i} error:`, e);
    }
  }

  if (metrics.length === 0) {
    console.error("All runs failed.");
    process.exit(1);
  }

  const avgLatency = metrics.reduce((a, b) => a + b, 0) / metrics.length;
  const minLatency = Math.min(...metrics);
  const maxLatency = Math.max(...metrics);

  console.log("\\n========================================");
  console.log("BENCHMARK RESULTS");
  console.log("========================================");
  console.log(`Total Runs: ${iterations}`);
  console.log(`Average Latency: ${avgLatency.toFixed(2)} ms`);
  console.log(`Min Latency: ${minLatency} ms`);
  console.log(`Max Latency: ${maxLatency} ms`);
  console.log("========================================");

  fs.writeFileSync("/tmp/benchmark_results.json", JSON.stringify({
    avgLatency, minLatency, maxLatency
  }));
}

runBenchmark();
