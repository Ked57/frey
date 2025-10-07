import { fetch } from 'node-fetch';

// Test a real server to see error response
const testResponse = async () => {
  try {
    const response = await fetch('http://localhost:3000/user');
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    const text = await response.text();
    console.log('Response:', text);
  } catch (error) {
    console.log('Error:', error.message);
  }
};

testResponse();
