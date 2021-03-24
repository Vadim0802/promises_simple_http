import http from 'http';
import url from 'url';
import nock from 'nock';
import querystring from 'querystring';

const getSearch = (queryParams, params) => {
  const mergedQuery = { ...queryParams, ...params };
  const keys = Object.keys(mergedQuery);
  const newQueryParams = keys
    .filter((key) => mergedQuery[key] !== null && mergedQuery[key] !== undefined)
    .reduce((acc, key) => ({ ...acc, [key]: mergedQuery[key] }), {});

  return keys.length > 0 ? `?${querystring.stringify(newQueryParams)}` : '';
};

const methods = {
  GET: (options, promiseExecutor) => {
    const responseBody = [];
    const urlObject = new URL(options.url);
    const query = Object.fromEntries(urlObject.searchParams.entries());
    const search = getSearch(query, options.params);
    const req = http.get({
      hostname: urlObject.hostname,
      path: `${urlObject.pathname}${search}`,
      headers: options.headers,
    }, (res) => {
      res.on('data', (chunk) => responseBody.push(chunk.toString()));
      res.on('end', () => {
        const response = {
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers,
          data: responseBody.join(),
        };
        promiseExecutor.resolve(response);
      });
      res.on('error', promiseExecutor.reject);
    });
    req.on('error', promiseExecutor.reject);
  },
  POST: (options, promiseExecutor) => {
    const responseBody = [];
    const urlObject = new URL(options.url);
    const query = getSearch(urlObject.search, options.params);
    const data = querystring.stringify(options.data);
    http.request({
      method: options.method,
      headers: {
        ...options.headers,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(data),
      },
      hostname: urlObject.hostname,
      path: `${urlObject.pathname}${query}`,
    }, (res) => {
      res.on('data', (chunk) => responseBody.push(chunk.toString()))
      res.on('end', () => {
        const response = {
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers,
          data: responseBody.join(),
        };
        promiseExecutor.resolve(response);
      }).on('error', (err) => promiseExecutor.reject(err));
    }).end(data);
  },
};

const dispatch = (options) => {
  return new Promise((resolve, reject) => {
    methods[options.method](options, { resolve, reject });
  });
};

export const get = (url, config = {}) => dispatch({ ...config, url, method: 'GET' });
export const post = (url, data, config = {}) => dispatch({
  ...config,
  url,
  data,
  method: 'POST',
});

const host = 'http://ru.hexlet.io';
const pathname = '/users/new';
nock(host).get(pathname).replyWithError('timeout error');

try {
  const response = await get(`${host}${pathname}`);
  console.log(response)
} catch (e) {
  console.log('Good');
}

export default { get, post };