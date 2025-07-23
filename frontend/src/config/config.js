// Get the current hostname
const hostname = window.location.hostname;
const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

// Check if we're in development mode or if backend is running locally
// For now, always use local backend for development
const backend_url = "http://localhost:5050/api";

console.log('Current hostname:', hostname);
console.log('Is localhost:', isLocalhost);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Using backend URL:', backend_url);

// const backend_url ="https://resturant1-xi.vercel.app/api"
export default backend_url
// https://resturant1-xi.vercel.app/