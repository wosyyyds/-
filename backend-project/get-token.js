const http = require('http');
const querystring = require('querystring');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function register() {
  try {
    console.log('注册测试用户...');
    
    const postData = JSON.stringify({
      name: 'Test User',
      email: 'test@example.com',
      password: '123456'
    });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const response = await makeRequest(options, postData);
    console.log('注册结果:', response);
    
    return response.status === 201;
  } catch (error) {
    console.error('注册失败:', error.message);
    return false;
  }
}

async function login() {
  try {
    console.log('登录获取新token...');
    
    const postData = JSON.stringify({
      email: '2143872305@qq.com',
      password: '123456'
    });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const response = await makeRequest(options, postData);
    console.log('登录结果:', response);
    
    if (response.data && response.data.token) {
      console.log('新Token:', response.data.token);
      return response.data.token;
    }
    
    return null;
  } catch (error) {
    console.error('登录失败:', error.message);
    return null;
  }
}

async function main() {
  // 先试着注册（如果用户已存在会失败，但没关系）
  await register();
  
  // 然后登录
  const token = await login();
  
  if (token) {
    console.log('\n可以使用的Token:', token);
  }
}

main();