// Get the current hostname
const hostname = window.location.hostname;
const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

// Use local backend for development, relative path for production
const backend_url = isLocalhost
  ? "http://localhost:5050/api"
  : "/api"; // <-- This is correct for production with reverse proxy

console.log('Current hostname:', hostname);
console.log('Is localhost:', isLocalhost);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Using backend URL:', backend_url);

// const backend_url ="https://resturant1-xi.vercel.app/api"
export default backend_url;
// https://resturant1-xi.vercel.app/