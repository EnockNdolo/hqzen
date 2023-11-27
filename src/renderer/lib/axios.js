import axios from 'axios';

const instance = axios.create({
    baseURL: API_URL, // Injected via webpack.DefinePlugin
    xsrfCookieName: 'csrftoken',
    xsrfHeaderName: 'X-CSRFToken',
    headers: {
        'X-Requested-With': 'XMLHttpRequest'
    }
});

instance.interceptors.response.use(
    response => Promise.resolve(response.data),
    error => Promise.reject(error)
);

export default instance;
