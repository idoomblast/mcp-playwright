/**
 * Contoh penggunaan Network Inspection dengan mcp-playwright
 * 
 * File ini menunjukkan cara menggunakan fitur inspeksi network untuk:
 * - Memulai monitoring network traffic
 * - Mengunjungi website dan melacak semua requests/responses
 * - Memfilter network data berdasarkan berbagai criteria
 * - Menganalisis performa network
 */

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

async function networkInspectionExample() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['../build/index.js'],
  });

  const client = new Client({
    name: 'network-inspection-example',
    version: '1.0.0',
  }, {
    capabilities: {}
  });

  await client.connect(transport);

  try {
    // === Contoh 1: Memulai monitoring network ===
    console.log('=== Contoh 1: Memulai Network Monitoring ===');
    
    // Navigasi ke website dengan network monitoring
    await client.callTool('playwright_navigate', {
      url: 'https://httpbin.org',
      headless: true
    });

    // Mulai network monitoring
    const startResult = await client.callTool('playwright_network_inspection', {
      action: 'start'
    });
    console.log('Network monitoring started:', startResult.content[0].text);

    // Kunjungi beberapa pages untuk generate network traffic
    await client.callTool('playwright_navigate', {
      url: 'https://httpbin.org/json'
    });

    // Tunggu sebentar untuk memastikan semua requests selesai
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Ambil semua network entries
    const allEntriesResult = await client.callTool('playwright_network_inspection', {
      action: 'get',
      format: 'summary'
    });
    console.log('All network entries:');
    console.log(allEntriesResult.content[0].text);

    // === Contoh 2: Filtering berdasarkan criteria ===
    console.log('\n=== Contoh 2: Filtering Network Entries ===');

    // Filter hanya GET requests
    const getRequestsResult = await client.callTool('playwright_network_inspection', {
      action: 'get',
      filter: {
        method: 'GET'
      },
      format: 'detailed'
    });
    console.log('GET requests only:');
    console.log(getRequestsResult.content[0].text);

    // Filter berdasarkan resource type
    const documentRequestsResult = await client.callTool('playwright_network_inspection', {
      action: 'get',
      filter: {
        resourceType: 'document'
      },
      format: 'summary'
    });
    console.log('Document requests only:');
    console.log(documentRequestsResult.content[0].text);

    // === Contoh 3: Monitoring API calls ===
    console.log('\n=== Contoh 3: Monitoring API Calls ===');
    
    // Clear previous entries
    await client.callTool('playwright_network_inspection', {
      action: 'clear'
    });

    // Visit API endpoint yang akan membuat beberapa requests
    await client.callTool('playwright_navigate', {
      url: 'https://httpbin.org/get?param1=value1&param2=value2'
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Filter requests yang mengandung 'httpbin.org'
    const apiCallsResult = await client.callTool('playwright_network_inspection', {
      action: 'get',
      filter: {
        url: 'httpbin.org'
      },
      format: 'detailed',
      limit: 10
    });
    console.log('API calls to httpbin.org:');
    console.log(apiCallsResult.content[0].text);

    // === Contoh 4: Monitoring performa ===
    console.log('\n=== Contoh 4: Performance Monitoring ===');
    
    // Navigate ke website yang mungkin memiliki beberapa slow requests
    await client.callTool('playwright_navigate', {
      url: 'https://httpbin.org/delay/1'
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Filter requests yang memakan waktu lebih dari 500ms
    const slowRequestsResult = await client.callTool('playwright_network_inspection', {
      action: 'get',
      filter: {
        minDuration: 500
      },
      format: 'detailed'
    });
    console.log('Slow requests (>500ms):');
    console.log(slowRequestsResult.content[0].text);

    // === Contoh 5: Monitoring XHR/Fetch requests ===
    console.log('\n=== Contoh 5: Monitoring XHR/Fetch Requests ===');
    
    // Navigate ke page yang melakukan AJAX calls
    await client.callTool('playwright_navigate', {
      url: 'https://httpbin.org'
    });

    // Execute JavaScript yang melakukan fetch request
    await client.callTool('playwright_evaluate', {
      script: `
        fetch('https://httpbin.org/get')
          .then(response => response.json())
          .then(data => console.log('Fetch completed', data));
      `
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Filter XHR/Fetch requests
    const xhrRequestsResult = await client.callTool('playwright_network_inspection', {
      action: 'get',
      filter: {
        resourceType: 'fetch'
      },
      format: 'detailed'
    });
    console.log('XHR/Fetch requests:');
    console.log(xhrRequestsResult.content[0].text);

    // === Contoh 6: Error monitoring ===
    console.log('\n=== Contoh 6: Error Monitoring ===');
    
    // Try to access a non-existent endpoint
    await client.callTool('playwright_navigate', {
      url: 'https://httpbin.org/status/404'
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Filter error responses (4xx, 5xx)
    const errorRequestsResult = await client.callTool('playwright_network_inspection', {
      action: 'get',
      filter: {
        status: 404
      },
      format: 'detailed'
    });
    console.log('Error responses (404):');
    console.log(errorRequestsResult.content[0].text);

    // Stop network monitoring
    const stopResult = await client.callTool('playwright_network_inspection', {
      action: 'stop'
    });
    console.log('Network monitoring stopped:', stopResult.content[0].text);

    // Final cleanup
    await client.callTool('playwright_close', {});

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

// Advanced example: Real-time network monitoring
async function realTimeNetworkMonitoring() {
  console.log('\n=== Advanced Example: Real-time Network Monitoring ===');
  
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['../build/index.js'],
  });

  const client = new Client({
    name: 'realtime-network-example',
    version: '1.0.0',
  }, {
    capabilities: {}
  });

  await client.connect(transport);

  try {
    // Start browser and network monitoring
    await client.callTool('playwright_navigate', {
      url: 'https://httpbin.org',
      headless: true
    });

    await client.callTool('playwright_network_inspection', {
      action: 'start'
    });

    // Simulate browsing activity
    const urls = [
      'https://httpbin.org/json',
      'https://httpbin.org/html',
      'https://httpbin.org/xml',
      'https://httpbin.org/user-agent'
    ];

    for (const url of urls) {
      console.log(`\nNavigating to: ${url}`);
      await client.callTool('playwright_navigate', { url });
      
      // Wait for requests to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get latest network activity
      const latestActivity = await client.callTool('playwright_network_inspection', {
        action: 'get',
        limit: 5,
        format: 'summary'
      });
      
      console.log('Latest network activity:');
      console.log(latestActivity.content[0].text);
    }

    // Final comprehensive report
    console.log('\n=== Final Network Report ===');
    const finalReport = await client.callTool('playwright_network_inspection', {
      action: 'get',
      format: 'detailed'
    });
    console.log(finalReport.content[0].text);

    await client.callTool('playwright_close', {});
  } catch (error) {
    console.error('Error in real-time monitoring:', error);
  } finally {
    await client.close();
  }
}

// Run examples
async function main() {
  console.log('Starting Network Inspection Examples...\n');
  
  await networkInspectionExample();
  await realTimeNetworkMonitoring();
  
  console.log('\n✅ All examples completed successfully!');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  networkInspectionExample,
  realTimeNetworkMonitoring
}; 