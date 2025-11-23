const fetch = require('node-fetch');

async function testEnquirySubmission() {
  console.log('🧪 Testing Enquiry Form Submission...\n');
  
  const testData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    company: 'Test Company Inc.',
    serviceType: 'web-development',
    budget: '10k-25k',
    timeline: '2-3-months',
    message: 'This is a test enquiry to verify the form functionality. We are interested in developing a modern website for our business.'
  };

  try {
    console.log('📤 Submitting test enquiry...');
    console.log('Data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:3000/api/enquiry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('\n📥 Response Status:', response.status);
    console.log('📥 Response Data:', JSON.stringify(result, null, 2));
    
    if (response.ok && result.success) {
      console.log('\n✅ SUCCESS: Enquiry submitted successfully!');
      console.log('📧 Email sent:', result.data.email_sent ? 'Yes' : 'No');
      console.log('🆔 Enquiry ID:', result.data.id);
    } else {
      console.log('\n❌ FAILED: Enquiry submission failed');
      console.log('Error:', result.error || result.message);
    }
    
  } catch (error) {
    console.error('\n💥 ERROR: Failed to submit enquiry');
    console.error('Details:', error.message);
  }
}

// Test form validation with missing required fields
async function testFormValidation() {
  console.log('\n🧪 Testing Form Validation (Missing Required Fields)...\n');
  
  const invalidData = {
    name: '',
    email: 'invalid-email',
    serviceType: '',
    message: ''
  };

  try {
    console.log('📤 Submitting invalid enquiry...');
    console.log('Data:', JSON.stringify(invalidData, null, 2));
    
    const response = await fetch('http://localhost:3000/api/enquiry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidData)
    });

    const result = await response.json();
    
    console.log('\n📥 Response Status:', response.status);
    console.log('📥 Response Data:', JSON.stringify(result, null, 2));
    
    if (response.status === 400 && !result.success) {
      console.log('\n✅ SUCCESS: Form validation working correctly!');
      console.log('❌ Validation Error:', result.error);
    } else {
      console.log('\n⚠️  WARNING: Form validation may not be working as expected');
    }
    
  } catch (error) {
    console.error('\n💥 ERROR: Failed to test validation');
    console.error('Details:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Enquiry Form Tests\n');
  console.log('=' .repeat(50));
  
  await testFormValidation();
  
  console.log('\n' + '=' .repeat(50));
  
  await testEnquirySubmission();
  
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Tests completed!');
}

runTests().catch(console.error);