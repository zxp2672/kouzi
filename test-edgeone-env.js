// 测试EdgeOne环境变量
const https = require('https');

const url = 'https://www.001tf.com/api/health';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('健康检查响应:');
    console.log(data.substring(0, 500));
  });
}).on('error', err => {
  console.error('请求失败:', err.message);
});
