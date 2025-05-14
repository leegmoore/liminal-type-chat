/**
 * Direct test script for Claude 3.7 Sonnet using Anthropic SDK
 * Run with: node test-claude37-direct.js YOUR_ANTHROPIC_API_KEY
 */
const Anthropic = require('@anthropic-ai/sdk');

async function testClaude37Direct() {
  // Get API key from command line
  const apiKey = process.argv[2];
  if (!apiKey) {
    console.error('Please provide your Anthropic API key as a command line argument');
    console.error('Usage: node test-claude37-direct.js YOUR_ANTHROPIC_API_KEY');
    process.exit(1);
  }

  try {
    console.log('Initializing Anthropic client...');
    const client = new Anthropic.Anthropic({
      apiKey: apiKey
    });
    
    console.log('Testing with Claude 3.7 Sonnet...');
    const message = await client.messages.create({
      model: 'claude-3-7-sonnet-20250218',
      max_tokens: 1000,
      messages: [
        { role: 'user', content: 'Hello! Can you confirm you are Claude 3.7 Sonnet and list 3 key capabilities or improvements you have compared to previous Claude models?' }
      ]
    });
    
    console.log('Response from Claude 3.7 Sonnet:');
    console.log('----------------------------');
    console.log(message.content[0].text);
    console.log('----------------------------');
    console.log('Message ID:', message.id);
    console.log('Model:', message.model);
    console.log('Usage:', message.usage);
    
    console.log('Testing streaming...');
    console.log('Streaming response:');
    console.log('----------------------------');
    
    const stream = await client.messages.stream({
      model: 'claude-3-7-sonnet-20250218',
      max_tokens: 1000,
      messages: [
        { role: 'user', content: 'Please count from 1 to 5 very slowly, with a pause between each number.' }
      ]
    });
    
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        process.stdout.write(chunk.delta.text);
      }
    }
    
    console.log('\n----------------------------');
    console.log('Claude 3.7 Sonnet direct integration test completed successfully!');
  } catch (error) {
    console.error('Error testing Claude 3.7 Sonnet integration:');
    console.error(error.message || error);
    if (error.status) {
      console.error(`Status: ${error.status}`);
    }
    process.exit(1);
  }
}

testClaude37Direct();