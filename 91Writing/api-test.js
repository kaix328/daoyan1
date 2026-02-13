// API调用测试脚本
// 用于验证91hub API的连接问题

const API_KEY = 'sk-LdbDBBWQJq4BJP9h4Rgd4ZQa2nTMBQTtg4agp0hUO22DyCiz';
const BASE_URL = 'https://ai.91hub.vip';

// 测试不同的API端点
const endpoints = [
  '/v1/chat/completions',
  '/chat/completions',
  '/api/v1/chat/completions',
  '/openai/v1/chat/completions'
];

// 测试消息
const testMessage = {
  model: 'gpt-3.5-turbo',
  messages: [
    {
      role: 'user',
      content: '你好，这是一个测试消息。'
    }
  ],
  max_tokens: 100,
  temperature: 0.7
};

// 测试函数
async function testEndpoint(endpoint) {
  const url = BASE_URL + endpoint;
  console.log(`\n测试端点: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(testMessage)
    });
    
    console.log(`状态码: ${response.status}`);
    console.log(`状态文本: ${response.statusText}`);
    
    const responseText = await response.text();
    console.log(`响应内容: ${responseText}`);
    
    if (response.ok) {
      console.log('✅ 成功!');
      return true;
    } else {
      console.log('❌ 失败');
      return false;
    }
  } catch (error) {
    console.log(`❌ 网络错误: ${error.message}`);
    return false;
  }
}

// 测试API密钥验证端点
async function testValidation() {
  const validationEndpoints = [
    '/v1/models',
    '/models',
    '/api/v1/models'
  ];
  
  console.log('\n=== 测试API密钥验证端点 ===');
  
  for (const endpoint of validationEndpoints) {
    const url = BASE_URL + endpoint;
    console.log(`\n测试验证端点: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      });
      
      console.log(`状态码: ${response.status}`);
      const responseText = await response.text();
      console.log(`响应内容: ${responseText.substring(0, 200)}...`);
      
      if (response.ok) {
        console.log('✅ 验证端点成功!');
        return true;
      }
    } catch (error) {
      console.log(`❌ 验证端点错误: ${error.message}`);
    }
  }
  
  return false;
}

// 主测试函数
async function runTests() {
  console.log('=== 91hub API 连接测试 ===');
  console.log(`API密钥: ${API_KEY.substring(0, 10)}...`);
  console.log(`基础URL: ${BASE_URL}`);
  
  // 先测试验证端点
  await testValidation();
  
  console.log('\n=== 测试聊天完成端点 ===');
  
  // 测试所有可能的端点
  for (const endpoint of endpoints) {
    const success = await testEndpoint(endpoint);
    if (success) {
      console.log(`\n🎉 找到可用端点: ${BASE_URL}${endpoint}`);
      break;
    }
  }
  
  console.log('\n=== 测试完成 ===');
}

// 运行测试
runTests().catch(console.error);