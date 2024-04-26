const axios = require('axios');
const readline = require('readline');

// 创建 readline 接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 查询视频列表的接口 URL
const queryVideoListUrl = `https://media.weishi.qq.com/media-api/getVideoList`;

// 删除视频的接口 URL
const delVideoUrl = 'https://media.weishi.qq.com/media-api/delVideo';

// 发起查询视频列表的请求
async function queryVideoList(personId, cookie) {
  try {
    const response = await axios.get(queryVideoListUrl + `?data={"personId":"${personId}","attachInfo":""}`, {
      headers: {
        Cookie: cookie
      }
    });
    const data = response.data;

    // 处理返回的数据
    if (data && data.feedDetailList) {
      const feedDetails = data.feedDetailList;
      // console.log('视频列表查询结果:', feedDetails);
      return feedDetails;
    } else {
      console.log('视频列表为空,删除操作已完成。');
      return [];
    }
  } catch (error) {
    console.error('查询视频列表时出错:', error.message);
    return [];
  }
}

// 发起删除视频的请求
async function delVideo(feedId, desc, isPrePub, cookie, personId, delayBetweenRequests) {
  try {
    const requestBody = {
      data: JSON.stringify({
        feedId,
        personId,
        isPrePub,
      })
    };

    const response = await axios.post(delVideoUrl, requestBody, {
      headers: {
        Cookie: cookie
      }
    });
    console.log(`已删除视频: ${desc}`);
    console.log(`等待: ${delayBetweenRequests / 1000} 秒`);
  } catch (error) {
    console.error(`删除视频 ${desc} 时出错:`, error.message);
  }
}

// 重复发起请求直到视频列表为空
async function repeatRequests(personId, cookie, delayBetweenRequests) {
  while (true) {
    const feedDetails = await queryVideoList(personId, cookie);

    if (feedDetails.length === 0) {
      console.log('视频列表为空,删除操作已完成。');
      break;
    }

    for (const { feedId, desc, isPrePub } of feedDetails) {
      const time = generateRandomDelay(delayBetweenRequests)
      await delVideo(feedId, desc, isPrePub, cookie, personId, time);
      await new Promise(resolve => setTimeout(resolve, time));
    }
  }

  console.log('所有删除操作完成。');
}

// // 从命令行输入参数
// rl.question('请输入 personId: ', (personId) => {
//   rl.question('请输入 cookie: ', (cookie) => {
//     rl.question('请输入 delayBetweenRequests（毫秒）: ', (delayBetweenRequests) => {
//       // 执行重复请求
//       repeatRequests(personId, cookie, delayBetweenRequests);
//       rl.close();
//     });
//   });
// });
// 从cookie中提取personId的函数
function extractPersonIdFromCookie(cookie) {
  const personIdMatch = cookie.match(/person_id=(\d+)/);
  if (personIdMatch && personIdMatch.length > 1) {
    return personIdMatch[1];
  } else {
    return null;
  }
}

function generateRandomDelay(x) {
  const minDelay = 1000;
  const maxDelay = x >= 1000 ? x : 1000;
  const randomDelay = minDelay + Math.random() * (maxDelay - minDelay);
  return randomDelay;
}

// 从命令行输入参数
rl.question('请输入 cookie: ', (cookie) => {
  rl.question('请输入 delayBetweenRequests（毫秒）: ', (delayBetweenRequests) => {
    const personId = extractPersonIdFromCookie(cookie);
    if (personId) {
      // 执行重复请求
      repeatRequests(personId, cookie, delayBetweenRequests);
    } else {
      console.log('无法从cookie中提取personId');
    }
    rl.close();
  });
});