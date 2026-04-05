import _axios from 'axios';

/**
 * Create an axios isntalce with the default config.
 * @see: https://axios-http.com/docs/instance
 */
export const axios = _axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // timeout: [big number but not too big],
  // headers: { 'X-Custom-Header': 'foobar' },
});

/**
 * Here is also a good place to create interceptors
 * @see: https://axios-http.com/docs/interceptors
 */

// Add a request interceptor
axios.interceptors.request.use(
  function (config) {
    // Do something before request is sent
    return config;
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error);
  },
);

// Add a response interceptor
axios.interceptors.response.use(
  function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response;
  },
  function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    return Promise.reject(error);
  },
);
